-- Pagi Sore Catering — Updated Schema (OOAD Compliant)
-- Create database
CREATE DATABASE IF NOT EXISTS `pagi_sore` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
USE `pagi_sore`;

-- admin table
CREATE TABLE IF NOT EXISTS `admin` (
  `admin_id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(200) NOT NULL,
  `username` VARCHAR(100) NOT NULL UNIQUE,
  `password` VARCHAR(255) NOT NULL
);

-- customers table
CREATE TABLE IF NOT EXISTS `customers` (
  `customer_id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(200) NOT NULL,
  `phone` VARCHAR(20),
  `address` TEXT,
  `password` VARCHAR(255) NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- menu table
CREATE TABLE IF NOT EXISTS `menu` (
  `menu_id` INT AUTO_INCREMENT PRIMARY KEY,
  `menu_name` VARCHAR(200) NOT NULL,
  `description` TEXT,
  `price` INT NOT NULL,
  `category` VARCHAR(100),
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- orders table
CREATE TABLE IF NOT EXISTS `orders` (
  `order_id` VARCHAR(64) PRIMARY KEY,
  `customer_id` INT NOT NULL,
  `total_price` INT NOT NULL,
  `order_date` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `delivery_date` DATE,
  `status` VARCHAR(100) DEFAULT 'Pending',
  FOREIGN KEY (customer_id) REFERENCES customers(customer_id) ON DELETE CASCADE
);

-- order_items table
CREATE TABLE IF NOT EXISTS `order_items` (
  `item_id` INT AUTO_INCREMENT PRIMARY KEY,
  `order_id` VARCHAR(64) NOT NULL,
  `menu_id` INT NOT NULL,
  `portion` INT DEFAULT 1,
  `note` TEXT,
  FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE CASCADE,
  FOREIGN KEY (menu_id) REFERENCES menu(menu_id) ON DELETE CASCADE
);

-- payments table
CREATE TABLE IF NOT EXISTS `payments` (
  `payment_id` INT AUTO_INCREMENT PRIMARY KEY,
  `order_id` VARCHAR(64) NOT NULL,
  `upload_proof` VARCHAR(500),
  `timestamp` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `verified_by` INT,
  `status` VARCHAR(100) DEFAULT 'Pending',
  FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE CASCADE,
  FOREIGN KEY (verified_by) REFERENCES admin(admin_id) ON DELETE SET NULL
);

-- delivery table
CREATE TABLE IF NOT EXISTS `delivery` (
  `delivery_id` INT AUTO_INCREMENT PRIMARY KEY,
  `order_id` VARCHAR(64) NOT NULL,
  `deliver_time` DATETIME,
  `driver` VARCHAR(200),
  `address` TEXT,
  `status` VARCHAR(100) DEFAULT 'Scheduled',
  FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE CASCADE
);

-- Sample data
INSERT INTO `admin` (`name`, `username`, `password`) VALUES ('Admin', 'admin', 'admin') ON DUPLICATE KEY UPDATE username=username;
INSERT INTO `customers` (`name`, `phone`, `address`, `password`) VALUES ('Demo User', '0812345678', 'Jakarta', 'user123') ON DUPLICATE KEY UPDATE phone=phone;
INSERT INTO `menu` (`menu_name`, `description`, `price`, `category`) VALUES 
  ('Paket Hemat', 'Nasi + 2 lauk', 25000, 'Breakfast'),
  ('Paket Spesial', 'Nasi + 3 lauk + buah', 40000, 'Lunch'),
  ('Paket Event', 'Buffet untuk 20 orang', 800000, 'Catering');

