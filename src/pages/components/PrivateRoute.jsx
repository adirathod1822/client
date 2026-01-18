import { onAuthStateChanged } from "firebase/auth";
import { useEffect, useState } from "react";
import { auth } from "../../firebase";
import { Loader } from "./Loader";
import { Navigate } from "react-router-dom";

export default function PrivateRoute({ children }) {
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [userLoggedIn, setUserLoggedIn] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUserLoggedIn(!!user);
      setCheckingAuth(false);
    });
    return unsubscribe;
  }, []);

  if (checkingAuth) return <Loader />;

  return userLoggedIn ? children : <Navigate to="/auth" replace />;
}
