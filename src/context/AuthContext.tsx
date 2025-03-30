
import React, { createContext, useContext, useState, useEffect } from "react";
import { toast } from "sonner";

interface User {
  id: string;
  name: string;
  email: string;
  userType: "admin" | "normal";
  companyId?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for stored user data on component mount
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      // In a real app, this would be an API call
      // Mock login logic for demonstration
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (email === "admin@example.com" && password === "password") {
        const userData: User = {
          id: "1",
          name: "Administrator",
          email: "admin@example.com",
          userType: "admin",
          companyId: "123"
        };
        setUser(userData);
        localStorage.setItem("user", JSON.stringify(userData));
        toast.success("Login successful");
        return true;
      } else if (email === "user@example.com" && password === "password") {
        const userData: User = {
          id: "2",
          name: "Regular User",
          email: "user@example.com",
          userType: "normal",
          companyId: "123"
        };
        setUser(userData);
        localStorage.setItem("user", JSON.stringify(userData));
        toast.success("Login successful");
        return true;
      } else {
        toast.error("Invalid credentials");
        return false;
      }
    } catch (error) {
      console.error("Login error:", error);
      toast.error("Login failed. Please try again.");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("user");
    toast.info("You have been logged out");
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
