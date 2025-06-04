package db

import "context"

type Category struct {
	ID       string `db:"id" json:"id"`
	Name     string `db:"name" json:"name"`
	ImageURL string `db:"image_url" json:"image_url"`
}

func (s *Storage) ListCategories(ctx context.Context) ([]Category, error) {
	var categories []Category

	query := `
		SELECT id, name, image_url
		FROM categories
	`

	rows, err := s.db.QueryContext(ctx, query)

	if err != nil {
		return nil, err
	}

	defer rows.Close()

	for rows.Next() {
		var c Category
		err := rows.Scan(&c.ID, &c.Name, &c.ImageURL)
		if err != nil {
			return nil, err
		}
		categories = append(categories, c)
	}

	if err = rows.Err(); err != nil {
		return nil, err
	}

	return categories, nil
}

func (s *Storage) CreateCategory(ctx context.Context, category Category) error {
	query := `
		INSERT INTO categories (id, name, image_url)
		VALUES (?, ?, ?)
	`

	_, err := s.db.ExecContext(ctx, query, category.ID, category.Name, category.ImageURL)
	if err != nil {
		return err
	}

	return nil
}
