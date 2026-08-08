export type Tone = "coral" | "orange" | "green" | "purple" | "pink";
export type BranchStatus = "priority" | "maintaining" | "slowed" | "archived";
export type TaskBucket = "today" | "week" | "later";
export type TaskStatus = "todo" | "done";
export type RecordKind = "exercise" | "sleep" | "finance" | "idea";

export interface User {
  id: string;
  name: string;
  avatar: string;
  level: number;
  currentStage: string;
}

export interface Branch {
  id: string;
  name: string;
  description: string;
  status: BranchStatus;
  tone: Tone;
  icon: string;
  weeklyFrequency: number;
}

export interface Project {
  id: string;
  branchId: string;
  title: string;
  description: string;
  stage: string;
  deadline: string;
  status: "active" | "paused" | "archived";
}

export interface Task {
  id: string;
  projectId?: string;
  branchId: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: 1 | 2 | 3;
  bucket: TaskBucket;
  estimatedMinutes: number;
  actualMinutes: number;
  scheduledAt: string;
  completedAt?: string;
}

export interface StudyRecord {
  id: string;
  category: "english" | "reading" | "major";
  title: string;
  durationMinutes: number;
  completed: boolean;
  mastery: number;
  recordedAt: string;
}

export interface StudyNote {
  id: string;
  title: string;
  content: string;
  tags: string[];
  updatedAt: string;
}

export interface SleepRecord {
  id: string;
  sleepAt: string;
  wakeAt: string;
  durationMinutes: number;
  quality: number;
  status: "fast" | "normal" | "light";
  note: string;
  recordedAt: string;
}

export interface ExerciseRecord {
  id: string;
  type: string;
  durationMinutes: number;
  intensity: "low" | "medium" | "high";
  feeling: string;
  calories?: number;
  note: string;
  recordedAt: string;
}

export interface FinanceRecord {
  id: string;
  type: "income" | "expense";
  amount: number;
  category: string;
  paymentMethod: string;
  note: string;
  recordedAt: string;
}

export interface IdeaRecord {
  id: string;
  title: string;
  content: string;
  tags: string[];
  pinned: boolean;
  recordedAt: string;
}

export interface FocusSession {
  id: string;
  taskId?: string;
  startedAt: string;
  endedAt?: string;
  durationSeconds: number;
  status: "completed" | "ended";
}

export interface ActiveFocus {
  taskId?: string;
  totalSeconds: number;
  remainingSeconds: number;
  status: "idle" | "running" | "paused";
  startedAt?: string;
  lastTickAt?: string;
}

export interface Review {
  id: string;
  kind: "daily" | "weekly";
  date: string;
  good: string;
  problem: string;
  next: string;
  updatedAt: string;
}

export interface AppSettings {
  reminderEnabled: boolean;
  reminderTime: string;
  reminderLevel: "gentle" | "normal" | "strong";
  privacy: {
    finance: boolean;
    sleep: boolean;
    study: boolean;
  };
  reducedMotion: boolean;
  weekStartsMonday: boolean;
}

export interface DashboardLayout {
  order: string[];
  hidden: string[];
  pinned: string[];
  quickRecords: RecordKind[];
}

export interface ThemeSettings {
  theme: "warm" | "lavender" | "mint";
  intensity: number;
  stickers: boolean;
  texture: boolean;
  character: "rabbit" | "cat" | "bear" | "frog";
  characterVisible: boolean;
  characterFrequency: "low" | "normal" | "high";
}

export interface AppState {
  version: 3;
  user: User;
  branches: Branch[];
  projects: Project[];
  tasks: Task[];
  studyRecords: StudyRecord[];
  notes: StudyNote[];
  sleepRecords: SleepRecord[];
  exerciseRecords: ExerciseRecord[];
  financeRecords: FinanceRecord[];
  ideaRecords: IdeaRecord[];
  focusSessions: FocusSession[];
  activeFocus: ActiveFocus;
  reviews: Review[];
  settings: AppSettings;
  dashboard: DashboardLayout;
  theme: ThemeSettings;
  selectedDate: string;
  nextPriorities: string[];
}

