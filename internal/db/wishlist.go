package db

import (
	"context"
	"time"
)

type Wishlist struct {
	ID          int64      `db:"id" json:"id"`
	UserID      int64      `db:"user_id" json:"user_id"`
	Name        string     `db:"name" json:"name"`
	Description string     `db:"description" json:"description"`
	IsPublic    bool       `db:"is_public" json:"is_public"`
	CreatedAt   time.Time  `db:"created_at" json:"created_at"`
	UpdateAt    time.Time  `db:"updated_at" json:"updated_at"`
	DeletedAt   *time.Time `db:"deleted_at" json:"deleted_at"`

	Items []WishlistItem `json:"items"`
}

func (s *storage) CreateWishlist(ctx context.Context, list Wishlist) (Wishlist, error) {
	query := `INSERT INTO wishlists (user_id, name, description, is_public) VALUES (?, ?, ?, ?)`

	res, err := s.db.ExecContext(ctx, query,
		list.UserID,
		list.Name,
		list.Description,
		list.IsPublic,
	)

	if err != nil {
		return Wishlist{}, err
	}

	betID, err := res.LastInsertId()
	if err != nil {
		return Wishlist{}, err
	}

	return s.GetWishlistByID(ctx, betID)
}

func (s *storage) GetWishlistByID(ctx context.Context, id int64) (Wishlist, error) {
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
	ID          int64     `db:"id" json:"id"`
	WishlistID  int64     `db:"wishlist_id" json:"wishlist_id"`
	Title       *string   `db:"title" json:"title"`
	URL         string    `db:"url" json:"url"`
	Price       *float64  `db:"price" json:"price"`
	Currency    *string   `db:"currency" json:"currency"`
	ImageURL    *string   `db:"image_url" json:"image_url"`
	Notes       *string   `db:"notes" json:"notes"`
	IsPurchased bool      `db:"is_purchased" json:"is_purchased"`
	CreatedAt   time.Time `db:"created_at" json:"created_at"`
	UpdateAt    time.Time `db:"updated_at" json:"updated_at"`
}

func (s *storage) GetWishlistItemByID(ctx context.Context, id int64) (WishlistItem, error) {
	query := `SELECT id, wishlist_id, title, url, price, notes, is_purchased, created_at, updated_at FROM wishlist_items WHERE id = ?`

	var item WishlistItem

	if err := s.db.QueryRowContext(ctx, query, id).Scan(
		&item.ID,
		&item.WishlistID,
		&item.Title,
		&item.URL,
		&item.Price,
		&item.Notes,
		&item.IsPurchased,
		&item.CreatedAt,
		&item.UpdateAt,
	); err != nil && IsNoRowsError(err) {
		return WishlistItem{}, ErrNotFound
	} else if err != nil {
		return WishlistItem{}, err
	}

	return item, nil
}

func (s *storage) getWishlistItems(ctx context.Context, wishlistID int64) ([]WishlistItem, error) {
	query := `SELECT id, wishlist_id, title, url, price, notes, is_purchased, created_at, updated_at FROM wishlist_items WHERE wishlist_id = ?`

	rows, err := s.db.QueryContext(ctx, query, wishlistID)
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
			&item.Title,
			&item.URL,
			&item.Price,
			&item.Notes,
			&item.IsPurchased,
			&item.CreatedAt,
			&item.UpdateAt,
		); err != nil {
			return nil, err
		}

		items = append(items, item)
	}

	return items, nil
}

func (s *storage) CreateWishlistItem(ctx context.Context, item WishlistItem) (WishlistItem, error) {
	query := `INSERT INTO wishlist_items (wishlist_id, title, url, price, notes, is_purchased) VALUES (?, ?, ?, ?, ?, ?)`

	res, err := s.db.ExecContext(ctx, query,
		item.WishlistID,
		item.Title,
		item.URL,
		item.Price,
		item.Notes,
		item.IsPurchased,
	)

	if err != nil {
		return WishlistItem{}, err
	}

	itemID, err := res.LastInsertId()
	if err != nil {
		return WishlistItem{}, err
	}

	return s.GetWishlistItemByID(ctx, itemID)
}

func (s *storage) UpdateWishlistItem(ctx context.Context, item WishlistItem) (WishlistItem, error) {
	query := `UPDATE wishlist_items SET title = ?, url = ?, price = ?, notes = ?, is_purchased = ?, image_url = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`

	_, err := s.db.ExecContext(ctx, query,
		item.Title,
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

func (s *storage) GetWishlistByUserID(ctx context.Context, userID int64) (Wishlist, error) {
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

	items, err := s.getWishlistItems(ctx, list.ID)
	if err != nil {
		return Wishlist{}, err
	}

	list.Items = items

	return list, nil
}
