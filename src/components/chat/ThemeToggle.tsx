
import React, { useState, useEffect } from "react";
import { Moon, Sun } from "lucide-react";

const ThemeToggle: React.FC = () => {
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    // Check if user has already set a preference
    const isDarkMode = localStorage.getItem("darkMode") === "true" || 
                      window.matchMedia("(prefers-color-scheme: dark)").matches;
    setDarkMode(isDarkMode);
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
    }
  }, []);

  const toggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    localStorage.setItem("darkMode", newDarkMode.toString());
    
    if (newDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  return (
    <button
      onClick={toggleDarkMode}
      className="fixed bottom-4 right-4 bg-ecole-primary dark:bg-gray-700 text-white p-3 rounded-full shadow-lg hover:opacity-90 focus:outline-none z-50 transition-colors duration-300"
      aria-label="Toggle dark mode"
    >
      {darkMode ? (
        <Sun className="h-5 w-5" />
      ) : (
        <Moon className="h-5 w-5" />
      )}
    </button>
  );
};

export default ThemeToggle;
