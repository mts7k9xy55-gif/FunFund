import { useState } from "react";
import Sidebar from "./Sidebar";
import ChatArea from "./ChatArea";

export const ChatLayout = ({ darkMode, setDarkMode }) => {
  const [activeChannel, setActiveChannel] = useState("general");
  const [activeChannelType, setActiveChannelType] = useState("channel");

  return (
    <div className="flex h-full overflow-hidden bg-background">
      <Sidebar 
        activeChannel={activeChannel}
        activeChannelType={activeChannelType}
        setActiveChannel={setActiveChannel}
        setActiveChannelType={setActiveChannelType}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
      />
      <ChatArea 
        activeChannel={activeChannel}
        activeChannelType={activeChannelType}
        setActiveChannel={setActiveChannel}
        setActiveChannelType={setActiveChannelType}
      />
    </div>
  );
};

export default ChatLayout;