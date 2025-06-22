import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Chat from "./pages/Chat";
import PrivateRoute from "./pages/components/PrivateRoute";
import AuthPage from "./pages/AuthPage";

function App() {
  return (
    <Router>
      <Routes>
        {/* <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} /> */}
        <Route path="/auth" element={<AuthPage />} />

        {/* 🔐 Protected Route */}
        <Route
          path="/chat"
          element={
            <PrivateRoute>
              <Chat />
            </PrivateRoute>
          }
        />

        {/* Optional: Redirect default route */}
        <Route path="*" element={<Navigate to="/auth" />} />
      </Routes>
    </Router>
  );
}

export default App;