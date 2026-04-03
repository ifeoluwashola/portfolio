package main

import (
	"context"
	"fmt"
	"log"
	"os"

	"github.com/jackc/pgx/v5/pgxpool"
)

func main() {
	ctx := context.Background()
	dbURL := "postgres://mac:@localhost:5432/portfolio?sslmode=disable"
	pool, err := pgxpool.New(ctx, dbURL)
	if err != nil {
		log.Fatal(err)
	}
	defer pool.Close()

	alumniID := 1
	query := `
		SELECT id, alumni_id, project_title, description, architecture_diagram_url, live_demo_url, repo_url, created_at
		FROM capstone_projects
		WHERE alumni_id = $1
		ORDER BY created_at ASC
	`
	rows, err := pool.Query(ctx, query, alumniID)
	if err != nil {
		log.Fatal(err)
	}
	defer rows.Close()

	count := 0
	for rows.Next() {
		count++
		var id, aid int
		var title, desc, arch, live, repo string
		var createdAt interface{}
		err := rows.Scan(&id, &aid, &title, &desc, &arch, &live, &repo, &createdAt)
		if err != nil {
			log.Fatal(err)
		}
		fmt.Printf("Project %d: %s\n", id, title)
	}
	fmt.Printf("Total projects for alumni %d: %d\n", alumniID, count)
}
