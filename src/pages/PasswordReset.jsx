import { useEffect, useState } from "react";
import {
  getAuth,
  verifyPasswordResetCode,
  confirmPasswordReset
} from "firebase/auth";
import { useNavigate } from "react-router-dom";
import DoodleBackground from "../features/chat/components/DoodleBackground";
export default function ResetPassword() {
  const auth = getAuth();
  const navigate = useNavigate();

  const [oobCode, setOobCode] = useState(null);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.hash);
    const code = params.get("oobCode");
    debugger

    if (!code) {
      setError("Invalid or missing reset link.");
      setLoading(false);
      return;
    }

    verifyPasswordResetCode(auth, code)
      .then(() => {
        setOobCode(code);
        setLoading(false);
      })
      .catch(() => {
        setError("This reset link is invalid or has expired.");
        setLoading(false);
      });
  }, [auth]);

  const handleReset = async (e) => {
    e.preventDefault();
    setError("");

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    try {
      await confirmPasswordReset(auth, oobCode, password);
      setSuccess(true);

      setTimeout(() => {
        navigate("/login");
      }, 2500);
    } catch {
      setError("Failed to reset password. Please request a new link.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0b0f14] text-white">
        Verifying reset link…
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0b0f14] px-4">
        <DoodleBackground/>
      <div className="w-full max-w-md bg-[#121826] rounded-2xl p-8 shadow-2xl">

        <div className="flex justify-center mb-6">
          <img src="/OC_LOGO.png" alt="OnlyChat" className="w-20" />
        </div>

        <h1 className="text-2xl font-bold text-center text-white mb-2">
          Reset your password
        </h1>

        <p className="text-sm text-gray-400 text-center mb-6">
          Enter a new password for your OnlyChat account
        </p>

        {error && (
          <div className="bg-red-500/10 text-red-400 text-sm p-3 rounded mb-4">
            {error}
          </div>
        )}

        {success ? (
          <div className="bg-green-500/10 text-green-400 text-sm p-3 rounded text-center">
            Password reset successful. Redirecting to login…
          </div>
        ) : (
          <form onSubmit={handleReset} className="space-y-4">

            <input
              type="password"
              placeholder="New password"
              className="w-full bg-[#0b0f14] border border-gray-700 rounded-lg px-4 py-3 text-white outline-none focus:border-blue-500"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <input
              type="password"
              placeholder="Confirm password"
              className="w-full bg-[#0b0f14] border border-gray-700 rounded-lg px-4 py-3 text-white outline-none focus:border-blue-500"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
            />

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:opacity-90 transition rounded-lg py-3 font-semibold"
            >
              Reset Password
            </button>

          </form>
        )}
      </div>
    </div>
  );
}
