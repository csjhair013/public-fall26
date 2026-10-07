import express from "express";
import bcrypt from "bcrypt";
import pool from "../config/db.js";
import transporter from "../config/email.js";

const router = express.Router();

// Register a new user
router.post("/register", async (req, res) => {
    try {
        const {
            first_name,
            last_name,
            email,
            password,
            password_confirmation,
        } = req.body;

        // Check that all fields were provided
        if (
            !first_name ||
            !last_name ||
            !email ||
            !password ||
            !password_confirmation
        ) {
            return res.status(400).json({
                success: false,
                message: "Please provide all required fields.",
            });
        }

        // Basic email validation
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailPattern.test(email)) {
            return res.status(400).json({
                success: false,
                message: "Please enter a valid email address.",
            });
        }

        // Require a minimum password length
        if (password.length < 8) {
            return res.status(400).json({
                success: false,
                message: "Password must be at least 8 characters long.",
            });
        }

        // Make sure the passwords match
        if (password !== password_confirmation) {
            return res.status(400).json({
                success: false,
                message: "Passwords do not match.",
            });
        }

        // Clean up the email before checking the database
        const cleanEmail = email.trim().toLowerCase();

        // Check whether the email is already registered
        const [existingUsers] = await pool.execute(
            "SELECT user_id FROM users WHERE email = ?",
            [cleanEmail]
        );

        if (existingUsers.length > 0) {
            return res.status(409).json({
                success: false,
                message: "An account with this email already exists.",
            });
        }

        // Hash the password before saving it
        const passwordHash = await bcrypt.hash(password, 12);

        // Generate a 6-digit email verification code
        const verificationCode = Math.floor(
            100000 + Math.random() * 900000
        ).toString();

        // Code expires in 10 minutes
        const verificationExpires = new Date(
            Date.now() + 10 * 60 * 1000
        );

        // Create the user account
        const [result] = await pool.execute(
            `INSERT INTO users
            (
                first_name,
                last_name,
                email,
                password_hash,
                email_verified,
                email_verification_code,
                email_verification_expires_at
            )
            VALUES (?, ?, ?, ?, FALSE, ?, ?)`,
            [
                first_name.trim(),
                last_name.trim(),
                cleanEmail,
                passwordHash,
                verificationCode,
                verificationExpires,
            ]
        );

        // Send the verification email
        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: cleanEmail,
            subject: "JobTrack Email Verification",
            text: `Hello ${first_name.trim()},

Thank you for creating a JobTrack account.

Your email verification code is:

${verificationCode}

This code will expire in 10 minutes.

If you did not create this account, you can ignore this email.

- JobTrack`,
        });

        return res.status(201).json({
            success: true,
            message:
                "Account created successfully. Please check your email for your verification code.",
            user: {
                user_id: result.insertId,
                first_name: first_name.trim(),
                last_name: last_name.trim(),
                email: cleanEmail,
            },
        });
    } catch (error) {
        console.error("Registration error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to register your account.",
        });
    }
});

// Verify a user's email address
router.post("/verify-email", async (req, res) => {
    try {
        const { email, verification_code } = req.body;

        // Check that both fields were provided
        if (!email || !verification_code) {
            return res.status(400).json({
                success: false,
                message: "Email and verification code are required.",
            });
        }

        const cleanEmail = email.trim().toLowerCase();

        // Find the user
        const [users] = await pool.execute(
            `SELECT
                user_id,
                email_verified,
                email_verification_code,
                email_verification_expires_at
             FROM users
             WHERE email = ?`,
            [cleanEmail]
        );

        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Unable to verify this account.",
            });
        }

        const user = users[0];

        // Check whether the email is already verified
        if (user.email_verified) {
            return res.status(400).json({
                success: false,
                message: "This email address is already verified.",
            });
        }

        // Check whether the verification code is correct
        if (user.email_verification_code !== verification_code) {
            return res.status(400).json({
                success: false,
                message: "Invalid verification code.",
            });
        }

        // Check whether the verification code has expired
        if (
            !user.email_verification_expires_at ||
            new Date(user.email_verification_expires_at) < new Date()
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Your verification code has expired. Please request a new code.",
            });
        }

        // Mark the email as verified and remove the used code
        await pool.execute(
            `UPDATE users
             SET
                email_verified = TRUE,
                email_verification_code = NULL,
                email_verification_expires_at = NULL
             WHERE user_id = ?`,
            [user.user_id]
        );

        return res.status(200).json({
            success: true,
            message: "Email verified successfully.",
        });
    } catch (error) {
        console.error("Email verification error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to verify your email address.",
        });
    }
});

