import { HashRouter as Router, Routes, Route, Navigate } from "react-router-dom";
// import Chat from "./pages/Chat";
import PrivateRoute from "./pages/components/PrivateRoute";
import AuthPage from "./pages/AuthPage";
import ChatPage from "./pages/ChatPage";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/auth" element={<AuthPage />} />
        <Route
          path="/chat"
          element={
            <PrivateRoute>
              <ChatPage />
            </PrivateRoute>
          }
        />
        <Route path="*" element={<Navigate to="/auth" />} />
      </Routes>
    </Router>
  );
}

export default App;