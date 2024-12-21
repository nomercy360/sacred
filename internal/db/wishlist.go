package db

import (
	"context"
	"time"
)

type Wishlist struct {
	ID          string     `db:"id" json:"id"`
	UserID      string     `db:"user_id" json:"user_id"`
	Name        string     `db:"name" json:"name"`
	Description string     `db:"description" json:"description"`
	IsPublic    bool       `db:"is_public" json:"is_public"`
	CreatedAt   time.Time  `db:"created_at" json:"created_at"`
	UpdatedAt   time.Time  `db:"updated_at" json:"updated_at"`
	DeletedAt   *time.Time `db:"deleted_at" json:"deleted_at"`
}

func (s *storage) CreateWishlist(ctx context.Context, list Wishlist) (Wishlist, error) {
	query := `INSERT INTO wishlists (id, user_id, name, description, is_public) VALUES (?, ?, ?, ?, ?)`

	_, err := s.db.ExecContext(ctx, query,
		list.ID,
		list.UserID,
		list.Name,
		list.Description,
		list.IsPublic,
	)

	if err != nil {
		return Wishlist{}, err
	}

	return s.GetWishlistByID(ctx, list.ID)
}

func (s *storage) GetWishlistByID(ctx context.Context, id string) (Wishlist, error) {
	query := `SELECT id, user_id, name, description, is_public, created_at FROM wishlists WHERE id = ?`

	var list Wishlist

	if err := s.db.QueryRowContext(ctx, query, id).Scan(
		&list.ID,
		&list.UserID,
		&list.Name,
		&list.Description,
		&list.IsPublic,
		&list.CreatedAt,
	); err != nil && IsNoRowsError(err) {
		return Wishlist{}, ErrNotFound
	} else if err != nil {
		return Wishlist{}, err
	}

	return list, nil
}

func (s *storage) GetWishlists(ctx context.Context) ([]Wishlist, error) {
	query := `SELECT id, user_id, name, description, is_public, created_at FROM wishlists`

	rows, err := s.db.QueryContext(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	lists := make([]Wishlist, 0)

	for rows.Next() {
		var list Wishlist
		if err := rows.Scan(
			&list.ID,
			&list.UserID,
			&list.Name,
			&list.Description,
			&list.IsPublic,
			&list.CreatedAt,
		); err != nil {
			return nil, err
		}

		lists = append(lists, list)
	}

	return lists, nil
}
