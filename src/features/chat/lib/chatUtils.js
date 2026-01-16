export const INACTIVITY_LIMIT = 10 * 60 * 1000; // 10 minutes

export const getChatId = (a, b) => [a, b].sort().join("_");

export const getDateGroup = (timestamp) => {
  if (!timestamp) return "Unknown";

  let date;

  // Firestore Timestamp
  if (timestamp?.seconds) {
    date = new Date(timestamp.seconds * 1000);
  }
  // JS Date
  else if (timestamp instanceof Date) {
    date = timestamp;
  }
  // number (ms)
  else {
    date = new Date(timestamp);
  }

  if (isNaN(date.getTime())) return "Invalid Date";

  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  if (date.toDateString() === today.toDateString()) return "Today";
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday";

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

