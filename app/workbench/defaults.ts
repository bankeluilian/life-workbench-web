import type { AppState } from "./types";

export const toLocalDate = (date = new Date()) => {
  const shifted = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return shifted.toISOString().slice(0, 10);
};

const dateAfter = (days: number) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return toLocalDate(date);
};

export const createDefaultState = (): AppState => {
  const today = toLocalDate();
  return {
    version: 3,
    user: {
      id: "local-user",
      name: "小兔软糖",
      avatar: "/assets/clean/illustrations/03-rabbit-with-mug.png",
      level: 0,
      currentStage: "备考期",
    },
    branches: [
      { id: "learning", name: "学习成长", description: "英天进步一点点，未来更自由", status: "priority", tone: "purple", icon: "book", weeklyFrequency: 6 },
      { id: "health", name: "身体健康", description: "健康是所有热爱的底气", status: "priority", tone: "green", icon: "shoe", weeklyFrequency: 5 },
      { id: "career", name: "事业赚钱", description: "把热爱变现，创造更多可能", status: "priority", tone: "orange", icon: "wallet", weeklyFrequency: 3 },
      { id: "finance", name: "财务管理", description: "看见每一笔选择", status: "maintaining", tone: "orange", icon: "briefcase", weeklyFrequency: 2 },
      { id: "order", name: "生活秩序", description: "让日常更轻盈", status: "maintaining", tone: "green", icon: "clipboard", weeklyFrequency: 3 },
      { id: "inner", name: "内在成长", description: "留一点时间给自己", status: "maintaining", tone: "pink", icon: "plant", weeklyFrequency: 2 },
      { id: "reading", name: "阅读积累", description: "持续输入，拓宽视野", status: "maintaining", tone: "purple", icon: "book", weeklyFrequency: 4 },
      { id: "travel", name: "旅行体验", description: "等待合适的季节", status: "slowed", tone: "green", icon: "flag", weeklyFrequency: 1 },
      { id: "social", name: "社交拓展", description: "把精力留给重要关系", status: "slowed", tone: "coral", icon: "heart", weeklyFrequency: 1 },
    ],
    projects: [
      { id: "cet4", branchId: "learning", title: "英语四级备考", description: "每天进步一点点，四级一次过！", stage: "第 1 周 / 共 12 周", deadline: dateAfter(84), status: "active" },
    ],
    tasks: [
      { id: "vocab", projectId: "cet4", branchId: "learning", title: "词汇学习 80 个", description: "30 分钟", status: "todo", priority: 1, bucket: "today", estimatedMinutes: 30, actualMinutes: 0, scheduledAt: `${today}T09:00:00` },
      { id: "reading-task", projectId: "cet4", branchId: "learning", title: "长篇阅读 1 篇", description: "25 分钟", status: "todo", priority: 1, bucket: "today", estimatedMinutes: 25, actualMinutes: 0, scheduledAt: `${today}T19:30:00` },
      { id: "listening", projectId: "cet4", branchId: "learning", title: "听力真题 1 套", description: "20 分钟", status: "todo", priority: 1, bucket: "today", estimatedMinutes: 20, actualMinutes: 0, scheduledAt: `${today}T14:00:00` },
      { id: "writing", projectId: "cet4", branchId: "learning", title: "写作模板背诵", description: "2 篇", status: "todo", priority: 2, bucket: "week", estimatedMinutes: 30, actualMinutes: 0, scheduledAt: `${today}T20:00:00` },
      { id: "translation", projectId: "cet4", branchId: "learning", title: "翻译每日一句", description: "5 句", status: "todo", priority: 2, bucket: "week", estimatedMinutes: 15, actualMinutes: 0, scheduledAt: `${today}T20:30:00` },
      { id: "mock", projectId: "cet4", branchId: "learning", title: "模拟卷练习", description: "1 套", status: "todo", priority: 2, bucket: "week", estimatedMinutes: 90, actualMinutes: 0, scheduledAt: `${today}T10:00:00` },
      { id: "grammar", projectId: "cet4", branchId: "learning", title: "语法专项练习", description: "20 分钟", status: "todo", priority: 3, bucket: "later", estimatedMinutes: 20, actualMinutes: 0, scheduledAt: `${today}T18:30:00` },
      { id: "roots", projectId: "cet4", branchId: "learning", title: "词根词缀整理", description: "15 分钟", status: "todo", priority: 3, bucket: "later", estimatedMinutes: 15, actualMinutes: 0, scheduledAt: `${today}T18:50:00` },
      { id: "fitness", branchId: "health", title: "健身训练", description: "20 分钟力量训练", status: "todo", priority: 2, bucket: "today", estimatedMinutes: 20, actualMinutes: 0, scheduledAt: `${today}T18:00:00` },
      { id: "creator", branchId: "career", title: "自媒体更新", description: "发布笔记 / 视频", status: "todo", priority: 2, bucket: "week", estimatedMinutes: 40, actualMinutes: 0, scheduledAt: `${today}T21:00:00` },
    ],
    studyRecords: [],
    notes: [],
    sleepRecords: [],
    exerciseRecords: [],
    financeRecords: [],
    ideaRecords: [],
    focusSessions: [],
    activeFocus: { totalSeconds: 0, remainingSeconds: 0, status: "idle" },
    reviews: [],
    settings: {
      reminderEnabled: false,
      reminderTime: "21:00",
      reminderLevel: "gentle",
      privacy: { finance: true, sleep: true, study: true },
      reducedMotion: false,
      weekStartsMonday: true,
    },
    dashboard: {
      order: ["quote", "overview", "main-task", "support", "trend", "quick"],
      hidden: [],
      pinned: ["main-task"],
      quickRecords: ["exercise", "sleep", "finance", "idea"],
    },
    theme: {
      theme: "warm",
      intensity: 60,
      stickers: true,
      texture: true,
      character: "rabbit",
      characterVisible: true,
      characterFrequency: "normal",
    },
    selectedDate: today,
    nextPriorities: ["保持稳定睡眠", "每天完成一项学习任务", "安排两次运动"],
  };
};

