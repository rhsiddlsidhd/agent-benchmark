import { UserRole } from "@/server/models";
import { AuthSession } from "@/shared/schemas";
import { create } from "zustand";

export type AuthState = {
  isAuth: boolean;
  role: UserRole | "GUEST";
  email: string | null;
  userId: string | null;
};

type AuthAction = {
  setSession: (session: AuthSession) => void;
  clearAuth: () => void;
};

const useAuthStore = create<AuthState & AuthAction>((set) => ({
  isAuth: false,
  role: "GUEST",
  email: null,
  userId: null,
  setSession: ({ role, email, userId }) =>
    set(() => ({
      isAuth: true,
      role,
      email,
      userId,
    })),
  clearAuth: () =>
    set(() => ({
      isAuth: false,
      role: "GUEST",
      email: null,
      userId: null,
    })),
}));

export { useAuthStore };
