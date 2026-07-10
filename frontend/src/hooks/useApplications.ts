import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { applicationsApi } from '../api/applications';

export const useUploadApplication = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => applicationsApi.upload(file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications'] });
    },
  });
};

export const useApplications = (statusFilter?: string) => {
  return useQuery({
    queryKey: ['applications', statusFilter],
    queryFn: () => applicationsApi.getAll(statusFilter),
  });
};

export const useApplication = (id: number) => {
  return useQuery({
    queryKey: ['application', id],
    queryFn: () => applicationsApi.getById(id),
    enabled: !!id && !isNaN(id),
  });
};

export const useValidateApplication = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, extractedData }: { id: number; extractedData: Record<string, any> }) =>
      applicationsApi.validate(id, extractedData),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['application', data.id] });
      queryClient.invalidateQueries({ queryKey: ['applications'] });
    },
  });
};

export const useSubmitApplication = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => applicationsApi.submit(id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['application', data.id] });
      queryClient.invalidateQueries({ queryKey: ['applications'] });
    },
  });
};

export const useReviewAction = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, action, reason }: { id: number; action: 'approve' | 'reject' | 'escalate'; reason?: string }) =>
      applicationsApi.action(id, action, reason),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['application', data.id] });
      queryClient.invalidateQueries({ queryKey: ['applications'] });
    },
  });
};

export const useDeleteApplication = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => applicationsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications'] });
    },
  });
};
