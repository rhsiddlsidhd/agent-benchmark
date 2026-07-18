import { UserRole } from "@/models/user.model";
import { AuthSession } from "@/types/auth";
import { create } from "zustand";

export type AuthState = {
  token: string | null;
  isAuth: boolean;
  role: UserRole | "GUEST";
  email: string | null;
  userId: string | null;
};

type AuthAction = {
  setToken: (session: AuthSession) => void;
  clearAuth: () => void;
};

const useAuthStore = create<AuthState & AuthAction>((set) => ({
  token: null,
  isAuth: false,
  role: "GUEST",
  email: null,
  userId: null,
  setToken: ({ token, role, email, userId }) =>
    set(() => ({
      token,
      isAuth: !!token,
      role: token ? role : "GUEST",
      email,
      userId,
    })),
  clearAuth: () =>
    set(() => ({
      token: null,
      isAuth: false,
      role: "GUEST",
      email: null,
      userId: null,
    })),
}));

export default useAuthStore;
