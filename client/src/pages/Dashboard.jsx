
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const API_URL = "http://localhost:5000/api";

const emptyApplication = {
    company_name: "",
    job_title: "",
    job_location: "",
    job_type: "Internship",
    application_status: "Interested",
    application_date: "",
    job_url: "",
    notes: "",
};

const applicationStatuses = [
    "Interested",
    "Applied",
    "Interviewing",
    "Offer",
    "Rejected",
    "Withdrawn",
];

const jobTypes = [
    "Internship",
    "Full-time",
    "Part-time",
    "Contract",
    "Temporary",
    "Other",
];

function getApplicationId(application) {
    return application.id ?? application.application_id;
}

const styles = {
    page: {
        minHeight: "100vh",
        backgroundColor: "#6b9dea",
        padding: "30px 20px",
        fontFamily: "Arial, sans-serif",
        color: "#243247",
    },
    container: {
        maxWidth: "1100px",
        margin: "0 auto",
    },
    header: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: "15px",
        marginBottom: "25px",
    },
    heading: {
        margin: "0 0 8px",
        fontSize: "30px",
    },
    subtitle: {
        margin: 0,
        color: "#64748b",
    },
    button: {
        padding: "10px 16px",
        border: "none",
        borderRadius: "6px",
        cursor: "pointer",
        fontSize: "14px",
        fontWeight: "bold",
    },
    logoutButton: {
        backgroundColor: "#dc2626",
        color: "#ffffff",
    },
    panel: {
        backgroundColor: "#94eec4",
        padding: "24px",
        borderRadius: "10px",
        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.06)",
        marginBottom: "25px",
    },
    sectionHeading: {
        marginTop: 0,
        marginBottom: "20px",
        fontSize: "22px",
    },
    formGrid: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
        gap: "18px",
    },
    field: {
        display: "flex",
        flexDirection: "column",
        gap: "7px",
        fontSize: "14px",
        fontWeight: "bold",
    },
    input: {
        width: "100%",
        boxSizing: "border-box",
        padding: "11px",
        border: "1px solid #cbd5e1",
        borderRadius: "6px",
        fontSize: "14px",
        fontFamily: "Arial, sans-serif",
        fontWeight: "normal",
        color: "#243247",
        backgroundColor: "#ffffff",
        WebkitTextFillColor: "#243247",
        opacity: 1,
    },

    select: {
        width: "100%",
        boxSizing: "border-box",
        padding: "11px",
        border: "1px solid #cbd5e1",
        borderRadius: "6px",
        fontSize: "14px",
        fontFamily: "Arial, sans-serif",
        fontWeight: "normal",
        color: "#243247",
        backgroundColor: "#ffffff",
        WebkitTextFillColor: "#243247",
        opacity: 1,
    },

    textarea: {
        width: "100%",
        boxSizing: "border-box",
        minHeight: "100px",
        padding: "11px",
        border: "1px solid #cbd5e1",
        borderRadius: "6px",
        fontSize: "14px",
        fontFamily: "Arial, sans-serif",
        fontWeight: "normal",
        color: "#243247",
        backgroundColor: "#ffffff",
        WebkitTextFillColor: "#243247",
        opacity: 1,
        resize: "vertical",
    },
    fullWidth: {
        gridColumn: "1 / -1",
    },
    formButtons: {
        display: "flex",
        flexWrap: "wrap",
        gap: "10px",
        marginTop: "20px",
    },
    primaryButton: {
        backgroundColor: "#2563eb",
        color: "#ffffff",
    },
    secondaryButton: {
        backgroundColor: "#e2e8f0",
        color: "#243247",
    },
    editButton: {
        backgroundColor: "#dbeafe",
        color: "#1d4ed8",
    },
    deleteButton: {
        backgroundColor: "#fee2e2",
        color: "#b91c1c",
    },
    message: {
        padding: "12px 15px",
        borderRadius: "6px",
        marginBottom: "18px",
    },
    error: {
        backgroundColor: "#fee2e2",
        color: "#991b1b",
    },
    success: {
        backgroundColor: "#dcfce7",
        color: "#166534",
    },
    applicationCard: {
        border: "1px solid #e2e8f0",
        borderRadius: "8px",
        padding: "20px",
        marginBottom: "15px",
        overflowWrap: "anywhere",
    },
    applicationHeader: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        flexWrap: "wrap",
        gap: "12px",
    },
    applicationTitle: {
        margin: "0 0 6px",
        fontSize: "19px",
    },
    company: {
        margin: 0,
        color: "#64748b",
    },
    details: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
        gap: "12px",
        marginTop: "18px",
        fontSize: "14px",
    },
    detail: {
        margin: 0,
        lineHeight: "1.6",
        overflowWrap: "anywhere",
    },
    badge: {
        display: "inline-block",
        padding: "5px 9px",
        borderRadius: "20px",
        backgroundColor: "#e0e7ff",
        color: "#3730a3",
        fontSize: "12px",
        fontWeight: "bold",
    },
    empty: {
        textAlign: "center",
        padding: "30px 10px",
        color: "#64748b",
    },
};

