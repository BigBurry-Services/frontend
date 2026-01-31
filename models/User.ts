import mongoose, { Schema, Document, Model } from "mongoose";

export enum UserRole {
  ADMIN = "admin",
  RECEPTIONIST = "receptionist",
  DOCTOR = "doctor",
  PHARMACIST = "pharmacist",
}

export interface IUser extends Document {
  username: string;
  password?: string;
  role: UserRole;
  name: string;
  specialization?: string;
  department?: string;
  consultationFee?: number;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema = new Schema(
  {
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, required: true, enum: Object.values(UserRole) },
    name: { type: String, required: true },
    specialization: { type: String },
    department: { type: String },
    consultationFee: { type: Number },
  },
  { timestamps: true },
);

const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>("User", UserSchema);

export default User;
