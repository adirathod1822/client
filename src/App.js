import { HashRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Chat from "./pages/Chat";
import PrivateRoute from "./pages/components/PrivateRoute";
import AuthPage from "./pages/AuthPage";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/auth" element={<AuthPage />} />
        <Route
          path="/chat"
          element={
            <PrivateRoute>
              <Chat />
            </PrivateRoute>
          }
        />
        <Route path="*" element={<Navigate to="/auth" />} />
      </Routes>
    </Router>
  );
}

export default App;