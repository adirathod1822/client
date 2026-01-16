export function MessageList({
  groupedMessages,
  currentUserEmail,
  typingUsers,
  selectedUser,
  chatContainerRef,
  chatEndRef,
  showScrollToBottom,
  scrollToBottom,
}) {
  const getTimeString = (timestamp) => {
    if (!timestamp) return "";

    // Firestore Timestamp
    if (timestamp?.toDate) {
      return timestamp.toDate().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    }

    // Number or string fallback
    return new Date(timestamp).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div
      ref={chatContainerRef}
      className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-300 dark:bg-[#121212]"
    >
      {!selectedUser && (
        <div className="flex flex-col items-center justify-center h-full text-center dark:text-white/70 text-black px-4 animate-fade-in">
          <h1 className="text-2xl font-semibold mb-2">No chat selected</h1>
          <p className="text-sm max-w-sm">
            Select a contact from the sidebar to begin a conversation.
          </p>
        </div>
      )}


      {Object.entries(groupedMessages).map(([dateLabel, msgs]) => (
        <div key={dateLabel}>
          <div className="text-center text-xs font-semibold text-gray-500 my-4">
            {dateLabel}
          </div>
          {msgs.map((msg) => {
            const isMe = msg.from === currentUserEmail;

            const bubbleBase =
              "flex flex-col px-4 py-2 text-sm max-w-[80%] " +
              (isMe
                ? "ml-auto bg-blue-500 text-white items-end rounded-[1.1rem] rounded-br-none"
                : "mr-auto bg-gray-200 text-black dark:bg-gray-700 dark:text-white rounded-[1.1rem] rounded-bl-none");

            const timeStamp = (
              <div
                className={`text-[10px] dark:text-gray-300 ${isMe ? "text-white" : "text-black"
                  }`}
              >
                {getTimeString(msg.timestamp)}

                {isMe && (
                  <span className="ml-2">{msg.read ? "✓✓" : "✓"}</span>
                )}
              </div>
            );

            if (msg.type === "image") {
              return (
                <div
                  key={msg.id || msg.timestamp.toMillis()}
                  className={`flex flex-col m-1 max-w-[80%] ${isMe ? "ml-auto items-end" : "mr-auto items-start"
                    }`}
                >
                  <img
                    src={msg.image}
                    alt="shared"
                    className="max-w-xs rounded-lg border mt-1"
                  />
                  {timeStamp}
                </div>
              );
            }

            if (msg.type === "code") {
              return (
                <div
                  key={msg.id || msg.timestamp.toMillis()}
                  className={`flex flex-col m-1 max-w-[80%] ${isMe ? "ml-auto items-end" : "mr-auto items-start"
                    }`}
                >
                  <pre
                    className={bubbleBase}
                    style={{
                      wordBreak: "break-word",
                      overflowWrap: "break-word",
                    }}
                  >
                    <button
                      onClick={() => navigator.clipboard.writeText(msg.text)}
                      className={`italic dark:text-white ${isMe ? "text-white" : "text-black"
                        } mt-1 ml-3 block`}
                    >
                      <code
                        style={{
                          whiteSpace: "pre-wrap",
                          wordBreak: "break-word",
                          overflowWrap: "break-word",
                        }}
                      >
                        {msg.text}
                      </code>
                    </button>
                    {timeStamp}
                  </pre>
                </div>
              );
            }

            // normal text
            return (
              <div
                key={msg.id || msg.timestamp.toMillis()}
                className={`flex flex-col m-1 max-w-[80%] ${isMe ? "ml-auto items-end" : "mr-auto items-start"
                  }`}
              >
                <div
                  className={bubbleBase}
                  style={{
                    wordBreak: "break-word",
                    overflowWrap: "break-word",
                    whiteSpace: "pre-wrap",
                  }}
                >
                  <div>{msg.text}</div>
                  {timeStamp}
                </div>
              </div>
            );
          })}

          {selectedUser && typingUsers[selectedUser] && (
            <div className="flex mb-4 mt-2 items-center ml-2 space-x-2">
              <span className="text-sm text-gray-500 dark:text-blue-400">
                typing
              </span>
              <div className="flex space-x-1">
                <span className="w-1.5 h-1.5 bg-gray-500 dark:bg-gray-300 rounded-full opacity-50 animate-bounce delay-75" />
                <span className="w-1.5 h-1.5 bg-gray-500 dark:bg-gray-300 rounded-full opacity-50 animate-bounce delay-150" />
                <span className="w-1.5 h-1.5 bg-gray-500 dark:bg-gray-300 rounded-full opacity-50 animate-bounce delay-300" />
              </div>
            </div>
          )}
        </div>
      ))}

      <div ref={chatEndRef} />

      {showScrollToBottom && (
        <button
          onClick={scrollToBottom}
          className="fixed bottom-24 right-4 z-50 bg-white text-gray-800 dark:bg-[#222] dark:text-white border border-gray-300 dark:border-gray-600 hover:bg-blue-500 hover:text-white transition-all duration-300 w-10 h-10 rounded-full flex items-center justify-center"
          title="Scroll to bottom"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      )}
    </div>
  );
}
