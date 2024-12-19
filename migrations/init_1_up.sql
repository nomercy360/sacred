CREATE TABLE users
(
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    chat_id       INT UNIQUE NOT NULL,
    username      VARCHAR(255),
    first_name    VARCHAR(255),
    last_name     VARCHAR(255),
    language_code VARCHAR(255),
    email         VARCHAR(255),
    referral_code TEXT       NOT NULL UNIQUE,
    referred_by   TEXT REFERENCES users (referral_code),
    created_at    TIMESTAMP  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at    TIMESTAMP,
    CONSTRAINT chat_id_unique UNIQUE (chat_id)
);

CREATE INDEX users_chat_id_index
    ON users (chat_id);

CREATE TABLE categories
(
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    name       TEXT NOT NULL UNIQUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    image_url  TEXT
);

CREATE TABLE user_interests
(
    user_id     INTEGER NOT NULL REFERENCES users (id),
    category_id INTEGER NOT NULL REFERENCES categories (id),
    PRIMARY KEY (user_id, category_id)
);

CREATE TABLE wishlists
(
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id     INTEGER NOT NULL REFERENCES users (id),
    name        TEXT    NOT NULL,
    description TEXT,
--     category_id INTEGER REFERENCES categories (id),
    is_public   BOOLEAN  DEFAULT 1,
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
    deleted_at  DATETIME
);

CREATE TABLE wishlist_items
(
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    wishlist_id  INTEGER NOT NULL REFERENCES wishlists (id),
    title        TEXT,
    url          TEXT,
    price        REAL,
    currency     TEXT,
    image_url    TEXT,
    notes        TEXT,
    is_purchased BOOLEAN  DEFAULT 0,
    created_at   DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at   DATETIME DEFAULT CURRENT_TIMESTAMP,
    deleted_at   DATETIME
);

CREATE TABLE followers
(
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    follower_id INTEGER NOT NULL REFERENCES users (id),
    followed_id INTEGER NOT NULL REFERENCES users (id),
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (follower_id, followed_id)
);


INSERT INTO categories (name, image_url)
VALUES ('Fashion',
        '/fashion.png'),
       ('Home',
        '/home.png'),
       ('Editorial',
        '/editorial.png'),
       ('Gaming',
        '/gaming.png'),
       ('Kids',
        '/kids.png'),
       ('Sports',
        '/sports.png'),
       ('Music',
        '/music.png'),
       ('Beauty',
        '/beauty.png'),
       ('Healthcare',
        '/healthcare.png'),
       ('Travel',
        '/travel.png'),
       ('Technology',
        '/technology.png'),
       ('Art & Design',
        '/art_design.png'),
       ('Food & Drink',
        '/food_drink.png'),
       ('Books',
        '/books.png'),
       ('Education',
        '/education.png'),
       ('Entertainment',
        '/entertainment.png'),
       ('Finance',
        '/finance.png'),
       ('Productivity',
        '/productivity.png');

