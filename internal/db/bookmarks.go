package db

import (
	"context"
)

func (s *storage) SaveWishToBookmarks(ctx context.Context, uid, wishID string) error {
	query := `INSERT INTO user_bookmarks (user_id, wish_id) VALUES (?, ?)`

	_, err := s.db.ExecContext(ctx, query, uid, wishID)

	if err != nil {
		return err
	}

	return nil
}

func (s *storage) RemoveWishFromBookmarks(ctx context.Context, uid, wishID string) error {
	query := `DELETE FROM user_bookmarks WHERE user_id = ? AND wish_id = ?`

	_, err := s.db.ExecContext(ctx, query, uid, wishID)

	if err != nil {
		return err
	}

	return nil
}

func (s *storage) ListBookmarkedWishes(ctx context.Context, uid string) ([]Wish, error) {
	query := s.baseWishesQuery() + `
			LEFT JOIN user_bookmarks ub ON w.id = ub.wish_id
			WHERE ub.user_id = ?
			GROUP BY w.id
			ORDER BY w.created_at DESC
			LIMIT 100`
	return s.fetchWishes(ctx, query, uid)
}
