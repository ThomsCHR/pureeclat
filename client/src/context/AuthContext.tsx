/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import { apiGetMe, apiLogout } from "../api/apiClient";

export type AuthUser = {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: string;          // "CLIENT" | "ADMIN" | "ESTHETICIENNE" | "SUPERADMIN"
  isAdmin?: boolean;
};

type AuthContextType = {
  user: AuthUser | null;
  isAuthenticated: boolean;
  authLoading: boolean;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  login: (user: AuthUser) => void;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);

  // Vérifie la session via le cookie HttpOnly au montage
  useEffect(() => {
    apiGetMe()
      .then(({ user: u }) => {
        setUser(u);
        setIsAuthenticated(true);
      })
      .catch(() => {
        setUser(null);
        setIsAuthenticated(false);
      })
      .finally(() => setAuthLoading(false));
  }, []);

  const login = (nextUser: AuthUser) => {
    setUser(nextUser);
    setIsAuthenticated(true);
  };

  const logout = async () => {
    try {
      await apiLogout();
    } catch {
      // Même en cas d'erreur, on déconnecte côté client
    }
    setUser(null);
    setIsAuthenticated(false);
  };

  const isAdmin = !!user?.isAdmin;
  const isSuperAdmin = user?.role === "SUPERADMIN";

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        authLoading,
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
