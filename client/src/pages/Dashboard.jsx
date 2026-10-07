import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function Dashboard() {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const getUser = async () => {
            try {
                const response = await fetch(
                    "http://localhost:5000/api/auth/me",
                    {
                        credentials: "include",
                    }
                );

                const data = await response.json();

                if (!response.ok) {
                    navigate("/unauthorized");
                    return;
                }

                setUser(data.user);
            } catch (error) {
                console.error("Dashboard error:", error);
                setError("Unable to load your account.");
            } finally {
                setLoading(false);
            }
        };

        getUser();
    }, [navigate]);

    const handleLogout = async () => {
        try {
            const response = await fetch(
                "http://localhost:5000/api/auth/logout",
                {
                    method: "POST",
                    credentials: "include",
                }
            );

            if (response.ok) {
                navigate("/login");
            } else {
                setError("Unable to log out.");
            }
        } catch (error) {
            console.error("Logout error:", error);
            setError("Unable to connect to the server.");
        }
    };

    if (loading) {
        return <h1>Loading Dashboard...</h1>;
    }

    if (error) {
        return <p>{error}</p>;
    }

    return (
        <div>
            <h1>Welcome to JobTrack!</h1>

            {user && (
                <div>
                    <h2>Account Information</h2>

                    <p>
                        <strong>Name:</strong>{" "}
                        {user.first_name} {user.last_name}
                    </p>

                    <p>
                        <strong>Email:</strong> {user.email}
                    </p>

                    <p>
                        <strong>Email Verified:</strong>{" "}
                        {user.email_verified ? "Yes" : "No"}
                    </p>
                </div>
            )}

            <button onClick={handleLogout}>Logout</button>
        </div>
    );
}

export default Dashboard;
