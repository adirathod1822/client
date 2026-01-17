import UserCard from "./UserCard";

export function ChatHeader({
  selectedUserDetails,
  selectedUser,
  getDisplayName,
  // isDarkMode,
  // onToggleTheme,
  onLogout
}) {
  const name = getDisplayName(selectedUser ?? "")
  const lastSeenDate = selectedUserDetails?.last_changed?.toDate().toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  })
  return (
    <div className="p-1 border-b border-gray-200 dark:border-gray-700 bg-gray-200 dark:bg-[#1e1e1e] flex justify-between items-center">

      <UserCard
        email={selectedUser}
        name={name}
        isOnline={selectedUserDetails?.online || false}
        lastSeen={!selectedUserDetails?.online ? lastSeenDate : null}
        isSelected={false}
        onSelect={{}}
        showStatus={false}
      />

      <button
        onClick={onLogout}
        className="flex items-center gap-1 mr-2 px-3 py-2 rounded-full bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all duration-200"
        title="Logout"
      >
        <span className="hidden sm:inline text-sm font-medium">➜]</span>
      </button>
    </div>
  );

}
