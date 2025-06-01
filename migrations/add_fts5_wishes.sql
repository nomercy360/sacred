-- Drop existing FTS table and triggers if they exist
DROP TABLE IF EXISTS wishes_fts;
DROP TRIGGER IF EXISTS wishes_ai;
DROP TRIGGER IF EXISTS wishes_ad;
DROP TRIGGER IF EXISTS wishes_au;
DROP TRIGGER IF EXISTS wish_categories_ai;
DROP TRIGGER IF EXISTS wish_categories_ad;

-- Create FTS5 virtual table for wishes search
CREATE VIRTUAL TABLE IF NOT EXISTS wishes_fts USING fts5
(
    wish_id UNINDEXED,
    name,
    notes,
    category_names,
    tokenize='porter unicode61'
);


-- Create triggers to keep FTS5 table in sync
CREATE TRIGGER IF NOT EXISTS wishes_ai
    AFTER INSERT
    ON wishes
BEGIN
    INSERT INTO wishes_fts (wish_id, name, notes, category_names)
    VALUES (new.id,
            IFNULL(new.name, ''),
            IFNULL(new.notes, ''),
            IFNULL((SELECT GROUP_CONCAT(c.name, ' ')
                    FROM wish_categories wc
                             JOIN categories c ON wc.category_id = c.id
                    WHERE wc.wish_id = new.id), ''));
END;

CREATE TRIGGER IF NOT EXISTS wishes_ad
    AFTER DELETE
    ON wishes
BEGIN
    DELETE FROM wishes_fts WHERE wish_id = old.id;
END;

CREATE TRIGGER IF NOT EXISTS wishes_au
    AFTER UPDATE
    ON wishes
BEGIN
    UPDATE wishes_fts
    SET name           = IFNULL(new.name, ''),
        notes          = IFNULL(new.notes, ''),
        category_names = IFNULL((SELECT GROUP_CONCAT(c.name, ' ')
                                 FROM wish_categories wc
                                          JOIN categories c ON wc.category_id = c.id
                                 WHERE wc.wish_id = new.id), '')
    WHERE wish_id = new.id;
END;

-- Trigger for category changes
CREATE TRIGGER IF NOT EXISTS wish_categories_ai
    AFTER INSERT
    ON wish_categories
BEGIN
    UPDATE wishes_fts
    SET category_names = IFNULL((SELECT GROUP_CONCAT(c.name, ' ')
                                 FROM wish_categories wc
                                          JOIN categories c ON wc.category_id = c.id
                                 WHERE wc.wish_id = new.wish_id), '')
    WHERE wish_id = new.wish_id;
END;

CREATE TRIGGER IF NOT EXISTS wish_categories_ad
    AFTER DELETE
    ON wish_categories
BEGIN
    UPDATE wishes_fts
    SET category_names = IFNULL((SELECT GROUP_CONCAT(c.name, ' ')
                                 FROM wish_categories wc
                                          JOIN categories c ON wc.category_id = c.id
                                 WHERE wc.wish_id = old.wish_id), '')
    WHERE wish_id = old.wish_id;
END;

-- Populate FTS table with existing data
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
ON CONFLICT DO NOTHING;