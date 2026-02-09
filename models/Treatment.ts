import mongoose, { Schema, Document, Model } from "mongoose";

export interface ITreatment extends Document {
  id: string;
  name: string;
  categoryID?: string;
  price: number;
  description?: string;
}

const TreatmentSchema: Schema = new Schema(
  {
    name: { type: String, required: true, unique: true },
    categoryID: { type: String },
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

if (mongoose.models.Treatment) {
  delete (mongoose as any).models.Treatment;
}

const Treatment: Model<ITreatment> = mongoose.model<ITreatment>(
  "Treatment",
  TreatmentSchema,
);

export default Treatment;
