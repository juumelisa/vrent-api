CREATE TABLE IF NOT EXISTS cities (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  image_url VARCHAR(500) NOT NULL,
  UNIQUE KEY uniq_name (name)
);

CREATE TABLE IF NOT EXISTS locations (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  city_id BIGINT UNSIGNED NOT NULL,
  name VARCHAR(255) NOT NULL,
  address VARCHAR(255) NOT NULL,
  open_hours VARCHAR(100) NOT NULL,
  FOREIGN KEY (city_id) REFERENCES cities(id)
);

CREATE TABLE IF NOT EXISTS vehicle_models (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  type VARCHAR(50) NOT NULL,
  brand VARCHAR(100) NOT NULL,
  model VARCHAR(100) NOT NULL,
  image_url VARCHAR(500) NOT NULL,
  UNIQUE KEY uniq_type_brand_model (type, brand, model)
);

CREATE TABLE IF NOT EXISTS vehicles (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  vehicle_model_id BIGINT UNSIGNED NOT NULL,
  location_id BIGINT UNSIGNED NOT NULL,
  price_per_day INT NOT NULL COMMENT 'Rupiah per day',
  seats INT NOT NULL,
  transmission SMALLINT UNSIGNED NOT NULL COMMENT '1 = Manual, 2 = Automatic',
  FOREIGN KEY (vehicle_model_id) REFERENCES vehicle_models(id),
  FOREIGN KEY (location_id) REFERENCES locations(id)
);

CREATE TABLE IF NOT EXISTS vehicle_units (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  vehicle_id BIGINT UNSIGNED NOT NULL,
  police_number VARCHAR(20) NOT NULL,
  available BOOLEAN NOT NULL DEFAULT TRUE,
  UNIQUE KEY uniq_police_number (police_number),
  FOREIGN KEY (vehicle_id) REFERENCES vehicles(id)
);

CREATE TABLE IF NOT EXISTS users (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  password VARCHAR(255) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_email (email)
);

CREATE TABLE IF NOT EXISTS sessions (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  token VARCHAR(500) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_token (token),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS faqs (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  question VARCHAR(255) NOT NULL,
  answer TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS reservations (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  -- vehicle_id/vehicle_unit_id are only used internally (e.g. to free the unit on cancel).
  -- All display fields below are a snapshot taken at booking time, so editing or removing
  -- the vehicle/model/unit later never changes what a past reservation shows.
  vehicle_id BIGINT UNSIGNED NOT NULL,
  vehicle_unit_id BIGINT UNSIGNED NOT NULL,
  vehicle_type VARCHAR(50) NOT NULL,
  vehicle_brand VARCHAR(100) NOT NULL,
  vehicle_model VARCHAR(100) NOT NULL,
  vehicle_image_url VARCHAR(500) NOT NULL,
  police_number VARCHAR(20) NOT NULL,
  price_per_day INT NOT NULL COMMENT 'Rupiah per day, at time of booking',
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  total_price INT NOT NULL COMMENT 'Rupiah, total for the whole rental period',
  status ENUM('confirmed', 'cancelled') NOT NULL DEFAULT 'confirmed',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (vehicle_id) REFERENCES vehicles(id),
  FOREIGN KEY (vehicle_unit_id) REFERENCES vehicle_units(id)
);