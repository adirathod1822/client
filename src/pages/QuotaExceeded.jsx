// src/pages/QuotaExceeded.jsx

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../firebase";
import { updateDoc, doc } from "firebase/firestore";
import { onAuthStateChanged, signOut } from "firebase/auth";

export default function QuotaExceeded() {
  const [currentUserEmail, setCurrentUserEmail] = useState("");
  const navigate = useNavigate();
  useEffect(() => {
    const onAuth = onAuthStateChanged(auth, async (user) => {
      setCurrentUserEmail(user.email)
    })
    return () => {
      onAuth()
    }
  })
  return (
    <div className="min-h-screen bg-black flex flex-col justify-center items-center bg-red-50">
      <h1 className="text-4xl font-bold text-red-700 mb-4">Quota Exceeded</h1>
      <p className="text-lg text-gray-700 mb-6">
        You've exceeded your daily usage quota. Please try again later.
      </p>
      <button
        onClick={async () => {
          await updateDoc(doc(db, "users", currentUserEmail), { online: false });
          await signOut(auth);
          navigate("/auth")
        }}
        className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg"
      >
        Go Back to Home
      </button>
    </div>
  );
}