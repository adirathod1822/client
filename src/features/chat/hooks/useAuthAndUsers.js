import { useEffect, useMemo, useState, useCallback } from "react";
import { auth, db } from "../../../firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { collection, doc, onSnapshot, setDoc, updateDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { socket } from "../lib/socket";

export function useAuthAndUsers() {
  const [currentUserEmail, setCurrentUserEmail] = useState("");
  const [currentUserName, setCurrentUserName] = useState("");
  const [users, setUsers] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUserEmail(user.email);
        setCurrentUserName(user.displayName || user.email.split("@")[0]);

        await setDoc(
          doc(db, "users", user.email),
          {
            email: user.email,
            displayName: user.displayName || user.email.split("@")[0],
            online: true,
          },
          { merge: true }
        );

        socket.emit("register_user", user.email);

        const unsubscribeUsers = onSnapshot(collection(db, "users"), (snapshot) => {
          const userList = snapshot.docs
            .map((d) => d.data())
            .filter((u) => u.email !== user.email);
          setUsers(userList);
        });

        return () => unsubscribeUsers();
      } else {
        navigate("/login");
      }
    });

    return () => unsubAuth();
  }, [navigate]);

  const onlineUsers = useMemo(
    () => users.filter((u) => u.online),
    [users]
  );
  const offlineUsers = useMemo(
    () => users.filter((u) => !u.online),
    [users]
  );

  const getDisplayName = useCallback(
    (email) => {
      const user = users.find((u) => u.email === email);
      return user?.displayName || email.split("@")[0];
    },
    [users]
  );

  const handleLogout = useCallback(async () => {
    if (currentUserEmail) {
      await updateDoc(doc(db, "users", currentUserEmail), { online: false });
    }
    await signOut(auth);
    navigate("/login");
  }, [currentUserEmail, navigate]);

  return {
    currentUserEmail,
    currentUserName,
    users,
    onlineUsers,
    offlineUsers,
    getDisplayName,
    handleLogout,
  };
}
