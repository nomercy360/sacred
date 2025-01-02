CREATE TABLE users
(
    id            TEXT PRIMARY KEY,
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
    image_url    TEXT,
    notes        TEXT,
    is_fulfilled BOOLEAN  DEFAULT 0,
    is_public    BOOLEAN  DEFAULT 1,
    is_favorite  BOOLEAN  DEFAULT 0,
    reserved_by  TEXT REFERENCES users (id),
    reserved_at  DATETIME,
    created_at   DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at   DATETIME DEFAULT CURRENT_TIMESTAMP,
    source_id    TEXT,
    source_type  TEXT CHECK (source_type IN ('idea', 'wishlist_item')),
    deleted_at   DATETIME,
    CONSTRAINT unique_user_source UNIQUE (user_id, source_id)
);

CREATE TABLE wish_images
(
    id         TEXT PRIMARY KEY,
    wish_id    TEXT    NOT NULL REFERENCES wishes (id) ON DELETE CASCADE,
    url        TEXT    NOT NULL,
    width      INTEGER,
    height     INTEGER,
    size_bytes INTEGER,
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

CREATE TABLE ideas
(
    id          TEXT PRIMARY KEY,
    name        TEXT NOT NULL,
    description TEXT,
    category_id TEXT NOT NULL REFERENCES categories (id),
    price       REAL,
    currency    TEXT,
    image_url   TEXT,
    url         TEXT,
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
    deleted_at  DATETIME
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
       ('RITjZETZZGhoi', 'Editorial', '/editorial.png'),
       ('AJ33P1QKDGwr3', 'Gaming', '/gaming.png'),
       ('nNO1L1kki8kmy', 'Kids', '/kids.png'),
       ('KSXV97h2xP3ID', 'Sports', '/sports.png'),
       ('IKujqdN96YOHg', 'Music', '/music.png'),
       ('93YlI3YrpVHtt', 'Beauty', '/beauty.png'),
       ('gRtijLKN9aLb7', 'Healthcare', '/healthcare.png'),
       ('ovz8jovLpkzSq', 'Travel', '/travel.png'),
       ('IwDGFPZUIBRdY', 'Technology', '/technology.png'),
       ('anV0LNdpjWd4r', 'Art & Design', '/art_design.png'),
       ('hQn9GNkNIRyyp', 'Food & Drink', '/food_drink.png'),
       ('z7c1IYxXkDvej', 'Books', '/books.png'),
       ('sXXVWD9XEdwwr', 'Education', '/education.png'),
       ('wedhnp2MVv3Qi', 'Entertainment', '/entertainment.png'),
       ('1G4sqO5okTCQD', 'Finance', '/finance.png'),
       ('06z08OJFuIa8c', 'Productivity', '/productivity.png');


INSERT INTO ideas (id, name, description, category_id, price, currency, image_url, url)
VALUES ('GFT001', 'Oodie Wearable Blanket', 'A warm, cozy wearable blanket perfect for lounging at home.', 'Fashion',
        84.99, 'USD', 'https://assets.peatch.io/images/oodie.jpg', 'https://theoodie.com/products/navy-blanket-hoodie'),
       ('GFT002', 'Bartesian Cocktail Machine',
        'A home cocktail maker that crafts quality drinks at the touch of a button.', 'Home', 349.99, 'USD',
        'https://assets.peatch.io/images/bartesian.webp', 'https://bartesian.com/products/cocktail-maker'),
       ('GFT003', 'Beats Pill+ Portable Speaker', 'High-quality portable speaker with rich sound and sleek design.',
        'Music', 179.95, 'USD', 'https://assets.peatch.io/images/beats_pill.jpeg',
        'https://www.apple.com/th-en/shop/product/MW463PA/A/beats-pill-wireless-bluetooth-speaker-champagne-gold'),
       ('GFT004', 'iRobot Roomba i5+ Robot Vacuum', 'Efficient robot vacuum with automatic dirt disposal.', 'Home',
        599.99, 'USD', 'https://assets.peatch.io/images/roomba.webp',
        'https://store.irobot.com/default/roomba-i5-plus'),
       ('GFT005', 'Nintendo Switch OLED Model', 'Versatile gaming console with vibrant OLED display.', 'Gaming', 349.99,
        'USD', 'https://assets.peatch.io/images/switch_oled.avif', 'https://www.nintendo.com/us/switch/oled-model/'),
       ('GFT006', 'Oura Ring Gen3', 'Advanced health tracker in the form of a sleek, wearable ring.', 'Healthcare',
        299.00, 'USD', 'https://assets.peatch.io/images/oura_ring.avif',
        'https://ouraring.com/product/rings/oura-gen3/heritage/silver'),
       ('GFT007', 'Hotel Chocolat Velvetiser', 'Luxury hot chocolate maker for barista-grade drinks at home.',
        'Food & Drink', 149.95, 'USD', 'https://assets.peatch.io/images/velvetiser.jpg',
        'https://www.hotelchocolat.com/uk/velvetiser-hot-chocolate-machine.html'),
       ('GFT008', 'Kiehl’s Ultra Pure High-Potency Serum', 'Hydrating serum suitable for sensitive skin.', 'Beauty',
        26.00, 'USD', 'https://assets.peatch.io/images/kiehls_serum.jpg',
        'https://www.kiehls.com/skincare/face-serums/ultra-pure-high-potency-1.5--hyaluronic-acid-serum/WW0238KIE.html'),
       ('GFT009', 'Birkenstock Boston Clogs', 'Comfortable and fashionable suede clogs.', 'Fashion', 155.00, 'USD',
        'https://assets.peatch.io/images/birkenstock_clogs.avif',
        'https://www.birkenstock.com/us/boston-rivet-suede-leather/boston-266409-suedeleather-0-eva-w_1.html'),
       ('GFT010', 'Stanley Quencher H2.0 Flowstate Tumbler', 'Durable tumbler that keeps drinks hot or cold for hours.',
        'Travel', 40.00, 'USD', 'https://assets.peatch.io/images/stanley_tumbler.webp',
        'https://www.stanley1913.com/products/quencher-h2-0-flowstate-tumbler-40-oz'),
       ('GFT011', 'Shokz OpenRun Pro 2 Headphones', 'Open-ear sports headphones with premium sound quality.', 'Sports',
        179.95, 'USD', 'https://assets.peatch.io/images/shokz_headphones.webp',
        'https://shokz.com/products/openrunpro2'),
       ('GFT012', 'PerfectDraft Beer Dispenser', 'Home beer dispenser for pub-quality pints.', 'Home', 299.00, 'USD',
        'https://assets.peatch.io/images/perfectdraft.webp',
        'https://www.perfectdraft.com/en-gb/perfectdraft-keg-machine'),
       ('GFT013', 'Lumin Complete Skincare Gift Set', 'Effective skincare products tailored for men.', 'Beauty', 60.00,
        'USD', 'https://assets.peatch.io/images/lumin_skincare.webp',
        'https://www.luminskin.com/products/detox-clear-bundle'),
       ('GFT014', 'Lavazza A Modo Mio Deséa Coffee Machine', 'Versatile coffee maker with multiple brewing options.',
        'Home', 249.99, 'USD', 'https://assets.peatch.io/images/lavazza_desea.avif',
        'https://www.lavazza.com/en/coffee-machines/desea'),
       ('GFT015', 'Power Plate Mini+ Handheld Massager', 'Lightweight, powerful massager for muscle relief.',
        'Healthcare', 99.99, 'USD', 'https://assets.peatch.io/images/power_plate.webp',
        'https://powerplate.com/products/power-plate-mini-plus'),
       ('GFT016', 'LEGO® Sunflowers', 'A charming LEGO set to build decorative sunflowers.', 'Art & Design', 12.99,
        'USD', 'https://assets.peatch.io/images/sunflower.webp', 'https://www.lego.com/en-us/product/sunflowers-40524'),
       ('GFT017', 'Salter Retro Espresso Machine', 'Compact espresso machine for coffee enthusiasts.', 'Home', 129.99,
        'USD', 'https://assets.peatch.io/images/salter_espresso.jpg',
        'https://salter.com/products/retro-espresso-machine-grey.html'),
       ('GFT018', 'Apple AirTag 4-Pack', 'Compact tracking devices to keep track of your belongings.', 'Technology',
        99.00, 'USD', 'https://assets.peatch.io/images/airtag.jpeg',
        'https://www.apple.com/shop/product/airtag-4-pack'),
       ('GFT019', 'Bose QuietComfort Earbuds II', 'Noise-canceling earbuds with superior sound quality.', 'Music',
        279.00, 'USD', 'https://assets.peatch.io/images/bose_qc_earbuds.png',
        'https://www.bose.com/en_us/products/headphones/earbuds/quietcomfort-earbuds-ii'),
       ('GFT020', 'Kodak Printomatic Digital Instant Print Camera',
        'Instant print camera for capturing and sharing memories.', 'Photography', 69.99, 'USD',
        'https://assets.peatch.io/images/kodak_printomatic.jpg',
        'https://www.kodak.com/en/consumer/product/printomatic');
