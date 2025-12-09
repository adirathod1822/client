export function ChatHeader({ selectedUser, getDisplayName, isDarkMode, onToggleTheme }) {
  return (
    <div className="p-3 border-b border-gray-200 dark:border-gray-700 bg-gray-200 dark:bg-[#1e1e1e] flex justify-between items-center">
      <h2 className="text-md font-bold">
        Chat with {selectedUser ? getDisplayName(selectedUser) : "—"}
      </h2>
      <button
        onClick={onToggleTheme}
        className="w-9 h-9 flex items-center justify-center bg-gray-200 dark:bg-gray-800 text-lg rounded-full hover:scale-105 transition-transform"
        title="Toggle Dark Mode"
      >
        {isDarkMode ? "☀️" : "🌙"}
      </button>
    </div>
  );
}
