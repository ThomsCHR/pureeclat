import { useState } from "react";

type AuthUser = {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
};

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(() => {
    const data = localStorage.getItem("authUser");
    try {
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  });

  const isAuthenticated = !!localStorage.getItem("authToken") && user !== null;

  const logout = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("authUser");
    setUser(null);
  };

  return { user, isAuthenticated, logout };
}
