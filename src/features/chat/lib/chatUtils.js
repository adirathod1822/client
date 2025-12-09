export const INACTIVITY_LIMIT = 10 * 60 * 1000; // 10 minutes

export const getChatId = (a, b) => [a, b].sort().join("_");

export const getDateGroup = (timestamp) => {
  const date = typeof timestamp === "object" && timestamp?.seconds ? new Date(timestamp.seconds * 1000) : new Date(timestamp);

  if (isNaN(date.getTime())) return "Invalid Date";

  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  if (date.toDateString() === today.toDateString()) return "Today";
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday";

  return date.toLocaleDateString();
};
