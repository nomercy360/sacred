package db

import (
	"context"
	"encoding/json"
	"fmt"
	"strings"
	"time"
)

type Wish struct {
	ID           string      `db:"id" json:"id"`
	UserID       string      `db:"user_id" json:"user_id"`
	Name         *string     `db:"name" json:"name"`
	URL          *string     `db:"url" json:"url"`
	Price        *float64    `db:"price" json:"price"`
	Currency     *string     `db:"currency" json:"currency"`
	Notes        *string     `db:"notes" json:"notes"`
	SourceID     *string     `db:"source_id" json:"source_id"`
	IsFulfilled  bool        `db:"is_fulfilled" json:"is_fulfilled"`
	IsFavorite   bool        `db:"is_favorite" json:"is_favorite,omitempty"`
	ReservedBy   *string     `db:"reserved_by" json:"reserved_by,omitempty"`
	ReservedAt   *time.Time  `db:"reserved_at" json:"reserved_at,omitempty"`
	CreatedAt    time.Time   `db:"created_at" json:"created_at"`
	UpdatedAt    time.Time   `db:"updated_at" json:"updated_at"`
	DeletedAt    *time.Time  `db:"deleted_at" json:"deleted_at,omitempty"`
	PublishedAt  *time.Time  `db:"published_at" json:"published_at"`
	Images       []WishImage `json:"images"`
	Categories   []Category  `json:"categories"`
	IsBookmarked bool        `db:"is_bookmarked" json:"is_bookmarked"`
	CopiedWishID *string     `db:"copied_wish_id" json:"copied_wish_id,omitempty"`
}

func UnmarshalJSONToSlice[T any](src interface{}) ([]T, error) {
	var source []byte

	switch s := src.(type) {
	case []byte:
		source = s
	case string:
		source = []byte(s)
	case nil:
		return []T{}, nil
	default:
		return nil, fmt.Errorf("unsupported type: %T", s)
	}

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
	Width     int       `db:"width" json:"width"`
	Height    int       `db:"height" json:"height"`
}

func (s *Storage) GetWishByID(ctx context.Context, viewerID, id string) (Wish, error) {
	query := `SELECT 
    		w.id, 
    		w.user_id,
    		w.name, 
    		w.url, 
    		w.price,
    		w.currency,
    		w.notes, 
    		w.is_fulfilled, 
    		w.published_at, 
    		w.is_favorite,
    		w.reserved_by, 
    		w.reserved_at,
    		w.created_at, 
    		w.updated_at,
    		w.source_id,
			EXISTS (SELECT 1 FROM user_bookmarks ub WHERE ub.user_id = ? AND ub.wish_id = w.id) AS is_bookmarked,
			(SELECT id FROM wishes WHERE user_id = ? AND source_id = w.id LIMIT 1) AS copied_wish_id
		FROM wishes w
		WHERE w.id = ?`

	var item Wish

	if err := s.db.QueryRowContext(ctx, query, viewerID, viewerID, id).Scan(
		&item.ID,
		&item.UserID,
		&item.Name,
		&item.URL,
		&item.Price,
		&item.Currency,
		&item.Notes,
		&item.IsFulfilled,
		&item.PublishedAt,
		&item.IsFavorite,
		&item.ReservedBy,
		&item.ReservedAt,
		&item.CreatedAt,
		&item.UpdatedAt,
		&item.SourceID,
		&item.IsBookmarked,
		&item.CopiedWishID,
	); err != nil && IsNoRowsError(err) {
		return Wish{}, ErrNotFound
	} else if err != nil {
		return Wish{}, err
	}

	// fetch images
	imagesData, err := s.db.QueryContext(ctx, `SELECT id, wish_id, url, position, width, height FROM wish_images WHERE wish_id = ?`, id)
	if err != nil {
		return Wish{}, err
	}
	defer imagesData.Close()
	images := make([]WishImage, 0)
	for imagesData.Next() {
		var image WishImage
		if err := imagesData.Scan(
			&image.ID,
			&image.WishID,
			&image.URL,
			&image.Position,
			&image.Width,
			&image.Height,
		); err != nil {
			return Wish{}, err
		}
		images = append(images, image)
	}

	if err = imagesData.Err(); err != nil {
		return Wish{}, err
	}

	categoriesData, err := s.db.QueryContext(ctx, `SELECT c.id, c.name, c.image_url FROM wish_categories wc JOIN categories c ON wc.category_id = c.id WHERE wc.wish_id = ?`, id)
	if err != nil {
		return Wish{}, err
	}

	defer categoriesData.Close()
	categories := make([]Category, 0)
	for categoriesData.Next() {
		var category Category
		if err := categoriesData.Scan(
			&category.ID,
			&category.Name,
			&category.ImageURL,
		); err != nil {
			return Wish{}, err
		}
		categories = append(categories, category)
	}

	if err = categoriesData.Err(); err != nil {
		return Wish{}, err
	}

	item.Images = images
	item.Categories = categories

	return item, nil
}

