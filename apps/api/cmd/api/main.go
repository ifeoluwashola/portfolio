package main

import (
	"context"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"strings"
	"syscall"
	"time"

	"github.com/Ifeoluwa/portfolio/apps/api/internal/cache"
	"github.com/Ifeoluwa/portfolio/apps/api/internal/config"
	"github.com/Ifeoluwa/portfolio/apps/api/internal/database"
	"github.com/Ifeoluwa/portfolio/apps/api/internal/handler"
	"github.com/Ifeoluwa/portfolio/apps/api/internal/middleware"
	"github.com/Ifeoluwa/portfolio/apps/api/internal/notifications"
	"github.com/Ifeoluwa/portfolio/apps/api/internal/repository/github"
	"github.com/Ifeoluwa/portfolio/apps/api/internal/repository/postgres"
	"github.com/Ifeoluwa/portfolio/apps/api/internal/service"

	"github.com/prometheus/client_golang/prometheus/promhttp"
	"github.com/rs/cors"
)

func main() {
	// 1. Initialize Structured Logger
	var logger *slog.Logger
	if os.Getenv("APP_ENV") == "production" || os.Getenv("LOG_FORMAT") == "json" {
		logger = slog.New(slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{Level: slog.LevelInfo}))
	} else {
		logger = slog.New(slog.NewTextHandler(os.Stdout, &slog.HandlerOptions{Level: slog.LevelDebug}))
	}
	slog.SetDefault(logger)

	// 1. Load Configuration (fatal if JWT_SECRET missing)
	cfg := config.LoadConfig()

	// 2. Setup Database Connection Pool
	logger.Info("Initializing database connection...")
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	
	dbPool, err := database.NewPool(ctx, cfg.DatabaseURL)
	if err != nil {
		logger.Error("Failed to connect to database", slog.Any("error", err))
		os.Exit(1)
	}
	defer dbPool.Close()
	logger.Info("Database connection established.")

	// 2.1. Run Database Migrations
	if err := database.RunMigrations(ctx, cfg.DatabaseURL); err != nil {
		logger.Error("Database migrations failed", slog.Any("error", err))
		os.Exit(1)
	}

	// 3. Initialize Cache Layer (InMemory by default, Redis if URL provided)
	var tokenCache cache.TokenCache
	if cfg.RedisURL != "" {
		var redisErr error
		tokenCache, redisErr = cache.NewRedisCache(cfg.RedisURL)
		if redisErr != nil {
			logger.Warn("Redis connectivity failure, falling back to in-memory", slog.Any("error", redisErr))
			tokenCache = cache.NewInMemoryCache()
			logger.Info("Token cache initialized (in-memory)")
		} else {
			logger.Info("Token cache initialized (Redis) — persistent session layer active")
		}
	} else {
		tokenCache = cache.NewInMemoryCache()
		logger.Info("Token cache initialized (in-memory)")
	}

	// 4. Initialize Repositories
	contactRepo := postgres.NewContactRepository(dbPool)
	githubRepo := github.NewGithubClient(cfg.GithubToken)
	projectDataRepo := postgres.NewProjectRepository(dbPool)
	userRepo := postgres.NewUserRepository(dbPool)
	profileRepo := postgres.NewProfileRepository(dbPool)
	blogRepo := postgres.NewBlogRepository(dbPool)
	academyRepo := postgres.NewAcademyRepository(dbPool)

	// 5. Initialize Services
	contactSvc := service.NewContactService(contactRepo)
	projectSvc := service.NewProjectService(githubRepo)
	projectDataSvc := service.NewProjectDataService(projectDataRepo)
	profileSvc := service.NewProfileService(profileRepo)
	blogSvc := service.NewBlogService(blogRepo)

	resendNotifier := notifications.NewResendNotifier(cfg)
	authSvc := service.NewAuthService(userRepo, userRepo, cfg, tokenCache, resendNotifier)
	academySvc := service.NewAcademyService(academyRepo, userRepo, cfg, tokenCache, resendNotifier)

	// 6. Initialize Auth Middleware (dependency injected)
	authMW := middleware.NewAuthMiddleware(cfg.JWTSecret, tokenCache)

	// 7. Initialize Handlers
	contactHandler := handler.NewContactHandler(contactSvc, resendNotifier)
	projectHandler := handler.NewProjectHandler(projectSvc)
	projectDataHandler := handler.NewProjectDataHandler(projectDataSvc)
	authHandler := handler.NewAuthHandler(authSvc)
	profileHandler := handler.NewProfileHandler(profileSvc)
	blogHandler := handler.NewBlogHandler(blogSvc)
	academyHandler := handler.NewAcademyHandler(academySvc)

	// 8. Setup Rate Limiter
	rl := middleware.NewRateLimiter(tokenCache)
	loginLimit := rl.RateLimit(5, time.Minute)      // 5 attempts per minute
	commentLimit := rl.RateLimit(10, time.Minute)   // 10 comments per minute
	inviteLimit := rl.RateLimit(3, time.Hour)       // 3 invites per hour

	// 8. Setup Router (ServeMux)
	mux := http.NewServeMux()

	// Health Check
	mux.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		w.Write([]byte("OK"))
	})

	// Metrics (Prometheus)
	mux.Handle("/metrics", promhttp.Handler())

	// === PUBLIC ROUTES ===
	mux.HandleFunc("/api/v1/contact", contactHandler.HandleSubmitContact)
	mux.HandleFunc("/api/v1/projects/guardrail/stats", projectHandler.HandleGetGuardrailStats)

	// Admin Auth (public: login only — NO register endpoint)
	mux.HandleFunc("POST /api/v1/admin/login", loginLimit(authHandler.HandleLogin))
	mux.HandleFunc("POST /api/v1/admin/refresh", authHandler.HandleRefreshToken)
	mux.HandleFunc("POST /api/v1/admin/logout", authMW.RequireAuth(authHandler.HandleLogout))
	mux.HandleFunc("GET /api/v1/auth/session", authMW.RequireAuth(authHandler.HandleGetSession))

	// Blog API Routes (public)
	mux.HandleFunc("GET /api/v1/blog/{slug}", blogHandler.GetPostData)
	mux.HandleFunc("POST /api/v1/blog/{slug}/view", blogHandler.RegisterView)
	mux.HandleFunc("POST /api/v1/blog/{slug}/like", blogHandler.RegisterLike)
	mux.HandleFunc("POST /api/v1/blog/{slug}/comment", commentLimit(blogHandler.LeaveComment))

	// Academy Public Routes
	mux.HandleFunc("POST /api/v1/academy/apply", academyHandler.HandleApply)
	mux.HandleFunc("POST /api/v1/paystack/webhook", academyHandler.HandlePaystackWebhook)
	mux.HandleFunc("POST /api/v1/academy/login", loginLimit(academyHandler.HandleAcademyLogin))
	mux.HandleFunc("POST /api/v1/academy/refresh", academyHandler.HandleRefreshStudentToken)
	mux.HandleFunc("POST /api/v1/academy/logout", authMW.RequireStudentAuth(academyHandler.HandleAcademyLogout))
	mux.HandleFunc("GET /api/v1/academy/session", authMW.RequireStudentAuth(academyHandler.HandleGetSession))
	mux.HandleFunc("POST /api/v1/academy/forgot-password", loginLimit(academyHandler.HandleAcademyForgotPassword))
	mux.HandleFunc("POST /api/v1/academy/reset-password", loginLimit(academyHandler.HandleAcademyResetPassword))

	// Alumni Hall of Fame (public)
	mux.HandleFunc("GET /api/v1/alumni", academyHandler.HandleListAlumni)
	mux.HandleFunc("GET /api/v1/alumni/{slug}", academyHandler.HandleGetAlumniPortfolio)

	// Labs (public listing)
	mux.HandleFunc("GET /api/v1/labs", academyHandler.HandleListLabs)
	mux.HandleFunc("GET /api/v1/labs/{id}", academyHandler.HandleGetLab)

	// Profile API (GET is public, PUT is admin-protected)
	mux.HandleFunc("/api/v1/profile", func(w http.ResponseWriter, r *http.Request) {
		switch r.Method {
		case http.MethodGet:
			profileHandler.HandleGetProfile(w, r)
		case http.MethodPut:
			authMW.RequireAuth(profileHandler.HandleUpsertProfile).ServeHTTP(w, r)
		default:
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		}
	})

	// Dynamic DB Projects (GET is public, POST requires admin auth)
	mux.HandleFunc("/api/v1/projects", func(w http.ResponseWriter, r *http.Request) {
		switch r.Method {
		case http.MethodGet:
			projectDataHandler.HandleGetProjects(w, r)
		case http.MethodPost:
			authMW.RequireAuth(projectDataHandler.HandleCreateProject).ServeHTTP(w, r)
		default:
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		}
	})

	// === STUDENT PROTECTED ROUTES ===
	mux.HandleFunc("POST /api/v1/academy/change-password", authMW.RequireStudentAuth(academyHandler.HandleAcademyChangePassword))
	mux.HandleFunc("GET /api/v1/academy/dashboard", authMW.RequireStudentAuth(academyHandler.HandleGetStudentDashboard))
	mux.HandleFunc("POST /api/v1/academy/assignments", authMW.RequireStudentAuth(academyHandler.HandleSubmitAssignment))
	mux.HandleFunc("GET /api/v1/media/upload-url", authMW.RequireStudentAuth(academyHandler.HandleGetUploadURL))
	mux.HandleFunc("GET /api/v1/media/download-url", authMW.RequireStudentAuth(academyHandler.HandleGetDownloadURL))
	mux.HandleFunc("POST /api/v1/labs/{id}/submit", authMW.RequireStudentAuth(academyHandler.HandleSubmitLabFix))
	mux.HandleFunc("POST /api/v1/labs/submissions/{id}/comments", authMW.RequireStudentAuth(academyHandler.HandleAddSubmissionComment))
	mux.HandleFunc("POST /api/v1/academy/capstone", authMW.RequireStudentAuth(academyHandler.HandleSubmitCapstone))
	// Billing & Installments
	mux.HandleFunc("GET /api/v1/academy/billing", authMW.RequireStudentAuth(academyHandler.HandleGetBillingStatus))
	mux.HandleFunc("GET /api/v1/academy/billing/hub", authMW.RequireStudentAuth(academyHandler.HandleGetBillingHub))
	mux.HandleFunc("POST /api/v1/academy/billing/pay", authMW.RequireStudentAuth(academyHandler.HandleInitiateInstallmentPayment))
	
	// Attendance Gateway
	mux.HandleFunc("GET /api/v1/academy/sessions/{id}/join", authMW.RequireStudentAuth(academyHandler.HandleJoinSession))

	// === ADMIN PROTECTED ROUTES ===
	// Admin management
	mux.HandleFunc("POST /api/v1/admin/invite", inviteLimit(authMW.RequireAuth(authHandler.HandleInviteAdmin)))
	mux.HandleFunc("POST /api/v1/admin/change-password", loginLimit(authMW.RequireAuth(authHandler.HandleChangePassword)))
	mux.HandleFunc("GET /api/v1/admin/media/download-url", authMW.RequireAuth(academyHandler.HandleGetDownloadURL))

	// Contacts & Blog (admin)
	mux.HandleFunc("/api/v1/contacts", authMW.RequireAuth(contactHandler.HandleGetContacts))
	mux.HandleFunc("GET /api/v1/contacts/{id}", authMW.RequireAuth(contactHandler.HandleGetContactByID))
	mux.HandleFunc("GET /api/v1/admin/blog/stats", authMW.RequireAuth(blogHandler.GetAdminStats))
	mux.HandleFunc("GET /api/v1/admin/cohort-applications", authMW.RequireAuth(academyHandler.HandleGetAdminApplications))
	mux.HandleFunc("POST /api/v1/admin/applications/{id}/grant-scholarship", authMW.RequireAuth(academyHandler.HandleGrantScholarship))

	// Projects (admin)
	mux.HandleFunc("PUT /api/v1/projects/{id}", authMW.RequireAuth(projectDataHandler.HandleUpdateProject))
	mux.HandleFunc("DELETE /api/v1/projects/{id}", authMW.RequireAuth(projectDataHandler.HandleDeleteProject))

	// Academy Management (admin)
	mux.HandleFunc("GET /api/v1/admin/academy/weeks", authMW.RequireAuth(academyHandler.HandleGetCurriculum))
	mux.HandleFunc("PUT /api/v1/admin/academy/weeks", authMW.RequireAuth(academyHandler.HandleUpdateWeek))
	mux.HandleFunc("GET /api/v1/admin/academy/submissions", authMW.RequireAuth(academyHandler.HandleGetSubmissions))
	mux.HandleFunc("POST /api/v1/admin/academy/submissions/grade", authMW.RequireAuth(academyHandler.HandleGradeSubmission))
	mux.HandleFunc("POST /api/v1/admin/academy/broadcast-reschedule", authMW.RequireAuth(academyHandler.HandleBroadcastReschedule))

	// Break-It Labs Management (admin)
	mux.HandleFunc("POST /api/v1/admin/labs", authMW.RequireAuth(academyHandler.HandleAdminCreateLab))
	mux.HandleFunc("PUT /api/v1/admin/labs/{id}", authMW.RequireAuth(academyHandler.HandleAdminUpdateLab))
	mux.HandleFunc("DELETE /api/v1/admin/labs/{id}", authMW.RequireAuth(academyHandler.HandleAdminDeleteLab))
	mux.HandleFunc("POST /api/v1/admin/labs/winner", authMW.RequireAuth(academyHandler.HandleAdminSetLabWinner))

	// Disciplinary & Alumni Management (admin)
	mux.HandleFunc("GET /api/v1/admin/students", authMW.RequireAuth(academyHandler.HandleListAllStudents))
	mux.HandleFunc("POST /api/v1/admin/students/{id}/warn", authMW.RequireAuth(academyHandler.HandleWarnStudent))
	mux.HandleFunc("POST /api/v1/admin/students/{id}/disqualify", authMW.RequireAuth(academyHandler.HandleDisqualifyStudent))
	mux.HandleFunc("PUT /api/v1/admin/students/{id}/status", authMW.RequireAuth(academyHandler.HandleUpdateStudentStatus))
	mux.HandleFunc("GET /api/v1/admin/students/{id}/attendance", authMW.RequireAuth(academyHandler.HandleGetStudentAttendanceHistory))

	// Financial Command Center (admin)
	mux.HandleFunc("GET /api/v1/admin/billing/overview", authMW.RequireAuth(academyHandler.HandleGetAdminBillingOverview))
	mux.HandleFunc("GET /api/v1/admin/billing/ledger", authMW.RequireAuth(academyHandler.HandleGetAllStudentBillings))
	mux.HandleFunc("POST /api/v1/admin/billing/manual-payment", authMW.RequireAuth(academyHandler.HandleManualPayment))
	mux.HandleFunc("GET /api/v1/admin/alumni/eligible", authMW.RequireAuth(academyHandler.HandleGetEligibleStudents))
	mux.HandleFunc("GET /api/v1/admin/alumni/pending", authMW.RequireAuth(academyHandler.HandleListPendingCapstones))
	mux.HandleFunc("POST /api/v1/admin/alumni/approve/{id}", authMW.RequireAuth(academyHandler.HandleApproveCapstone))
	mux.HandleFunc("PUT /api/v1/admin/alumni/{id}", authMW.RequireAuth(academyHandler.HandleAdminUpdateAlumni))
	mux.HandleFunc("GET /api/v1/admin/alumni", authMW.RequireAuth(academyHandler.HandleListAlumni))
	
	// Class Sessions (admin)
	mux.HandleFunc("POST /api/v1/admin/academy/sessions", authMW.RequireAuth(academyHandler.HandleCreateClassSession))
	mux.HandleFunc("PUT /api/v1/admin/academy/sessions/{id}", authMW.RequireAuth(academyHandler.HandleUpdateClassSession))
	mux.HandleFunc("DELETE /api/v1/admin/academy/sessions/{id}", authMW.RequireAuth(academyHandler.HandleDeleteClassSession))
	mux.HandleFunc("GET /api/v1/admin/academy/sessions/{id}/attendance", authMW.RequireAuth(academyHandler.HandleGetSessionAttendance))

	// 9. Setup Middleware (CORS)
	allowedOrigins := strings.Split(cfg.AllowedOrigins, ",")
	for i := range allowedOrigins {
		allowedOrigins[i] = strings.TrimSpace(allowedOrigins[i])
	}

	c := cors.New(cors.Options{
		AllowedOrigins:   allowedOrigins,
		AllowedMethods:   []string{"GET", "POST", "OPTIONS", "PUT", "DELETE", "PATCH"},
		AllowedHeaders:   []string{"Content-Type", "Authorization"},
		AllowCredentials: true,
	})
	
	// Request Logger (apply before CORS)
	loggingHandler := middleware.RequestLogger(logger)(mux)
	finalHandler := c.Handler(loggingHandler)

	// Launch background workers as goroutines.
	// Both respect context cancellation for graceful shutdown.
	cronCtx, cronCancel := context.WithCancel(context.Background())
	go academySvc.RunPaymentLockCron(cronCtx)
	go academySvc.RunClassSessionAutomator(cronCtx)

	// 10. Start Server
	srv := &http.Server{
		Addr:    ":" + cfg.Port,
		Handler: finalHandler,
	}

	// Graceful Shutdown Channel
	stop := make(chan os.Signal, 1)
	signal.Notify(stop, os.Interrupt, syscall.SIGTERM)

	go func() {
		logger.Info("Starting API Server", slog.String("port", cfg.Port))
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			logger.Error("Could not listen", slog.Any("error", err))
			os.Exit(1)
		}
	}()

	<-stop
	logger.Info("Shutting down server...")
	cronCancel() // Stop the cron worker gracefully

	shutdownCtx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := srv.Shutdown(shutdownCtx); err != nil {
		logger.Error("Server shutdown failed", slog.Any("error", err))
		os.Exit(1)
	}
	logger.Info("Server stopped gracefully")
}
