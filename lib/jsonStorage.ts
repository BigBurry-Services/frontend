import fs from "fs/promises";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");

export class JsonStorage<
  T extends { id?: string; createdAt?: Date; updatedAt?: Date },
> {
  private filePath: string;

  constructor(private collectionName: string) {
    this.filePath = path.join(DATA_DIR, `${collectionName}.json`);
  }

  private async ensureDirectory() {
    try {
      await fs.mkdir(DATA_DIR, { recursive: true });
    } catch (error) {
      // Ignore if directory already exists
    }
  }

  private async readData(): Promise<T[]> {
    await this.ensureDirectory();
    try {
      const data = await fs.readFile(this.filePath, "utf-8");
      return JSON.parse(data, (key, value) => {
        // Revive dates
        if (
          typeof value === "string" &&
          /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/.test(value)
        ) {
          return new Date(value);
        }
        return value;
      });
    } catch (error: any) {
      if (error.code === "ENOENT") {
        return [];
      }
      throw error;
    }
  }

  private async writeData(data: T[]): Promise<void> {
    await this.ensureDirectory();
    await fs.writeFile(this.filePath, JSON.stringify(data, null, 2), "utf-8");
  }

  async find(
    query: Partial<T> | ((item: T) => boolean) | Record<string, any> = {},
  ): Promise<T[]> {
    const data = await this.readData();

    if (typeof query === "function") {
      return data.filter(query as any);
    }

    if (Object.keys(query).length === 0) return data;

    return data.filter((item: any) => {
      return Object.entries(query).every(([key, value]) => {
        if (value && typeof value === "object" && !Array.isArray(value)) {
          // Handle operators
          return Object.entries(value).every(([op, opValue]: [string, any]) => {
            switch (op) {
              case "$regex":
                return new RegExp(opValue, (value as any).$options || "").test(
                  item[key],
                );
              case "$gte":
                return item[key] >= opValue;
              case "$lte":
                return item[key] <= opValue;
              case "$gt":
                return item[key] > opValue;
              case "$lt":
                return item[key] < opValue;
              case "$ne":
                return item[key] !== opValue;
              case "$in":
                return Array.isArray(opValue) && opValue.includes(item[key]);
              default:
                return item[key] === value;
            }
          });
        }
        return item[key] === value;
      });
    });
  }

  async findOne(
    query: Partial<T> | ((item: T) => boolean) | Record<string, any>,
  ): Promise<T | null> {
    const results = await this.find(query);
    return results.length > 0 ? results[0] : null;
  }

  async countDocuments(
    query: Partial<T> | ((item: T) => boolean) | Record<string, any> = {},
  ): Promise<number> {
    const data = await this.find(query);
    return data.length;
  }

  async findById(id: string): Promise<T | null> {
    return this.findOne({ id } as any);
  }

  async create(item: Omit<T, "id" | "createdAt" | "updatedAt">): Promise<T> {
    const data = await this.readData();
    const newItem = {
      ...item,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
      createdAt: new Date(),
      updatedAt: new Date(),
    } as unknown as T;

    data.push(newItem);
    await this.writeData(data);
    return newItem;
  }

  async update(id: string, updates: Partial<T>): Promise<T | null> {
    const data = await this.readData();
    const index = data.findIndex((item) => item.id === id);

    if (index === -1) return null;

    const updatedItem = {
      ...data[index],
      ...updates,
      updatedAt: new Date(),
    };

    data[index] = updatedItem;
    await this.writeData(data);
    return updatedItem;
  }

  async delete(id: string): Promise<boolean> {
    const data = await this.readData();
    const initialLength = data.length;
    const filteredData = data.filter((item) => item.id !== id);

    if (filteredData.length === initialLength) return false;

    await this.writeData(filteredData);
    return true;
  }
}
