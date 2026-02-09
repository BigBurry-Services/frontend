import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import fs from "fs";
import path from "path";

async function seed() {
  try {
    const envPath = path.join(process.cwd(), ".env");
    if (!fs.existsSync(envPath)) {
      console.error(".env file not found");
      process.exit(1);
    }

    const envContent = fs.readFileSync(envPath, "utf8");
    const mongoUriMatch = envContent.match(/MONGODB_URI=(.*)/);

    if (!mongoUriMatch) {
      console.error("MONGODB_URI not found in .env");
      process.exit(1);
    }

    const MONGODB_URI = mongoUriMatch[1].trim();

    console.log("Connecting to MongoDB...");
    await mongoose.connect(MONGODB_URI);
    console.log("Connected.");

    const User = mongoose.model(
      "User",
      new mongoose.Schema(
        {
          username: { type: String, required: true, unique: true },
          password: { type: String, required: true },
          role: { type: String, required: true },
          name: { type: String, required: true },
        },
        { collection: "users" },
      ),
    );

    const adminExists = await User.findOne({ role: "admin" });

    if (adminExists) {
      console.log(`Admin user already exists: ${adminExists.username}`);
      // I could update it, but let's just report for now.
      // If the user wants a new one, they can tell me.
      // Or I can offer to reset it.
    } else {
      const username = "admin";
      const password = "admin123";
      const hashedPassword = await bcrypt.hash(password, 10);

      await User.create({
        username,
        password: hashedPassword,
        role: "admin",
        name: "Administrator",
      });

      console.log(
        `Admin user created: username=${username}, password=${password}`,
      );
    }

    process.exit(0);
  } catch (err) {
    console.error("Error seeding admin:", err);
    process.exit(1);
  }
}

seed();
