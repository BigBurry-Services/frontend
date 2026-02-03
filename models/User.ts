import { JsonStorage } from "../lib/jsonStorage";

export enum UserRole {
  ADMIN = "admin",
  RECEPTIONIST = "receptionist",
  DOCTOR = "doctor",
  PHARMACIST = "pharmacist",
}

export interface IUser {
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

const User = new JsonStorage<IUser>("users");

export default User;
