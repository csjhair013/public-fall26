import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

function Verify2FA() {
    const location = useLocation();
    const navigate = useNavigate();

    const [email, setEmail] = useState(location.state?.email || "");
    const [twoFactorCode, setTwoFactorCode] = useState("");
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (event) => {
        event.preventDefault();

        setMessage("");
        setError("");
        setLoading(true);

        try {
            const response = await fetch(
                "http://localhost:5000/api/auth/verify-2fa",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    credentials: "include",
                    body: JSON.stringify({
                        email,
                        two_factor_code: twoFactorCode,
                    }),
                }
            );

            const data = await response.json();

            if (!response.ok) {
                setError(data.message || "2FA verification failed.");
                return;
            }

            setMessage(data.message);

            setTimeout(() => {
                navigate("/dashboard");
            }, 1000);
        } catch (error) {
            console.error("2FA verification error:", error);
            setError(
                "Unable to connect to the server. Please try again."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <h1>Two-Factor Authentication</h1>

            <p>
                Enter the verification code sent to your email.
            </p>

            <form onSubmit={handleSubmit}>
                <div>
                    <label htmlFor="email">Email:</label>
                    <br />
                    <input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        required
                    />
                </div>

                <br />

                <div>
                    <label htmlFor="twoFactorCode">
                        2FA Code:
                    </label>
                    <br />
                    <input
                        id="twoFactorCode"
                        type="text"
                        value={twoFactorCode}
                        onChange={(event) =>
                            setTwoFactorCode(event.target.value)
                        }
                        placeholder="Enter 2FA code"
                        required
                    />
                </div>

                <br />

                {error && <p>{error}</p>}

                {message && <p>{message}</p>}

                <button type="submit" disabled={loading}>
                    {loading ? "Verifying..." : "Verify"}
                </button>
            </form>
        </div>
    );
}

export default Verify2FA;