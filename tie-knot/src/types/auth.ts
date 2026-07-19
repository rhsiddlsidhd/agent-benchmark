import { UserRole } from "@/models/user.model";

export interface AuthSession {
  role: UserRole;
  email: string;
  userId: string;
}
