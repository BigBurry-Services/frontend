import mongoose, { Schema, Document, Model } from "mongoose";

export interface IPackage extends Document {
  id: string;
  name: string;
  totalPrice: number;
  items: string[];
  description?: string;
}

const PackageSchema: Schema = new Schema(
  {
    name: { type: String, required: true },
    totalPrice: { type: Number, required: true },
    items: { type: [String], required: true },
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

if (mongoose.models.Package) {
  delete (mongoose as any).models.Package;
}

const Package: Model<IPackage> = mongoose.model<IPackage>(
  "Package",
  PackageSchema,
);

export default Package;
