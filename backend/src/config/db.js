import mongoose from "mongoose";

const connectDB = async () => {
  const primary = process.env.MONGO_URI;
  const fallback = process.env.LOCAL_MONGO_URI || "mongodb://127.0.0.1:27017/researchhub";

  try {
    await mongoose.connect(primary, { connectTimeoutMS: 10000 });
    console.info("[db] MongoDB connected");
    return;
  } catch (err) {
    console.warn("[db] Primary MongoDB connection failed:", err.message || err);
    // If primary fails due to DNS/SRV resolution or network, try local fallback
    try {
      await mongoose.connect(fallback, { connectTimeoutMS: 10000 });
      console.info("[db] MongoDB connected using fallback URI");
      return;
    } catch (err2) {
      console.warn("[db] MongoDB unavailable, continuing without a database:", err2.message || err2);
      // Do not exit; allow server to start for local testing without a DB.
      return;
    }
  }
};

export default connectDB;
