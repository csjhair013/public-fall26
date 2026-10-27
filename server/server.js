import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import pool from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import transporter from "./config/email.js";
import session from "express-session";
import applicationRoutes from "./routes/applicationRoutes.js";


dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Allow the React frontend to communicate with the backend
app.use(
    cors({
        origin: process.env.CLIENT_URL || "http://localhost:5173",
        credentials: true,
    })
);

// Parse incoming JSON request bodies.
app.use(express.json());

app.use(
    session({
        secret: process.env.SESSION_SECRET,
        resave: false,
        saveUninitialized: false,
        cookie: {
            httpOnly: true,
            secure: false,
            maxAge: 1000 * 60 * 60,
        },
    })
);

app.use("/api/auth", authRoutes);
app.use("/api/applications", applicationRoutes);

// Basic test route.
app.get("/api/health", (req, res) => {
    res.status(200).json({
        success: true,
        message: "JobTrack backend is running.",
    });
});

// MySQL connection test route.
app.get("/api/db-test", async (req, res, next) => {
    try {
        const [rows] = await pool.execute(
        "SELECT 1 AS databaseConnected"
    );
 
    res.status(200).json({
        success: true,
        message: "MySQL connection successful.",
        result: rows[0],
});
    } catch (error) {
        console.error("DB TEST ERROR:", error);
        next(error);
    }
});

// Handle routes that do not exist.
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: "Route not found.",
    });
});

// Central error handler.
// Do not send database details or stack traces to the frontend.
app.use((err, req, res, next) => {
    console.error("Backend error:", err);

    res.status(err.status || 500).json({
        success: false,
        message: err.status 
        ? err.message: 
        "An unexpected server error occurred."
    });
});

app.listen(PORT, () => {
    console.log(`JobTrack server running at http://localhost:${PORT}`);
});