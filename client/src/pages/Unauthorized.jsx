import { Link } from "react-router-dom";

function Unauthorized() {
    return (
    <main>
        <h1>Access Denied</h1>
        <p>You must be logged in to access this page.</p>

        <Link to="/login">Go to Login</Link>
        <br />
        <Link to="/">Return to Home</Link>
    </main>
    );
}

export default Unauthorized;