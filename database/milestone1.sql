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

// Milestone 2: Main job application resource
CREATE TABLE IF NOT EXISTS job_applications(
    application_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    company_name VARCHAR(150) NOT NULL,
    job_title VARCHAR(150) NOT NULL,
    job_location VARCHAR(150),
    job_type VARCHAR(50),
    application_status VARCHAR(50) NOT NULL DEFAULT 'Intersted',
    application_date DATE,
    job_url VARCHAR(2048),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_job_applications_user
    FOREIGN KEY (user_id)
        REFERENCES users(user_id)
        ON DELETE CASCADE
);

-- Milestone 2: Activity history for each job application
CREATE TABLE IF NOT EXISTS application_activities (
    activity_id INT AUTO_INCREMENT PRIMARY KEY,
    application_id INT NOT NULL,
    activity_type VARCHAR(100) NOT NULL,
    activity_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_application_activities_application
        FOREIGN KEY (application_id)
        REFERENCES job_applications(application_id)
        ON DELETE CASCADE
);
