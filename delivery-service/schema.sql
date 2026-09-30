CREATE TABLE IF NOT EXISTS couriers (
 id TEXT PRIMARY KEY, name TEXT NOT NULL, token_hash TEXT NOT NULL UNIQUE,
 active INTEGER NOT NULL DEFAULT 1, lat REAL, lng REAL, accuracy REAL, updated INTEGER
);
CREATE TABLE IF NOT EXISTS orders (
 id TEXT PRIMARY KEY, token_hash TEXT NOT NULL UNIQUE, courier_id TEXT REFERENCES couriers(id),
 status TEXT NOT NULL DEFAULT 'preparing', created INTEGER NOT NULL, updated INTEGER NOT NULL,
 expires INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS courier_orders ON orders(courier_id, status);

CREATE TABLE IF NOT EXISTS order_details (id TEXT PRIMARY KEY, details TEXT NOT NULL, estimate TEXT, subscription TEXT, notified INTEGER DEFAULT 0);
CREATE TABLE IF NOT EXISTS shop_settings (id TEXT PRIMARY KEY, value TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS service_keys (id TEXT PRIMARY KEY, value TEXT NOT NULL);
