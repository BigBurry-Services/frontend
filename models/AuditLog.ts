import { JsonStorage } from "../lib/jsonStorage";

export interface IAuditLog {
  id: string;
  userId: string;
  username: string;
  action: "LOGIN" | "LOGOUT";
  timestamp: Date;
  details?: string;
}

const AuditLog = new JsonStorage<IAuditLog>("audit_logs");

export default AuditLog;
