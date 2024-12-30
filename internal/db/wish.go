package db

import (
	"context"
	"encoding/json"
	"fmt"
	"time"
)

type Wish struct {
	ID          string      `db:"id" json:"id"`
	UserID      string      `db:"user_id" json:"user_id"`
	Name        *string     `db:"name" json:"name"`
	URL         *string     `db:"url" json:"url"`
	Price       *float64    `db:"price" json:"price"`
	Currency    *string     `db:"currency" json:"currency"`
	Notes       *string     `db:"notes" json:"notes"`
	SourceID    *string     `db:"source_id" json:"source_id"`
	SourceType  *string     `db:"source_type" json:"source_type"`
	IsFulfilled bool        `db:"is_fulfilled" json:"is_fulfilled"`
	IsPublic    bool        `db:"is_public" json:"is_public"`
	IsFavorite  bool        `db:"is_favorite" json:"is_favorite"`
	ReservedBy  *string     `db:"reserved_by" json:"reserved_by"`
	ReservedAt  *time.Time  `db:"reserved_at" json:"reserved_at"`
	CreatedAt   time.Time   `db:"created_at" json:"created_at"`
	UpdatedAt   time.Time   `db:"updated_at" json:"updated_at"`
	DeletedAt   *time.Time  `db:"deleted_at" json:"deleted_at"`
	Images      []WishImage `json:"images"`
	Categories  []Category  `json:"categories"`
}

func UnmarshalJSONToSlice[T any](src interface{}) ([]T, error) {
	var source []byte

	// Convert the input to a byte slice
	switch s := src.(type) {
	case []byte:
		source = s
	case string:
		source = []byte(s)
	case nil:
		// Return an empty slice of the desired type for nil input
		return []T{}, nil
	default:
		return nil, fmt.Errorf("unsupported type: %T", s)
	}

	// Unmarshal the JSON into the desired slice type
	var result []T
	if err := json.Unmarshal(source, &result); err != nil {
		return nil, fmt.Errorf("error unmarshalling JSON: %w", err)
	}

	return result, nil
}

type WishImage struct {
	ID        string    `db:"id" json:"id"`
	WishID    string    `db:"wish_id" json:"wish_id"`
	URL       string    `db:"url" json:"url"`
	CreatedAt time.Time `db:"created_at" json:"created_at"`
	Position  int       `db:"position" json:"position"`
	SizeBytes int       `db:"size_bytes" json:"size_bytes"`
	Width     int       `db:"width" json:"width"`
	Height    int       `db:"height" json:"height"`
}

func (s *storage) GetWishByID(ctx context.Context, id string) (Wish, error) {
	query := `SELECT 
    		w.id, 
    		w.user_id,
    		w.name, 
    		w.url, 
    		w.price,
    		w.currency,
    		w.notes, 
    		w.is_fulfilled, 
    		w.is_public, 
    		w.is_favorite,
    		w.reserved_by, 
    		w.reserved_at,
    		w.created_at, 
    		w.updated_at,
    		json_group_array(distinct json_object('id', wi.id, 'wish_id', wi.wish_id, 'url', wi.url, 'position', wi.position, 'size_bytes', wi.size_bytes, 'width', wi.width, 'height', wi.height)) filter (where wi.id is not null) as images,
			json_group_array(distinct json_object('id', wc.category_id, 'name', c.name, 'image_url', c.image_url)) filter (where wc.category_id is not null) as categories
		FROM wishes w
		LEFT JOIN wish_images wi ON w.id = wi.wish_id
		LEFT JOIN wish_categories wc ON w.id = wc.wish_id
		LEFT JOIN categories c ON wc.category_id = c.id
		WHERE w.id = ?
		GROUP BY w.id`

	var item Wish
	var imagesData interface{}
	var categoriesData interface{}

	if err := s.db.QueryRowContext(ctx, query, id).Scan(
		&item.ID,
		&item.UserID,
		&item.Name,
		&item.URL,
		&item.Price,
		&item.Currency,
		&item.Notes,
		&item.IsFulfilled,
		&item.IsPublic,
		&item.IsFavorite,
		&item.ReservedBy,
		&item.ReservedAt,
		&item.CreatedAt,
		&item.UpdatedAt,
		&imagesData,
		&categoriesData,
	); err != nil && IsNoRowsError(err) {
		return Wish{}, ErrNotFound
	} else if err != nil {
		return Wish{}, err
	}

	images, err := UnmarshalJSONToSlice[WishImage](imagesData)
	if err != nil {
		return Wish{}, err
	}

	item.Images = images

	categories, err := UnmarshalJSONToSlice[Category](categoriesData)
	if err != nil {
		return Wish{}, err
	}

	item.Categories = categories

	return item, nil
}

