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

	Items []WishlistItem `json:"items"`
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

type WishlistItem struct {
	ID          string     `db:"id" json:"id"`
	WishlistID  string     `db:"wishlist_id" json:"wishlist_id"`
	Name        string     `db:"name" json:"name"`
	URL         *string    `db:"url" json:"url"`
	Price       *float64   `db:"price" json:"price"`
	Currency    *string    `db:"currency" json:"currency"`
	ImageURL    *string    `db:"image_url" json:"image_url"`
	Notes       *string    `db:"notes" json:"notes"`
	SourceID    *string    `db:"source_id" json:"source_id"`
	SourceType  *string    `db:"source_type" json:"source_type"`
	IsPurchased bool       `db:"is_purchased" json:"is_purchased"`
	IsPublic    bool       `db:"is_public" json:"is_public"`
	CreatedAt   time.Time  `db:"created_at" json:"created_at"`
	UpdatedAt   time.Time  `db:"updated_at" json:"updated_at"`
	DeletedAt   *time.Time `db:"deleted_at" json:"deleted_at"`
}

func (s *storage) GetWishlistItemByID(ctx context.Context, id string) (WishlistItem, error) {
	query := `SELECT id, wishlist_id, name, url, price, currency, image_url, notes, is_purchased, is_public, created_at, updated_at FROM wishlist_items WHERE id = ?`

	var item WishlistItem

	if err := s.db.QueryRowContext(ctx, query, id).Scan(
		&item.ID,
		&item.WishlistID,
		&item.Name,
		&item.URL,
		&item.Price,
		&item.Currency,
		&item.ImageURL,
		&item.Notes,
		&item.IsPurchased,
		&item.IsPublic,
		&item.CreatedAt,
		&item.UpdatedAt,
	); err != nil && IsNoRowsError(err) {
		return WishlistItem{}, ErrNotFound
	} else if err != nil {
		return WishlistItem{}, err
	}

	return item, nil
}

func (s *storage) CreateWishlistItem(ctx context.Context, item WishlistItem) (WishlistItem, error) {
	query := `INSERT INTO wishlist_items (id, wishlist_id, name, url, price, currency, image_url, notes, is_purchased, is_public) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`

	_, err := s.db.ExecContext(ctx, query,
		item.ID,
		item.WishlistID,
		item.Name,
		item.URL,
		item.Price,
		item.Currency,
		item.ImageURL,
		item.Notes,
		item.IsPurchased,
		item.IsPublic,
	)

	if err != nil {
		return WishlistItem{}, err
	}

	return s.GetWishlistItemByID(ctx, item.ID)
}

func (s *storage) UpdateWishlistItem(ctx context.Context, item WishlistItem) (WishlistItem, error) {
	query := `UPDATE wishlist_items SET name = ?, url = ?, price = ?, notes = ?, is_purchased = ?, image_url = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`

	_, err := s.db.ExecContext(ctx, query,
		item.ID,
		item.Name,
		item.URL,
		item.Price,
		item.Notes,
		item.IsPurchased,
		item.ImageURL,
		item.ID,
	)

	if err != nil {
		return WishlistItem{}, err
	}

	return s.GetWishlistItemByID(ctx, item.ID)
}

func (s *storage) GetWishlistByUserID(ctx context.Context, userID string) (Wishlist, error) {
	query := `SELECT id, user_id, name, description, is_public, created_at FROM wishlists WHERE user_id = ? LIMIT 1`

	var list Wishlist

	if err := s.db.QueryRowContext(ctx, query, userID).Scan(
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

	items, err := s.GetWishlistItemsByWishListID(ctx, list.ID)
	if err != nil {
		return Wishlist{}, err
	}

	list.Items = items

	return list, nil
}

func (s *storage) fetchWishlistItems(ctx context.Context, query string, args ...interface{}) ([]WishlistItem, error) {
	rows, err := s.db.QueryContext(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	items := make([]WishlistItem, 0)
	for rows.Next() {
		var item WishlistItem
		if err := rows.Scan(
			&item.ID,
			&item.WishlistID,
			&item.Name,
			&item.URL,
			&item.Price,
			&item.Notes,
			&item.IsPurchased,
			&item.ImageURL,
			&item.SourceID,
			&item.SourceType,
			&item.CreatedAt,
			&item.UpdatedAt,
		); err != nil {
			return nil, err
		}
		items = append(items, item)
	}

	return items, nil
}

func (s *storage) GetWishlistItems(ctx context.Context) ([]WishlistItem, error) {
	query := `SELECT id, wishlist_id, name, url, price, notes, is_purchased, image_url, source_id, source_type, created_at, updated_at FROM wishlist_items
		      ORDER BY created_at DESC LIMIT 100`
	return s.fetchWishlistItems(ctx, query)
}

func (s *storage) GetWishlistItemsByWishListID(ctx context.Context, wishlistID string) ([]WishlistItem, error) {
	query := `SELECT id, wishlist_id, name, url, price, notes, is_purchased, image_url, source_id, source_type, created_at, updated_at FROM wishlist_items WHERE wishlist_id = ?
			  ORDER BY created_at DESC LIMIT 100`
	return s.fetchWishlistItems(ctx, query, wishlistID)
}

func (s *storage) GetWishlistItemsByUserID(ctx context.Context, userID string) ([]WishlistItem, error) {
	query := `SELECT id, wishlist_id, name, url, price, notes, is_purchased, image_url, source_id, source_type, created_at, updated_at FROM wishlist_items
              WHERE wishlist_id IN (SELECT id FROM wishlists WHERE user_id = ?)
              ORDER BY created_at DESC LIMIT 100`
	return s.fetchWishlistItems(ctx, query, userID)
}
