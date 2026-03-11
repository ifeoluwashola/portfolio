package github

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"github.com/Ifeoluwa/portfolio/apps/api/internal/domain"
)

type GithubClient struct {
	token      string
	httpClient *http.Client
}

func NewGithubClient(token string) domain.GithubRepository {
	return &GithubClient{
		token: token,
		httpClient: &http.Client{
			Timeout: 10 * time.Second,
		},
	}
}

func (c *GithubClient) GetRepoStats(ctx context.Context, owner, repo string) (*domain.ProjectStats, error) {
	url := fmt.Sprintf("https://api.github.com/repos/%s/%s", owner, repo)

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
	if err != nil {
		return nil, fmt.Errorf("could not create github request: %w", err)
	}

	req.Header.Set("Accept", "application/vnd.github.v3+json")
	if c.token != "" && c.token != "your_personal_access_token" {
		req.Header.Set("Authorization", "Bearer "+c.token)
	}

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("github api request failed: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("unexpected status code from github: %d", resp.StatusCode)
	}

	var data struct {
		Name        string `json:"name"`
		Stargazers  int    `json:"stargazers_count"`
		Forks       int    `json:"forks_count"`
		OpenIssues  int    `json:"open_issues_count"`
		Description string `json:"description"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&data); err != nil {
		return nil, fmt.Errorf("could not decode github response: %w", err)
	}

	return &domain.ProjectStats{
		Name:        data.Name,
		Stars:       data.Stargazers,
		Forks:       data.Forks,
		OpenIssues:  data.OpenIssues,
		Description: data.Description,
	}, nil
}
