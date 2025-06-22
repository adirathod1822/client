import { useState, useEffect } from "react";
import { auth, provider, db } from "../firebase";
import { useNavigate } from "react-router-dom";
import {
    onAuthStateChanged,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signInWithPopup,
    updateProfile,
} from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";

export default function AuthPage() {
    const [isLogin, setIsLogin] = useState(true);   
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [name, setName] = useState("");
    const [error, setError] = useState("");
    const [isDarkMode, setIsDarkMode] = useState(() => {
        const savedTheme = localStorage.getItem("theme");
        return savedTheme ? savedTheme === "dark" : true; // default to dark
    });

    const navigate = useNavigate();

    useEffect(() => {
        const html = document.documentElement;
        html.classList.toggle("dark", isDarkMode);
        localStorage.setItem("theme", isDarkMode ? "dark" : "light");
    }, [isDarkMode]);

    useEffect(() => {
        const unsub = onAuthStateChanged(auth, (user) => {
            if (user) navigate("/chat");
        });
        return unsub;
    }, [navigate]);

    const handleAuth = async () => {
        setError("");
        try {
            if (isLogin) {
                await signInWithEmailAndPassword(auth, email, password);
            } else {
                const result = await createUserWithEmailAndPassword(auth, email, password);
                const user = result.user;
                await updateProfile(user, { displayName: name });

                await setDoc(doc(db, "users", user.email), {
                    email: user.email,
                    displayName: name,
                    online: true,
                    createdAt: Date.now(),
                });
            }
        } catch (err) {
            setError(err.message);
        }
    };

    const handleGoogleLogin = async () => {
        try {
            const result = await signInWithPopup(auth, provider);
            const user = result.user;

            const userDocRef = doc(db, "users", user.email);
            const userDocSnap = await getDoc(userDocRef);

            if (!userDocSnap.exists()) {
                await setDoc(userDocRef, {
                    email: user.email,
                    displayName: user.displayName || user.email.split("@")[0],
                    online: true,
                    createdAt: Date.now(),
                });
            } else {
                await setDoc(userDocRef, { online: true }, { merge: true });
            }
        } catch (err) {
            setError(err.message);
        }
    };

    return (
        <div className="flex h-screen bg-white dark:bg-[#121212] text-black dark:text-white">
            {/* Left Panel */}
            {/* <div className="w-1/2 hidden md:flex flex-col justify-center items-center bg-gray-100 dark:bg-[#1e1e1e] border-r dark:border-gray-700">
                <h2 className="text-3xl font-bold mb-4">Welcome 🚀 !!</h2>
                <p className="text-center text-gray-600 dark:text-gray-400 max-w-xs">
                    chat . share . enjoy 
                </p>
            </div> */}

            {/* Right Panel */}
            <div className="flex-1 flex flex-col justify-center items-center p-8">
                <div className="w-full max-w-sm space-y-5">
                    <div className="flex justify-between items-center mb-4">
                        <h1 className="text-xl font-bold">{isLogin ? "Login" : "Sign Up"}</h1>
                        <button
                            onClick={() => setIsDarkMode((prev) => !prev)}
                            className="text-lg hover:scale-110 transition-transform"
                            title="Toggle Dark Mode"
                        >
                            {isDarkMode ? "☀️" : "🌙"}
                        </button>
                    </div>

                    {!isLogin && (
                        <input
                            className="w-full px-4 py-2 border rounded-md bg-gray-100 dark:bg-[#2b2b2b] dark:text-white focus:outline-none"
                            type="text"
                            placeholder="Name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />
                    )}

                    <input
                        className="w-full px-4 py-2 border rounded-md bg-gray-100 dark:bg-[#2b2b2b] dark:text-white focus:outline-none"
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                    <input
                        className="w-full px-4 py-2 border rounded-md bg-gray-100 dark:bg-[#2b2b2b] dark:text-white focus:outline-none"
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                    {error && <p className="text-red-500 text-sm">{error}</p>}
                    <button
                        onClick={handleAuth}
                        className="w-full bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md"
                    >
                        {isLogin ? "Login" : "Create Account"}
                    </button>

                    <div className="relative text-center py-2">
                        <span className="bg-white dark:bg-[#121212] px-2 text-sm text-gray-400">or</span>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-full border-t border-gray-300 dark:border-gray-700"></div>
                        </div>
                    </div>

                    <button
                        onClick={handleGoogleLogin}
                        className="w-full bg-white text-black border dark:bg-[#2b2b2b] dark:text-white dark:border-gray-600 px-4 py-2 rounded-md flex items-center justify-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-800"
                    >
                        <img
                            src="https://img.icons8.com/color/20/google-logo.png"
                            alt="Google"
                            className="w-5 h-5"
                        />
                        Continue with Google
                    </button>

                    <p className="text-center text-sm">
                        {isLogin ? "Don't have an account?" : "Already have an account?"}
                        <button
                            onClick={() => setIsLogin(!isLogin)}
                            className="ml-1 text-blue-500 hover:underline"
                        >
                            {isLogin ? "Sign Up" : "Login"}
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
}
