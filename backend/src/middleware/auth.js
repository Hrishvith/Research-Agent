import jwt from "jsonwebtoken";
import User from "../models/User.js";

export default async function auth(req, res, next) {
  try {
    const authHeader = req.headers.authorization || req.headers.Authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Missing or invalid Authorization header" });
    }
    const token = authHeader.split(" ")[1];
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    if (!payload || !payload.sub) return res.status(401).json({ error: "Invalid token" });
    const user = await User.findById(payload.sub).select("-password");
    if (!user) return res.status(401).json({ error: "User not found" });
    req.auth = { user };
    return next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid token" });
  }
}
