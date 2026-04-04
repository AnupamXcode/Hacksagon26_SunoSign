import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import "./index.css";

// Initialize theme on page load
(function() {
  const html = document.documentElement;
  const saved = localStorage.getItem('theme');
  const isDark = saved ? saved === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;
  
  if (isDark) {
    html.classList.add('dark');
  } else {
    html.classList.remove('dark');
  }
})();

createRoot(document.getElementById("root")).render(<App />);
