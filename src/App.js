import { HashRouter as Router, Routes, Route, Navigate } from "react-router-dom";
// import Chat from "./pages/Chat";
import PrivateRoute from "./pages/components/PrivateRoute";
import AuthPage from "./pages/AuthPage";
import ChatPage from "./pages/ChatPage";
// import { ProfilePage } from "./pages/ProfilePage";
import ResetPassword from "./pages/PasswordReset";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        {/* <Route path="/profile" element={<ProfilePage />} /> */}
        <Route path="/chat" element={<PrivateRoute> <ChatPage /> </PrivateRoute>} />
        <Route path="*" element={<Navigate to="/auth" replace/>} />
      </Routes>
    </Router>
  );
}

export default App;