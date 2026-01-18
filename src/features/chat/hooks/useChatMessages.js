import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { db } from "../../../firebase";
import { limit, limitToLast, serverTimestamp, where } from "firebase/firestore";

import {
  addDoc,
  collection,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
} from "firebase/firestore";
import { toast } from "react-toastify";
import { socket } from "../lib/socket";
import { notificationSound } from "../lib/notification";
import { getChatId, getDateGroup } from "../lib/chatUtils";

export function useChatMessages({ currentUserEmail, getDisplayName, isDarkMode }) {
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [typingUsers, setTypingUsers] = useState({});
  const [input, setInput] = useState("");
  const [isCodeMode, setIsCodeMode] = useState(false);
  const [unsubChat, setUnsubChat] = useState(null);

  const chatContainerRef = useRef(null);
  const chatEndRef = useRef(null);
  const typingTimeout = useRef(null);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);

  // Scroll handler
  useEffect(() => {
    const handleScroll = () => {
      const el = chatContainerRef.current;
      if (!el) return;
      const isAtBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 50;
      setShowScrollToBottom(!isAtBottom);
    };

    const el = chatContainerRef.current;
    if (!el) return;
    el.addEventListener("scroll", handleScroll);
    return () => el.removeEventListener("scroll", handleScroll);
  }, []);

  // Socket listeners
  useEffect(() => {
    if (!currentUserEmail) return;

    const handleReceiveMessage = (msg) => {
      let timestamp = msg.timestamp;
      if (!timestamp || isNaN(new Date(timestamp).getTime())) {
        timestamp = serverTimestamp();
      }
      msg.timestamp = timestamp;

      const isRelevant =
        (msg.from === selectedUser && msg.to === currentUserEmail) ||
        (msg.from === currentUserEmail && msg.to === selectedUser);

      if (isRelevant) {
        setMessages((prev) => {
          const alreadyExists = prev.some(
            (m) =>
              m.timestamp === msg.timestamp &&
              m.from === msg.from &&
              m.to === msg.to &&
              m.text === msg.text
          );
          if (!alreadyExists) notificationSound.play();
          return alreadyExists ? prev : [...prev, msg];
        });
      } else if (msg.to === currentUserEmail) {
        toast.info(
          `A msg from ${getDisplayName(msg.from) || msg.from.split("@")[0]}`,
          {
            position: "top-right",
            autoClose: 3000,
            theme: isDarkMode ? "dark" : "light",
          }
        );
        notificationSound.play();
      }
    };

    const handleTyping = ({ from, to }) => {
      if (to === currentUserEmail) {
        setTypingUsers((prev) => ({ ...prev, [from]: true }));
      }
    };

    const handleStopTyping = ({ from, to }) => {
      if (to === currentUserEmail) {
        setTypingUsers((prev) => {
          const updated = { ...prev };
          delete updated[from];
          return updated;
        });
      }
    };

    socket.on("receive_private_message", handleReceiveMessage);
    socket.on("typing", handleTyping);
    socket.on("stop_typing", handleStopTyping);

    return () => {
      socket.off("receive_private_message", handleReceiveMessage);
      socket.off("typing", handleTyping);
      socket.off("stop_typing", handleStopTyping);
    };
  }, [currentUserEmail, selectedUser, getDisplayName, isDarkMode]);

  const handleSelectUser = useCallback(
    (email) => {
      setSelectedUser(email);
      if (unsubChat) unsubChat();

      const chatId = getChatId(currentUserEmail, email);
      const q = query(
        collection(db, "messages", chatId, "chats"),
        where("timestamp", "!=", null),
        orderBy("timestamp", "desc"),
        limit(50)
      );

      const unsubscribe = onSnapshot(q, async (snap) => {
        const data = snap.docs.map((d) => ({ id: d.id, ...d.data() })).reverse();
        setMessages(data);

        for (const docSnap of snap.docs) {
          const msg = docSnap.data();
          if (msg.to === currentUserEmail && !msg.read) {
            await updateDoc(docSnap.ref, { read: true });
          }
        }
      });

      setUnsubChat(() => unsubscribe);
    },
    [currentUserEmail, unsubChat]
  );

  const sendMessage = useCallback(async () => {
    if (!input.trim() || !selectedUser) return;

    // chatEndRef.current?.scrollIntoView({ behavior: "smooth" });

    const msg = {
      from: currentUserEmail,
      to: selectedUser,
      text: input.trim(),
      timestamp: serverTimestamp(),
      read: false,
      type: isCodeMode ? "code" : "text",
    };


    const chatId = getChatId(currentUserEmail, selectedUser);
    await addDoc(collection(db, "messages", chatId, "chats"), msg);
    scrollToBottom()
    socket.emit("send_private_message", msg);
    socket.emit("stop_typing", { from: currentUserEmail, to: selectedUser });
    setInput("");
  }, [currentUserEmail, input, isCodeMode, selectedUser]);

  const handleInputChange = (e) => {
    setInput(e.target.value);

    if (selectedUser) {
      socket.emit("typing", { from: currentUserEmail, to: selectedUser });
      clearTimeout(typingTimeout.current);
      typingTimeout.current = setTimeout(() => {
        socket.emit("stop_typing", { from: currentUserEmail, to: selectedUser });
      }, 1000);
    }
  };

  const handleClipboardUpload = async (e) => {
    const clipboard = e.clipboardData;
    if (clipboard.types.includes("Files")) {
      const file = clipboard.files[0];
      const reader = new FileReader();

      reader.onloadend = async () => {
        const base64 = reader.result;
        const msg = {
          from: currentUserEmail,
          to: selectedUser,
          image: base64,
          timestamp: serverTimestamp(),
          read: false,
          type: "image",
        };

        socket.emit("send_private_message", msg);

        const chatId = getChatId(currentUserEmail, selectedUser);
        await addDoc(collection(db, "messages", chatId, "chats"), msg);
      };

      reader.readAsDataURL(file);
    } else {
      setInput(clipboard.getData("text"));
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !selectedUser) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = reader.result;
      const msg = {
        from: currentUserEmail,
        to: selectedUser,
        image: base64,
        timestamp: serverTimestamp(),
        read: false,
        type: "image",
      };

      socket.emit("send_private_message", msg);

      const chatId = getChatId(currentUserEmail, selectedUser);
      await addDoc(collection(db, "messages", chatId, "chats"), msg);
    };
    reader.readAsDataURL(file);
  };
  const groupedMessages = useMemo(() => {
    const getMillis = (t) => {
      if (!t) return 0;
      if (t?.seconds) return t.seconds * 1000; // Firestore Timestamp
      if (typeof t === "number") return t;     // serverTimestamp()
      if (typeof t === "string") return new Date(t).getTime(); // fallback
      return 0;
    };

    const sorted = [...messages].sort(
      (a, b) => getMillis(a.timestamp) - getMillis(b.timestamp)
    );

    return sorted.reduce((acc, msg) => {
      const dateKey = getDateGroup(msg.timestamp);
      if (!acc[dateKey]) acc[dateKey] = [];
      acc[dateKey].push(msg);
      return acc;
    }, {});
  }, [messages]);


  const toggleCodeMode = () => setIsCodeMode((prev) => !prev);

  const scrollToBottom = () =>
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });

  return {
    selectedUser,
    handleSelectUser,
    messages,
    groupedMessages,
    typingUsers,
    input,
    isCodeMode,
    toggleCodeMode,
    sendMessage,
    handleInputChange,
    handleClipboardUpload,
    handleImageUpload,
    chatContainerRef,
    chatEndRef,
    showScrollToBottom,
    scrollToBottom,
  };
}
