export default function ResetConfirmationPopUp({
  mail,
  showResetConfirm,
  setShowResetConfirm,
  handleForgotPassword
}) {
  if (!showResetConfirm) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-gray-200 dark:bg-[#1e1e1e] rounded-2xl p-6 w-full max-w-sm shadow-xl">

        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
          Reset password?
        </h3>

        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
          We’ll send a password reset link to <b>{mail || "your email"}</b>.
        </p>

        <div className="flex justify-end gap-3">
          <button
            onClick={() => setShowResetConfirm(false)}
            className="px-4 py-2 rounded-lg bg-gray-300 dark:bg-gray-700"
          >
            No
          </button>

          <button
            onClick={() => {
              setShowResetConfirm(false);
              handleForgotPassword();
            }}
            className="px-4 py-2 rounded-lg bg-blue-600 text-white font-semibold"
          >
            Yes
          </button>
        </div>

      </div>
    </div>
  );
}
