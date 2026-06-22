import React, { useState } from "react";
import QuestionList from "./components/QuestionList.jsx";
import UserList from "./components/UserList.jsx";
import NotificationPanel from "./components/NotificationPanel.jsx";

export default function App() {
  const [view, setView] = useState("questions");

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <span className="dot" />
          QA Admin
        </div>
        <nav className="sidebar-nav">
          <button className={`sidebar-link ${view === "questions" ? "active" : ""}`}
            onClick={() => setView("questions")}>
            📋 Questions
          </button>
          <button className={`sidebar-link ${view === "users" ? "active" : ""}`}
            onClick={() => setView("users")}>
            👥 Users
          </button>
          <button className={`sidebar-link ${view === "notifications" ? "active" : ""}`}
            onClick={() => setView("notifications")}>
            🔔 Notifications
          </button>
        </nav>
      </aside>

      <main className="main">
        {view === "questions" && <QuestionList />}
        {view === "users" && <UserList />}
        {view === "notifications" && <NotificationPanel />}
      </main>
    </div>
  );
}
