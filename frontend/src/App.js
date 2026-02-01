import { useState } from "react";
import "@/App.css";
import { Toaster } from "@/components/ui/sonner";
import ChatLayout from "@/components/ChatLayout";

function App() {
  const [darkMode, setDarkMode] = useState(false);

  return (
    <div className={darkMode ? "dark" : ""}>
      <div className="App h-screen">
        <ChatLayout darkMode={darkMode} setDarkMode={setDarkMode} />
        <Toaster />
      </div>
    </div>
  );
}

export default App;