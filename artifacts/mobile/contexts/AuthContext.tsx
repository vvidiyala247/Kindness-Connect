import AsyncStorage from "@react-native-async-storage/async-storage";
import { useQueryClient } from "@tanstack/react-query";
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";

import type { UserProfile } from "@workspace/api-client-react";

const TOKEN_KEY = "kc_jwt";

interface AuthContextValue {
  token: string | null;
  user: UserProfile | null;
  isLoading: boolean;
  login: (token: string, user: UserProfile) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const queryClient = useQueryClient();

  useEffect(() => {
    AsyncStorage.getItem(TOKEN_KEY)
      .then((stored) => {
        if (stored) {
          setToken(stored);
        }
      })
      .finally(() => setIsLoading(false));
  }, []);

  const login = useCallback(async (newToken: string, newUser: UserProfile) => {
    await AsyncStorage.setItem(TOKEN_KEY, newToken);
    setToken(newToken);
    setUser(newUser);
  }, []);

  const logout = useCallback(async () => {
    await AsyncStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
    queryClient.clear();
  }, [queryClient]);

  return (
    <AuthContext.Provider value={{ token, user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
