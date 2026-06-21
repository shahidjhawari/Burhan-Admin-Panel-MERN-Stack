import React from "react";
import QuestionList from "./components/QuestionList.jsx";

export default function App() {
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <span className="dot" />
          QA Admin
        </div>
        <nav className="sidebar-nav">
          <button className="sidebar-link active">Questions</button>
        </nav>
      </aside>

      <main className="main">
        <QuestionList />
      </main>
    </div>
  );
}