func (s *storage) CreateWish(ctx context.Context, item Wish, categories []string) error {
	query := `INSERT INTO wishes (id, user_id, name, url, price, currency, notes, is_fulfilled, is_public) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`

	tx, err := s.db.BeginTx(ctx, nil)
	if err != nil {
		return err
	}

	_, err = tx.ExecContext(ctx, query,
		item.ID,
		item.UserID,
		item.Name,
		item.URL,
		item.Price,
		item.Currency,
		item.Notes,
		item.IsFulfilled,
		item.IsPublic,
	)

	if err != nil {
		return err
	}

	for _, categoryID := range categories {
		_, err = tx.ExecContext(ctx, `INSERT INTO wish_categories (wish_id, category_id) VALUES (?, ?)`, item.ID, categoryID)
		if err != nil {
			tx.Rollback()
			return err
		}
	}

	if err := tx.Commit(); err != nil {
		return err
	}

	return nil
}

func (s *storage) UpdateWish(ctx context.Context, item Wish) (Wish, error) {
	query := `UPDATE wishes SET name = ?, url = ?, price = ?, notes = ?, is_fulfilled = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`

	_, err := s.db.ExecContext(ctx, query,
		item.ID,
		item.Name,
		item.URL,
		item.Price,
		item.Notes,
		item.IsFulfilled,
		item.ID,
	)

	if err != nil {
		return Wish{}, err
	}

	return s.GetWishByID(ctx, item.ID)
}

func (s *storage) baseWishesQuery() string {
	return `SELECT w.id,
				   w.user_id,
				   w.name,
				   w.url,
				   w.price,
				   w.currency,
				   w.notes,
				   w.is_fulfilled,
				   w.is_favorite,
				   w.is_public,
				   w.source_id,
				   w.source_type,
				   w.reserved_by,
				   w.reserved_at,
				   w.created_at,
				   w.updated_at,
				   json_group_array(distinct json_object(
						   'id', wi.id,
						   'wish_id', wi.wish_id,
						   'url', wi.url,
						   'position', wi.position,
						   'size_bytes', wi.size_bytes,
						   'width', wi.width,
						   'height', wi.height))
						   filter ( where wi.id is not null) as images,
				   json_group_array(distinct json_object(
						   'id', wc.category_id,
						   'name', c.name,
						   'image_url', c.image_url
				   )) filter (where wc.category_id is not null) as categories
			FROM wishes w
         LEFT JOIN wish_images wi ON w.id = wi.wish_id
         LEFT JOIN wish_categories wc ON w.id = wc.wish_id
         LEFT JOIN categories c ON wc.category_id = c.id`
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
		var imagesData interface{}
		var categoriesData interface{}
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
			&item.SourceID,
			&item.SourceType,
			&item.ReservedBy,
			&item.ReservedAt,
			&item.CreatedAt,
			&item.UpdatedAt,
			&imagesData,
			&categoriesData,
		); err != nil {
			return nil, err
		}

		images, err := UnmarshalJSONToSlice[WishImage](imagesData)
		if err != nil {
			return nil, err
		}

		item.Images = images

		categories, err := UnmarshalJSONToSlice[Category](categoriesData)
		if err != nil {
			return nil, err
		}

		item.Categories = categories

		items = append(items, item)
	}

	return items, nil
}

func (s *storage) ListWishes(ctx context.Context) ([]Wish, error) {
	query := s.baseWishesQuery() + `
			GROUP BY w.id
			ORDER BY w.created_at DESC
			LIMIT 100`
	return s.fetchWishes(ctx, query)
}

func (s *storage) GetWishesByUserID(ctx context.Context, userID string) ([]Wish, error) {
	query := s.baseWishesQuery() + `
			WHERE w.user_id = ?
        	GROUP BY w.id
			ORDER BY w.created_at DESC
			LIMIT 100`
	return s.fetchWishes(ctx, query, userID)
}

func (s *storage) CreateWishImage(ctx context.Context, image WishImage) (WishImage, error) {
	query := `INSERT INTO wish_images (id, wish_id, url, position, size_bytes, width, height) VALUES (?, ?, ?, ?, ?, ?, ?)`

	_, err := s.db.ExecContext(ctx, query,
		image.ID,
		image.WishID,
		image.URL,
		image.Position,
		image.SizeBytes,
		image.Width,
		image.Height,
	)

	if err != nil {
		return WishImage{}, err
	}

	return image, nil
}
