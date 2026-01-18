import { useState } from "react";
import UserCard, { Avatar } from "./UserCard";

// import dinoLogo from "../../../utils/blue_dino.png";

export function Sidebar({
  allUsers,
  onlineUsers,
  offlineUsers,
  selectedUser,
  onSelectUser,
  getDisplayName,
  currentUserName,
  onToggleTheme,
  isDarkMode,
  onLogout
}) {
  const [showCard, setShowCard] = useState(false);
  const [showLogo, setShowLogo] = useState(true);

  return (
    <>
      {/* Desktop sidebar */}
      <div className="hidden lg:block w-1/4 p-4 bg-gray-200 dark:bg-[#1e1e1e] border-r border-gray-300 dark:border-gray-700 overflow-y-auto">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 mb-4">
          <div className="flex flex-col items-start">
            <div className="flex items-center gap-2">
              {showLogo ?
                <img src="/OC_LOGO.png" alt="OnlyChat" className="w-8 h-8" />
                :
                <Avatar
                  name={getDisplayName(currentUserName).split(" ")[0]}
                  isOnline={false}
                  isSelected={false}
                  showStatus={false}
                />}
              <p className="font-bold text-lg">
                Hey, {getDisplayName(currentUserName).split(" ")[0]} !!
              </p>
            </div>
          </div>
          {/* 
          <button
            onClick={onLogout}
            className="bg-red-500 text-white px-3 py-1 rounded text-sm w-full sm:w-auto"
          >
            Logout
          </button> */}
          <button
            onClick={onToggleTheme}
            className="w-9 h-9 flex items-center justify-center bg-gray-200 dark:bg-gray-800 text-lg rounded-full hover:scale-105 transition-transform"
            title="Toggle Dark Mode"
          >
            {isDarkMode ? "☀️" : "🌙"}
          </button>



        </div>

        <hr className="border-t border-gray-300 dark:border-gray-700 -mx-4 mb-2" />

        <div className="pt-2 pb-2">
          <h3 className="text-sm font-semibold mb-2 text-green-600">
            Users ({allUsers.length})
          </h3>
          {allUsers.length > 0 ? (
            allUsers.map((u) => (

              <UserCard
                email={u.email}
                name={getDisplayName(u.email)}
                isOnline={u.online}
                lastSeen={u.lastSeen}
                isSelected={selectedUser === u.email}
                onSelect={onSelectUser}
              />


            ))
          ) : (
            <p className="text-xs text-gray-400 italic">No users online</p>
          )}

        </div>

      </div>

      {/* Mobile header + dropdown */}
      <div className="sm:hidden flex justify-between p-2 items-center border-b dark:border-gray-700 bg-gray-200 dark:bg-[#1e1e1e]">
        <div className="flex items-center gap-2">
          {/* <img src={dinoLogo} alt="Dino" className="h-8 w-8" /> */}
          <p className="font-bold">Hey, {currentUserName.split(" ")[0]}!</p>
        </div>
        <button
          onClick={() => setShowCard((prev) => !prev)}
          className="bg-blue-500 text-white px-3 py-1 rounded"
        >
          ☰
        </button>
      </div>

      {showCard && (
        <div className="md:hidden absolute z-50 w-full left-0 top-14 bg-gray-200 dark:bg-[#1e1e1e] border-t border-b dark:border-gray-700 p-4 shadow-lg">
          <button
            onClick={onLogout}
            className="bg-red-500 text-white px-4 py-1 rounded mb-4"
          >
            Logout
          </button>

          <h3 className="text-sm font-semibold mb-2 text-green-600">
            Online ({onlineUsers.length})
          </h3>
          {onlineUsers.map((u) => (
            <div
              key={u.email}
              onClick={() => {
                onSelectUser(u.email);
                setShowCard(false);
              }}
              className={`cursor-pointer p-2 rounded mb-1 ${selectedUser === u.email
                ? "bg-blue-500 text-white"
                : "hover:bg-gray-200 dark:hover:bg-gray-700"
                }`}
            >
              {getDisplayName(u.email)}
            </div>
          ))}

          <h3 className="text-sm font-semibold mt-4 mb-2 text-red-500">
            Offline ({offlineUsers.length})
          </h3>
          {offlineUsers.map((u) => (
            <div
              key={u.email}
              onClick={() => {
                onSelectUser(u.email);
                setShowCard(false);
              }}
              className={`cursor-pointer p-2 rounded mb-1 ${selectedUser === u.email
                ? "bg-blue-500 text-white"
                : "hover:bg-gray-200 dark:hover:bg-gray-700"
                }`}
            >
              {getDisplayName(u.email)}
            </div>
          ))}
        </div>
      )}
    </>
  );
}