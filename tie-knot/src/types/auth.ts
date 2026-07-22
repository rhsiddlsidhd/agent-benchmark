import { UserRole } from "@/models";
export interface AuthSession {
  role: UserRole;
  email: string;
  userId: string;
}
