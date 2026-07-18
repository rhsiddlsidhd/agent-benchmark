import { UserRole } from "@/models/user.model";

export interface AuthSession {
  token: string;
  role: UserRole;
  email: string;
  userId: string;
}
