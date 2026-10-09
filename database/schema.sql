CREATE DATABASE IF NOT EXISTS agriequip_connect;
USE agriequip_connect;

CREATE TABLE IF NOT EXISTS accounts (
  id VARCHAR(80) PRIMARY KEY,
  data JSON NOT NULL,
  password VARCHAR(255) NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS equipment (
  id VARCHAR(80) PRIMARY KEY,
  data JSON NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS bookings (
  id VARCHAR(80) PRIMARY KEY,
  data JSON NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Gateway references only: never store cards, CVVs, PINs, or bank credentials.
CREATE TABLE IF NOT EXISTS payments (
  id VARCHAR(80) PRIMARY KEY, booking_id VARCHAR(80) NOT NULL, data JSON NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS payouts (
  id VARCHAR(80) PRIMARY KEY, booking_id VARCHAR(80) NOT NULL, provider_id VARCHAR(80) NOT NULL, data JSON NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS platform_payment_settings (
  id VARCHAR(40) PRIMARY KEY, data JSON NOT NULL, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS news (
  id VARCHAR(160) PRIMARY KEY,
  title TEXT NOT NULL,
  summary TEXT,
  source VARCHAR(255) NOT NULL,
  source_url TEXT NOT NULL,
  canonical_url TEXT,
  published_at DATETIME NULL,
  fetched_at DATETIME NOT NULL,
  language VARCHAR(8) NOT NULL,
  category VARCHAR(80) NOT NULL,
  state VARCHAR(40),
  district VARCHAR(80),
  guid VARCHAR(255),
  UNIQUE KEY news_guid (guid),
  INDEX news_fetched_at (fetched_at),
  INDEX news_category_state (category, state)
);

CREATE TABLE IF NOT EXISTS schemes (
  id VARCHAR(100) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  government VARCHAR(120) NOT NULL,
  state VARCHAR(40) NOT NULL,
  category VARCHAR(80) NOT NULL,
  eligibility TEXT,
  benefits TEXT,
  official_url TEXT NOT NULL,
  last_verified DATE NOT NULL,
  status VARCHAR(40) NOT NULL,
  INDEX schemes_state_category (state, category)
);

CREATE TABLE IF NOT EXISTS market_prices (
  id VARCHAR(160) PRIMARY KEY,
  crop VARCHAR(100) NOT NULL,
  market VARCHAR(160) NOT NULL,
  district VARCHAR(80),
  min_price DECIMAL(12,2),
  max_price DECIMAL(12,2),
  modal_price DECIMAL(12,2),
  price_date DATE NOT NULL,
  source VARCHAR(255) NOT NULL,
  source_url TEXT NOT NULL,
  fetched_at DATETIME NOT NULL,
  INDEX market_prices_date_district (price_date, district)
);
