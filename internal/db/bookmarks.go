package db

import (
	"context"
	"sacred/internal/contract"
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

func (s *Storage) GetUsersWhoBookmarkedWish(ctx context.Context, wishID string, limit int, offset int) ([]contract.ShortUserProfile, int, error) {
	var users []contract.ShortUserProfile
	var total int

	// Query to get the paginated list of users
	query := `
		SELECT
			u.id,
			u.username,
			u.name,
			u.avatar_url,
			(SELECT COUNT(*) FROM followers f WHERE f.following_id = u.id) as followers
		FROM users u
		JOIN user_bookmarks ub ON u.id = ub.user_id
		WHERE ub.wish_id = ?
		ORDER BY ub.created_at DESC
		LIMIT ? OFFSET ?`

	rows, err := s.db.QueryContext(ctx, query, wishID, limit, offset)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	for rows.Next() {
		var user contract.ShortUserProfile
		// Note: Ensure that u.name and u.avatar_url are nullable in your DB schema
		// or handle potential nil values if contract.ShortUserProfile expects *string for them.
		// The provided contract.ShortUserProfile uses *string for Name and AvatarURL, so this should align.
		if err := rows.Scan(&user.ID, &user.Username, &user.Name, &user.AvatarURL, &user.Followers); err != nil {
			return nil, 0, err
		}
		users = append(users, user)
	}
	if err = rows.Err(); err != nil {
		return nil, 0, err
	}

	// Query to get the total count
	countQuery := `SELECT COUNT(*) FROM user_bookmarks WHERE wish_id = ?`
	err = s.db.QueryRowContext(ctx, countQuery, wishID).Scan(&total)
	if err != nil {
		return nil, 0, err
	}

	return users, total, nil
}
