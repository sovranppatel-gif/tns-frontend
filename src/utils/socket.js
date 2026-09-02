import { io } from "socket.io-client";
import { API_URL } from "./api.js";

let socket = null;

export function getSocket() {
  if (socket) return socket;

  socket = io(API_URL || undefined, {
    transports: ["websocket", "polling"],
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
  });

  socket.on("connect", () => {
    socket.emit("logs:subscribe");
  });

  return socket;
}

export function subscribeActivityLogs(onLog) {
  const s = getSocket();
  const handler = (log) => onLog?.(log);
  s.emit("logs:subscribe");
  s.on("activity:log", handler);
  return () => s.off("activity:log", handler);
}

export function subscribeSectionUpdates(section, onUpdate) {
  const s = getSocket();
  const key = String(section || "").toLowerCase();
  if (!key) return () => {};

  const handler = (payload) => {
    if (!payload?.section) return;
    if (String(payload.section).toLowerCase() === key) onUpdate?.(payload);
  };

  s.emit("section:subscribe", key);
  s.on("section:updated", handler);
  return () => s.off("section:updated", handler);
}

export function subscribeStudentNotifications({ email, userId }, onNotification) {
  const s = getSocket();
  const payload = {
    email: String(email || "").toLowerCase().trim(),
    userId: String(userId || "").trim(),
  };

  const join = () => {
    if (payload.email || payload.userId) {
      s.emit("student:subscribe", payload);
    }
  };

  join();
  s.on("connect", join);

  const handler = (notification) => onNotification?.(notification);
  const profileHandler = (live) => {
    onNotification?.({
      id: live?.notificationId || `profile-${live?.userId || 'updated'}`,
      type: "profile",
      title:
        live?.status === "Rejected"
          ? "Profile update not approved"
          : "Profile update approved",
      body: "",
      meta: live && typeof live === "object" ? live : {},
    });
  };
  s.on("notification:new", handler);
  s.on("profile:updated", profileHandler);

  return () => {
    s.off("connect", join);
    s.off("notification:new", handler);
    s.off("profile:updated", profileHandler);
  };
}
