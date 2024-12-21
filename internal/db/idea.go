package db

import (
	"context"
	"time"
)

type Idea struct {
	ID          string     `db:"id" json:"id"`
	Name        string     `db:"name" json:"name"`
	Description *string    `db:"description" json:"description"`
	CategoryID  string     `db:"category_id" json:"category_id"`
	Price       *float64   `db:"price" json:"price"`
	Currency    *string    `db:"currency" json:"currency"`
	ImageURL    *string    `db:"image_url" json:"image_url"`
	URL         *string    `db:"url" json:"url"`
	CreatedAt   time.Time  `db:"created_at" json:"created_at"`
	UpdatedAt   time.Time  `db:"updated_at" json:"updated_at"`
	DeletedAt   *time.Time `db:"deleted_at" json:"deleted_at"`
}

func (s *storage) ListIdeas(ctx context.Context, uid string) ([]Idea, error) {
	var ideas []Idea

	query := `
		SELECT id, name, description, category_id, price, currency, image_url, url, created_at, updated_at, deleted_at
		FROM ideas
		ORDER BY created_at DESC
		LIMIT 100
	`

	rows, err := s.db.QueryContext(ctx, query)

	if err != nil {
		return nil, err
	}

	defer rows.Close()

	for rows.Next() {
		var i Idea
		err := rows.Scan(&i.ID, &i.Name, &i.Description, &i.CategoryID, &i.Price, &i.Currency, &i.ImageURL, &i.URL, &i.CreatedAt, &i.UpdatedAt, &i.DeletedAt)
		if err != nil {
			return nil, err
		}
		ideas = append(ideas, i)
	}

	if err = rows.Err(); err != nil {
		return nil, err
	}

	return ideas, nil
}

func (s *storage) CreateIdea(ctx context.Context, idea Idea) error {
	query := `
		INSERT INTO ideas (id, name, description, category_id, price, currency, image_url, url, created_at, updated_at)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
			
	`

	if _, err := s.db.ExecContext(
		ctx,
		query,
		idea.ID,
		idea.Name,
		idea.Description,
		idea.CategoryID,
		idea.Price,
		idea.Currency,
		idea.ImageURL,
		idea.URL,
		idea.CreatedAt,
		idea.UpdatedAt,
	); err != nil {
		return err
	}

	return nil
}

func (s *storage) GetIdeaByID(ctx context.Context, id string) (Idea, error) {
	var res Idea

	query := `
		SELECT id, name, description, category_id, price, currency, image_url, url, created_at, updated_at, deleted_at
		FROM ideas
		WHERE id = ?
	`

	if err := s.db.QueryRowContext(ctx, query, id).Scan(
		res.ID,
		res.Name,
		res.Description,
		res.CategoryID,
		res.Price,
		res.Currency,
		res.ImageURL,
		res.URL,
		res.CreatedAt,
		res.UpdatedAt,
	); err != nil && IsNoRowsError(err) {
		return Idea{}, ErrNotFound
	} else if err != nil {
		return Idea{}, err
	}

	return res, nil
}
