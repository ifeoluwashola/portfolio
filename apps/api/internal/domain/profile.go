package domain

import (
	"context"
	"encoding/json"
	"time"
)

// Experience represents a single work experience entry
type Experience struct {
	Role         string `json:"role"`
	Company      string `json:"company"`
	StartTime    string `json:"start_time"`
	EndTime      string `json:"end_time"`
	IsPresent    bool   `json:"is_present"`
	WorkType     string `json:"work_type"`
	LocationType string `json:"location_type"`
	Location     string `json:"location"`
	Description  string `json:"description"`
}

// Education represents a single education entry
type Education struct {
	Degree      string `json:"degree"`
	Institution string `json:"institution"`
	StartTime   string `json:"start_time"`
	EndTime     string `json:"end_time"`
	ProgramType string `json:"program_type"`
}

// Certification represents a single certification entry
type Certification struct {
	Name string `json:"name"`
	Year string `json:"year"`
}

// Profile represents the engineer's About Me data
type Profile struct {
	ID              int             `json:"id"`
	Bio             string          `json:"bio"`
	AvatarURL       string          `json:"avatar_url"`
	Email           string          `json:"email"`
	Phone           string          `json:"phone"`
	WhatsappNumber  string          `json:"whatsapp_number"`
	Location        string          `json:"location"`
	GithubURL       string          `json:"github_url"`
	LinkedinURL     string          `json:"linkedin_url"`
	TwitterURL      string          `json:"twitter_url"`
	Experiences     json.RawMessage `json:"experiences"`      // Stored as JSONB in DB
	Education       json.RawMessage `json:"education"`        // Stored as JSONB in DB
	Certifications  json.RawMessage `json:"certifications"`   // Stored as JSONB in DB
	TechnicalSkills json.RawMessage `json:"technical_skills"` // Array of strings stored as JSONB
	UpdatedAt       time.Time       `json:"updated_at"`
}

type ProfileRepository interface {
	GetProfile(ctx context.Context) (*Profile, error)
	UpsertProfile(ctx context.Context, profile *Profile) error
}

type ProfileService interface {
	GetProfile(ctx context.Context) (*Profile, error)
	UpsertProfile(ctx context.Context, profile *Profile) error
}
