/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useContext,
  useState,
  type ReactNode,
} from "react";

export type AuthUser = {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: string;          // "CLIENT" | "ADMIN" | "ESTHETICIENNE" | "SUPERADMIN"
  isAdmin?: boolean;     // dépend du token backend
};

type AuthContextType = {
  user: AuthUser | null;
  isAuthenticated: boolean;

  // Nouveaux flags mieux définis
  isAdmin: boolean;       // ADMIN + SUPERADMIN
  isSuperAdmin: boolean;  // SUPERADMIN uniquement

  login: (token: string, user: AuthUser) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => {
    const stored = localStorage.getItem("authUser");
    if (!stored) return null;
    try {
      return JSON.parse(stored) as AuthUser;
    } catch {
      localStorage.removeItem("authUser");
      return null;
    }
  });

  const [isAuthenticated, setIsAuthenticated] = useState(
    !!localStorage.getItem("authToken") && user !== null
  );

  const login = (token: string, nextUser: AuthUser) => {
    localStorage.setItem("authToken", token);
    localStorage.setItem("authUser", JSON.stringify(nextUser));
    setUser(nextUser);
    setIsAuthenticated(true);
  };

  const logout = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("authUser");
    setUser(null);
    setIsAuthenticated(false);
  };

  // 🔥 Backend envoie isAdmin = true si ADMIN ou SUPERADMIN
  const isAdmin = !!user?.isAdmin;

  // 🔥 SUPERADMIN strict
  const isSuperAdmin = user?.role === "SUPERADMIN";

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isAdmin,
        isSuperAdmin,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}
