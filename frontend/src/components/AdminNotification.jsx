import { useEffect, useRef, useState } from "react";
import axios from "axios";

function AdminNotification() {
  const [notification, setNotification] = useState(null);
  const lastSeenId = useRef(null);

  const normalSound = useRef(null);
  const severeSound = useRef(null);

  useEffect(() => {
    normalSound.current = new Audio("/sounds/normal-notification.mp3");
    severeSound.current = new Audio("/sounds/severe-alert.mp3");
  }, []);

  useEffect(() => {
    const checkNotification = async () => {
      try {
        const res = await axios.get(
          "https://cpe-complaint-system.onrender.com/api/complaints/notifications/latest"
        );

        const latest = res.data;

        if (!latest) return;

        if (lastSeenId.current === null) {
          lastSeenId.current = latest.complaint_id;
          return;
        }

        if (latest.complaint_id !== lastSeenId.current) {
          lastSeenId.current = latest.complaint_id;
          setNotification(latest);

          const severity = latest.severity?.toLowerCase();

          if (
            severity === "high" ||
            severity === "severe" ||
            severity === "critical"
          ) {
            severeSound.current?.play().catch(() => {});
          } else {
            normalSound.current?.play().catch(() => {});
          }
        }
      } catch (err) {
        console.error("Notification check failed:", err);
      }
    };

    checkNotification();

    const interval = setInterval(checkNotification, 5000);

    return () => clearInterval(interval);
  }, []);

  if (!notification) return null;

  const severity = notification.severity?.toLowerCase();

  const isSevere =
    severity === "high" ||
    severity === "severe" ||
    severity === "critical";

  return (
    <div className={`admin-notification ${isSevere ? "severe" : "normal"}`}>
      <button className="close-btn" onClick={() => setNotification(null)}>
        ×
      </button>

      <h3>{isSevere ? "URGENT SEVERE FEEDBACK" : "New Feedback Received"}</h3>

      <p>
        <strong>Subject:</strong> {notification.subject_code}
      </p>

      <p>
        <strong>Instructor:</strong> {notification.instructor_name}
      </p>

      <p>
        <strong>Severity:</strong> {notification.severity}
      </p>

      <p className="message">{notification.complaint_text}</p>
    </div>
  );
}

export default AdminNotification;