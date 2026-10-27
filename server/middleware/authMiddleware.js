function authMiddleware(req, res, next) {
    // A user is authenticated only after completing login and 2FA.
    if (!req.session || !req.session.user || !req.session.user_id) {
        return res.status(401).json({
            success: false,
            message: "Please log in to access this resource.",
        });
    }

    // Continue to the requested route.
    next();
}

export default authMiddleware;