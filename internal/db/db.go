package db

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	nanoid "github.com/matoous/go-nanoid/v2"
	"github.com/mattn/go-sqlite3"
	"time"
)

type Storage struct {
	db *sql.DB
}

func init() {
	// Registers the sqlite3 driver with a ConnectHook so that we can
	// initialize the default PRAGMAs.
	//
	// Note 1: we don't define the PRAGMA as part of the dsn string
	// because not all pragmas are available.
	//
	// Note 2: the busy_timeout pragma must be first because
	// the connection needs to be set to block on busy before WAL mode
	// is set in case it hasn't been already set by another connection.
	sql.Register("sql",
		&sqlite3.SQLiteDriver{
			ConnectHook: func(conn *sqlite3.SQLiteConn) error {
				_, err := conn.Exec(`
					PRAGMA busy_timeout       = 10000;
					PRAGMA journal_mode       = WAL;
					PRAGMA journal_size_limit = 200000000;
					PRAGMA synchronous        = NORMAL;
					PRAGMA foreign_keys       = ON;
					PRAGMA temp_store         = MEMORY;
					PRAGMA cache_size         = -16000;
				`, nil)

				return err
			},
		},
	)
}

func (s *Storage) InitSchema() error {
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	// For in-memory databases, we need to handle the case where vec0 might not be available
	// Try to create tables one by one for better error isolation
	tx, err := s.db.BeginTx(ctx, nil)
	if err != nil {
		return fmt.Errorf("failed to begin transaction: %w", err)
	}
	defer tx.Rollback()

	// Split schema into individual statements
	statements := []string{
		`CREATE TABLE IF NOT EXISTS users
		(
			id            TEXT PRIMARY KEY,
			chat_id       INT UNIQUE NOT NULL,
			username      VARCHAR(255),
			name          VARCHAR(255),
			language_code VARCHAR(255),
			email         VARCHAR(255),
			referral_code TEXT       NOT NULL UNIQUE,
			referred_by   TEXT REFERENCES users (referral_code),
			created_at    TIMESTAMP  NOT NULL DEFAULT CURRENT_TIMESTAMP,
			updated_at    TIMESTAMP  NOT NULL DEFAULT CURRENT_TIMESTAMP,
			deleted_at    TIMESTAMP,
			avatar_url    TEXT,
			CONSTRAINT chat_id_unique UNIQUE (chat_id)
		)`,
		`CREATE TABLE IF NOT EXISTS categories(
			id         TEXT PRIMARY KEY,
			name       TEXT NOT NULL UNIQUE,
			created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
			image_url  TEXT
		)`,
		`CREATE TABLE IF NOT EXISTS user_interests
		(
			user_id     TEXT NOT NULL REFERENCES users (id),
			category_id TEXT NOT NULL REFERENCES categories (id),
			PRIMARY KEY (user_id, category_id)
		)`,
		`CREATE TABLE IF NOT EXISTS wishlists
		(
			id          TEXT PRIMARY KEY,
			user_id     TEXT NOT NULL REFERENCES users (id),
			name        TEXT NOT NULL,
			description TEXT,
			is_public   BOOLEAN  DEFAULT 1,
			created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
			updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
			deleted_at  TIMESTAMP
		);`,
		`CREATE TABLE IF NOT EXISTS wishes
		(
			id           TEXT PRIMARY KEY,
			user_id      TEXT NOT NULL REFERENCES users (id),
			name         TEXT,
			url          TEXT,
			price        REAL,
			currency     TEXT,
			notes        TEXT,
			is_fulfilled BOOLEAN  DEFAULT 0,
			is_favorite  BOOLEAN  DEFAULT 0,
			reserved_by  TEXT REFERENCES users (id),
			reserved_at  TIMESTAMP,
			created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
			updated_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
			published_at TIMESTAMP,
			deleted_at   TIMESTAMP,
			source_id    TEXT
		);`,
		`CREATE TABLE IF NOT EXISTS wish_images
		(
			id         TEXT PRIMARY KEY,
			wish_id    TEXT REFERENCES wishes (id) ON DELETE CASCADE,
			url        TEXT    NOT NULL,
			width      INTEGER,
			height     INTEGER,
			position   INTEGER NOT NULL,
			created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
		);`,
		`CREATE TABLE IF NOT EXISTS wish_categories
		(
			wish_id     TEXT NOT NULL REFERENCES wishes (id),
			category_id TEXT NOT NULL REFERENCES categories (id),
			PRIMARY KEY (wish_id, category_id)
		);`,
		`CREATE TABLE IF NOT EXISTS wishlist_items
		(
			wishlist_id TEXT NOT NULL REFERENCES wishlists (id),
			wish_id     TEXT NOT NULL REFERENCES wishes (id),
			PRIMARY KEY (wishlist_id, wish_id)
		);`,
		`CREATE TABLE IF NOT EXISTS followers
		(
			follower_id  TEXT NOT NULL REFERENCES users (id),
			following_id TEXT NOT NULL REFERENCES users (id),
			created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
			PRIMARY KEY (follower_id, following_id)
		);`,
		`CREATE TABLE IF NOT EXISTS user_bookmarks
		(
			user_id TEXT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
			wish_id TEXT NOT NULL REFERENCES wishes (id) ON DELETE CASCADE,
			PRIMARY KEY (user_id, wish_id)
		);`,
	}

	// Create regular tables first
	for i, stmt := range statements {
		if _, err := tx.ExecContext(ctx, stmt); err != nil {
			return fmt.Errorf("failed to execute statement %d: %w", i, err)
		}
	}

	// Create FTS5 virtual table
	fts5Table := `CREATE VIRTUAL TABLE IF NOT EXISTS wishes_fts USING fts5
	(
		wish_id UNINDEXED,
		name,
		notes,
		category_names,
		tokenize='porter unicode61'
	);`
	if _, err := tx.ExecContext(ctx, fts5Table); err != nil {
		return fmt.Errorf("failed to create FTS5 table: %w", err)
	}

	// Create FTS5 triggers
	fts5Triggers := []string{
		`CREATE TRIGGER IF NOT EXISTS wishes_ai
		AFTER INSERT ON wishes
		BEGIN
			INSERT INTO wishes_fts (wish_id, name, notes, category_names)
			VALUES (new.id,
					IFNULL(new.name, ''),
					IFNULL(new.notes, ''),
					IFNULL((SELECT GROUP_CONCAT(c.name, ' ')
							FROM wish_categories wc
							JOIN categories c ON wc.category_id = c.id
							WHERE wc.wish_id = new.id), ''));
		END;`,
		`CREATE TRIGGER IF NOT EXISTS wishes_ad
		AFTER DELETE ON wishes
		BEGIN
			DELETE FROM wishes_fts WHERE wish_id = old.id;
		END;`,
		`CREATE TRIGGER IF NOT EXISTS wishes_au
		AFTER UPDATE ON wishes
		BEGIN
			UPDATE wishes_fts
			SET name           = IFNULL(new.name, ''),
				notes          = IFNULL(new.notes, ''),
				category_names = IFNULL((SELECT GROUP_CONCAT(c.name, ' ')
										FROM wish_categories wc
										JOIN categories c ON wc.category_id = c.id
										WHERE wc.wish_id = new.id), '')
			WHERE wish_id = new.id;
		END;`,
		`CREATE TRIGGER IF NOT EXISTS wish_categories_ai
		AFTER INSERT ON wish_categories
		BEGIN
			UPDATE wishes_fts
			SET category_names = IFNULL((SELECT GROUP_CONCAT(c.name, ' ')
										FROM wish_categories wc
										JOIN categories c ON wc.category_id = c.id
										WHERE wc.wish_id = new.wish_id), '')
			WHERE wish_id = new.wish_id;
		END;`,
		`CREATE TRIGGER IF NOT EXISTS wish_categories_ad
		AFTER DELETE ON wish_categories
		BEGIN
			UPDATE wishes_fts
			SET category_names = IFNULL((SELECT GROUP_CONCAT(c.name, ' ')
										FROM wish_categories wc
										JOIN categories c ON wc.category_id = c.id
										WHERE wc.wish_id = old.wish_id), '')
			WHERE wish_id = old.wish_id;
		END;`,
	}

	for _, trigger := range fts5Triggers {
		if _, err := tx.ExecContext(ctx, trigger); err != nil {
			return fmt.Errorf("failed to create FTS5 trigger: %w", err)
		}
	}

	// Create indexes
	indexes := []string{
		`CREATE INDEX users_chat_id_index ON users (chat_id);`,
	}

	for _, stmt := range indexes {
		if _, err := tx.ExecContext(ctx, stmt); err != nil {
			return fmt.Errorf("failed to create index: %w", err)
		}
	}

	var count int
	err = tx.QueryRowContext(ctx, "SELECT COUNT(*) FROM categories").Scan(&count)
	if err != nil {
		return fmt.Errorf("failed to check categories count: %w", err)
	}

	if count == 0 {
		defaultCategories := []struct {
			name     string
			imageURL string
		}{
			{"Fashion", "/fashion.png"},
			{"Home", "/home.png"},
			{"Books", "/books.png"},
			{"Gaming", "/gaming.png"},
			{"Kids", "/kids.png"},
			{"Sports", "/sports.png"},
			{"Music", "/music.png"},
			{"Beauty", "/beauty.png"},
			{"Healthcare", "/healthcare.png"},
			{"Travel", "/travel.png"},
			{"Tech", "/tech.png"},
			{"Art & Design", "/art_design.png"},
			{"Food", "/food.png"},
			{"Pets", "/pets.png"},
			{"Hobbies", "/hobbies.png"},
		}

		categories := make([]Category, len(defaultCategories))
		for i, cat := range defaultCategories {
			id, err := nanoid.New()
			if err != nil {
				return fmt.Errorf("failed to generate category ID: %w", err)
			}
			categories[i] = Category{
				ID:       id,
				Name:     cat.name,
				ImageURL: cat.imageURL,
			}
		}

		stmt, err := tx.PrepareContext(ctx, "INSERT INTO categories (id, name, image_url) VALUES (?, ?, ?)")
		if err != nil {
			return fmt.Errorf("failed to prepare categories insert: %w", err)
		}
		defer stmt.Close()

		for _, cat := range categories {
			if _, err := stmt.ExecContext(ctx, cat.ID, cat.Name, cat.ImageURL); err != nil {
				return fmt.Errorf("failed to insert category %s: %w", cat.Name, err)
			}
		}
	}

	// Populate FTS5 table with existing data (if any)
	populateFTS := `
	INSERT INTO wishes_fts (wish_id, name, notes, category_names)
	SELECT w.id,
		   IFNULL(w.name, ''),
		   IFNULL(w.notes, ''),
		   IFNULL((SELECT GROUP_CONCAT(c.name, ' ')
				   FROM wish_categories wc
				   JOIN categories c ON wc.category_id = c.id
				   WHERE wc.wish_id = w.id), '')
	FROM wishes w
	WHERE w.deleted_at IS NULL
	AND NOT EXISTS (SELECT 1 FROM wishes_fts WHERE wish_id = w.id);`

	if _, err := tx.ExecContext(ctx, populateFTS); err != nil {
		return fmt.Errorf("failed to populate FTS5 table: %w", err)
	}

	return tx.Commit()
}