// Resend email verification code
router.post("/resend-verification", async (req, res) => {
    try {
        const { email } = req.body;

        // Check that email was provided
        if (!email) {
            return res.status(400).json({
                success: false,
                message: "Email is required.",
            });
        }

        // Basic email validation
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailPattern.test(email)) {
            return res.status(400).json({
                success: false,
                message: "Please enter a valid email address.",
            });
        }

        const cleanEmail = email.trim().toLowerCase();

        // Find the user
        const [users] = await pool.execute(
            `SELECT
                user_id,
                first_name,
                email_verified
             FROM users
             WHERE email = ?`,
            [cleanEmail]
        );

        // Do not resend if the account does not exist
        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Unable to resend verification code.",
            });
        }

        const user = users[0];

        // Do not resend if already verified
        if (user.email_verified) {
            return res.status(400).json({
                success: false,
                message: "This email address is already verified.",
            });
        }

        // Generate a new 6-digit verification code
        const verificationCode = Math.floor(
            100000 + Math.random() * 900000
        ).toString();

        // Code expires in 10 minutes
        const verificationExpires = new Date(
            Date.now() + 10 * 60 * 1000
        );

        // Save the new code
        await pool.execute(
            `UPDATE users
             SET
                email_verification_code = ?,
                email_verification_expires_at = ?
             WHERE user_id = ?`,
            [
                verificationCode,
                verificationExpires,
                user.user_id,
            ]
        );

        // Send the new verification email
        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: cleanEmail,
            subject: "JobTrack New Verification Code",
            text: `Hello ${user.first_name},

Here is your new JobTrack email verification code:

${verificationCode}

This code will expire in 10 minutes.

If you did not request a new verification code, you can ignore this email.

- JobTrack`,
        });

        return res.status(200).json({
            success: true,
            message:
                "A new verification code has been sent to your email.",
        });
    } catch (error) {
        console.error("Resend verification error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to resend verification code.",
        });
    }
});
// Log in a user
router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        // Check that both fields were provided
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Email and password are required.",
            });
        }

        // Basic email validation
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailPattern.test(email)) {
            return res.status(400).json({
                success: false,
                message: "Please enter a valid email address.",
            });
        }

        const cleanEmail = email.trim().toLowerCase();

        // Find the user by email
        const [users] = await pool.execute(
            `SELECT
                user_id,
                first_name,
                last_name,
                email,
                password_hash,
                email_verified
             FROM users
             WHERE email = ?`,
            [cleanEmail]
        );

        // Use a generic message so we do not reveal whether an account exists
        if (users.length === 0) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password.",
            });
        }

        const user = users[0];

        // Require email verification before login
        if (!user.email_verified) {
            return res.status(403).json({
                success: false,
                message: "Please verify your email address before logging in.",
            });
        }

        // Compare the submitted password with the stored bcrypt hash
        const passwordMatches = await bcrypt.compare(
            password,
            user.password_hash
        );

        if (!passwordMatches) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password.",
            });
        }

        // Generate a temporary 6-digit 2FA code
        const twoFactorCode = Math.floor(
            100000 + Math.random() * 900000
        ).toString();

        // 2FA code expires in 10 minutes
        const twoFactorExpires = new Date(
            Date.now() + 10 * 60 * 1000
        );

        // Store the 2FA code and expiration time
        await pool.execute(
            `UPDATE users
             SET
                two_factor_code = ?,
                two_factor_expires_at = ?
             WHERE user_id = ?`,
            [
                twoFactorCode,
                twoFactorExpires,
                user.user_id,
            ]
        );

        // Send the 2FA code by email
        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: user.email,
            subject: "JobTrack Login Verification Code",
            text: `Hello ${user.first_name},

Your JobTrack login verification code is:

${twoFactorCode}

This code will expire in 10 minutes.

If you did not attempt to log in, you can ignore this email.

- JobTrack`,
        });

        // Do NOT authenticate the user yet.
        // They must complete the 2FA step first.
        return res.status(200).json({
            success: true,
            message:
                "Password verified. A verification code has been sent to your email.",
            requiresTwoFactor: true,
        });
    } catch (error) {
        console.error("Login error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to log in at this time.",
        });
    }
});

// Verify the 2FA code
router.post("/verify-2fa", async (req, res) => {
    try {
        const { email, two_factor_code } = req.body;

        // Check that both fields were provided
        if (!email || !two_factor_code) {
            return res.status(400).json({
                success: false,
                message: "Email and 2FA code are required.",
            });
        }

        const cleanEmail = email.trim().toLowerCase();

        // Find the user and their 2FA information
        const [users] = await pool.execute(
            `SELECT
                user_id,
                first_name,
                last_name,
                email,
                email_verified,
                two_factor_code,
                two_factor_expires_at
             FROM users
             WHERE email = ?`,
            [cleanEmail]
        );

        if (users.length === 0) {
            return res.status(401).json({
                success: false,
                message: "Unable to verify the 2FA code.",
            });
        }

        const user = users[0];

        // Make sure the email is verified
        if (!user.email_verified) {
            return res.status(403).json({
                success: false,
                message: "Please verify your email address first.",
            });
        }

        // Check whether the 2FA code is correct
        if (user.two_factor_code !== two_factor_code) {
            return res.status(401).json({
                success: false,
                message: "Invalid 2FA code.",
            });
        }

        // Check whether the 2FA code has expired
        if (
            !user.two_factor_expires_at ||
            new Date(user.two_factor_expires_at) < new Date()
        ) {
            return res.status(401).json({
                success: false,
                message: "Your 2FA code has expired.",
            });
        }

        // Remove the code so it cannot be reused
        await pool.execute(
            `UPDATE users
             SET
                two_factor_code = NULL,
                two_factor_expires_at = NULL
             WHERE user_id = ?`,
            [user.user_id]
        );

        // Create the login session
        req.session.user = {
            user_id: user.user_id,
            first_name: user.first_name,
            last_name: user.last_name,
            email: user.email,
            email_verified: user.email_verified,
        };

        return res.status(200).json({
            success: true,
            message: "Login successful.",
            user: {
                user_id: user.user_id,
                first_name: user.first_name,
                last_name: user.last_name,
                email: user.email,
                email_verified: user.email_verified,
            },
        });
    } catch (error) {
        console.error("2FA verification error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to verify the 2FA code.",
        });
    }
});
   // Get the currently logged-in user
router.get("/me", (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({
            success: false,
            message: "You are not logged in.",
        });
    }

    return res.status(200).json({
        success: true,
        user: req.session.user,
    });
});

// Log out the current user
router.post("/logout", (req, res) => {
    req.session.destroy((error) => {
        if (error) {
            console.error("Logout error:", error);

            return res.status(500).json({
                success: false,
                message: "Unable to log out.",
            });
        }

        res.clearCookie("connect.sid");

        return res.status(200).json({
            success: true,
            message: "Logout successful.",
        });
    });
});

export default router;