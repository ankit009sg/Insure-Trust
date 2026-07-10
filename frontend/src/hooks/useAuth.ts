import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { authApi } from '../api/auth';
import { useAuthStore } from '../stores/authStore';
import { Role } from '../types';

export const useRegister = () => {
  return useMutation({
    mutationFn: ({ email, password, role }: { email: string; password: string; role: Role }) =>
      authApi.register(email, password, role),
  });
};

export const useLogin = () => {
  const setAuth = useAuthStore((state) => state.setAuth);
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      authApi.login(email, password),
    onSuccess: (data) => {
      setAuth(data.access_token, data.email, data.role);
      // Clear react query cache to avoid data bleed between user sessions
      queryClient.clear();
    },
  });
};

export const useCurrentUser = () => {
  const token = useAuthStore((state) => state.token);
  return useQuery({
    queryKey: ['currentUser'],
    queryFn: () => authApi.getMe(),
    enabled: !!token,
  });
};
