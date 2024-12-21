package db

import (
	"context"
	"time"
)

type Wish struct {
	ID          string     `db:"id" json:"id"`
	UserID      string     `db:"user_id" json:"user_id"`
	Name        string     `db:"name" json:"name"`
	URL         *string    `db:"url" json:"url"`
	Price       *float64   `db:"price" json:"price"`
	Currency    *string    `db:"currency" json:"currency"`
	ImageURL    *string    `db:"image_url" json:"image_url"`
	Notes       *string    `db:"notes" json:"notes"`
	SourceID    *string    `db:"source_id" json:"source_id"`
	SourceType  *string    `db:"source_type" json:"source_type"`
	IsFulfilled bool       `db:"is_fulfilled" json:"is_fulfilled"`
	IsPublic    bool       `db:"is_public" json:"is_public"`
	IsFavorite  bool       `db:"is_favorite" json:"is_favorite"`
	ReservedBy  *string    `db:"reserved_by" json:"reserved_by"`
	ReservedAt  *time.Time `db:"reserved_at" json:"reserved_at"`
	CreatedAt   time.Time  `db:"created_at" json:"created_at"`
	UpdatedAt   time.Time  `db:"updated_at" json:"updated_at"`
	DeletedAt   *time.Time `db:"deleted_at" json:"deleted_at"`
}

func (s *storage) GetWishByID(ctx context.Context, id string) (Wish, error) {
	query := `SELECT 
    		id, 
    		user_id,
    		name, 
    		url, 
    		price,
    		currency,
    		image_url,
    		notes, 
    		is_fulfilled, 
    		is_public, 
    		is_favorite,
    		reserved_by, 
    		reserved_at, 
    		created_at, 
    		updated_at
		FROM wishes WHERE id = ?`

	var item Wish

	if err := s.db.QueryRowContext(ctx, query, id).Scan(
		&item.ID,
		&item.UserID,
		&item.Name,
		&item.URL,
		&item.Price,
		&item.Currency,
		&item.ImageURL,
		&item.Notes,
		&item.IsFulfilled,
		&item.IsPublic,
		&item.IsFavorite,
		&item.ReservedBy,
		&item.ReservedAt,
		&item.CreatedAt,
		&item.UpdatedAt,
	); err != nil && IsNoRowsError(err) {
		return Wish{}, ErrNotFound
	} else if err != nil {
		return Wish{}, err
	}

	return item, nil
}

func (s *storage) CreateWish(ctx context.Context, item Wish) (Wish, error) {
	query := `INSERT INTO wishes (id, user_id, name, url, price, currency, image_url, notes, is_fulfilled, is_public) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`

	_, err := s.db.ExecContext(ctx, query,
		item.ID,
		item.UserID,
		item.Name,
		item.URL,
		item.Price,
		item.Currency,
		item.ImageURL,
		item.Notes,
		item.IsFulfilled,
		item.IsPublic,
	)

	if err != nil {
		return Wish{}, err
	}

	return s.GetWishByID(ctx, item.ID)
}

func (s *storage) UpdateWish(ctx context.Context, item Wish) (Wish, error) {
	query := `UPDATE wishes SET name = ?, url = ?, price = ?, notes = ?, is_fulfilled = ?, image_url = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`

	_, err := s.db.ExecContext(ctx, query,
		item.ID,
		item.Name,
		item.URL,
		item.Price,
		item.Notes,
		item.IsFulfilled,
		item.ImageURL,
		item.ID,
	)

	if err != nil {
		return Wish{}, err
	}

	return s.GetWishByID(ctx, item.ID)
}

func (s *storage) fetchWishes(ctx context.Context, query string, args ...interface{}) ([]Wish, error) {
	rows, err := s.db.QueryContext(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	items := make([]Wish, 0)
	for rows.Next() {
		var item Wish
		if err := rows.Scan(
			&item.ID,
			&item.UserID,
			&item.Name,
			&item.URL,
			&item.Price,
			&item.Currency,
			&item.Notes,
			&item.IsFulfilled,
			&item.IsFavorite,
			&item.IsPublic,
			&item.ImageURL,
			&item.SourceID,
			&item.SourceType,
			&item.ReservedBy,
			&item.ReservedAt,
			&item.CreatedAt,
			&item.UpdatedAt,
		); err != nil {
			return nil, err
		}
		items = append(items, item)
	}

	return items, nil
}

func (s *storage) ListWishes(ctx context.Context) ([]Wish, error) {
	query := `SELECT id, user_id, name, url, price, currency, notes, is_fulfilled, is_favorite, is_public, image_url, source_id, source_type, reserved_by, reserved_at, created_at, updated_at FROM wishes
		      ORDER BY created_at DESC LIMIT 100`
	return s.fetchWishes(ctx, query)
}

func (s *storage) GetWishesByUserID(ctx context.Context, userID string) ([]Wish, error) {
	query := `SELECT id, user_id, name, url, price, currency, notes, is_fulfilled, is_favorite, is_public, image_url, source_id, source_type, reserved_by, reserved_at, created_at, updated_at FROM wishes
              WHERE user_id = ?
              ORDER BY created_at DESC LIMIT 100`
	return s.fetchWishes(ctx, query, userID)
}
