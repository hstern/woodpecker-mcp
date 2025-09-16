// Streamlined type definitions for Woodpecker CI debugging - focused on essential pipeline debugging info

export type StatusValue =
  | "skipped"
  | "pending"
  | "running"
  | "success"
  | "failure"
  | "killed"
  | "error"
  | "blocked"
  | "declined"
  | "created";

export type WebhookEvent =
  | "push"
  | "pull_request"
  | "pull_request_closed"
  | "tag"
  | "release"
  | "deployment"
  | "cron"
  | "manual";

export type StepType = "clone" | "service" | "plugin" | "commands" | "cache";

export type LogEntryType = 0 | 1 | 2 | 3 | 4; // stdout, stderr, exit_code, metadata, progress

export type PipelineErrorType =
  | "linter"
  | "deprecation"
  | "compiler"
  | "generic"
  | "bad_habit";

export type PipelineError = {
  type: PipelineErrorType;
  message: string;
  is_warning: boolean;
  data?: unknown;
};

export type Step = {
  id: number;
  name: string;
  uuid: string;
  type: StepType;
  state: StatusValue;
  error?: string;
  exit_code?: number;
  start_time?: number;
  end_time?: number;
  pipeline_id: number;
};

export type Workflow = {
  id: number;
  name: string;
  state: StatusValue;
  error?: string;
  start_time?: number;
  end_time?: number;
  pipeline_id: number;
  children: Step[];
};

export type Pipeline = {
  id: number;
  number: number;
  parent?: number;
  event: WebhookEvent;
  status: StatusValue;
  errors?: PipelineError[];
  created_at: number;
  updated_at: number;
  started_at?: number;
  finished_at?: number;
  commit: string;
  branch: string;
  ref: string;
  title?: string;
  message?: string;
  author?: string;
  author_email?: string;
  workflows?: Workflow[];
};

export type LogEntry = {
  id: number;
  step_id: number;
  time: number;
  line: number;
  data: string | null;
  type: LogEntryType;
};

export type Repo = {
  id: number;
  forge_remote_id: string;
  name: string;
  owner: string;
  full_name: string;
  default_branch?: string;
  private: boolean;
  trusted: boolean;
  active: boolean;
  config_file?: string;
  timeout?: number;
  forge_id: number;
};

export type Config = {
  name: string;
  data: string;
  hash: string;
};

// Custom error types for better error handling
export type WoodpeckerError =
  | { type: "api_error"; status: number; message: string }
  | { type: "network_error"; message: string }
  | { type: "validation_error"; message: string }
  | { type: "not_found"; resource: string; id: string | number }
  | { type: "authorization_error"; message: string };

// Utility types for debugging
export type PipelineDebugInfo = {
  pipeline: Pipeline;
  failedSteps: Step[];
  errorLogs: LogEntry[];
  config?: Config[];
};

export type RepositoryContext = {
  repo: Repo;
  currentBranch?: string;
  currentCommit?: string;
  recentPipelines: Pipeline[];
};
