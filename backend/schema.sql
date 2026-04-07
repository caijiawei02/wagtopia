-- Wagtopia Database Schema
-- SQLite

CREATE TABLE IF NOT EXISTS parents (
    parent_id   INTEGER PRIMARY KEY AUTOINCREMENT,
    parent_name TEXT    NOT NULL,
    phone       TEXT
);

CREATE TABLE IF NOT EXISTS dogs (
    dog_id    INTEGER PRIMARY KEY AUTOINCREMENT,
    parent_id INTEGER NOT NULL,
    dog_name  TEXT    NOT NULL,
    breed     TEXT,
    FOREIGN KEY (parent_id) REFERENCES parents(parent_id)
);

CREATE TABLE IF NOT EXISTS groomers (
    groomer_id   INTEGER PRIMARY KEY AUTOINCREMENT,
    groomer_name TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS services (
    service_id       INTEGER PRIMARY KEY AUTOINCREMENT,
    service_name     TEXT    NOT NULL,
    duration_minutes INTEGER NOT NULL DEFAULT 60
);

CREATE TABLE IF NOT EXISTS bookings (
    booking_id  INTEGER PRIMARY KEY AUTOINCREMENT,
    parent_id   INTEGER NOT NULL,
    dog_id      INTEGER NOT NULL,
    groomer_id  INTEGER NOT NULL,
    service_id  INTEGER NOT NULL,
    start_time  TEXT    NOT NULL,
    end_time    TEXT    NOT NULL,
    created_at  TEXT    NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (parent_id)  REFERENCES parents(parent_id),
    FOREIGN KEY (dog_id)     REFERENCES dogs(dog_id),
    FOREIGN KEY (groomer_id) REFERENCES groomers(groomer_id),
    FOREIGN KEY (service_id) REFERENCES services(service_id)
);

-- ── Seed data ────────────────────────────────────────────────────────────────

INSERT INTO groomers (groomer_name) VALUES ('Mia'), ('Tom'), ('Sarah');

INSERT INTO services (service_name, duration_minutes) VALUES
    ('Wash',     60),
    ('Grooming', 60);

INSERT INTO parents (parent_name, phone) VALUES
    ('Alice', '+65 9111 1111'),
    ('Bob',   '+65 9222 2222'),
    ('Carol', '+65 9333 3333');

INSERT INTO dogs (parent_id, dog_name, breed) VALUES
    (1, 'Coco',  'Poodle'),
    (1, 'Max',   'Labrador'),
    (2, 'Buddy', 'Beagle'),
    (3, 'Luna',  'Shih Tzu');
