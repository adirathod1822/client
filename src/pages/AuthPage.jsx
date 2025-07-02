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
import { Loader } from "./components/Loader";

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem("theme");
    return savedTheme ? savedTheme === "dark" : false;
  });

  const navigate = useNavigate();

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDarkMode);
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
    setLoading(true);
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
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
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
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") handleAuth();
  };
  return (
    <div className="relative">
      {loading && <Loader/>}
      <div className="min-h-screen w-full flex flex-col md:flex-row items-center justify-center bg-gray-300 dark:bg-[#121212] transition-colors">
        <div className="w-full max-w-md bg-gray-200 dark:bg-[#1e1e1e] shadow-2xl rounded-3xl p-10 space-y-6 mx-4 my-8 animate-fadeInUp">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {isLogin ? "Sign In" : "Create Account"}
            </h2>
            <button
              className="text-lg"
              title="Toggle Theme"
              onClick={() => setIsDarkMode((prev) => !prev)}
            >
              {isDarkMode ? "🌞" : "🌙"}
            </button>
          </div>

          {!isLogin && (
            <input
              type="text"
              placeholder="Full Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-[#1f2937] text-gray-800 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          )}

          <input
            type="email"
            placeholder="Email Address"
            value={email}
            onKeyDown={handleKeyPress}

            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-[#1f2937] text-gray-800 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onKeyDown={handleKeyPress}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-[#1f2937] text-gray-800 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          {error && <p className="text-red-600 text-sm text-center font-semibold">{error}</p>}

          <button
            onClick={handleAuth}
            className="w-full bg-gradient-to-r from-blue-500 to-blue-500 text-white font-semibold py-2 px-4 rounded-lg hover:opacity-90 transition-all"
          >
            {isLogin ? "Login" : "Register"}
          </button>

          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-gray-300 dark:bg-gray-600" />
            <span className="text-gray-500 text-sm">or</span>
            <div className="flex-1 h-px bg-gray-300 dark:bg-gray-600" />
          </div>

          <button
            onClick={handleGoogleLogin}
            className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#1f2937] text-gray-800 dark:text-white py-2 px-4 rounded-lg flex items-center justify-center gap-3 hover:bg-gray-100 dark:hover:bg-[#374151] transition-all"
          >
            <img src="https://img.icons8.com/color/20/google-logo.png" alt="Google" className="w-5 h-5" />
            Continue with Google
          </button>

          <p className="text-center text-sm text-gray-600 dark:text-gray-400">
            {isLogin ? "Don't have an account?" : "Already registered?"} <button onClick={() => setIsLogin(!isLogin)} className="text-blue-500 font-semibold hover:underline">{isLogin ? "Create one" : "Login"}</button>
          </p>
        </div>
      </div>
    </div>
  );
}