CREATE DATABASE IF NOT EXISTS jobtrack;

USE jobtrack;

CREATE TABLE users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,

    email_verified BOOLEAN NOT NULL DEFAULT FALSE,
    email_verification_code VARCHAR(10),
    email_verification_expires_at DATETIME,

    two_factor_code VARCHAR(10),
    two_factor_expires_at DATETIME, 

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);