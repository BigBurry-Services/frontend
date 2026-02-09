import mongoose, { Schema, Document, Model } from "mongoose";

export interface IService extends Document {
  id: string;
  name: string;
  category?: string;
  price: number;
  description?: string;
}

const ServiceSchema: Schema = new Schema(
  {
    name: { type: String, required: true, unique: true },
    category: { type: String },
    price: { type: Number, required: true },
    description: { type: String },
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

if (mongoose.models.Service) {
  delete (mongoose as any).models.Service;
}

const Service: Model<IService> = mongoose.model<IService>(
  "Service",
  ServiceSchema,
);

export default Service;
