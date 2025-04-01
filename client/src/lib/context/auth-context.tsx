import React, { createContext, useState, useContext, useEffect } from "react";
import { User } from "@shared/schema";
import { apiRequest } from "../queryClient";
import { useToast } from "@/hooks/use-toast";

interface AuthContextData {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (userData: any) => Promise<void>;
  logout: () => void;
  enableDevMode: () => Promise<void>;
  isDevMode: boolean;
}

// Create the initial context with defaults
const AuthContext = createContext<AuthContextData>({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  login: async () => {},
  register: async () => {},
  logout: () => {},
  enableDevMode: async () => {},
  isDevMode: false,
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDevMode, setIsDevMode] = useState(false);
  const { toast } = useToast();

  // Initialize auth state from localStorage
  useEffect(() => {
    // Check if dev mode was previously enabled
    const devModeEnabled = localStorage.getItem("devMode") === "true";
    
    if (devModeEnabled) {
      // If dev mode was enabled, login as developer
      loginAsDeveloper().catch(() => {
        // If developer login fails, clear dev mode flag
        localStorage.removeItem("devMode");
        setIsDevMode(false);
      });
    } else {
      // Otherwise try to load the saved user
      const savedUser = localStorage.getItem("user");
      if (savedUser) {
        try {
          setUser(JSON.parse(savedUser));
        } catch (error) {
          console.error("Failed to parse saved user:", error);
          localStorage.removeItem("user");
        }
      }
      
      setIsLoading(false);
    }
  }, []);

  // Save dev mode state to localStorage when it changes
  useEffect(() => {
    localStorage.setItem("devMode", isDevMode.toString());
  }, [isDevMode]);

  const loginAsDeveloper = async () => {
    try {
      setIsLoading(true);
      const response = await apiRequest("POST", "/api/auth/login", { 
        username: "developer", 
        password: "password123" 
      });
      const userData = await response.json();
      setUser(userData);
      setIsDevMode(true);
      localStorage.setItem("user", JSON.stringify(userData));
      localStorage.setItem("devMode", "true");
      setIsLoading(false);
      return userData;
    } catch (error) {
      console.error("Developer login failed:", error);
      setIsLoading(false);
      setIsDevMode(false);
      localStorage.removeItem("devMode");
      throw error;
    }
  };

  const login = async (username: string, password: string) => {
    try {
      setIsLoading(true);
      const response = await apiRequest("POST", "/api/auth/login", { username, password });
      const userData = await response.json();
      setUser(userData);
      localStorage.setItem("user", JSON.stringify(userData));
      toast({
        title: "Login successful",
        description: `Welcome back, ${userData.displayName || userData.username}!`,
        variant: "default",
      });
    } catch (error: any) {
      toast({
        title: "Login failed",
        description: error.message || "Invalid credentials",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData: any) => {
    try {
      setIsLoading(true);
      const response = await apiRequest("POST", "/api/users", userData);
      const newUser = await response.json();
      setUser(newUser);
      localStorage.setItem("user", JSON.stringify(newUser));
      toast({
        title: "Registration successful",
        description: "Your account has been created successfully!",
        variant: "default",
      });
    } catch (error: any) {
      toast({
        title: "Registration failed",
        description: error.message || "Failed to create account",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setIsDevMode(false);
    localStorage.removeItem("user");
    localStorage.removeItem("devMode");
    toast({
      title: "Logged out",
      description: "You have been logged out successfully",
      variant: "default",
    });
  };

  const enableDevMode = async () => {
    try {
      // First try to login as developer
      try {
        await login("developer", "password123");
      } catch (error) {
        // If login fails, register the developer account
        await register({
          username: "developer",
          password: "password123",
          email: "dev@example.com",
          displayName: "Developer Mode",
          nativeLanguage: "en",
          bio: "This is a developer account for testing"
        });
        // Then login with the newly created account
        await login("developer", "password123");
      }
      
      setIsDevMode(true);
      localStorage.setItem("devMode", "true");
      toast({
        title: "Developer Mode Enabled",
        description: "You are now signed in as a developer user",
        variant: "default",
      });
    } catch (error) {
      toast({
        title: "Developer Mode Failed", 
        description: "Could not enable developer mode",
        variant: "destructive",
      });
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
        enableDevMode,
        isDevMode,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);