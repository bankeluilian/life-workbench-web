import type { AppState } from "./types";

export const DAILY_QUOTES = [
  "你未来的样子，藏在你现在的选择里。",
  "把今天走稳，明天自然会向你靠近。",
  "微小但持续的行动，会把愿望变成生活。",
  "不必一次抵达，先认真完成眼前的一小步。",
  "真正的成长，是每天都比昨天多一点清醒。",
  "专注当下能做的事，答案会在行动里出现。",
  "慢一点没关系，只要没有离开自己的方向。",
  "今天积累的一页，会成为未来笃定的底气。",
  "允许自己循序渐进，也相信时间会给出回响。",
  "把复杂的目标，拆成一个现在就能开始的动作。",
  "稳定不是停滞，而是持续向前的另一种力量。",
  "每一次认真完成，都是在为理想生活投票。",
  "你不需要时刻完美，只需要继续真实地前进。",
  "休息不是偏离目标，而是为了走得更长久。",
  "先照顾好能量，再把注意力交给最重要的事。",
  "当你愿意开始，普通的一天也会产生新的可能。",
  "把注意力放回自己，成长就会重新变得清晰。",
  "完成胜过完美，今天先让一件重要的事发生。",
  "耐心对待过程，结果会在重复中慢慢显现。",
  "你认真生活的痕迹，终会连成属于自己的答案。",
  "把节奏握在自己手里，远方就不再只是想象。",
  "每个被珍惜的今天，都在悄悄改变未来。",
  "目标负责指引方向，习惯负责带你抵达。",
  "向前走一点，也值得为自己认真庆祝。",
];

export function getDailyQuote(dateKey: string) {
  const [year, month, day] = dateKey.split("-").map(Number);
  const dayNumber = Number.isFinite(year) && Number.isFinite(month) && Number.isFinite(day)
    ? Math.floor(Date.UTC(year, month - 1, day) / 86_400_000)
    : Math.floor(Date.now() / 86_400_000);
  return DAILY_QUOTES[Math.abs(dayNumber) % DAILY_QUOTES.length];
}

export function getAiLearningAdvice(pathname: string, state: AppState) {
  const todayTasks = state.tasks.filter((task) => task.scheduledAt.slice(0, 10) === state.selectedDate);
  const completed = todayTasks.filter((task) => task.status === "done").length;
  const pending = todayTasks.filter((task) => task.status !== "done");
  const next = pending[0];

  if (pathname === "/learning" || pathname.startsWith("/learning/")) {
    return next
      ? `先用 20 分钟推进「${next.title}」，结束后立刻做 3 分钟回忆复述，记忆会更牢。`
      : "今天的学习任务已完成，建议用 10 分钟整理错题与关键词，让成果真正沉淀下来。";
  }
  if (pathname.startsWith("/projects/")) {
    return next
      ? `项目推进时只保留一个焦点：先完成「${next.title}」，再决定下一步，避免频繁切换。`
      : "项目当前没有待办，建议补充一个可在 30 分钟内完成的具体下一步。";
  }
  if (pathname === "/branches" || pathname.startsWith("/branches/")) {
    return "本周只选择一条重点支线加速推进，其他支线维持最低节奏，更容易看到真实进展。";
  }
  if (pathname === "/insights" || pathname.startsWith("/reviews/")) {
    const sleep = state.sleepRecords.at(-1)?.durationMinutes ?? 0;
    return sleep >= 420
      ? "最近睡眠能支撑深度学习，建议把最难的任务安排在精神最清醒的 60 分钟里。"
      : "近期睡眠记录偏少，今天优先完成短时复习，并把高强度学习放到休息充分后。";
  }
  if (pathname === "/profile" || pathname.startsWith("/settings") || pathname === "/customize" || pathname === "/layout-editor") {
    return "建议保留一个固定学习入口和一个固定复盘时间，让工作台越简单，行动阻力越小。";
  }
  return next
    ? `今天已完成 ${completed}/${todayTasks.length} 项。下一步先专注「${next.title}」20 分钟，完成后再查看其他任务。`
    : "今天的计划已经清空，花 5 分钟复盘有效方法，并为明天写下一个最重要的学习动作。";
}
