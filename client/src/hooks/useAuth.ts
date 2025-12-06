import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";

interface User {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  isEmailVerified: string;
  isAdmin: string | null;
  isSupplier: string | null;
  profileImageUrl: string | null;
  createdAt: string;
}

interface LoginData {
  email: string;
  password: string;
}

interface RegisterData {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
}

interface AuthResponse {
  message: string;
  user: User;
}

export function useAuth() {
  const { data: user, isLoading, error, isFetched } = useQuery<User | null>({
    queryKey: ["/api/auth/user"],
    queryFn: async () => {
      try {
        const res = await fetch("/api/auth/user", { credentials: "include" });
        if (res.status === 401) {
          return null;
        }
        if (!res.ok) {
          throw new Error("Failed to fetch user");
        }
        return await res.json();
      } catch {
        return null;
      }
    },
    retry: false,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const loginMutation = useMutation({
    mutationFn: async (data: LoginData): Promise<AuthResponse> => {
      const res = await apiRequest("POST", "/api/auth/login", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (data: RegisterData): Promise<AuthResponse> => {
      const res = await apiRequest("POST", "/api/auth/register", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async (): Promise<{ message: string }> => {
      const res = await apiRequest("POST", "/api/auth/logout", {});
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      queryClient.setQueryData(["/api/auth/user"], null);
    },
  });

  const forgotPasswordMutation = useMutation({
    mutationFn: async (email: string): Promise<{ message: string }> => {
      const res = await apiRequest("POST", "/api/auth/forgot-password", { email });
      return res.json();
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: async (data: { token: string; password: string }): Promise<{ message: string }> => {
      const res = await apiRequest("POST", "/api/auth/reset-password", data);
      return res.json();
    },
  });

  const verifyEmailMutation = useMutation({
    mutationFn: async (data: { token: string; userId: string }): Promise<{ message: string }> => {
      const res = await apiRequest("POST", "/api/auth/verify-email", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
    },
  });

  const resendVerificationMutation = useMutation({
    mutationFn: async (): Promise<{ message: string }> => {
      const res = await apiRequest("POST", "/api/auth/resend-verification", {});
      return res.json();
    },
  });

  const isAdmin = user?.isAdmin === "true";
  const isEmailVerified = user?.isEmailVerified === "true";

  return {
    user,
    isLoading: isLoading && !isFetched,
    isAuthenticated: !!user,
    isAdmin,
    isEmailVerified,
    error,
    login: loginMutation.mutateAsync,
    register: registerMutation.mutateAsync,
    logout: logoutMutation.mutateAsync,
    forgotPassword: forgotPasswordMutation.mutateAsync,
    resetPassword: resetPasswordMutation.mutateAsync,
    verifyEmail: verifyEmailMutation.mutateAsync,
    resendVerification: resendVerificationMutation.mutateAsync,
    isLoginPending: loginMutation.isPending,
    isRegisterPending: registerMutation.isPending,
    isLogoutPending: logoutMutation.isPending,
    loginError: loginMutation.error,
    registerError: registerMutation.error,
  };
}