func (s *Storage) CreateWish(ctx context.Context, item Wish, categories []string) error {
	query := `INSERT INTO wishes 
    	(id, user_id, name, url, price, currency, notes, is_fulfilled, 
    	 published_at, source_id, created_at, updated_at
    	 ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`

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
		item.PublishedAt,
		item.SourceID,
		item.CreatedAt,
		item.UpdatedAt,
	)

	if err != nil && IsUniqueViolationError(err) {
		tx.Rollback()
		return ErrAlreadyExists
	} else if err != nil {
		tx.Rollback()
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

func (s *Storage) UpdateWish(ctx context.Context, item Wish, categories []string) error {
	tx, err := s.db.BeginTx(ctx, nil)
	if err != nil {
		return err
	}
	defer tx.Rollback()

	query := `UPDATE wishes SET 
                  name = ?, 
                  url = ?,
                  price = ?, 
                  notes = ?, 
                  is_fulfilled = ?, 
                  updated_at = CURRENT_TIMESTAMP,
                  published_at = CURRENT_TIMESTAMP 
              WHERE id = ? AND user_id = ?`

	_, err = tx.ExecContext(ctx, query,
		item.Name,
		item.URL,
		item.Price,
		item.Notes,
		item.IsFulfilled,
		item.ID,
		item.UserID,
	)

	if err != nil {
		return err
	}

	_, err = tx.ExecContext(ctx, `DELETE FROM wish_categories WHERE wish_id = ?`, item.ID)
	if err != nil {
		return err
	}

	for _, categoryID := range categories {
		_, err = tx.ExecContext(ctx, `INSERT INTO wish_categories (wish_id, category_id) VALUES (?, ?)`, item.ID, categoryID)
		if err != nil {
			return err
		}
	}

	if err := tx.Commit(); err != nil {
		return err
	}

	return err
}

func (s *Storage) GetPublicWishesFeed(ctx context.Context, viewerID, searchQuery string) ([]Wish, error) {
	// Original query without search
	baseQuery := s.baseWishesQuery() + ` WHERE w.published_at IS NOT NULL AND w.source_id IS NULL AND w.deleted_at IS NULL`

	var args []interface{}

	if viewerID != "" {
		baseQuery += ` AND w.user_id != ?`
		args = append(args, viewerID)
	}

	if searchQuery != "" {
		baseQuery += ` AND LOWER(w.name) = ?`
		args = append(args, strings.ToLower(searchQuery))
	}

	baseQuery += `
			GROUP BY w.id
			ORDER BY w.created_at DESC
			LIMIT 100`

	return s.fetchWishes(ctx, baseQuery, args...)
}

func (s *Storage) baseWishesQuery() string {
	return `SELECT w.id,
				   w.user_id,
				   w.name,
				   w.url,
				   w.price,
				   w.currency,
				   w.notes,
				   w.is_fulfilled,
				   w.is_favorite,
				   w.published_at,
				   w.source_id,
				   w.reserved_by,
				   w.reserved_at,
				   w.created_at,
				   w.updated_at,
				   json_group_array(distinct json_object(
						   'id', wi.id,
						   'wish_id', wi.wish_id,
						   'url', wi.url,
						   'position', wi.position,
						   'width', wi.width,
						   'height', wi.height))
						   filter ( where wi.id is not null) as images,
				   json_group_array(distinct json_object(
						   'id', wc.category_id,
						   'name', c.name,
						   'image_url', c.image_url
				   )) filter (where wc.category_id is not null) as categories
			FROM wishes w
         JOIN wish_images wi ON w.id = wi.wish_id
         JOIN wish_categories wc ON w.id = wc.wish_id
         JOIN categories c ON wc.category_id = c.id`
}

func (s *Storage) fetchWishes(ctx context.Context, query string, args ...interface{}) ([]Wish, error) {
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
			&item.PublishedAt,
			&item.SourceID,
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

func (s *Storage) ListWishes(ctx context.Context) ([]Wish, error) {
	query := s.baseWishesQuery() + `
			GROUP BY w.id
			ORDER BY w.created_at DESC
			LIMIT 100`
	return s.fetchWishes(ctx, query)
}

func (s *Storage) GetWishesByUserID(ctx context.Context, userID string) ([]Wish, error) {
	query := s.baseWishesQuery() + `
			WHERE w.user_id = ?
        	GROUP BY w.id
			ORDER BY w.created_at DESC
			LIMIT 100`
	return s.fetchWishes(ctx, query, userID)
}

func (s *Storage) CreateWishImage(ctx context.Context, image WishImage) (WishImage, error) {
	query := `INSERT INTO wish_images (id, wish_id, url, position, width, height, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)`

	_, err := s.db.ExecContext(ctx, query,
		image.ID,
		image.WishID,
		image.URL,
		image.Position,
		image.Width,
		image.Height,
		image.CreatedAt,
	)

	if err != nil {
		return WishImage{}, err
	}

	return image, nil
}

func (s *Storage) DeleteWish(ctx context.Context, uid, id string) error {
	tx, err := s.db.BeginTx(ctx, nil)
	if err != nil {
		return err
	}

	defer tx.Rollback()

	query := `DELETE FROM wish_images WHERE wish_id = ?`
	_, err = tx.ExecContext(ctx, query, id)

	if err != nil {
		tx.Rollback()
		return err
	}

	query = `DELETE FROM wish_categories WHERE wish_id = ?`
	_, err = tx.ExecContext(ctx, query, id)
	if err != nil {
		tx.Rollback()
		return err
	}

	query = `DELETE FROM wishes WHERE id = ? AND user_id = ?`
	_, err = tx.ExecContext(ctx, query, id, uid)

	if err != nil {
		tx.Rollback()
	}

	return tx.Commit()
}

func (s *Storage) DeleteWishImages(ctx context.Context, wishID string, photoIDs []string) error {
	if len(photoIDs) == 0 {
		return nil
	}

	placeholders := make([]string, len(photoIDs))
	for i := range photoIDs {
		placeholders[i] = "?"
	}
	placeholderString := strings.Join(placeholders, ",")

	query := fmt.Sprintf("DELETE FROM wish_images WHERE wish_id = ? AND id IN (%s)", placeholderString)

	args := make([]interface{}, 0, len(photoIDs)+1)
	args = append(args, wishID)
	for _, id := range photoIDs {
		args = append(args, id)
	}

	result, err := s.db.ExecContext(ctx, query, args...)
	if err != nil {
		return fmt.Errorf("failed to execute delete query: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		fmt.Printf("Warning: could not get rows affected after deleting wish images: %v\n", err)
	} else {
		fmt.Printf("Deleted %d wish image(s) for wish_id %s.\n", rowsAffected, wishID)
	}

	return nil
}

type AutocompleteSuggestion struct {
	Text  string `json:"text"`
	Count int    `json:"count"`
}

func (s *Storage) GetWishAutocomplete(ctx context.Context, prefix string, limit int) ([]AutocompleteSuggestion, error) {
	if prefix == "" {
		return []AutocompleteSuggestion{}, nil
	}

	// Use FTS5 to get matching wishes and extract unique terms
	query := `
		SELECT suggestion,
			   COUNT(*) as count
		FROM (SELECT DISTINCT w.id,
							  LOWER(w.name) as suggestion
			  FROM wishes_fts fts
					   JOIN wishes w ON fts.wish_id = w.id
			  WHERE wishes_fts MATCH ?
				AND w.published_at IS NOT NULL
				AND w.source_id IS NULL
				AND w.deleted_at IS NULL
				AND w.name IS NOT NULL) unique_matches
		GROUP BY suggestion
		ORDER BY LENGTH(suggestion),
				 suggestion
		LIMIT 10;`

	rows, err := s.db.QueryContext(ctx, query, prefix+"*", limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	suggestions := make([]AutocompleteSuggestion, 0)
	for rows.Next() {
		var suggestion AutocompleteSuggestion
		if err := rows.Scan(&suggestion.Text, &suggestion.Count); err != nil {
			return nil, err
		}
		suggestions = append(suggestions, suggestion)
	}

	return suggestions, nil
}
