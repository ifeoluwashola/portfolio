package main

import (
	"context"
	"flag"
	"fmt"
	"log"
	"os"

	"github.com/Ifeoluwa/portfolio/apps/api/internal/config"
	"github.com/Ifeoluwa/portfolio/apps/api/internal/database"
	"golang.org/x/crypto/bcrypt"
)

func main() {
	var (
		email     = flag.String("email", "", "Admin email address")
		password  = flag.String("password", "", "Admin password")
		firstName = flag.String("firstname", "Super", "Admin first name")
		lastName  = flag.String("lastname", "Admin", "Admin last name")
	)
	flag.Parse()

	if *email == "" || *password == "" {
		fmt.Println("Usage: go run cmd/seed-admin/main.go -email <email> -password <password>")
		os.Exit(1)
	}

	// Hash password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(*password), bcrypt.DefaultCost)
	if err != nil {
		log.Fatalf("Failed to hash password: %v", err)
	}

	username := *email
	rawSQL := fmt.Sprintf(`INSERT INTO users (username, email, password_hash, first_name, last_name, role, is_first_login) VALUES ('%s', '%s', '%s', '%s', '%s', 'admin', false) ON CONFLICT (email) DO UPDATE SET password_hash = '%s', role = 'admin';`, username, *email, string(hashedPassword), *firstName, *lastName, string(hashedPassword))

	cfg := config.LoadConfig()
	if cfg.DatabaseURL == "" {
		fmt.Println("\nNo DATABASE_URL found. Run the following SQL command manually on your EC2 instance:")
		fmt.Println("\n" + rawSQL + "\n")
		fmt.Println("Example using docker exec (replace <container_id_or_name> with your postgres container):")
		fmt.Printf("docker exec -i <container_id_or_name> psql -U postgres -d kybern_db -c \"%s\"\n", rawSQL)
		return
	}

	ctx := context.Background()
	pool, err := database.NewPool(ctx, cfg.DatabaseURL)
	if err != nil {
		fmt.Printf("Failed to connect to database: %v\n", err)
		fmt.Println("\nCould not connect to the database. If your DB is on a private network (like inside an EC2 docker-compose), run this SQL manually inside the EC2 instance:")
		fmt.Println("\n" + rawSQL + "\n")
		return
	}
	defer pool.Close()

	query := `
		INSERT INTO users (username, email, password_hash, first_name, last_name, role, is_first_login)
		VALUES ($1, $2, $3, $4, $5, 'admin', false)
		ON CONFLICT (email) DO UPDATE 
		SET password_hash = $3, role = 'admin'
		RETURNING id
	`

	var id int
	err = pool.QueryRow(ctx, query, username, *email, string(hashedPassword), *firstName, *lastName).Scan(&id)
	if err != nil {
		log.Fatalf("Failed to insert admin user: %v", err)
	}

	fmt.Printf("Successfully created/updated admin user with ID %d\n", id)
}
