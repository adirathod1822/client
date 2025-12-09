import { useEffect, useRef } from "react";
import { db } from "../../../firebase";
import { doc, updateDoc } from "firebase/firestore";
import { INACTIVITY_LIMIT } from "../lib/chatUtils";

export function useInactivityTimer(currentUserEmail) {
  const timeoutRef = useRef(null);

  useEffect(() => {
    if (!currentUserEmail) return;

    const resetTimer = () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);

      timeoutRef.current = setTimeout(async () => {
        try {
          await updateDoc(doc(db, "users", currentUserEmail), {
            online: false,
            inactiveSince: new Date(),
          });
        } catch (err) {
          console.error("Error updating offline status:", err);
        }
      }, INACTIVITY_LIMIT);
    };

    const activityEvents = ["mousemove", "keydown", "touchstart", "scroll"];

    activityEvents.forEach((event) =>
      window.addEventListener(event, resetTimer)
    );

    resetTimer();

    return () => {
      activityEvents.forEach((event) =>
        window.removeEventListener(event, resetTimer)
      );
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [currentUserEmail]);
}
