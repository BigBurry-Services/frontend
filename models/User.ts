import mongoose, { Schema, Document, Model } from "mongoose";

export enum UserRole {
  ADMIN = "admin",
  RECEPTIONIST = "receptionist",
  DOCTOR = "doctor",
  PHARMACIST = "pharmacist",
}

export interface IUser extends Document {
  id: string;
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
    role: { type: String, enum: Object.values(UserRole), required: true },
    name: { type: String, required: true },
    specialization: { type: String },
    department: { type: String },
    consultationFee: { type: Number },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (doc, ret: any) => {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  },
);

if (mongoose.models.User) {
  delete (mongoose as any).models.User;
}

const User: Model<IUser> = mongoose.model<IUser>("User", UserSchema);

export default User;
