import { useQuery } from "@tanstack/react-query";
import type { User } from "@shared/schema";

export function useAuth() {
  const { data: user, isLoading, error } = useQuery<User | null>({
    queryKey: ["/api/auth/user"],
    retry: false,
  });

  const isAdmin = user?.isAdmin === "true";

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    isAdmin,
    error,
  };
}
