import { useRef } from "react";

export function MessageInput({
  input,
  onInputChange,
  onSend,
  onPasteClipboard,
  isCodeMode,
  toggleCodeMode,
  onImageUpload,
}) {
  const fileInputRef = useRef(null);

  return (
    <div className="fixed bottom-0 left-0 right-0 border-t border-gray-200 dark:border-gray-700 p-3 bg-gray-200 dark:bg-[#1e1e1e] z-10 md:static">
      <div className="flex items-center gap-2 w-full overflow-hidden">
        <input
          value={input}
          onChange={onInputChange}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              onSend();
            }
          }}
          onPaste={onPasteClipboard}
          className="flex-1 min-w-0 px-4 py-2 rounded bg-gray-100 dark:bg-[#2b2b2b] dark:text-white focus:outline-none"
          placeholder="Type your message..."
        />

        <button
          onClick={toggleCodeMode}
          className="p-2 rounded-full bg-gray-300 text-gray-800 hover:bg-blue-500 hover:text-white dark:bg-gray-700 dark:text-white dark:hover:bg-blue-500 transition-colors"
        >
          {isCodeMode ? "<>" : "💬"}
        </button>

        <input
          type="file"
          accept="image/*"
          onChange={onImageUpload}
          className="hidden"
          ref={fileInputRef}
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          className="p-2 rounded-full bg-gray-300 text-gray-800 hover:bg-blue-500 hover:text-white dark:bg-gray-700 dark:text-white dark:hover:bg-blue-500 transition-colors"
        >
          ➕
        </button>

        <button
          onClick={onSend}
          className="flex-shrink-0 bg-blue-500 text-white px-5 py-2 rounded hover:bg-blue-600"
        >
          Send
        </button>
      </div>
    </div>
  );
}