function Dashboard() {
    const navigate = useNavigate();

    const [user, setUser] = useState(null);
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("All");
    const [sortOrder, setSortOrder] = useState("newest");
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [form, setForm] = useState(emptyApplication);
    const [editingId, setEditingId] = useState(null);

    // Check the logged-in user and load their applications.
    useEffect(() => {
        async function loadDashboard() {
            try {
                const userResponse = await fetch(`${API_URL}/auth/me`, {
                    method: "GET",
                    credentials: "include",
                });

                if (!userResponse.ok) {
                    navigate("/unauthorized");
                    return;
                }

                const userData = await userResponse.json();
                setUser(userData.user ?? userData);

                const applicationsResponse = await fetch(
                    `${API_URL}/applications`,
                    {
                        method: "GET",
                        credentials: "include",
                    }
                );

                const applicationsData =
                    await applicationsResponse.json();

                if (!applicationsResponse.ok) {
                    throw new Error(
                        applicationsData.message ||
                            "Unable to load applications."
                    );
                }

                setApplications(
                    Array.isArray(applicationsData)
                        ? applicationsData
                        : applicationsData.applications ?? []
                );
            } catch (err) {
                setError(
                    err.message || "Unable to load the dashboard."
                );
            } finally {
                setLoading(false);
            }
        }

        loadDashboard();
    }, [navigate]);

    // Update the matching form field whenever a user types or selects an option.
    function handleChange(event) {
        const { name, value } = event.target;

        setForm((previousForm) => ({
            ...previousForm,
            [name]: value,
        }));
    }

    // Clear the form and exit editing mode.
    function resetForm() {
        setForm({ ...emptyApplication });
        setEditingId(null);
        setError("");
        setSuccess("");
    }

    // Create a new application or update an existing one.
    async function handleSubmit(event) {
        event.preventDefault();
        setError("");
        setSuccess("");

        // Reject required fields that contain only spaces.
        if (
            !form.company_name.trim() ||
            !form.job_title.trim()
        ) {
            setError(
                "Company name and job title are required."
            );
            return;
        }

        // Validate the optional job posting URL.
        if (form.job_url.trim()) {
            try {
                const url = new URL(form.job_url.trim());

                if (
                    !["http:", "https:"].includes(url.protocol)
                ) {
                    setError(
                        "Job URL must start with HTTP or HTTPS."
                    );
                    return;
                }
            } catch {
                setError(
                    "Please enter a valid job posting URL."
                );
                return;
            }
        }

        setSaving(true);

        try {
            const isEditing = editingId !== null;

            const endpoint = isEditing
                ? `${API_URL}/applications/${editingId}`
                : `${API_URL}/applications`;

            const response = await fetch(endpoint, {
                method: isEditing ? "PUT" : "POST",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    ...form,
                    company_name: form.company_name.trim(),
                    job_title: form.job_title.trim(),
                    job_location: form.job_location.trim(),
                    job_url: form.job_url.trim(),
                    notes: form.notes.trim(),
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message ||
                        "Unable to save the application."
                );
            }

            // Refresh the list so it reflects the database.
            const applicationsResponse = await fetch(
                `${API_URL}/applications`,
                {
                    method: "GET",
                    credentials: "include",
                }
            );

            const applicationsData =
                await applicationsResponse.json();

            if (!applicationsResponse.ok) {
                throw new Error(
                    applicationsData.message ||
                        "Saved the application, but could not refresh the list."
                );
            }

            setApplications(
                Array.isArray(applicationsData)
                    ? applicationsData
                    : applicationsData.applications ?? []
            );

            setSuccess(
                isEditing
                    ? "Application updated successfully."
                    : "Application added successfully."
            );

            setForm({ ...emptyApplication });
            setEditingId(null);
        } catch (err) {
            setError(
                err.message || "Unable to save the application."
            );
        } finally {
            setSaving(false);
        }
    }

    // Copy a selected application's information into the form.
    function handleEdit(application) {
        const applicationId = getApplicationId(application);

    if (
        applicationId == null ||
        !/^\d+$/.test(String(applicationId)) ||
        Number(applicationId) <= 0
        ) {
        
        console.error("Invalid application record:", application);
        
        setError("Could not find a valid ID for this application.");
        
        return;
        }

        setEditingId(Number(applicationId));

        setForm({
            company_name: application.company_name ?? "",
            job_title: application.job_title ?? "",
            job_location: application.job_location ?? "",
            job_type: application.job_type ?? "Internship",
            application_status:
                application.application_status ?? "Interested",
            application_date: application.application_date
                ? String(application.application_date).slice(0, 10)
                : "",
            job_url: application.job_url ?? "",
            notes: application.notes ?? "",
        });

        setError("");
        setSuccess("");

        window.scrollTo({
            top: 0,
            behavior: "smooth",
        });
    }

    // Delete an application after the user confirms.
    async function handleDelete(id) {
        const confirmed = window.confirm(
            "Are you sure you want to delete this application?"
        );

        if (!confirmed) {
            return;
        }

        const applicationId =
            typeof id === "object" && id !== null
                ? getApplicationId(id)
                : id;

        if (
            applicationId == null ||
            !/^\d+$/.test(String(applicationId)) ||
            Number(applicationId) <= 0
        ) {
            console.error("Invalid application ID:", id);
            setError("Could not find a valid ID for this application.");
            return;
        }

        const numericId = Number(applicationId);

        setError("");
        setSuccess("");

        try {
            const response = await fetch(
                `${API_URL}/applications/${numericId}`,
                {
                    method: "DELETE",
                    credentials: "include",
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message ||
                        "Unable to delete the application."
                );
            }

            setApplications((previousApplications) =>
                previousApplications.filter(
                    (application) =>
                        Number(getApplicationId(application)) !== numericId
                )
            );

            if (Number(editingId) === numericId) {
                setForm({ ...emptyApplication });
                setEditingId(null);
            }

            setSuccess("Application deleted successfully.");
        } catch (err) {
            setError(
                err.message || "Unable to delete the application."
            );
        }
    }

    // End the current session and return to the login page.
    async function handleLogout() {
        setError("");
        setSuccess("");

        try {
            const response = await fetch(
                `${API_URL}/auth/logout`,
                {
                    method: "POST",
                    credentials: "include",
                }
            );

            if (!response.ok) {
                const data = await response.json();

                throw new Error(
                    data.message || "Unable to log out."
                );
            }

            navigate("/login");
        } catch (err) {
            setError(err.message || "Unable to log out.");
        }
    }

    if (loading) {
        return (
            <main style={styles.page}>
                <div style={styles.container}>
                    <p>Loading your JobTrack dashboard...</p>
                </div>
            </main>
        );
    }

    return (
        <main style={styles.page}>
            <div style={styles.container}>
                <header style={styles.header}>
                    <div>
                        <h1 style={styles.heading}>
                            Welcome to JobTrack
                        </h1>

                        <p style={styles.subtitle}>
                            Keep track of your job applications
                            in one place.
                        </p>
                    </div>

                    <button
                        type="button"
                        style={{
                            ...styles.button,
                            ...styles.logoutButton,
                        }}
                        onClick={handleLogout}
                    >
                        Log Out
                    </button>
                </header>

                {user && (
                    <section style={styles.panel}>
                        <h2 style={styles.sectionHeading}>
                            Account Information
                        </h2>

                        <p>
                            <strong>Name:</strong>{" "}
                            {user.name ||
                                user.full_name ||
                                [user.first_name, user.last_name]
                                    .filter(Boolean)
                                    .join(" ") ||
                                "Julia Hairston"}
                        </p>

                        <p>
                            <strong>Email:</strong>{" "}
                            {user.email || "Not available"}
                        </p>
                    </section>
                )}

                {error && (
                    <div
                        role="alert"
                        style={{
                            ...styles.message,
                            ...styles.error,
                        }}
                    >
                        {error}
                    </div>
                )}

                {success && (
                    <div
                        role="status"
                        style={{
                            ...styles.message,
                            ...styles.success,
                        }}
                    >
                        {success}
                    </div>
                )}

                <section style={styles.panel}>
                    <h2 style={styles.sectionHeading}>
                        {editingId !== null
                            ? "Edit Job Application"
                            : "Add Job Application"}
                    </h2>

                    <form onSubmit={handleSubmit}>
                        <div style={styles.formGrid}>
                            <label style={styles.field}>
                                Company Name *
                                <input
                                    style={styles.select}
                                    type="text"
                                    name="company_name"
                                    value={form.company_name}
                                    onChange={handleChange}
                                    maxLength={150}
                                    required
                                />
                            </label>

                            <label style={styles.field}>
                                Job Title *
                                <input
                                    style={styles.input}
                                    type="text"
                                    name="job_title"
                                    value={form.job_title}
                                    onChange={handleChange}
                                    maxLength={150}
                                    required
                                />
                            </label>

                            <label style={styles.field}>
                                Job Location
                                <input
                                    style={styles.input}
                                    type="text"
                                    name="job_location"
                                    value={form.job_location}
                                    onChange={handleChange}
                                    maxLength={150}
                                    placeholder="e.g., Norfolk, VA"
                                />
                            </label>

                            <label style={styles.field}>
                                Job Type
                                <select
                                    style={styles.input}
                                    name="job_type"
                                    value={form.job_type}
                                    onChange={handleChange}
                                    required
                                >
                                    {jobTypes.map((jobType) => (
                                        <option
                                            key={jobType}
                                            value={jobType}
                                        >
                                            {jobType}
                                        </option>
                                    ))}
                                </select>
                            </label>

                            <label style={styles.field}>
                                Application Status *
                                <select
                                    style={styles.input}
                                    name="application_status"
                                    value={form.application_status}
                                    onChange={handleChange}
                                    required
                                >
                                    {applicationStatuses.map(
                                        (status) => (
                                            <option
                                                key={status}
                                                value={status}
                                            >
                                                {status}
                                            </option>
                                        )
                                    )}
                                </select>
                            </label>

                            <label style={styles.field}>
                                Application Date
                                <input
                                    style={styles.input}
                                    type="date"
                                    name="application_date"
                                    value={form.application_date}
                                    onChange={handleChange}
                                />
                            </label>

                            <label
                                style={{
                                    ...styles.field,
                                    ...styles.fullWidth,
                                }}
                            >
                                Job Posting URL
                                <input
                                    style={styles.input}
                                    type="url"
                                    name="job_url"
                                    value={form.job_url}
                                    onChange={handleChange}
                                    maxLength={2048}
                                    placeholder="https://example.com/job"
                                />
                            </label>

                            <label
                                style={{
                                    ...styles.field,
                                    ...styles.fullWidth,
                                }}
                            >
                                Notes
                                <textarea
                                    style={styles.textarea}
                                    name="notes"
                                    value={form.notes}
                                    onChange={handleChange}
                                    placeholder="Add interview details, contacts, or reminders..."
                                />
                            </label>
                        </div>

                        <div style={styles.formButtons}>
                            <button
                                type="submit"
                                disabled={saving}
                                style={{
                                    ...styles.button,
                                    ...styles.primaryButton,
                                    opacity: saving ? 0.7 : 1,
                                }}
                            >
                                {saving
                                    ? "Saving..."
                                    : editingId !== null
                                      ? "Update Application"
                                      : "Add Application"}
                            </button>

                            {editingId !== null && (
                                <button
                                    type="button"
                                    style={{
                                        ...styles.button,
                                        ...styles.secondaryButton,
                                    }}
                                    onClick={resetForm}
                                    disabled={saving}
                                >
                                    Cancel Edit
                                </button>
                            )}
                        </div>
                    </form>
                </section>

                <section style={styles.panel}>
                    <h2 style={styles.sectionHeading}>
                        My Applications ({applications.length})
                    </h2>

                    {applications.length === 0 ? (
                        <div style={styles.empty}>
                            <p>
                                You have no job applications yet.
                            </p>
                            <p>
                                Use the form above to add your first
                                application.
                            </p>
                        </div>
                    ) : (
                        applications.map((application) => (
                            <article
                                key={getApplicationId(application)}
                                style={styles.applicationCard}
                            >
                                <div
                                    style={styles.applicationHeader}
                                >
                                    <div>
                                        <h3
                                            style={styles.applicationTitle}
                                        >
                                            {application.job_title}
                                        </h3>

                                        <p style={styles.company}>
                                            {application.company_name}
                                        </p>
                                    </div>

                                    <span style={styles.badge}>
                                        {application.application_status}
                                    </span>
                                </div>

                                <div style={styles.details}>
                                    <p style={styles.detail}>
                                        <strong>Location:</strong>{" "}
                                        {application.job_location ||
                                            "Not specified"}
                                    </p>

                                    <p style={styles.detail}>
                                        <strong>Job Type:</strong>{" "}
                                        {application.job_type ||
                                            "Not specified"}
                                    </p>

                                    <p style={styles.detail}>
                                        <strong>Application Date:</strong>{" "}
                                        {application.application_date
                                            ? String(
                                                  application.application_date
                                              ).slice(0, 10)
                                            : "Not specified"}
                                    </p>

                                    <p style={styles.detail}>
                                        <strong>Job URL:</strong>{" "}
                                        {application.job_url ? (
                                            <a
                                                href={application.job_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                            >
                                                View Job Posting
                                            </a>
                                        ) : (
                                            "Not provided"
                                        )}
                                    </p>

                                    <p
                                        style={{
                                            ...styles.detail,
                                            ...styles.fullWidth,
                                        }}
                                    >
                                        <strong>Notes:</strong>{" "}
                                        {application.notes ||
                                            "No notes"}
                                    </p>
                                </div>

                                <div style={styles.formButtons}>
                                    <button
                                        type="button"
                                        style={{
                                            ...styles.button,
                                            ...styles.editButton,
                                        }}
                                        onClick={() =>
                                            handleEdit(application)
                                        }
                                    >
                                        Edit
                                    </button>

                                    <button
                                        type="button"
                                        style={{
                                            ...styles.button,
                                            ...styles.deleteButton,
                                        }}
                                        onClick={() =>
                                            handleDelete(getApplicationId(application))
                                        }
                                    >
                                        Delete
                                    </button>
                                </div>
                            </article>
                        ))
                    )}
                </section>
            </div>
        </main>
    );
}

export default Dashboard;

