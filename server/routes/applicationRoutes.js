import express from "express";
import pool from "../config/db.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

const allowedStatuses = [
    "Interested",
    "Applied",
    "Interviewing",
    "Offer",
    "Rejected",
    "Withdrawn",
];

const allowedJobTypes = [
    "Full-time",
    "Part-time",
    "Internship",
    "Contract",
    "Temporary",
    "Other",
];

// Check that the application ID is a positive integer.
function isValidId(id) {
    return /^\d+$/.test(id) && Number(id) > 0;
}

// Validate application fields sent by the client.
function validateApplication(body){
    const{
        company_name,
        job_title,
        application_status,
        job_type,
        application_date,

    } = body;

    if (
        typeof company_name !== "string" ||
        !company_name.trim() ||
        company_name.trim().length > 150
    ) {
        return "Company name is required and must be 150 characters or fewer.";
    }

    if (
        typeof job_title !== "string" ||
        !job_title.trim() ||
        job_title.trim().length > 150
    ) {
        return "Job title is required and must be 150 characters or fewer.";
    }

    if (
        application_status !== undefined &&
        !allowedStatuses.includes(application_status)
    ) {
        return "Please select a valid application status.";
    }

    if ( job_type != null &&
        job_type !== "" &&
        !allowedJobTypes.includes(job_type)
    ) {
        return "Please select a valid job type.";
    }

    if (application_date != null && application_date !== "") {
        if (
            typeof application_date !== "string" ||
            !/^\d{4}-\d{2}-\d{2}$/.test(application_date)
        ) {
            return "Application date must be use YYYY-MM-DD format.";
        }

        const date = new Date(`${application_date}T00:00:00Z`);

        if (
            Number.isNaN(date.getTime()) ||
            date.toISOString().slice(0,10) !== application_date
        ) {
            return "Please provide a valid application date.";
        }
    }

    for (const field of ["job_location", "job_url"]) {
        if (body[field] != null && typeof body[field] !== "string") {
            return `${field} must be text.`;
        }
    }

    if (
        body.job_location &&
        body.job_location.trim().length > 150
    ) {
        return "Job location must be 150 characters or fewer.";
    }

    if (body.job_url && body.job_url.trim()) {
        try {
            const url = new URL(body.job_url.trim());

            if (!["http:", "https:"].includes(url.protocol)) {
                return "Job URL must start with HTTP or HTTPS.";
            }
        } catch {
            return "Please provide a valid job URL.";
        }

        if (body.job_url.trim().length > 2048) {
            return "Job URL must be 2048 characters or fewer.";
        }
    }

    if (body.notes != null && typeof body.notes !== "string") {
        return "Notes must be text.";
    }

    return null;
}

// Apply session authentication to every route in this router.
router.use(authMiddleware);

// GET /api/applications
// List only the logged-in user's applications.
router.get("/", async (req, res) => {
    try {
        const userId = req.session.user.user_id;

        const [applications] = await pool.execute(
            `SELECT * 
            FROM job_applications
            WHERE user_id = ? 
            ORDER BY created_at DESC`,
            [userId]
        );

        return res.status(200).json({
            success: true,
            applications,

        });
    } catch (error) {
        console.error("List applications error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to retrieve job applications.",
        });
    }
});

// GET /api/applications/:id
// Retrieve one application owned by the logged-in user.
router.get("/:id", async (req, res) => {
    if (!isValidId(req.params.id)) {
        return res.status(400).json({
            success: false,
            message: "Invalid application ID.",
        });
    }

    try {
        const [applications] = await pool.execute(
            `SELECT *
             FROM job_applications
             WHERE application_id = ? AND user_id = ?`,
            [Number(req.params.id), req.session.user.user_id]
        );

        if (applications.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Job application not found.",
            });
        }

        return res.status(200).json({
            success: true,
            application: applications[0],
        });
    } catch (error) {
        console.error("Get application error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to retrieve the job application.",
        });
    }
});

// POST /api/applications
// Create a job application for the logged-in user.
router.post("/", async (req, res) => {
    const validationError = validateApplication(req.body);

    if (validationError) {
        return res.status(400).json({
            success: false,
            message: validationError,
        });
    }

    try {
        const {
            company_name,
            job_title,
            job_location,
            job_type,
            application_status,
            application_date,
            job_url,
            notes,
        } = req.body;

        const [result] = await pool.execute(
            `INSERT INTO job_applications (
                user_id,
                company_name,
                job_title,
                job_location,
                job_type,
                application_status,
                application_date,
                job_url,
                notes
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                req.session.user.user_id,
                company_name.trim(),
                job_title.trim(),
                job_location?.trim() || null,
                job_type || null,
                application_status || "Interested",
                application_date || null,
                job_url?.trim() || null,
                notes?.trim() || null,
            ]
        );

        const [applications] = await pool.execute(
            `SELECT *
             FROM job_applications
             WHERE application_id = ? AND user_id = ?`,
            [result.insertId, req.session.user.user_id]
        );

        return res.status(201).json({
            success: true,
            message: "Job application created successfully.",
            application: applications[0],
        });
    } catch (error) {
        console.error("Create application error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to create the job application.",
        });
    }
});

// PUT /api/applications/:id
// Update an application only if it belongs to the logged-in user.
router.put("/:id", async (req, res) => {
    if (!isValidId(req.params.id)) {
        return res.status(400).json({
            success: false,
            message: "Invalid application ID.",
        });
    }

    const validationError = validateApplication(req.body);

    if (validationError) {
        return res.status(400).json({
            success: false,
            message: validationError,
        });
    }

    try {
        const {
            company_name,
            job_title,
            job_location,
            job_type,
            application_status,
            application_date,
            job_url,
            notes,
        } = req.body;

        const [result] = await pool.execute(
            `UPDATE job_applications
             SET company_name = ?,
                 job_title = ?,
                 job_location = ?,
                 job_type = ?,
                 application_status = ?,
                 application_date = ?,
                 job_url = ?,
                 notes = ?
             WHERE application_id = ? AND user_id = ?`,
            [
                company_name.trim(),
                job_title.trim(),
                job_location?.trim() || null,
                job_type || null,
                application_status || "Interested",
                application_date || null,
                job_url?.trim() || null,
                notes?.trim() || null,
                Number(req.params.id),
                req.session.user.user_id,
            ]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: "Job application not found.",
            });
        }

        const [applications] = await pool.execute(
            `SELECT *
             FROM job_applications
             WHERE application_id = ? AND user_id = ?`,
            [Number(req.params.id), req.session.user.user_id]
        );

        return res.status(200).json({
            success: true,
            message: "Job application updated successfully.",
            application: applications[0],
        });
    } catch (error) {
        console.error("Update application error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to update the job application.",
        });
    }
});

// DELETE /api/applications/:id
// Delete only an application owned by the logged-in user.
router.delete("/:id", async (req, res) => {
    if (!isValidId(req.params.id)) {
        return res.status(400).json({
            success: false,
            message: "Invalid application ID.",
        });
    }

    try {
        const [result] = await pool.execute(
            `DELETE FROM job_applications
             WHERE application_id = ? AND user_id = ?`,
            [Number(req.params.id), req.session.user.user_id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: "Job application not found.",
            });
        }

        return res.status(200).json({
            success: true,
            message: "Job application deleted successfully.",
        });
    } catch (error) {
        console.error("Delete application error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to delete the job application.",
        });
    }
});

export default router;