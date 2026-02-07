import mongoose, { Schema, Document, Model } from "mongoose";

export interface ICategory extends Document {
  id: string;
  name: string;
  description?: string;
}

const CategorySchema: Schema = new Schema(
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

if (mongoose.models.Category) {
  delete (mongoose as any).models.Category;
}

const Category: Model<ICategory> = mongoose.model<ICategory>(
  "Category",
  CategorySchema,
);

export default Category;
