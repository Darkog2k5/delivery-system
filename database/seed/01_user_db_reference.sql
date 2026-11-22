-- Reference SQL Seed Schema for Domain 1: UserDB (PostgreSQL)
-- Note: user-service also auto-seeds idempotently via DataSeeder on startup.

CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,
    user_code VARCHAR(32) NOT NULL UNIQUE,
    full_name VARCHAR(120) NOT NULL,
    phone VARCHAR(20) NOT NULL UNIQUE,
    email VARCHAR(120),
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(32) NOT NULL,
    hub_code VARCHAR(32),
    default_address VARCHAR(255),
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Default demo password for all accounts below is: 123456
-- Accounts: ADMIN_01, SHIPPER_01..03, SHOP_01..05 (9 total)
