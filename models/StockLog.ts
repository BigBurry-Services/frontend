import { JsonStorage } from "../lib/jsonStorage";

export interface IStockLog {
  id: string;
  itemId: string;
  itemName: string;
  change: number;
  type: "IN" | "OUT";
  reason: string;
  timestamp: Date;
}

const StockLog = new JsonStorage<IStockLog>("stock_logs");

export default StockLog;
