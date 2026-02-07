import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.join(process.cwd(), ".env") });

const MONGODB_URI = process.env.MONGODB_URI;

console.log("Testing connection to:", MONGODB_URI?.replace(/:([^@]+)@/, ":****@"));

async function test() {
  if (!MONGODB_URI) {
    console.error("MONGODB_URI is not defined");
    process.exit(1);
  }

  try {
    await mongoose.connect(MONGODB_URI);
    console.log("SUCCESS: Connected to MongoDB Atlas");
    console.log("Database Name:", mongoose.connection.name);
    process.exit(0);
  } catch (err: any) {
    console.error("FAILURE: Could not connect to MongoDB Atlas");
    console.error("Error Name:", err.name);
    console.error("Error Message:", err.message);
    if (err.reason) console.error("Reason:", JSON.stringify(err.reason, null, 2));
    process.exit(1);
  }
}

test();
