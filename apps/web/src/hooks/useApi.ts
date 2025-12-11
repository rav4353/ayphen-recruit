import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '../lib/api';
import type { ApiResponse, PaginationParams } from '../lib/types';

// Generic fetch hook with pagination
export function usePaginatedQuery<T>(
  key: string[],
  url: string,
  params?: PaginationParams & Record<string, unknown>,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: [...key, params],
    queryFn: async () => {
      const response = await api.get<ApiResponse<T[]>>(url, { params });
      return response.data;
    },
    enabled: options?.enabled ?? true,
  });
}

// Generic fetch single item
export function useItemQuery<T>(
  key: string[],
  url: string,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: key,
    queryFn: async () => {
      const response = await api.get<ApiResponse<T>>(url);
      return response.data;
    },
    enabled: options?.enabled ?? true,
  });
}

// Generic create mutation
export function useCreateMutation<TData, TVariables>(
  url: string,
  options?: {
    invalidateKeys?: string[][];
    onSuccess?: (data: ApiResponse<TData>) => void;
    successMessage?: string;
  }
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: TVariables) => {
      const response = await api.post<ApiResponse<TData>>(url, data);
      return response.data;
    },
    onSuccess: (data) => {
      if (options?.successMessage || data.message) {
        toast.success(options?.successMessage || data.message);
      }
      options?.invalidateKeys?.forEach((key) => {
        queryClient.invalidateQueries({ queryKey: key });
      });
      options?.onSuccess?.(data);
    },
    onError: (error: Error & { response?: { data?: ApiResponse<null> } }) => {
      const message = error.response?.data?.message || error.message || 'An error occurred';
      const errors = error.response?.data?.errors;
      if (errors?.length) {
        errors.forEach((err) => toast.error(err));
      } else {
        toast.error(message);
      }
    },
  });
}

// Generic update mutation
export function useUpdateMutation<TData, TVariables>(
  getUrl: (id: string) => string,
  options?: {
    invalidateKeys?: string[][];
    onSuccess?: (data: ApiResponse<TData>) => void;
    successMessage?: string;
  }
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: TVariables }) => {
      const response = await api.patch<ApiResponse<TData>>(getUrl(id), data);
      return response.data;
    },
    onSuccess: (data) => {
      if (options?.successMessage || data.message) {
        toast.success(options?.successMessage || data.message);
      }
      options?.invalidateKeys?.forEach((key) => {
        queryClient.invalidateQueries({ queryKey: key });
      });
      options?.onSuccess?.(data);
    },
    onError: (error: Error & { response?: { data?: ApiResponse<null> } }) => {
      const message = error.response?.data?.message || error.message || 'An error occurred';
      toast.error(message);
    },
  });
}

// Generic delete mutation
export function useDeleteMutation(
  getUrl: (id: string) => string,
  options?: {
    invalidateKeys?: string[][];
    onSuccess?: () => void;
    successMessage?: string;
  }
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.delete<ApiResponse<null>>(getUrl(id));
      return response.data;
    },
    onSuccess: (data) => {
      toast.success(options?.successMessage || data.message || 'Deleted successfully');
      options?.invalidateKeys?.forEach((key) => {
        queryClient.invalidateQueries({ queryKey: key });
      });
      options?.onSuccess?.();
    },
    onError: (error: Error & { response?: { data?: ApiResponse<null> } }) => {
      const message = error.response?.data?.message || error.message || 'An error occurred';
      toast.error(message);
    },
  });
}
