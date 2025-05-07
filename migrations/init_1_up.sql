CREATE TABLE users
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
);

CREATE INDEX users_chat_id_index
    ON users (chat_id);

CREATE TABLE categories
(
    id         TEXT PRIMARY KEY,
    name       TEXT NOT NULL UNIQUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    image_url  TEXT
);

CREATE TABLE user_interests
(
    user_id     TEXT NOT NULL REFERENCES users (id),
    category_id TEXT NOT NULL REFERENCES categories (id),
    PRIMARY KEY (user_id, category_id)
);

CREATE TABLE wishlists
(
    id          TEXT PRIMARY KEY,
    user_id     TEXT NOT NULL REFERENCES users (id),
    name        TEXT NOT NULL,
    description TEXT,
    is_public   BOOLEAN  DEFAULT 1,
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
    deleted_at  DATETIME
);

CREATE TABLE wishes
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
    reserved_at  DATETIME,
    created_at   DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at   DATETIME DEFAULT CURRENT_TIMESTAMP,
    published_at DATETIME,
    deleted_at   DATETIME,
    source_id    TEXT
);

CREATE TABLE wish_images
(
    id         TEXT PRIMARY KEY,
    wish_id    TEXT REFERENCES wishes (id) ON DELETE CASCADE,
    url        TEXT    NOT NULL,
    width      INTEGER,
    height     INTEGER,
    position   INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE wish_categories
(
    wish_id     TEXT NOT NULL REFERENCES wishes (id),
    category_id TEXT NOT NULL REFERENCES categories (id),
    PRIMARY KEY (wish_id, category_id)
);

CREATE TABLE wishlist_items
(
    wishlist_id TEXT NOT NULL REFERENCES wishlists (id),
    wish_id     TEXT NOT NULL REFERENCES wishes (id),
    PRIMARY KEY (wishlist_id, wish_id)
);

CREATE TABLE followers
(
    follower_id  TEXT NOT NULL REFERENCES users (id),
    following_id TEXT NOT NULL REFERENCES users (id),
    created_at   DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (follower_id, following_id)
);

CREATE TABLE user_bookmarks
(
    user_id TEXT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    wish_id TEXT NOT NULL REFERENCES wishes (id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, wish_id)
);

INSERT INTO categories (id, name, image_url)
VALUES ('LUTdDAJBnMfFQ', 'Fashion', '/fashion.png'),
       ('r09e6L7A1Ud3G', 'Home', '/home.png'),
       ('RITjZETZZGhoi', 'Books', '/books.png'),
       ('AJ33P1QKDGwr3', 'Gaming', '/gaming.png'),
       ('nNO1L1kki8kmy', 'Kids', '/kids.png'),
       ('KSXV97h2xP3ID', 'Sports', '/sports.png'),
       ('IKujqdN96YOHg', 'Music', '/music.png'),
       ('93YlI3YrpVHtt', 'Beauty', '/beauty.png'),
       ('gRtijLKN9aLb7', 'Healthcare', '/healthcare.png'),
       ('ovz8jovLpkzSq', 'Travel', '/travel.png'),
       ('IwDGFPZUIBRdY', 'Tech', '/tech.png'),
       ('anV0LNdpjWd4r', 'Art & Design', '/art_design.png'),
       ('hQn9GNkNIRyyp', 'Food', '/food.png'),
       ('z7c1IYxXkDvej', 'Pets', '/pets.png'),
       ('sXXVWD9XEdwwr', 'Hobbies', '/hobbies.png');
