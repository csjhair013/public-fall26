
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

function Dashboard() {
    const navigate = useNavigate();

    const [user, setUser] = useState(null);
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [form, setForm] = useState(emptyApplication);
    const [editingId, setEditingId] = useState(null);

    // Load the logged-in user and their applications.
    useEffect(() => {
        const loadDashboard = async () => {
            try {
                const userResponse = await fetch(`${API_URL}/auth/me`, {
                    credentials: "include",
                });

                const userData = await userResponse.json();

                if (!userResponse.ok) {
                    navigate("/unauthorized");
                    return;
                }

                setUser(userData.user);

                const applicationsResponse = await fetch(
                    `${API_URL}/applications`,
                    { credentials: "include" }
                );

                const applicationsData = await applicationsResponse.json();

                if (!applicationsResponse.ok) {
                    throw new Error(
                        applicationsData.message ||
                        "Unable to load your applications."
                    );
                }

                setApplications(applicationsData.applications || []);
            } catch (err) {
                console.error("Dashboard error:", err);
                setError(err.message || "Unable to connect to the server.");
            } finally {
                setLoading(false);
            }
        };

        loadDashboard();
    }, [navigate]);

    // Update a form field when the user types.
    const handleChange = (event) => {
        const { name, value } = event.target;

        setForm((previousForm) => ({
            ...previousForm,
            [name]: value,
        }));
    };

    // Clear the form and exit edit mode.
    const resetForm = () => {
        setForm({ ...emptyApplication });
        setEditingId(null);
        setError("");
        setSuccess("");
    };

    // Create a new application or save changes to an existing one.
    const handleSubmit = async (event) => {
        event.preventDefault();
        setError("");
        setSuccess("");
        setSaving(true);

        try {
            const isEditing = editingId !== null;

            const response = await fetch(
                isEditing
                    ? `${API_URL}/applications/${editingId}`
                    : `${API_URL}/applications`,
                {
                    method: isEditing ? "PUT" : "POST",
                    credentials: "include",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(form),
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message || "Unable to save the application."
                );
            }

            // Refresh the list so it reflects the database.
            const listResponse = await fetch(`${API_URL}/applications`, {
                credentials: "include",
            });

            const listData = await listResponse.json();

            if (!listResponse.ok) {
                throw new Error(
                    listData.message || "Saved, but unable to refresh the list."
                );
            }

            setApplications(listData.applications || []);
            setSuccess(
                isEditing
                    ? "Application updated successfully."
                    : "Application added successfully."
            );

            setForm({ ...emptyApplication });
            setEditingId(null);
        } catch (err) {
            console.error("Save application error:", err);
            setError(err.message || "Unable to connect to the server.");
        } finally {
            setSaving(false);
        }
    };

    // Put the selected application into the form.
    const handleEdit = (application) => {
        setEditingId(application.application_id);

        setForm({
            company_name: application.company_name || "",
            job_title: application.job_title || "",
            job_location: application.job_location || "",
            job_type: application.job_type || "Internship",
            application_status: application.application_status || "Interested",
            application_date: application.application_date
                ? String(application.application_date).slice(0, 10)
                : "",
            job_url: application.job_url || "",
            notes: application.notes || "",
        });

        setError("");
        setSuccess("");
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    // Delete only the selected application.
    const handleDelete = async (applicationId) => {
        const confirmed = window.confirm(
            "Are you sure you want to delete this application?"
        );

        if (!confirmed) {
            return;
        }

        setError("");
        setSuccess("");

        try {
            const response = await fetch(
                `${API_URL}/applications/${applicationId}`,
                {
                    method: "DELETE",
                    credentials: "include",
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message || "Unable to delete the application."
                );
            }

            setApplications((previous) =>
                previous.filter(
                    (application) =>
                        application.application_id !== applicationId
                )
            );

            if (editingId === applicationId) {
                resetForm();
            }

            setSuccess("Application deleted successfully.");
        } catch (err) {
            console.error("Delete application error:", err);
            setError(err.message || "Unable to connect to the server.");
        }
    };

    // Log out and return to the login page.
    const handleLogout = async () => {
        setError("");

        try {
            const response = await fetch(`${API_URL}/auth/logout`, {
                method: "POST",
                credentials: "include",
            });

            if (response.ok) {
                navigate("/login");
            } else {
                setError("Unable to log out.");
            }
        } catch (err) {
            console.error("Logout error:", err);
            setError("Unable to connect to the server.");
        }
    };

    if (loading) {
        return <h1>Loading Dashboard...</h1>;
    }

    return (
        <main style={styles.page}>
            <header style={styles.header}>
                <div>
                    <h1>Welcome to JobTrack!</h1>
                    <p>Keep track of your job applications in one place.</p>
                </div>

                <button type="button" onClick={handleLogout}>
                    Logout
                </button>
            </header>

            {user && (
                <section style={styles.card}>
                    <h2>Account Information</h2>
                    <p>
                        <strong>Name:</strong> {user.first_name}{" "}
                        {user.last_name}
                    </p>
                    <p>
                        <strong>Email:</strong> {user.email}
                    </p>
                    <p>
                        <strong>Email Verified:</strong>{" "}
                        {user.email_verified ? "Yes" : "No"}
                    </p>
                </section>
            )}

            {error && (
                <p role="alert" style={styles.error}>
                    {error}
                </p>
            )}

            {success && (
                <p role="status" style={styles.success}>
                    {success}
                </p>
            )}

            <section style={styles.card}>
                <h2>
                    {editingId !== null
                        ? "Edit Job Application"
                        : "Add a Job Application"}
                </h2>

                <form onSubmit={handleSubmit} style={styles.form}>
                    <label>
                        Company Name *
                        <input
                            name="company_name"
                            value={form.company_name}
                            onChange={handleChange}
                            required
                            maxLength={150}
                        />
                    </label>

                    <label>
                        Job Title *
                        <input
                            name="job_title"
                            value={form.job_title}
                            onChange={handleChange}
                            required
                            maxLength={150}
                        />
                    </label>

                    <label>
                        Location
                        <input
                            name="job_location"
                            value={form.job_location}
                            onChange={handleChange}
                            maxLength={150}
                            placeholder="e.g., Norfolk, VA"
                        />
                    </label>

                    <label>
                        Job Type
                        <select
                            name="job_type"
                            value={form.job_type}
                            onChange={handleChange}
                        >
                            <option value="Internship">Internship</option>
                            <option value="Full-time">Full-time</option>
                            <option value="Part-time">Part-time</option>
                            <option value="Contract">Contract</option>
                            <option value="Temporary">Temporary</option>
                        </select>
                    </label>

                    <label>
                        Application Status
                        <input
                            name="application_status"
                            value={form.application_status}
                            onChange={handleChange}
                            required
                            maxLength={50}
                            placeholder="e.g., Interested, Applied, Interview"
                        />
                    </label>

                    <label>
                        Application Date
                        <input
                            type="date"
                            name="application_date"
                            value={form.application_date}
                            onChange={handleChange}
                        />
                    </label>

                    <label style={styles.fullWidth}>
                        Job Posting URL
                        <input
                            type="url"
                            name="job_url"
                            value={form.job_url}
                            onChange={handleChange}
                            maxLength={2048}
                            placeholder="https://..."
                        />
                    </label>

                    <label style={styles.fullWidth}>
                        Notes
                        <textarea
                            name="notes"
                            value={form.notes}
                            onChange={handleChange}
                            rows={3}
                            placeholder="Recruiter details, interview notes, or next steps"
                        />
                    </label>

                    <div style={styles.actions}>
                        <button type="submit" disabled={saving}>
                            {saving
                                ? "Saving..."
                                : editingId !== null
                                  ? "Save Changes"
                                  : "Add Application"}
                        </button>

                        {editingId !== null && (
                            <button
                                type="button"
                                onClick={resetForm}
                                disabled={saving}
                            >
                                Cancel Edit
                            </button>
                        )}
                    </div>
                </form>
            </section>

            <section style={styles.card}>
                <h2>Your Applications ({applications.length})</h2>

                {applications.length === 0 ? (
                    <p>
                        You don't have any applications yet. Use the form above
                        to add your first one.
                    </p>
                ) : (
                    <div style={styles.applicationList}>
                        {applications.map((application) => (
                            <article
                                key={application.application_id}
                                style={styles.application}
                            >
                                <h3>{application.job_title}</h3>
                                <p>
                                    <strong>Company:</strong>{" "}
                                    {application.company_name}
                                </p>

                                {application.job_location && (
                                    <p>
                                        <strong>Location:</strong>{" "}
                                        {application.job_location}
                                    </p>
                                )}

                                {application.job_type && (
                                    <p>
                                        <strong>Job Type:</strong>{" "}
                                        {application.job_type}
                                    </p>
                                )}

                                <p>
                                    <strong>Status:</strong>{" "}
                                    {application.application_status}
                                </p>

                                {application.application_date && (
                                    <p>
                                        <strong>Application Date:</strong>{" "}
                                        {String(
                                            application.application_date
                                        ).slice(0, 10)}
                                    </p>
                                )}

                                {application.job_url && (
                                    <p>
                                        <strong>Posting:</strong>{" "}
                                        <a
                                            href={application.job_url}
                                            target="_blank"
                                            rel="noreferrer"
                                        >
                                            View Job Posting
                                        </a>
                                    </p>
                                )}

                                {application.notes && (
                                    <p>
                                        <strong>Notes:</strong>{" "}
                                        {application.notes}
                                    </p>
                                )}

                                <div style={styles.actions}>
                                    <button
                                        type="button"
                                        onClick={() => handleEdit(application)}
                                    >
                                        Edit
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() =>
                                            handleDelete(
                                                application.application_id
                                            )
                                        }
                                    >
                                        Delete
                                    </button>
                                </div>
                            </article>
                        ))}
                    </div>
                )}
            </section>
        </main>
    );
}

const styles = {
    page: {
        maxWidth: "1000px",
        margin: "0 auto",
        padding: "24px",
        fontFamily: "Arial, sans-serif",
    },
    header: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: "16px",
        marginBottom: "24px",
    },
    card: {
        border: "1px solid #4952f4",
        borderRadius: "8px",
        padding: "20px",
        marginBottom: "24px",
        backgroundColor: "#1f1045",
    },
    form: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
        gap: "16px",
    },
    fullWidth: {
        gridColumn: "1 / -1",
    },
    actions: {
        display: "flex",
        flexWrap: "wrap",
        gap: "10px",
        marginTop: "8px",
    },
    applicationList: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
        gap: "16px",
    },
    application: {
        border: "1px solid #3d1eec",
        borderRadius: "8px",
        padding: "16px",
        overflowWrap: "anywhere",
    },
    error: {
        color: "#b42318",
        backgroundColor: "#fef3f2",
        padding: "12px",
        borderRadius: "6px",
    },
    success: {
        color: "#067647",
        backgroundColor: "#ecfdf3",
        padding: "12px",
        borderRadius: "6px",
    },
};

export default Dashboard;
