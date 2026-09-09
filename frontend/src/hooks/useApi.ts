import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationOptions,
} from "@tanstack/react-query";
import { toast } from "sonner";

import { api, type ApplicationFilters, type QuestionFilters } from "@/lib/api";

export const keys = {
  board: (filters: object) => ["applications", "board", filters] as const,
  applications: (filters: object) => ["applications", "list", filters] as const,
  application: (id: number) => ["applications", "detail", id] as const,
  questions: (filters: object) => ["questions", filters] as const,
  tags: ["tags"] as const,
  projects: ["projects"] as const,
  project: (id: number) => ["projects", id] as const,
  dashboard: ["stats", "dashboard"] as const,
};

export const useBoard = (filters: { job_type?: string; q?: string }) =>
  useQuery({ queryKey: keys.board(filters), queryFn: () => api.applications.board(filters) });

export const useApplications = (filters: ApplicationFilters) =>
  useQuery({
    queryKey: keys.applications(filters),
    queryFn: () => api.applications.list(filters),
  });

export const useApplication = (id: number) =>
  useQuery({
    queryKey: keys.application(id),
    queryFn: () => api.applications.get(id),
    enabled: Number.isFinite(id),
  });

export const useQuestions = (filters: QuestionFilters) =>
  useQuery({ queryKey: keys.questions(filters), queryFn: () => api.questions.list(filters) });

export const useTags = () => useQuery({ queryKey: keys.tags, queryFn: api.tags.list });

export const useProjects = () =>
  useQuery({ queryKey: keys.projects, queryFn: api.projects.list });

export const useProject = (id: number) =>
  useQuery({
    queryKey: keys.project(id),
    queryFn: () => api.projects.get(id),
    enabled: Number.isFinite(id),
  });

export const useDashboard = () =>
  useQuery({ queryKey: keys.dashboard, queryFn: api.stats.dashboard });

/**
 * 写操作统一入口：成功后按 `invalidate` 里给的前缀失效缓存，并弹一条 toast。
 * 传前缀（如 ["applications"]）就能一次性刷掉列表 / 看板 / 详情。
 */
export function useAppMutation<TData, TVars>(
  mutationFn: (vars: TVars) => Promise<TData>,
  options: {
    invalidate?: readonly (readonly unknown[])[];
    success?: string;
  } & Omit<UseMutationOptions<TData, Error, TVars>, "mutationFn"> = {},
) {
  const { invalidate = [], success, ...rest } = options;
  const queryClient = useQueryClient();

  return useMutation<TData, Error, TVars>({
    mutationFn,
    ...rest,
    onSuccess: (...args) => {
      for (const key of invalidate) {
        queryClient.invalidateQueries({ queryKey: key });
      }
      if (success) toast.success(success);
      rest.onSuccess?.(...args);
    },
    onError: (...args) => {
      toast.error(args[0].message || "操作失败");
      rest.onError?.(...args);
    },
  });
}

/** 任何一处改动都可能影响 Dashboard，所以写操作基本都带上它 */
export const INVALIDATE_APPLICATIONS = [["applications"], keys.dashboard] as const;
export const INVALIDATE_QUESTIONS = [["questions"], keys.tags, keys.dashboard] as const;
export const INVALIDATE_PROJECTS = [["projects"], keys.dashboard] as const;
