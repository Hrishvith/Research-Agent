import mongoose from "mongoose";

const connectDB = async () => {
  const primary = process.env.MONGO_URI;
  const fallback = process.env.LOCAL_MONGO_URI || "mongodb://127.0.0.1:27017/researchhub";

  try {
    await mongoose.connect(primary, { connectTimeoutMS: 10000 });
    console.log("[db] MongoDB connected successfully");
    return;
  } catch (err) {
    console.error("[db] MongoDB connection error", err.message || err);
    // If primary fails due to DNS/SRV resolution or network, try local fallback
    try {
      console.log("[db] Attempting fallback MongoDB URI...");
      await mongoose.connect(fallback, { connectTimeoutMS: 10000 });
      console.log("[db] MongoDB connected (fallback)");
      return;
    } catch (err2) {
      console.error("[db] Fallback MongoDB connection error", err2.message || err2);
      process.exit(1);
    }
  }
};

export default connectDB;
