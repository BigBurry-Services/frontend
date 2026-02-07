import mongoose, { Schema, Document, Model } from "mongoose";

export interface IDepartment extends Document {
  id: string;
  name: string;
  description?: string;
}

const DepartmentSchema: Schema = new Schema(
  {
    name: { type: String, required: true, unique: true },
    description: String,
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

if (mongoose.models.Department) {
  delete (mongoose as any).models.Department;
}

const Department: Model<IDepartment> = mongoose.model<IDepartment>(
  "Department",
  DepartmentSchema,
);

export default Department;
