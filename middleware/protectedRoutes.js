import jwt from "jsonwebtoken";

// Middleware to extract user ID from the token
export const protectedRoutes = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Authorization token missing or invalid" });
  }

  const token = authHeader.split(" ")[1];

  try {
    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach user ID to request object
    req.user = { _id: decoded.userId }; // `userId` is assumed to be in the token payload
    next();
  } catch (error) {
    res.status(401).json({ message: "Invalid or expired token" });
  }
};
