import React, { useState } from "react";
import QuestionList from "./components/QuestionList.jsx";
import UserList from "./components/UserList.jsx";
import NotificationPanel from "./components/NotificationPanel.jsx";
import LivePanel from "./components/LivePanel.jsx";

const tabs = [
  { id: "questions",     label: "📋 Questions" },
  { id: "users",        label: "👥 Users" },
  { id: "notifications",label: "🔔 Notifications" },
  { id: "live",         label: "🔴 Live" },
];

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
          {tabs.map(t => (
            <button
              key={t.id}
              className={`sidebar-link ${view === t.id ? "active" : ""}`}
              onClick={() => setView(t.id)}
            >
              {t.label}
            </button>
          ))}
        </nav>
      </aside>
      <main className="main">
        {view === "questions"      && <QuestionList />}
        {view === "users"          && <UserList />}
        {view === "notifications"  && <NotificationPanel />}
        {view === "live"           && <LivePanel />}
      </main>
    </div>
  );
}
