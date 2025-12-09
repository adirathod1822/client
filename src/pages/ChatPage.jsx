import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import { useTheme } from "../features/chat/hooks/useTheme";
import { useInactivityTimer } from "../features/chat/hooks/useInactivityTimer";
import { useAuthAndUsers } from "../features/chat/hooks/useAuthAndUsers";
import { useChatMessages } from "../features/chat/hooks/useChatMessages";

import { Sidebar } from "../features/chat/components/Sidebar";
import { ChatHeader } from "../features/chat/components/ChatHeader";
import { MessageList } from "../features/chat/components/MessageList";
import { MessageInput } from "../features/chat/components/MessageInput";

export default function ChatPage() {
  const { isDarkMode, toggleTheme } = useTheme();

  const {
    currentUserEmail,
    currentUserName,
    onlineUsers,
    offlineUsers,
    getDisplayName,
    handleLogout,
  } = useAuthAndUsers();

  useInactivityTimer(currentUserEmail);

  const chat = useChatMessages({
    currentUserEmail,
    getDisplayName,
    isDarkMode,
  });

  return (
    <div className="flex flex-col md:flex-row h-screen bg-gray-300 dark:bg-[#121212] text-black dark:text-white">
      <ToastContainer />

      <Sidebar
        onlineUsers={onlineUsers}
        offlineUsers={offlineUsers}
        selectedUser={chat.selectedUser}
        onSelectUser={chat.handleSelectUser}
        getDisplayName={getDisplayName}
        currentUserName={currentUserName}
        onLogout={handleLogout}
      />

      <div className="flex flex-col flex-1 h-full">
        <ChatHeader
          selectedUser={chat.selectedUser}
          getDisplayName={getDisplayName}
          isDarkMode={isDarkMode}
          onToggleTheme={toggleTheme}
        />

        <MessageList
          groupedMessages={chat.groupedMessages}
          currentUserEmail={currentUserEmail}
          typingUsers={chat.typingUsers}
          selectedUser={chat.selectedUser}
          chatContainerRef={chat.chatContainerRef}
          chatEndRef={chat.chatEndRef}
          showScrollToBottom={chat.showScrollToBottom}
          scrollToBottom={chat.scrollToBottom}
        />

        {chat.selectedUser && (
          <MessageInput
            input={chat.input}
            onInputChange={chat.handleInputChange}
            onSend={chat.sendMessage}
            onPasteClipboard={chat.handleClipboardUpload}
            isCodeMode={chat.isCodeMode}
            toggleCodeMode={chat.toggleCodeMode}
            onImageUpload={chat.handleImageUpload}
          />
        )}
      </div>
    </div>
  );
}
