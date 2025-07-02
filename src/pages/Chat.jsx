import { useEffect, useState, useRef } from "react";
import { auth, db } from "../firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import dinoLogo from "../utils/blue_dino.png";
import notification from "../utils/noti.mp3";
import { collection, addDoc, query, orderBy, onSnapshot, updateDoc, doc, setDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import io from "socket.io-client";
import { ToastContainer, toast } from "react-toastify";
import { useCallback } from "react";

// const socket = io("https://onlychat-server-1.onrender.com");
const socket = io("http://localhost:5000");

const getChatId = (a, b) => [a, b].sort().join("_");
const notificationSound = new Audio(notification);
const INACTIVITY_LIMIT = 10 * 60 * 1000;

export default function Chat() {
    const [showCard, setShowCard] = useState(false);
    const cardRef = useRef(null);
    const [currentUserEmail, setCurrentUserEmail] = useState("");
    const [currentUserName, setCurrentUserName] = useState("");
    const [users, setUsers] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const [typingUsers, setTypingUsers] = useState({});
    const [unsubChat, setUnsubChat] = useState(null);
    const [isDarkMode, setIsDarkMode] = useState(() => {
        const savedTheme = localStorage.getItem("theme");
        return savedTheme ? savedTheme === "dark" : true;
    });

    const [isCodeMode, setIsCodeMode] = useState(false);
    const typingTimeout = useRef(null);
    const fileInputRef = useRef(null);
    const navigate = useNavigate();
    const [showScrollToBottom, setShowScrollToBottom] = useState(false);
    const chatContainerRef = useRef(null);
    const chatEndRef = useRef(null);
    const timeoutRef = useRef(null);

    const resetTimer = () => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }

        timeoutRef.current = setTimeout(async () => {
            console.log("User inactive for 10 minutes");

            try {
                await updateDoc(doc(db, "users", currentUserEmail), {
                    online: false,
                    inactiveSince: new Date(),
                });
            } catch (err) {
                console.error("Error updating offline status:", err);
            }
        }, INACTIVITY_LIMIT);
    };
    useEffect(() => {
        if (!currentUserEmail) return;

        const activityEvents = ["mousemove", "keydown", "touchstart", "scroll"];

        activityEvents.forEach((event) =>
            window.addEventListener(event, resetTimer)
        );

        // resetTimer();

        return () => {
            activityEvents.forEach((event) =>
                window.removeEventListener(event, resetTimer)
            );
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    });

    useEffect(() => {
        const handleScroll = () => {
            const el = chatContainerRef.current;
            if (!el) return;

            const isAtBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 50;
            setShowScrollToBottom(!isAtBottom);
        };

        const chatEl = chatContainerRef.current;
        chatEl?.addEventListener("scroll", handleScroll);

        return () => chatEl?.removeEventListener("scroll", handleScroll);
    }, []);


    useEffect(() => {
        const html = document.documentElement;
        html.classList.toggle("dark", isDarkMode);
        localStorage.setItem("theme", isDarkMode ? "dark" : "light");
    }, [isDarkMode]);

    const getDisplayName = useCallback((email) => {
        const user = users.find((u) => u.email === email);
        return user?.displayName || email.split("@")[0];
    }, [users]);

    useEffect(() => {
        const unsubAuth = onAuthStateChanged(auth, async (user) => {
            if (user) {
                setCurrentUserEmail(user.email);
                setCurrentUserName(user.displayName || user.email.split("@")[0]);

                    await setDoc(doc(db, "users", user.email), {
                        email: user.email,
                        displayName: user.displayName || user.email.split("@")[0],
                        online: true,
                }, { merge: true });

                socket.emit("register_user", user.email);

                const unsubscribeUsers = onSnapshot(collection(db, "users"), (snapshot) => {
                        const userList = snapshot.docs.map((doc) => doc.data()).filter((u) => u.email !== user.email);
                        setUsers(userList);
                });

                return () => unsubscribeUsers();
            } else {
                navigate("/login");
            }
        });

        socket.on("receive_private_message", (msg) => {
            let timestamp = msg.timestamp;

            if (!timestamp || isNaN(new Date(timestamp).getTime())) {
                timestamp = Date.now();
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
                toast.info(`A msg from ${getDisplayName(msg.from) || msg.from.split("@")[0]}`, {
                    position: "top-right",
                    autoClose: 3000,
                    theme: isDarkMode ? "dark" : "light",
                });
                notificationSound.play();
            }
        });

        socket.on("typing", ({ from, to }) => {
            if (to === currentUserEmail) {
                setTypingUsers((prev) => ({ ...prev, [from]: true }));
            }
        });

        socket.on("stop_typing", ({ from, to }) => {
            if (to === currentUserEmail) {
                setTypingUsers((prev) => {
                    const updated = { ...prev };
                    delete updated[from];
                    return updated;
                });
            }
        });

        return () => {
            unsubAuth();
            if (unsubChat) unsubChat();
            socket.off("receive_private_message");
            socket.off("typing");
            socket.off("stop_typing");
        };
    }, [currentUserEmail, selectedUser, navigate, unsubChat, isDarkMode, getDisplayName]);

    const handleSelectUser = (email) => {
        setSelectedUser(email);
        if (unsubChat) unsubChat();

        const chatId = getChatId(currentUserEmail, email);
        const q = query(collection(db, "messages", chatId, "chats"), orderBy("timestamp"));

        const unsubscribe = onSnapshot(q, async (snap) => {
            const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
            setMessages(data);

            for (const docSnap of snap.docs) {
                const msg = docSnap.data();
                if (msg.to === currentUserEmail && !msg.read) {
                    await updateDoc(docSnap.ref, { read: true });
                }
            }
        });

        setUnsubChat(() => unsubscribe);
    };


    const getDateGroup = (timestamp) => {
        const date = typeof timestamp === "object" && timestamp.seconds
            ? new Date(timestamp.seconds * 1000)
            : new Date(timestamp);

        if (isNaN(date.getTime())) return "Invalid Date";

        const today = new Date();
        const yesterday = new Date();
        yesterday.setDate(today.getDate() - 1);

        if (date.toDateString() === today.toDateString()) return "Today";
        if (date.toDateString() === yesterday.toDateString()) return "Yesterday";

        return date.toLocaleDateString();
    };


    const groupedMessages = messages.reduce((acc, msg) => {
        const dateKey = getDateGroup(msg.timestamp);
        if (!acc[dateKey]) acc[dateKey] = [];
        acc[dateKey].push(msg);
        return acc;
    }, {});


    const sendMessage = async () => {
        if (!input.trim() || !selectedUser) return;
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
        const msg = {
            from: currentUserEmail,
            to: selectedUser,
            text: input.trim(),
            timestamp: Date(),
            read: false,
            type: isCodeMode ? "code" : "text"
        };

        socket.emit("send_private_message", msg);

        const chatId = getChatId(currentUserEmail, selectedUser);
        await addDoc(collection(db, "messages", chatId, "chats"), msg);
        socket.emit("stop_typing", { from: currentUserEmail, to: selectedUser });
        setInput("");
    };

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onloadend = async () => {
            const base64 = reader.result;

            const msg = {
                from: currentUserEmail,
                to: selectedUser,
                image: base64,
                timestamp: Date(),
                read: false,
                type: "image"
            };

            socket.emit("send_private_message", msg);

            const chatId = getChatId(currentUserEmail, selectedUser);
            await addDoc(collection(db, "messages", chatId, "chats"), msg);
        };
        reader.readAsDataURL(file);
    };

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


    const handleLogout = async () => {
        await updateDoc(doc(db, "users", currentUserEmail), { online: false });
        await signOut(auth);
        navigate("/login");
    };



    const onlineUsers = users.filter((u) => u.online);
    const offlineUsers = users.filter((u) => !u.online);

    return (
        <div className="flex flex-col md:flex-row h-screen bg-white dark:bg-[#121212] text-black dark:text-white">
            <ToastContainer />

            <div className="hidden lg:block w-1/4 p-4 bg-gray-100 dark:bg-[#1e1e1e] border-r border-gray-300 dark:border-gray-700 overflow-y-auto">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 mb-4">
                    <div className="flex flex-col items-start">
                        <div className="flex items-center gap-2">
                            <img src={dinoLogo} alt="Dino" className="h-8 w-8" />
                            <p className="font-bold text-lg">
                                Hey, {currentUserName.split(" ")[0]} !!
                            </p>
                        </div>
                    </div>

                    <div className="text-xs text-gray-500 dark:text-gray-400">
                        <button
                            onClick={handleLogout}
                            className="bg-red-500 text-white px-3 py-1 rounded text-sm w-full sm:w-auto"
                        >
                            Logout
                        </button>
                    </div>
                </div>

                <hr className="fixed border-t border-gray-300 dark:border-gray-700 -mx-4 mb-2" />

                <div className="pt-2 pb-2">
                    <h3 className="text-sm font-semibold mb-2 text-green-600">
                        Online ({onlineUsers.length})
                    </h3>
                    {onlineUsers.length > 0 ? (
                        onlineUsers.map((u) => (
                            <div
                                key={u.email}
                                onClick={() => handleSelectUser(u.email)}
                                className={`cursor-pointer p-2 rounded mb-1 ${selectedUser === u.email
                                    ? "bg-blue-500 text-white"
                                    : "hover:bg-gray-200 dark:hover:bg-gray-700"
                                    }`}
                            >
                                {getDisplayName(u.email)}
                            </div>
                        ))
                    ) : (
                        <p className="text-xs text-gray-400 italic">No users online</p>
                    )}

                    <hr className="my-4 border-t border-gray-300 dark:border-gray-700 -mx-4" />

                    <h3 className="text-sm font-semibold mb-2 text-gray-500">
                        Offline ({offlineUsers.length})
                    </h3>
                    {offlineUsers.length > 0 ? (
                        offlineUsers.map((u) => (
                            <div
                                key={u.email}
                                onClick={() => handleSelectUser(u.email)}
                                className={`cursor-pointer p-2 rounded mb-1 ${selectedUser === u.email
                                    ? "bg-blue-500 text-white"
                                    : "hover:bg-gray-200 dark:hover:bg-gray-700"
                                    }`}
                            >
                                {getDisplayName(u.email)}
                            </div>
                        ))
                    ) : (
                        <p className="text-xs text-gray-400 italic">No users offline</p>
                    )}
                </div>

                <hr className="border-t border-gray-300 dark:border-gray-700 -mx-4 mt-2" />

            </div>
            <div className="sm:hidden flex justify-between p-2 items-center border-b dark:border-gray-700 bg-white dark:bg-[#1e1e1e]">
                <div className="flex items-center gap-2">
                    <img src={dinoLogo} alt="Dino" className="h-8 w-8" />
                    <p className="font-bold">Hey, {currentUserName.split(" ")[0]}!</p>
                </div>
                <button
                    onClick={() => setShowCard(!showCard)}
                    className="bg-blue-500 text-white px-3 py-1 rounded"
                >
                    ☰
                </button>
            </div>
            {showCard && (
                <div
                    ref={cardRef}
                    className="md:hidden absolute z-50 w-full left-0 top-14 bg-gray-100 dark:bg-[#1e1e1e] border-t border-b dark:border-gray-700 p-4 shadow-lg"
                >
                    <div className="flex flex-col items-start">
                        <button
                            onClick={handleLogout}
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
                                    handleSelectUser(u.email);
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
                                    handleSelectUser(u.email);
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
                </div>
            )}

            <div className="flex flex-col flex-1 h-full">

                <div className="p-3 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1e1e1e] flex justify-between items-center">

                    <h2 className="text-md font-bold">
                        Chat with {selectedUser ? getDisplayName(selectedUser) : "—"}
                    </h2>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setIsDarkMode((prev) => !prev)}
                            className="w-9 h-9 flex items-center justify-center bg-gray-200 dark:bg-gray-800 text-lg rounded-full hover:scale-105 transition-transform"
                            title="Toggle Dark Mode"
                        >
                            {isDarkMode ? "☀️" : "🌙"}
                        </button>
                    </div>
                </div>

                <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 space-y-3 bg-white dark:bg-[#121212]">
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
                                return (
                                    <div key={msg.id || msg.timestamp} className={`flex flex-col m-1 max-w-[80%] ${isMe ? "ml-auto items-end" : "mr-auto items-start"}`}>
                                        {/* {!isMe && (
                                            <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">
                                                {getDisplayName(msg.from)}
                                            </div>
                                        )} */}
                                        {msg.type === "image" ? (
                                            <img src={msg.image} alt="shared" className="max-w-xs rounded-lg border mt-1" />
                                        ) :
                                            msg.type === "code" ? (
                                                <pre
                                                    className={`flex flex-col px-4 py-2 text-sm max-w-[80%] ${isMe
                                                        ? "ml-auto bg-blue-500 text-white items-end rounded-[1.1rem] rounded-br-none"
                                                        : "mr-auto bg-gray-200 text-black dark:bg-gray-700 dark:text-white rounded-[1.1rem] rounded-bl-none "}
  `}
                                                    style={{
                                                        wordBreak: "break-word",
                                                        overflowWrap: "break-word",
                                                    }}
                                                >
                                                    <button
                                                        onClick={() => navigator.clipboard.writeText(msg.text)}
                                                        className={`italic dark:text-white ${isMe ? "text-white" : "text-black"} mt-1 ml-3 block`}
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
                                                    <div className={`text-[10px] dark:text-gray-300 ${isMe ? "text-white" : "text-black"}`}>
                                                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </div>
                                                </pre>
                                            ) : (
                                                <div
                                                    className={`flex flex-col px-4 py-2 text-sm max-w-[80%] ${isMe
                                                        ? "ml-auto bg-blue-500 text-white items-end rounded-[1.1rem] rounded-br-none"
                                                        : "mr-auto bg-gray-200 text-black dark:bg-gray-700 dark:text-white rounded-[1.1rem] rounded-bl-none "}
  `}
                                                    style={{
                                                        wordBreak: "break-word",
                                                        overflowWrap: "break-word",
                                                        whiteSpace: "pre-wrap",
                                                    }}
                                                >
                                                    <div>{msg.text}</div>
                                                    <div className={`text-[10px] dark:text-gray-300 ${isMe ? "text-white" : "text-black"}`}>
                                                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </div>
                                                </div>
                                            )

                                        }
                                        {showScrollToBottom && (
                                            <button
                                                onClick={() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })}
                                                className="fixed bottom-24 right-4 z-50 bg-white text-gray-800 dark:bg-[#222] dark:text-white border border-gray-300 dark:border-gray-600  hover:bg-blue-500 hover:text-white transition-all duration-300 w-10 h-10 rounded-full flex items-center justify-center"
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
                            })}
                            {selectedUser && typingUsers[selectedUser] && (
                                <div className="flex mb-4 mt-2 items-center ml-2 space-x-2">
                                    <span className="text-sm text-gray-500 dark:text-blue-400">typing</span>
                                    <div className="flex space-x-1">
                                        <span className="w-1.5 h-1.5 bg-gray-500 dark:bg-gray-300 rounded-full opacity-50 animate-bounce delay-75"></span>
                                        <span className="w-1.5 h-1.5 bg-gray-500 dark:bg-gray-300 rounded-full opacity-50 animate-bounce delay-150"></span>
                                        <span className="w-1.5 h-1.5 bg-gray-500 dark:bg-gray-300 rounded-full opacity-50 animate-bounce delay-300"></span>
                                    </div>
                                </div>
                            )}

                        </div>
                    ))}

                    <div ref={chatEndRef} />

                </div>

                {selectedUser && (<div className="fixed bottom-0 left-0 right-0 border-t border-gray-200 dark:border-gray-700 p-3 bg-white dark:bg-[#1e1e1e] z-10 md:static">
                    <div className="flex items-center gap-2 w-full overflow-hidden">
                        <input
                            value={input}
                            onChange={handleInputChange}
                            onKeyDown={(e) => {
                                if (e.key === "Enter" && !e.shiftKey) {
                                    e.preventDefault();
                                    sendMessage();
                                }
                            }}
                            className="flex-1 min-w-0 px-4 py-2 rounded bg-gray-100 dark:bg-[#2b2b2b] dark:text-white focus:outline-none"
                            placeholder="Type your message..."
                        />

                        <button
                            onClick={() => setIsCodeMode((prev) => !prev)}
                            className={`flex-shrink-0 px-2 py-1 border rounded ${isCodeMode ? 'bg-blue-500 text-white' : 'bg-white-300'
                                }`}
                        >
                            {isCodeMode ? "<>" : "💬"}
                        </button>

                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                            className="hidden"
                            ref={fileInputRef}
                        />
                        <button
                            onClick={() => fileInputRef.current.click()}
                            className="flex-shrink-0 px-2 py-1 border rounded"
                        >
                            📎
                        </button>

                        <button
                            onClick={sendMessage}
                            className="flex-shrink-0 bg-blue-500 text-white px-5 py-2 rounded hover:bg-blue-600">
                            Send
                        </button>
                    </div>
                </div>)}
            </div>
        </div>
    );
}
