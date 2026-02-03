import { JsonStorage } from "../lib/jsonStorage";

export interface ICategory {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

const Category = new JsonStorage<ICategory>("categories");

export default Category;