func NewStorage(dbFile string) (*Storage, error) {
	db, err := sql.Open("sql", dbFile)
	if err != nil {
		return nil, err
	}

	if err := db.Ping(); err != nil {
		return nil, err
	}

	return &Storage{db: db}, nil
}

func (s *Storage) Close() error {
	return s.db.Close()
}

var (
	ErrNotFound      = errors.New("not found")
	ErrAlreadyExists = errors.New("already exists")
)

type HealthStats struct {
	Status            string `json:"status"`
	Error             string `json:"error,omitempty"`
	Message           string `json:"message"`
	OpenConnections   int    `json:"open_connections"`
	InUse             int    `json:"in_use"`
	Idle              int    `json:"idle"`
	WaitCount         int64  `json:"wait_count"`
	WaitDuration      string `json:"wait_duration"`
	MaxIdleClosed     int64  `json:"max_idle_closed"`
	MaxLifetimeClosed int64  `json:"max_lifetime_closed"`
}

func (s *Storage) Health() (HealthStats, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 1*time.Second)
	defer cancel()

	stats := HealthStats{}

	// Ping the database
	err := s.db.PingContext(ctx)
	if err != nil {
		stats.Status = "down"
		stats.Error = fmt.Sprintf("db down: %v", err)
		return stats, fmt.Errorf("db down: %w", err)
	}

	// Database is up, add more statistics
	stats.Status = "up"
	stats.Message = "It's healthy"

	// Get database stats (like open connections, in use, idle, etc.)
	dbStats := s.db.Stats()
	stats.OpenConnections = dbStats.OpenConnections
	stats.InUse = dbStats.InUse
	stats.Idle = dbStats.Idle
	stats.WaitCount = dbStats.WaitCount
	stats.WaitDuration = dbStats.WaitDuration.String()
	stats.MaxIdleClosed = dbStats.MaxIdleClosed
	stats.MaxLifetimeClosed = dbStats.MaxLifetimeClosed

	// Evaluate stats to provide a health message
	if dbStats.OpenConnections > 40 { // Assuming 50 is the max for this example
		stats.Message = "The database is experiencing heavy load."
	}

	if dbStats.WaitCount > 1000 {
		stats.Message = "The database has a high number of wait events, indicating potential bottlenecks."
	}

	if dbStats.MaxIdleClosed > int64(dbStats.OpenConnections)/2 {
		stats.Message = "Many idle connections are being closed, consider revising the connection pool settings."
	}

	if dbStats.MaxLifetimeClosed > int64(dbStats.OpenConnections)/2 {
		stats.Message = "Many connections are being closed due to max lifetime, consider increasing max lifetime or revising the connection usage pattern."
	}

	return stats, nil
}
