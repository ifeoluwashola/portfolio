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

	"github.com/Ifeoluwa/portfolio/apps/api/internal/config"
	"github.com/Ifeoluwa/portfolio/apps/api/internal/database"
	"github.com/Ifeoluwa/portfolio/apps/api/internal/handler"
	"github.com/Ifeoluwa/portfolio/apps/api/internal/middleware"
	"github.com/Ifeoluwa/portfolio/apps/api/internal/repository/github"
	"github.com/Ifeoluwa/portfolio/apps/api/internal/repository/postgres"
	"github.com/Ifeoluwa/portfolio/apps/api/internal/service"

	"github.com/prometheus/client_golang/prometheus/promhttp"
	"github.com/rs/cors"
)

func main() {
	// 1. Load Configuration
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

	// 3. Initialize Repositories
	contactRepo := postgres.NewContactRepository(dbPool)
	githubRepo := github.NewGithubClient(cfg.GithubToken)
	projectDataRepo := postgres.NewProjectRepository(dbPool)
	userRepo := postgres.NewUserRepository(dbPool)
	profileRepo := postgres.NewProfileRepository(dbPool)
	blogRepo := postgres.NewBlogRepository(dbPool)

	// 4. Initialize Services
	contactSvc := service.NewContactService(contactRepo)
	projectSvc := service.NewProjectService(githubRepo)
	projectDataSvc := service.NewProjectDataService(projectDataRepo)
	authSvc := service.NewAuthService(userRepo)
	profileSvc := service.NewProfileService(profileRepo)
	blogSvc := service.NewBlogService(blogRepo)

	// 5. Initialize Handlers
	contactHandler := handler.NewContactHandler(contactSvc)
	projectHandler := handler.NewProjectHandler(projectSvc)
	projectDataHandler := handler.NewProjectDataHandler(projectDataSvc)
	authHandler := handler.NewAuthHandler(authSvc)
	profileHandler := handler.NewProfileHandler(profileSvc)
	blogHandler := handler.NewBlogHandler(blogSvc)

	// 6. Setup Router (ServeMux)
	mux := http.NewServeMux()

	// Health Check
	mux.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		w.Write([]byte("OK"))
	})

	// Metrics (Prometheus)
	mux.Handle("/metrics", promhttp.Handler())

	// API Routes
	mux.HandleFunc("/api/contact", contactHandler.HandleSubmitContact)
	mux.HandleFunc("/api/projects/guardrail/stats", projectHandler.HandleGetGuardrailStats)
	// Public Auth Routes
	mux.HandleFunc("/api/admin/register", authHandler.HandleRegister)
	mux.HandleFunc("/api/admin/login", authHandler.HandleLogin)
	mux.HandleFunc("/api/admin/logout", authHandler.HandleLogout)

	// Blog API Routes
	mux.HandleFunc("GET /api/blog/{slug}", blogHandler.GetPostData)
	mux.HandleFunc("POST /api/blog/{slug}/view", blogHandler.RegisterView)
	mux.HandleFunc("POST /api/blog/{slug}/like", blogHandler.RegisterLike)
	mux.HandleFunc("POST /api/blog/{slug}/comment", blogHandler.LeaveComment)

	// Profile API (GET is public, PUT is protected)
	mux.HandleFunc("/api/profile", func(w http.ResponseWriter, r *http.Request) {
		switch r.Method {
		case http.MethodGet:
			profileHandler.HandleGetProfile(w, r)
		case http.MethodPut:
			middleware.RequireAuth(profileHandler.HandleUpsertProfile).ServeHTTP(w, r)
		default:
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		}
	})

	// Protected Admin Routes (RequireAuth Middleware)
	mux.HandleFunc("/api/contacts", middleware.RequireAuth(contactHandler.HandleGetContacts))
	mux.HandleFunc("GET /api/contacts/{id}", middleware.RequireAuth(contactHandler.HandleGetContactByID))
	mux.HandleFunc("GET /api/admin/blog/stats", middleware.RequireAuth(blogHandler.GetAdminStats))
	
	// Dynamic DB Projects (GET is public, POST requires auth)
	mux.HandleFunc("/api/projects", func(w http.ResponseWriter, r *http.Request) {
		switch r.Method {
		case http.MethodGet:
			projectDataHandler.HandleGetProjects(w, r)
		case http.MethodPost:
			middleware.RequireAuth(projectDataHandler.HandleCreateProject).ServeHTTP(w, r)
		default:
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		}
	})
	mux.HandleFunc("PUT /api/projects/{id}", middleware.RequireAuth(projectDataHandler.HandleUpdateProject))
	mux.HandleFunc("DELETE /api/projects/{id}", middleware.RequireAuth(projectDataHandler.HandleDeleteProject))

	// 7. Setup Middleware (CORS)
	allowedOrigins := strings.Split(cfg.AllowedOrigins, ",")
	for i := range allowedOrigins {
		allowedOrigins[i] = strings.TrimSpace(allowedOrigins[i])
	}

	c := cors.New(cors.Options{
		AllowedOrigins:   allowedOrigins, // Dynamically loaded array
		AllowedMethods:   []string{"GET", "POST", "OPTIONS", "PUT", "DELETE", "PATCH"},
		AllowedHeaders:   []string{"Content-Type", "Authorization"},
		AllowCredentials: true,
	})
	handler := c.Handler(mux)

	// 8. Start Server
	server := &http.Server{
		Addr:    ":" + cfg.Port,
		Handler: handler,
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
