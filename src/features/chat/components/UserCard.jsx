const avatarColors = [
  "bg-blue-500",
  "bg-green-500",
  "bg-purple-500",
  "bg-pink-500",
  "bg-yellow-500",
  "bg-indigo-500",
];

const getAvatarColor = (name) =>
  avatarColors[name?.charCodeAt(0) % avatarColors.length];

const UserCard = ({
  email,
  name,
  isOnline,
  lastSeen,
  isSelected,
  onSelect,
  showStatus
}) => {
  const isClickable = typeof onSelect === "function";

  return (
    <div
      onClick={isClickable ? () => onSelect(email) : undefined}
      className={`flex items-center gap-3 p-2 rounded-lg transition
        ${isClickable ? "cursor-pointer" : "cursor-default"}
        ${
          isClickable
            ? isSelected
              ? "bg-blue-600 text-white"
              : "hover:bg-gray-200 dark:hover:bg-gray-700"
            : ""
        }`}
    >
      <Avatar
        name={name}
        isOnline={isOnline}
        isSelected={isSelected}
        showStatus={showStatus}
      />

      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">{name}</p>
        <p className={`${isOnline ?  'text-sm text-green-400 truncate': 'text-sm text-gray-400 truncate'}`}>
          {isOnline ? "Online" : lastSeen}
        </p>
      </div>
    </div>
  );
};


const Avatar = ({
  name,
  isOnline = false,
  isSelected = false,
  size = 45, // px
  showStatus = true,
}) => {
  const initial = name?.split(" ").map(nm=> nm.charAt(0)?.toUpperCase()).splice(0,2) || "?";
  const avatarColor = getAvatarColor(name);

  return (
    <div className="relative inline-flex">
      <div
        style={{ width: size, height: size }}
        className={`flex items-center justify-center rounded-full font-semibold
          ${isSelected ? "bg-white text-blue-600" : `${avatarColor} text-white`}`}
      >
        <span style={{ fontSize: size * 0.45 }}>{initial}</span>
      </div>

      {showStatus && (
        <span
          className={`absolute bottom-0 right-0 rounded-full border-2
            ${isOnline ? "bg-green-500" : "bg-gray-400"}`}
          style={{
            width: size * 0.28,
            height: size * 0.28,
            borderColor: "#111827",
          }}
        />
      )}
    </div>
  );
};


export default UserCard
export {Avatar}