import { JsonStorage } from "../lib/jsonStorage";

export interface IDepartment {
  id: string;
  name: string;
  description?: string;
  headOfDepartment?: string;
  createdAt: Date;
  updatedAt: Date;
}

const Department = new JsonStorage<IDepartment>("departments");

export default Department;
