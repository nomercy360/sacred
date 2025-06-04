package db

import (
	"context"
	"time"
)

func (s *Storage) SaveWishToBookmarks(ctx context.Context, uid, wishID string) error {
	query := `INSERT INTO user_bookmarks (user_id, wish_id) VALUES (?, ?)`

	_, err := s.db.ExecContext(ctx, query, uid, wishID)

	if err != nil {
		return err
	}

	return nil
}

func (s *Storage) RemoveWishFromBookmarks(ctx context.Context, uid, wishID string) error {
	query := `DELETE FROM user_bookmarks WHERE user_id = ? AND wish_id = ?`

	_, err := s.db.ExecContext(ctx, query, uid, wishID)

	if err != nil {
		return err
	}

	return nil
}

func (s *Storage) ListBookmarkedWishes(ctx context.Context, uid string) ([]Wish, error) {
	query := s.baseWishesQuery() + `
			LEFT JOIN user_bookmarks ub ON w.id = ub.wish_id
			WHERE ub.user_id = ?
			GROUP BY w.id
			ORDER BY w.created_at DESC
			LIMIT 100`
	return s.fetchWishes(ctx, query, uid)
}

func (s *Storage) GetUsersWhoSavedWish(ctx context.Context, wishID string, limit int, offset int) ([]User, int, error) {
	var users []User
	var total int

	// Query to get both the original creator and users who saved (copied) the wish
	// The original creator is given priority with sort_order = 0
	query := `
		WITH all_savers AS (
			-- Original creator of the wish
			SELECT DISTINCT
				u.id,
				u.username,
				u.name,
				u.avatar_url,
				(SELECT COUNT(*) FROM followers f WHERE f.following_id = u.id) as followers,
				w.created_at as saved_at,
				0 as sort_order
			FROM users u
			INNER JOIN wishes w ON u.id = w.user_id AND w.id = ?
			
			UNION ALL
			
			-- Users who copied the wish
			SELECT DISTINCT
				u.id,
				u.username,
				u.name,
				u.avatar_url,
				(SELECT COUNT(*) FROM followers f WHERE f.following_id = u.id) as followers,
				w.created_at as saved_at,
				1 as sort_order
			FROM users u
			INNER JOIN wishes w ON u.id = w.user_id AND w.source_id = ?
		)
		SELECT id, username, name, avatar_url, followers, saved_at
		FROM all_savers
		ORDER BY sort_order, saved_at DESC
		LIMIT ? OFFSET ?`

	rows, err := s.db.QueryContext(ctx, query, wishID, wishID, limit, offset)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	for rows.Next() {
		var user User
		var savedAt time.Time
		if err := rows.Scan(
			&user.ID,
			&user.Username,
			&user.Name,
			&user.AvatarURL,
			&user.Followers,
			&savedAt,
		); err != nil {
			return nil, 0, err
		}
		users = append(users, user)
	}
	if err = rows.Err(); err != nil {
		return nil, 0, err
	}

	// Query to get the total count including the original creator
	countQuery := `
		SELECT COUNT(DISTINCT user_id) FROM (
			-- Original creator
			SELECT u.id as user_id
			FROM users u
			INNER JOIN wishes w ON u.id = w.user_id AND w.id = ?
			
			UNION
			
			-- Users who copied
			SELECT u.id as user_id
			FROM users u
			INNER JOIN wishes w ON u.id = w.user_id AND w.source_id = ?
		) as all_users`

	err = s.db.QueryRowContext(ctx, countQuery, wishID, wishID).Scan(&total)
	if err != nil {
		return nil, 0, err
	}

	return users, total, nil
}
