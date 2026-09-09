export type JobType = "intern" | "autumn" | "spring" | "social";

export type Channel =
  | "official"
  | "boss"
  | "referral"
  | "nowcoder"
  | "liepin"
  | "maimai"
  | "campus_talk"
  | "other";

export type AppStatus =
  | "wishlist"
  | "applied"
  | "written_test"
  | "interview_1"
  | "interview_2"
  | "interview_3"
  | "hr"
  | "offer"
  | "pool"
  | "rejected";

export type EventType =
  | "apply"
  | "written_test"
  | "interview_1"
  | "interview_2"
  | "interview_3"
  | "hr"
  | "offer"
  | "reject"
  | "pool"
  | "other";

export type EventResult = "pending" | "passed" | "failed" | "na";

export type QuestionType =
  | "algorithm"
  | "fundamentals"
  | "project"
  | "system_design"
  | "sql"
  | "hr"
  | "puzzle"
  | "other";

export type ProjectStatus = "planning" | "active" | "paused" | "done" | "archived";
export type TaskStatus = "todo" | "doing" | "done";
export type Priority = "low" | "medium" | "high";

export interface ApplicationEvent {
  id: number;
  application_id: number;
  event_type: EventType;
  result: EventResult;
  happened_at: string;
  duration_minutes: number | null;
  interviewer: string | null;
  notes: string | null;
}

export interface Application {
  id: number;
  company: string;
  position: string;
  job_type: JobType;
  channel: Channel;
  city: string | null;
  salary: string | null;
  jd_url: string | null;
  referrer: string | null;
  applied_at: string;
  status: AppStatus;
  sort_order: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
  event_count: number;
  question_count: number;
  last_event_at: string | null;
}

export interface ApplicationDetail extends Application {
  events: ApplicationEvent[];
}

export interface BoardColumn {
  status: AppStatus;
  items: Application[];
}

export interface Tag {
  id: number;
  name: string;
  color: string;
}

export interface Question {
  id: number;
  title: string;
  question_type: QuestionType;
  content: string | null;
  my_answer: string | null;
  reference_answer: string | null;
  code_snippet: string | null;
  code_language: string | null;
  difficulty: number;
  mastery: number;
  need_review: boolean;
  source_company: string | null;
  application_id: number | null;
  event_id: number | null;
  asked_at: string | null;
  created_at: string;
  updated_at: string;
  tags: Tag[];
}

export interface Milestone {
  id: number;
  project_id: number;
  title: string;
  description: string | null;
  due_date: string | null;
  done: boolean;
  done_at: string | null;
  sort_order: number;
  task_total: number;
  task_done: number;
}

export interface Task {
  id: number;
  project_id: number;
  milestone_id: number | null;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: Priority;
  due_date: string | null;
  estimate_hours: number | null;
  sort_order: number;
  done_at: string | null;
}

export interface DevLog {
  id: number;
  project_id: number;
  log_date: string;
  content: string;
  blockers: string | null;
  hours_spent: number | null;
}

export interface Project {
  id: number;
  name: string;
  summary: string | null;
  description: string | null;
  tech_stack: string | null;
  repo_url: string | null;
  demo_url: string | null;
  status: ProjectStatus;
  started_at: string | null;
  target_at: string | null;
  created_at: string;
  updated_at: string;
  progress: number;
  task_total: number;
  task_done: number;
  milestone_total: number;
  milestone_done: number;
  log_count: number;
  total_hours: number;
  last_log_date: string | null;
}

export interface ProjectDetail extends Project {
  milestones: Milestone[];
  tasks: Task[];
  logs: DevLog[];
}

export interface FunnelStage {
  stage: string;
  label: string;
  count: number;
  rate: number;
}

export interface NamedCount {
  key: string;
  count: number;
}

export interface WeeklyPoint {
  week: string;
  count: number;
}

export interface ChannelStat {
  channel: string;
  total: number;
  reached_interview: number;
  offers: number;
  conversion: number;
}

export interface ProjectProgress {
  id: number;
  name: string;
  progress: number;
  status: string;
  task_done: number;
  task_total: number;
}

export interface DashboardStats {
  total_applications: number;
  active_applications: number;
  offer_count: number;
  rejected_count: number;
  interview_count: number;
  avg_days_to_first_response: number | null;
  funnel: FunnelStage[];
  status_counts: NamedCount[];
  weekly_applications: WeeklyPoint[];
  channel_stats: ChannelStat[];
  total_questions: number;
  need_review_count: number;
  question_types: NamedCount[];
  mastery_distribution: NamedCount[];
  top_tags: NamedCount[];
  project_progress: ProjectProgress[];
  logged_hours_this_week: number;
}
