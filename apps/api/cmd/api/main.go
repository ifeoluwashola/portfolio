package main

import (
	"context"
	"log"
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
	// 1. Load Configuration (fatal if JWT_SECRET missing)
	cfg := config.LoadConfig()

	// 2. Setup Database Connection Pool
	log.Println("Initializing database connection...")
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	
	dbPool, err := database.NewPool(ctx, cfg.DatabaseURL)
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}
	defer dbPool.Close()
	log.Println("Database connection established.")

	// 3. Initialize Cache Layer (InMemory by default, Redis if URL provided)
	var tokenCache cache.TokenCache
	if cfg.RedisURL != "" {
		var redisErr error
		tokenCache, redisErr = cache.NewRedisCache(cfg.RedisURL)
		if redisErr != nil {
			log.Printf("WRN: Redis connectivity failure, falling back to in-memory: %v", redisErr)
			tokenCache = cache.NewInMemoryCache()
			log.Println("Token cache initialized (in-memory)")
		} else {
			log.Println("Token cache initialized (Redis) — persistent session layer active")
		}
	} else {
		tokenCache = cache.NewInMemoryCache()
		log.Println("Token cache initialized (in-memory)")
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
	authSvc := service.NewAuthService(userRepo, cfg, tokenCache, resendNotifier)
	academySvc := service.NewAcademyService(academyRepo, cfg, resendNotifier)

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
	mux.HandleFunc("/api/contact", contactHandler.HandleSubmitContact)
	mux.HandleFunc("/api/projects/guardrail/stats", projectHandler.HandleGetGuardrailStats)

	// Admin Auth (public: login only — NO register endpoint)
	mux.HandleFunc("POST /api/admin/login", authHandler.HandleLogin)
	mux.HandleFunc("POST /api/admin/logout", authMW.RequireAuth(authHandler.HandleLogout))

	// Blog API Routes (public)
	mux.HandleFunc("GET /api/blog/{slug}", blogHandler.GetPostData)
	mux.HandleFunc("POST /api/blog/{slug}/view", blogHandler.RegisterView)
	mux.HandleFunc("POST /api/blog/{slug}/like", blogHandler.RegisterLike)
	mux.HandleFunc("POST /api/blog/{slug}/comment", blogHandler.LeaveComment)

	// Academy Public Routes
	mux.HandleFunc("POST /api/v1/academy/apply", academyHandler.HandleApply)
	mux.HandleFunc("POST /api/v1/paystack/webhook", academyHandler.HandlePaystackWebhook)
	mux.HandleFunc("POST /api/v1/academy/login", academyHandler.HandleAcademyLogin)
	mux.HandleFunc("POST /api/v1/academy/logout", authMW.RequireStudentAuth(academyHandler.HandleAcademyLogout))
	mux.HandleFunc("POST /api/v1/academy/forgot-password", academyHandler.HandleAcademyForgotPassword)
	mux.HandleFunc("POST /api/v1/academy/reset-password", academyHandler.HandleAcademyResetPassword)

	// Alumni Hall of Fame (public)
	mux.HandleFunc("GET /api/v1/alumni", academyHandler.HandleListAlumni)
	mux.HandleFunc("GET /api/v1/alumni/{slug}", academyHandler.HandleGetAlumniPortfolio)

	// Labs (public listing)
	mux.HandleFunc("GET /api/v1/labs", academyHandler.HandleListLabs)
	mux.HandleFunc("GET /api/v1/labs/{id}", academyHandler.HandleGetLab)

	// Profile API (GET is public, PUT is admin-protected)
	mux.HandleFunc("/api/profile", func(w http.ResponseWriter, r *http.Request) {
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
	mux.HandleFunc("/api/projects", func(w http.ResponseWriter, r *http.Request) {
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
	mux.HandleFunc("POST /api/v1/labs/{id}/submit", authMW.RequireStudentAuth(academyHandler.HandleSubmitLabFix))
	mux.HandleFunc("POST /api/v1/labs/submissions/{id}/comments", authMW.RequireStudentAuth(academyHandler.HandleAddSubmissionComment))
	mux.HandleFunc("POST /api/v1/academy/capstone", authMW.RequireStudentAuth(academyHandler.HandleSubmitCapstone))

	// === ADMIN PROTECTED ROUTES ===
	// Admin management
	mux.HandleFunc("POST /api/admin/invite", authMW.RequireAuth(authHandler.HandleInviteAdmin))
	mux.HandleFunc("POST /api/admin/change-password", authMW.RequireAuth(authHandler.HandleChangePassword))

	// Contacts & Blog (admin)
	mux.HandleFunc("/api/contacts", authMW.RequireAuth(contactHandler.HandleGetContacts))
	mux.HandleFunc("GET /api/contacts/{id}", authMW.RequireAuth(contactHandler.HandleGetContactByID))
	mux.HandleFunc("GET /api/admin/blog/stats", authMW.RequireAuth(blogHandler.GetAdminStats))
	mux.HandleFunc("GET /api/admin/cohort-applications", authMW.RequireAuth(academyHandler.HandleGetAdminApplications))

	// Projects (admin)
	mux.HandleFunc("PUT /api/projects/{id}", authMW.RequireAuth(projectDataHandler.HandleUpdateProject))
	mux.HandleFunc("DELETE /api/projects/{id}", authMW.RequireAuth(projectDataHandler.HandleDeleteProject))

	// Academy Management (admin)
	mux.HandleFunc("GET /api/v1/admin/academy/weeks", authMW.RequireAuth(academyHandler.HandleGetCurriculum))
	mux.HandleFunc("PUT /api/v1/admin/academy/weeks", authMW.RequireAuth(academyHandler.HandleUpdateWeek))
	mux.HandleFunc("GET /api/v1/admin/academy/submissions", authMW.RequireAuth(academyHandler.HandleGetSubmissions))
	mux.HandleFunc("POST /api/v1/admin/academy/submissions/grade", authMW.RequireAuth(academyHandler.HandleGradeSubmission))

	// Break-It Labs Management (admin)
	mux.HandleFunc("POST /api/v1/admin/labs", authMW.RequireAuth(academyHandler.HandleAdminCreateLab))
	mux.HandleFunc("PUT /api/v1/admin/labs/{id}", authMW.RequireAuth(academyHandler.HandleAdminUpdateLab))
	mux.HandleFunc("DELETE /api/v1/admin/labs/{id}", authMW.RequireAuth(academyHandler.HandleAdminDeleteLab))
	mux.HandleFunc("POST /api/v1/admin/labs/winner", authMW.RequireAuth(academyHandler.HandleAdminSetLabWinner))

	// Disciplinary & Alumni Management (admin)
	mux.HandleFunc("GET /api/v1/admin/students", authMW.RequireAuth(academyHandler.HandleListAllStudents))
	mux.HandleFunc("POST /api/v1/admin/students/{id}/warn", authMW.RequireAuth(academyHandler.HandleWarnStudent))
	mux.HandleFunc("POST /api/v1/admin/students/{id}/disqualify", authMW.RequireAuth(academyHandler.HandleDisqualifyStudent))
	mux.HandleFunc("GET /api/v1/admin/alumni/eligible", authMW.RequireAuth(academyHandler.HandleGetEligibleStudents))
	mux.HandleFunc("GET /api/v1/admin/alumni/pending", authMW.RequireAuth(academyHandler.HandleListPendingCapstones))
	mux.HandleFunc("POST /api/v1/admin/alumni/approve/{id}", authMW.RequireAuth(academyHandler.HandleApproveCapstone))
	mux.HandleFunc("PUT /api/v1/admin/alumni/{id}", authMW.RequireAuth(academyHandler.HandleAdminUpdateAlumni))
	mux.HandleFunc("GET /api/v1/admin/alumni", authMW.RequireAuth(academyHandler.HandleListAlumni))

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
	finalHandler := c.Handler(mux)

	// 10. Start Server
	server := &http.Server{
		Addr:    ":" + cfg.Port,
		Handler: finalHandler,
	}

	// Graceful Shutdown Channel
	stop := make(chan os.Signal, 1)
	signal.Notify(stop, os.Interrupt, syscall.SIGTERM)

	go func() {
		log.Printf("Starting API Server on :%s\n", cfg.Port)
		if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("Server error: %v", err)
		}
	}()

	<-stop
	log.Println("Shutting down server...")

	shutdownCtx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := server.Shutdown(shutdownCtx); err != nil {
		log.Fatalf("Server shutdown failed: %v", err)
	}
	log.Println("Server stopped gracefully")
}
