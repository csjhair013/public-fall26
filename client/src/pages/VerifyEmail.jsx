import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

function VerifyEmail() {
    const location = useLocation();
    const navigate = useNavigate();

    const [email, setEmail] = useState(location.state?.email || "");
    const [verificationCode, setVerificationCode] = useState("");
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
                "http://localhost:5000/api/auth/verify-email",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        email,
                        verification_code: verificationCode,
                    }),
                }
            );

            const data = await response.json();

            if (!response.ok) {
                setError(data.message || "Email verification failed.");
                return;
            }

            setMessage(data.message);

            setTimeout(() => {
                navigate("/login");
            }, 1500);
        } catch (error) {
            console.error("Email verification error:", error);
            setError(
                "Unable to connect to the server. Please try again."
            );
        } finally {
            setLoading(false);
        }
    };

    const handleResend = async () => {
        setMessage("");
        setError("");

        if (!email) {
            setError("Please enter your email address first.");
            return;
        }

        try {
            const response = await fetch(
                "http://localhost:5000/api/auth/resend-verification",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        email,
                    }),
                }
            );

            const data = await response.json();

            if (!response.ok) {
                setError(
                    data.message || "Unable to resend verification code."
                );
                return;
            }

            setMessage(data.message);
        } catch (error) {
            console.error("Resend verification error:", error);
            setError(
                "Unable to connect to the server. Please try again."
            );
        }
    };

    return (
        <div>
            <h1>Email Verification</h1>

            <p>
                Please enter the verification code sent to your email.
            </p>

            <form onSubmit={handleSubmit}>
                <div>
                    <label htmlFor="email">Email</label>
                    <input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        required
                    />
                </div>

                <div>
                    <label htmlFor="verificationCode">
                        Verification Code
                    </label>

                    <input
                        id="verificationCode"
                        type="text"
                        value={verificationCode}
                        onChange={(event) =>
                            setVerificationCode(event.target.value)
                        }
                        placeholder="Enter verification code"
                        required
                    />
                </div>

                {error && <p>{error}</p>}

                {message && <p>{message}</p>}

                <button type="submit" disabled={loading}>
                    {loading ? "Verifying..." : "Verify Email"}
                </button>
            </form>

            <button type="button" onClick={handleResend}>
                Resend Verification Code
            </button>
        </div>
    );
}

export default VerifyEmail;