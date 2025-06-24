import { useEffect, useState, useRef } from "react";
import { auth, db } from "../firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import dinoLogo from "../utils/blue_dino.png";
import notification from "../utils/noti.mp3";

import {
    collection,
    addDoc,
    query,
    orderBy,
    onSnapshot,
    updateDoc,
    doc,
    setDoc
} from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import io from "socket.io-client";
import { ToastContainer, toast } from "react-toastify";

const socket = io("https://onlychat-server-1.onrender.com");
const getChatId = (a, b) => [a, b].sort().join("_");
const notificationSound = new Audio(notification);

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
    const [unsubChat, setUnsubChat] = useState(null); const [isDarkMode, setIsDarkMode] = useState(() => {
        const savedTheme = localStorage.getItem("theme");
        return savedTheme ? savedTheme === "dark" : true;
    });

    const [isCodeMode, setIsCodeMode] = useState(false);
    const chatEndRef = useRef(null);
    const typingTimeout = useRef(null);
    const fileInputRef = useRef(null);
    const navigate = useNavigate();

    useEffect(() => {
        const html = document.documentElement;
        html.classList.toggle("dark", isDarkMode);
        localStorage.setItem("theme", isDarkMode ? "dark" : "light");
    }, [isDarkMode]);

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
    }, [currentUserEmail, selectedUser, navigate, unsubChat, isDarkMode]);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const getDisplayName = (email) => {
        const user = users.find((u) => u.email === email);
        return user?.displayName || email.split("@")[0];
    };

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
    const formatDate = (timestamp) => {
        const date = new Date(timestamp);
        const today = new Date();
        const yesterday = new Date();
        yesterday.setDate(today.getDate() - 1);

        if (
            date.toDateString() === today.toDateString()
        ) return "Today";

        if (
            date.toDateString() === yesterday.toDateString()
        ) return "Yesterday";

        return date.toLocaleDateString(undefined, {
            month: "short",
            day: "numeric",
            year: "numeric"
        });
    };
    const groupedMessages = messages.reduce((acc, msg) => {
        const dateLabel = formatDate(msg.timestamp);
        if (!acc[dateLabel]) acc[dateLabel] = [];
        acc[dateLabel].push(msg);
        return acc;
    }, {});

    const sendMessage = async () => {
        if (!input.trim() || !selectedUser) return;

        const msg = {
            from: currentUserEmail,
            to: selectedUser,
            text: input.trim(),
            timestamp: Date.now(),
            read: false,
            type: isCodeMode ? "code" : "text"
        };

        socket.emit("send_private_message", msg);

        const chatId = getChatId(currentUserEmail, selectedUser);
        await addDoc(collection(db, "messages", chatId, "chats"), msg);

        setInput("");
        socket.emit("stop_typing", { from: currentUserEmail, to: selectedUser });
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
                timestamp: Date.now(),
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



                {/* <h3 className="text-sm font-semibold mb-2 text-green-600">🟢 Online - {onlineUsers.length}</h3>
                {onlineUsers.map((u) => (
                    <div key={u.email} onClick={() => handleSelectUser(u.email)} className={`cursor-pointer p-2 rounded mb-1 ${selectedUser === u.email ? "bg-blue-500 text-white" : "hover:bg-gray-200 dark:hover:bg-gray-700"}`}>
                        {getDisplayName(u.email)}
                    </div>
                ))}

                <h3 className="text-sm font-semibold mt-4 mb-2 text-red-500">🔴 Offline - {offlineUsers.length}</h3>
                {offlineUsers.map((u) => (
                    <div key={u.email} onClick={() => handleSelectUser(u.email)} className={`cursor-pointer p-2 rounded mb-1 ${selectedUser === u.email ? "bg-blue-500 text-white" : "hover:bg-gray-200 dark:hover:bg-gray-700"}`}>
                        {getDisplayName(u.email)}
                    </div>
                ))} */}
                {/* FULL-WIDTH TOP BORDER */}
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

                    {/* Divider between Online and Offline */}
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

                {/* FULL-WIDTH BOTTOM BORDER */}
                <hr className="border-t border-gray-300 dark:border-gray-700 -mx-4 mt-2" />

            </div>
            <div className="md:hidden flex justify-between p-2 items-center border-b dark:border-gray-700 bg-white dark:bg-[#1e1e1e]">
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
                                    setShowCard(false); // close after selecting
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
                                    setShowCard(false); // close after selecting
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
                        {selectedUser && typingUsers[selectedUser] && (
                            <span className="text-sm text-blue-400 mr-2">typing...</span>
                        )}
                        <button
                            onClick={() => setIsDarkMode((prev) => !prev)}
                            className="w-9 h-9 flex items-center justify-center bg-gray-200 dark:bg-gray-800 text-lg rounded-full hover:scale-105 transition-transform"
                            title="Toggle Dark Mode"
                        >
                            {isDarkMode ? "☀️" : "🌙"}
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-white dark:bg-[#121212]">
                    {Object.entries(groupedMessages).map(([date, msgs]) => (
                        <div key={date}>
                            <div className="text-center text-sm text-gray-500 mb-2 mt-4">{date}</div>
                            {messages.map((msg) => {
                                const isMe = msg.from === currentUserEmail;
                                return (
                                    <div key={msg.id} className={`flex flex-col max-w-[80%] ${isMe ? "ml-auto items-end" : "mr-auto items-start"}`}>
                                        {!isMe && (
                                            <div className="ml-1 text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">
                                                {getDisplayName(msg.from)}
                                            </div>
                                        )}
                                        {msg.type === "image" ? (
                                            <img src={msg.image} alt="shared" className="max-w-xs rounded-lg border mt-1" />
                                        ) :
                                            msg.type === "code" ? (
                                                <pre
                                                    className="px-4 py-2 text-sm rounded-2xl dark:bg-gray-700 dark:text-white bg-gray-100 max-w-[90%] overflow-x-auto whitespace-pre-wrap break-words"
                                                    style={{
                                                        wordBreak: "break-word",
                                                        overflowWrap: "break-word",
                                                    }}
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
                                                    <button
                                                        onClick={() => navigator.clipboard.writeText(msg.text)}
                                                        className="text-xs text-blue-400 mt-1 ml-3 block"
                                                    >
                                                        Copy
                                                    </button>
                                                </pre>
                                            ) : (
                                                <div
                                                    className={`px-4 py-2 text-sm rounded-2xl max-w-[90%] ${isMe
                                                        ? "bg-blue-500 text-white self-end"
                                                        : "bg-gray-200 text-black dark:bg-gray-700 dark:text-white self-start"
                                                        }`}
                                                    style={{
                                                        wordBreak: "break-word",
                                                        overflowWrap: "break-word",
                                                        whiteSpace: "pre-wrap",
                                                        overflowX: "hidden",
                                                    }}
                                                >
                                                    {msg.text}
                                                </div>

                                            )

                                        }
                                        {isMe && (
                                            <div className={`text-[10px] flex gap-1 mb-2 mt-0.5 items-center ${isMe ? "justify-end" : "justify-start"} text-gray-200 dark:text-gray-300`}>
                                                <span className="ml-2">{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                {isMe && (
                                                    <>
                                                        <span>{msg.read ? "✓✓" : "✓"}</span>
                                                        {/* <span>{msg.read ? "Read" : "Sent"}</span> */}
                                                    </>
                                                )}
                                            </div>
                                        )}

                                        {!isMe && (
                                            <div className="text-[10px] m-1 text-gray-400 text-left">
                                                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                        )}

                                    </div>
                                );
                            })}
                        </div>
                    ))}


                    <div ref={chatEndRef} />
                </div>

                {/* <div className="sm:fixed border-t border-gray-200 dark:border-gray-700 p-3 bg-white dark:bg-[#1e1e1e] z-10"> */}
                <div className="fixed bottom-0 left-0 right-0 border-t border-gray-200 dark:border-gray-700 p-3 bg-white dark:bg-[#1e1e1e] z-10 md:static">

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
                            className="flex-shrink-0 bg-blue-500 text-white px-5 py-2 rounded hover:bg-blue-600"
                        >
                            Send
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
}
