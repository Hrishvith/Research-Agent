import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import auth from "../middleware/auth.js";

const router = express.Router();

// Simple in-memory OTP store for demo/dev. Key: email|purpose -> { otp, expiresAt }
const otpStore = new Map();

function generateOtp() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function otpKey(email, purpose) {
  return `${String(email).toLowerCase().trim()}|${purpose}`;
}

router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body || {};
    if (!name || !email || !password) return res.status(400).json({ error: "Missing required fields" });

    const existing = await User.findOne({ email: String(email).toLowerCase().trim() });
    if (existing) return res.status(409).json({ error: "Email already registered" });

    const hashed = await bcrypt.hash(password, 10);
    const user = new User({ name, email: String(email).toLowerCase().trim(), password: hashed });
    await user.save();

    const token = jwt.sign({ sub: user._id }, process.env.JWT_SECRET, {
      expiresIn: `${process.env.ACCESS_TOKEN_EXPIRE_MINUTES}m`,
    });

    const userObj = user.toObject();
    delete userObj.password;

    return res.json({ access_token: token, token_type: "bearer", user: userObj });
  } catch (err) {
    if (err?.code === 11000) return res.status(409).json({ error: "Email already registered" });
    console.error(err);
    return res.status(500).json({ error: "Failed to register user" });
  }
});

// POST /api/auth/request-otp
// { email, purpose }
router.post("/request-otp", async (req, res) => {
  try {
    const { email, purpose } = req.body || {};
    if (!email || !purpose) return res.status(400).json({ error: "Missing email or purpose" });

    const key = otpKey(email, purpose);
    const otp = generateOtp();
    const expiresAt = Date.now() + 1000 * 60 * 10; // 10 minutes
    otpStore.set(key, { otp, expiresAt });

    // For dev, return OTP in response (frontend expects dev_otp when backend is unavailable)
    return res.json({ message: "OTP generated", dev_otp: otp });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to generate OTP" });
  }
});

// POST /api/auth/verify-otp
// { email, otp, purpose }
router.post("/verify-otp", async (req, res) => {
  try {
    const { email, otp, purpose } = req.body || {};
    if (!email || !otp || !purpose) return res.status(400).json({ error: "Missing fields" });

    const key = otpKey(email, purpose);
    const stored = otpStore.get(key);
    if (!stored || stored.expiresAt < Date.now() || stored.otp !== String(otp).trim()) {
      return res.status(400).json({ error: "Invalid or expired OTP" });
    }

    // OTP valid — remove it
    otpStore.delete(key);

    // If purpose is register -> create user if not exists
    let user = await User.findOne({ email: String(email).toLowerCase().trim() });
    if (purpose === "register") {
      if (user) return res.status(409).json({ error: "Email already registered" });
      // Create a user with a random password (not used for OTP login)
      const pwd = Math.random().toString(36).slice(2, 10);
      const hashed = await bcrypt.hash(pwd, 10);
      user = new User({ name: email.split("@")[0], email: String(email).toLowerCase().trim(), password: hashed });
      await user.save();
    } else {
      // login purpose — require existing user; do not auto-create for login
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
    }

    const token = jwt.sign({ sub: user._id }, process.env.JWT_SECRET, {
      expiresIn: `${process.env.ACCESS_TOKEN_EXPIRE_MINUTES}m`,
    });

    const userObj = user.toObject();
    delete userObj.password;
    return res.json({ access_token: token, token_type: "bearer", user: userObj });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "OTP verification failed" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ error: "Missing credentials" });

    const user = await User.findOne({ email: String(email).toLowerCase().trim() });
    if (!user) return res.status(401).json({ error: "Invalid credentials" });

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(401).json({ error: "Invalid credentials" });

    const token = jwt.sign({ sub: user._id }, process.env.JWT_SECRET, {
      expiresIn: `${process.env.ACCESS_TOKEN_EXPIRE_MINUTES}m`,
    });

    const userObj = user.toObject();
    delete userObj.password;

    return res.json({ access_token: token, token_type: "bearer", user: userObj });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Login failed" });
  }
});

router.get("/me", auth, async (req, res) => {
  try {
    const user = req.auth?.user;
    if (!user) return res.status(404).json({ error: "User not found" });
    return res.json({ user });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to fetch user" });
  }
});

export default router;
