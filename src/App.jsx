import React, { useState } from "react";
import QuestionList from "./components/QuestionList.jsx";
import UserList from "./components/UserList.jsx";

export default function App() {
  const [view, setView] = useState("questions"); // "questions" | "users"

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <span className="dot" />
          QA Admin
        </div>
        <nav className="sidebar-nav">
          <button
            className={`sidebar-link ${view === "questions" ? "active" : ""}`}
            onClick={() => setView("questions")}
          >
            Questions
          </button>
          <button
            className={`sidebar-link ${view === "users" ? "active" : ""}`}
            onClick={() => setView("users")}
          >
            Users
          </button>
        </nav>
      </aside>

      <main className="main">
        {view === "questions" ? <QuestionList /> : <UserList />}
      </main>
    </div>
  );
}
