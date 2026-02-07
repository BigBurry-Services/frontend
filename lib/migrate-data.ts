import fs from "fs/promises";
import path from "path";
import dbConnect from "./db";
import AuditLog from "@/models/AuditLog";
import Category from "@/models/Category";
import Department from "@/models/Department";
import Expense from "@/models/Expense";
import Inventory from "@/models/Inventory";
import Invoice from "@/models/Invoice";
import Package from "@/models/Package";
import Patient from "@/models/Patient";
import PatientPackage from "@/models/PatientPackage";
import Resource from "@/models/Resource";
import Service from "@/models/Service";
import StockLog from "@/models/StockLog";
import Treatment from "@/models/Treatment";
import User from "@/models/User";
import Visit from "@/models/Visit";

const models: Record<string, any> = {
  AuditLog,
  Category,
  Department,
  Expense,
  Inventory,
  Invoice,
  Package,
  Patient,
  PatientPackage,
  Resource,
  Service,
  StockLog,
  Treatment,
  User,
  Visit,
};

// Map filenames to models
const fileMap: Record<string, string> = {
  "auditlogs.json": "AuditLog",
  "categories.json": "Category",
  "departments.json": "Department",
  "expenses.json": "Expense",
  "inventory.json": "Inventory",
  "invoices.json": "Invoice",
  "packages.json": "Package",
  "patients.json": "Patient",
  "patientpackages.json": "PatientPackage",
  "resources.json": "Resource",
  "services.json": "Service",
  "stocklogs.json": "StockLog",
  "treatments.json": "Treatment",
  "users.json": "User",
  "visits.json": "Visit",
};

export async function migrateData() {
  await dbConnect();
  const DATA_DIR = path.join(process.cwd(), "data");

  try {
    const files = await fs.readdir(DATA_DIR);
    console.log(`Found ${files.length} files in data directory.`);

    for (const file of files) {
      if (!file.endsWith(".json")) continue;

      const modelName = fileMap[file];
      if (!modelName) {
        console.warn(`No model found for file: ${file}`);
        continue;
      }

      const model = models[modelName];
      const filePath = path.join(DATA_DIR, file);
      const content = await fs.readFile(filePath, "utf-8");
      const data = JSON.parse(content);

      if (!Array.isArray(data)) {
        console.warn(`Data in ${file} is not an array.`);
        continue;
      }

      console.log(
        `Migrating ${data.length} records from ${file} to ${modelName}...`,
      );

      for (const record of data) {
        try {
          // Flatten record and handle _id vs id
          const { id, ...rest } = record;

          // Check if record already exists by ID (if we use the old ID as _id)
          // For simplicity, we'll use insertMany or just create.
          // In MongoDB, we might want to map the old 'id' to '_id' for continuity if possible,
          // but Mongoose IDs are usually ObjectIds.
          // If the old IDs were UUIDs/strings, we can use them as _id.

          await model.create({
            _id: id,
            ...rest,
          });
        } catch (err: any) {
          if (err.code === 11000) {
            // Already exists, skip
          } else {
            console.error(`Error migrating record from ${file}:`, err.message);
          }
        }
      }
      console.log(`Finished migrating ${file}.`);
    }

    console.log("Migration completed successfully!");
  } catch (err: any) {
    console.error("Migration failed:", err.message);
  }
}

// Allow running directly if needed (e.g. ts-node)
if (require.main === module) {
  migrateData();
}
