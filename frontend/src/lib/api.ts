import type {
  Application,
  ApplicationDetail,
  ApplicationEvent,
  AppStatus,
  BoardColumn,
  DashboardStats,
  DevLog,
  Milestone,
  Project,
  ProjectDetail,
  Question,
  Tag,
  Task,
  TaskStatus,
} from "@/types";

const BASE = "/api";

class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });

  if (!response.ok) {
    let detail = `请求失败 (${response.status})`;
    try {
      const body = await response.json();
      if (typeof body?.detail === "string") detail = body.detail;
    } catch {
      /* 响应体不是 JSON，用默认文案 */
    }
    throw new ApiError(detail, response.status);
  }

  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

function qs(params: object) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") continue;
    search.set(key, String(value));
  }
  const text = search.toString();
  return text ? `?${text}` : "";
}

const post = <T,>(path: string, body: unknown) =>
  request<T>(path, { method: "POST", body: JSON.stringify(body) });
const patch = <T,>(path: string, body: unknown) =>
  request<T>(path, { method: "PATCH", body: JSON.stringify(body) });
const del = (path: string) => request<void>(path, { method: "DELETE" });

export interface ApplicationFilters {
  status?: AppStatus;
  job_type?: string;
  channel?: string;
  q?: string;
}

export interface QuestionFilters {
  q?: string;
  question_type?: string;
  tag?: string;
  company?: string;
  application_id?: number;
  need_review?: boolean;
  mastery_lte?: number;
}

export const api = {
  applications: {
    list: (filters: ApplicationFilters = {}) =>
      request<Application[]>(`/applications${qs(filters)}`),
    board: (filters: { job_type?: string; q?: string } = {}) =>
      request<BoardColumn[]>(`/applications/board${qs(filters)}`),
    get: (id: number) => request<ApplicationDetail>(`/applications/${id}`),
    create: (body: Record<string, unknown>) =>
      post<ApplicationDetail>("/applications", body),
    update: (id: number, body: Record<string, unknown>) =>
      patch<ApplicationDetail>(`/applications/${id}`, body),
    remove: (id: number) => del(`/applications/${id}`),
    move: (id: number, body: { status: AppStatus; ordered_ids: number[] }) =>
      post<Application>(`/applications/${id}/move`, body),
    addEvent: (id: number, body: Record<string, unknown>) =>
      post<ApplicationEvent>(`/applications/${id}/events`, body),
    updateEvent: (id: number, eventId: number, body: Record<string, unknown>) =>
      patch<ApplicationEvent>(`/applications/${id}/events/${eventId}`, body),
    removeEvent: (id: number, eventId: number) =>
      del(`/applications/${id}/events/${eventId}`),
  },

  questions: {
    list: (filters: QuestionFilters = {}) => request<Question[]>(`/questions${qs(filters)}`),
    get: (id: number) => request<Question>(`/questions/${id}`),
    create: (body: Record<string, unknown>) => post<Question>("/questions", body),
    update: (id: number, body: Record<string, unknown>) =>
      patch<Question>(`/questions/${id}`, body),
    setMastery: (id: number, mastery: number, needReview?: boolean) =>
      post<Question>(`/questions/${id}/mastery`, {
        mastery,
        need_review: needReview,
      }),
    remove: (id: number) => del(`/questions/${id}`),
  },

  tags: {
    list: () => request<Tag[]>("/tags"),
  },

  projects: {
    list: () => request<Project[]>("/projects"),
    get: (id: number) => request<ProjectDetail>(`/projects/${id}`),
    create: (body: Record<string, unknown>) => post<ProjectDetail>("/projects", body),
    update: (id: number, body: Record<string, unknown>) =>
      patch<ProjectDetail>(`/projects/${id}`, body),
    remove: (id: number) => del(`/projects/${id}`),

    addMilestone: (id: number, body: Record<string, unknown>) =>
      post<Milestone>(`/projects/${id}/milestones`, body),
    updateMilestone: (id: number, milestoneId: number, body: Record<string, unknown>) =>
      patch<Milestone>(`/projects/${id}/milestones/${milestoneId}`, body),
    removeMilestone: (id: number, milestoneId: number) =>
      del(`/projects/${id}/milestones/${milestoneId}`),

    addTask: (id: number, body: Record<string, unknown>) =>
      post<Task>(`/projects/${id}/tasks`, body),
    updateTask: (id: number, taskId: number, body: Record<string, unknown>) =>
      patch<Task>(`/projects/${id}/tasks/${taskId}`, body),
    moveTask: (id: number, taskId: number, body: { status: TaskStatus; ordered_ids: number[] }) =>
      post<Task>(`/projects/${id}/tasks/${taskId}/move`, body),
    removeTask: (id: number, taskId: number) => del(`/projects/${id}/tasks/${taskId}`),

    addLog: (id: number, body: Record<string, unknown>) =>
      post<DevLog>(`/projects/${id}/logs`, body),
    updateLog: (id: number, logId: number, body: Record<string, unknown>) =>
      patch<DevLog>(`/projects/${id}/logs/${logId}`, body),
    removeLog: (id: number, logId: number) => del(`/projects/${id}/logs/${logId}`),
  },

  stats: {
    dashboard: () => request<DashboardStats>("/stats/dashboard"),
  },
};
