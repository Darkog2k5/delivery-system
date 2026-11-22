-- Reference SQL Seed Schema for Domain 2: DispatchDB (MySQL 8.0)
-- Note: dispatch-service also auto-seeds idempotently via SeedService on startup.

CREATE TABLE IF NOT EXISTS hubs (
    hub_code VARCHAR(32) PRIMARY KEY,
    hub_name VARCHAR(120) NOT NULL,
    district VARCHAR(80) NOT NULL,
    address VARCHAR(255) NOT NULL,
    lat DOUBLE NOT NULL,
    lng DOUBLE NOT NULL
);

CREATE TABLE IF NOT EXISTS shippers (
    shipper_code VARCHAR(32) PRIMARY KEY,
    full_name VARCHAR(120) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    hub_code VARCHAR(32) NOT NULL,
    vehicle_plate VARCHAR(32) NOT NULL,
    is_online BOOLEAN NOT NULL DEFAULT TRUE,
    active_orders_count INT NOT NULL DEFAULT 0,
    cod_holding BIGINT NOT NULL DEFAULT 0,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS dispatch_orders (
    tracking_code VARCHAR(32) PRIMARY KEY,
    customer_code VARCHAR(32) NOT NULL,
    sender_name VARCHAR(120) NOT NULL,
    sender_phone VARCHAR(20) NOT NULL,
    sender_address VARCHAR(255) NOT NULL,
    sender_district VARCHAR(80) NOT NULL,
    receiver_name VARCHAR(120) NOT NULL,
    receiver_phone VARCHAR(20) NOT NULL,
    receiver_address VARCHAR(255) NOT NULL,
    receiver_district VARCHAR(80) NOT NULL,
    item_name VARCHAR(200) NOT NULL,
    shipping_fee BIGINT NOT NULL,
    cod_amount BIGINT NOT NULL DEFAULT 0,
    hub_code VARCHAR(32) NOT NULL,
    assigned_shipper_code VARCHAR(32) NULL,
    assigned_shipper_name VARCHAR(120) NULL,
    order_status VARCHAR(32) NOT NULL,
    delivery_attempts INT NOT NULL DEFAULT 0,
    fail_reason VARCHAR(255) NULL,
    proof_image_url VARCHAR(255) NULL,
    receiver_signature VARCHAR(120) NULL,
    cod_collected BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
