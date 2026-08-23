const dashboardRepo = require('./repo');
const userRepo = require('../users/repo');

const HEATMAP_WEEKS = 14;
const HEATMAP_DAYS = HEATMAP_WEEKS * 7;
// Streak lookback needs to reach further back than the heatmap window so a
// longstanding streak isn't truncated to whatever the heatmap displays.
const STREAK_LOOKBACK_DAYS = 365;

function dayKey(date) {
  return date.toISOString().slice(0, 10);
}

function startOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

async function resolveUserId({ clerkId, userId }) {
  if (userId) return userId;
  if (!clerkId) {
    throw new Error('clerkId is required');
  }
  const user = await userRepo.findUserByClerkId(clerkId);
  if (!user) {
    throw new Error('User not found');
  }
  return user.id;
}

// Called after a document upload or a chat question — logs the activity that
// streak/heatmap are computed from. Failures here must never break the
// caller's primary flow, so callers should catch/log rather than propagate.
async function recordActivity({ clerkId, userId, workspaceId, type, metadata }) {
  const resolvedUserId = await resolveUserId({ clerkId, userId });
  return await dashboardRepo.recordActivity({
    userId: resolvedUserId,
    workspaceId,
    type,
    metadata,
  });
}

function buildActiveDaySet(activities) {
  const days = new Set();
  for (const activity of activities) {
    days.add(dayKey(activity.createdAt));
  }
  return days;
}

function computeStreaks(activeDays) {
  const today = startOfDay(new Date());

  // Current streak: count backward from today. If today has no activity yet,
  // start from yesterday instead so a streak isn't broken before the day ends.
  let currentStreak = 0;
  const cursor = new Date(today);
  if (!activeDays.has(dayKey(cursor))) {
    cursor.setDate(cursor.getDate() - 1);
  }
  while (activeDays.has(dayKey(cursor))) {
    currentStreak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  // Longest streak: scan all active days chronologically for the longest run
  // of consecutive calendar days.
  const sortedDays = [...activeDays].sort();
  let longestStreak = 0;
  let run = 0;
  let prevDate = null;
  for (const key of sortedDays) {
    const date = new Date(`${key}T00:00:00.000Z`);
    run = prevDate && Math.round((date - prevDate) / 86400000) === 1 ? run + 1 : 1;
    longestStreak = Math.max(longestStreak, run);
    prevDate = date;
  }

  return { currentStreak, longestStreak };
}

async function getStreakInsights({ clerkId, userId }) {
  const resolvedUserId = await resolveUserId({ clerkId, userId });

  const since = new Date();
  since.setDate(since.getDate() - STREAK_LOOKBACK_DAYS);

  const [activities, dueFlashcards] = await Promise.all([
    dashboardRepo.findStreakActivitiesSince(resolvedUserId, since),
    dashboardRepo.countDueFlashcards(resolvedUserId),
  ]);
  const activeDays = buildActiveDaySet(activities);

  return { ...computeStreaks(activeDays), dueFlashcards };
}

async function getHeatmap({ clerkId, userId }) {
  const resolvedUserId = await resolveUserId({ clerkId, userId });

  const since = startOfDay(new Date());
  since.setDate(since.getDate() - (HEATMAP_DAYS - 1));

  const activities = await dashboardRepo.findStreakActivitiesSince(resolvedUserId, since);

  const counts = new Map();
  for (const activity of activities) {
    const key = dayKey(activity.createdAt);
    counts.set(key, (counts.get(key) || 0) + 1);
  }

  return [...counts.entries()].map(([date, count]) => ({ date, count }));
}

module.exports = {
  recordActivity,
  getStreakInsights,
  getHeatmap,
};
