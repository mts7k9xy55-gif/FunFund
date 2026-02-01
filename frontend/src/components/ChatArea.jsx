import { useState, useRef, useEffect } from "react";
import { Hash, FolderKanban, MoreVertical } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import MessageList from "./MessageList";
import MessageComposer from "./MessageComposer";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const CHANNEL_DATA = {
  general: {
    name: "general",
    description: "General discussion and announcements",
    type: "channel"
  },
  random: {
    name: "random",
    description: "Random conversations and fun",
    type: "channel"
  },
  design: {
    name: "design",
    description: "Design discussions and feedback",
    type: "channel"
  },
  engineering: {
    name: "engineering",
    description: "Engineering team discussions",
    type: "channel"
  },
  marketing: {
    name: "marketing",
    description: "Marketing strategies and campaigns",
    type: "channel"
  },
  "website-redesign": {
    name: "Website Redesign",
    description: "Q2 2024 Website Redesign Project",
    type: "project"
  },
  "mobile-app": {
    name: "Mobile App v2",
    description: "Mobile app version 2 development",
    type: "project"
  },
  "api-integration": {
    name: "API Integration",
    description: "Third-party API integration project",
    type: "project"
  },
};

export const ChatArea = ({ 
  activeChannel, 
  activeChannelType,
  setActiveChannel,
  setActiveChannelType 
}) => {
  const [messages, setMessages] = useState({});
  const scrollRef = useRef(null);

  const channelInfo = CHANNEL_DATA[activeChannel] || {
    name: activeChannel,
    description: "Channel description",
    type: activeChannelType
  };

  // Initialize with mock messages for demo
  useEffect(() => {
    if (!messages[activeChannel]) {
      const mockMessages = [
        {
          id: `${activeChannel}-1`,
          user: "Alice Johnson",
          avatar: "AJ",
          content: "Hey team! How's everyone doing today?",
          timestamp: new Date(Date.now() - 3600000).toISOString(),
          reactions: [{ emoji: "👋", count: 3 }]
        },
        {
          id: `${activeChannel}-2`,
          user: "Bob Smith",
          avatar: "BS",
          content: "Great! Just finished the new feature implementation. Ready for review.",
          timestamp: new Date(Date.now() - 3000000).toISOString(),
          reactions: [{ emoji: "🎉", count: 2 }]
        },
        {
          id: `${activeChannel}-3`,
          user: "Carol Williams",
          avatar: "CW",
          content: "Awesome work Bob! I'll take a look at it this afternoon. Also, we should discuss the design updates for the landing page.",
          timestamp: new Date(Date.now() - 1800000).toISOString(),
          reactions: []
        },
      ];
      setMessages((prev) => ({ ...prev, [activeChannel]: mockMessages }));
    }
  }, [activeChannel]);

  const handleSendMessage = (content) => {
    const newMessage = {
      id: `${activeChannel}-${Date.now()}`,
      user: "You",
      avatar: "YO",
      content,
      timestamp: new Date().toISOString(),
      reactions: [],
      isOwn: true
    };

    setMessages((prev) => ({
      ...prev,
      [activeChannel]: [...(prev[activeChannel] || []), newMessage]
    }));
  };

  const handleConvertToProject = (messageId) => {
    const message = messages[activeChannel]?.find(m => m.id === messageId);
    if (!message) return;

    // Create a new project based on the message
    const projectId = `project-${Date.now()}`;
    const projectName = message.content.slice(0, 30) + (message.content.length > 30 ? "..." : "");
    
    // Switch to the new project
    setActiveChannel(projectId);
    setActiveChannelType("project");

    // Initialize the project with the original message
    setMessages((prev) => ({
      ...prev,
      [projectId]: [{
        ...message,
        id: `${projectId}-1`,
      }]
    }));
  };

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Header */}
      <div className="h-14 border-b border-border flex items-center justify-between px-6">
        <div className="flex items-center gap-3">
          {channelInfo.type === "channel" ? (
            <Hash className="h-5 w-5 text-muted-foreground" />
          ) : (
            <FolderKanban className="h-5 w-5 text-muted-foreground" />
          )}
          <div>
            <h2 className="font-semibold text-base text-foreground">
              {channelInfo.name}
            </h2>
            <p className="text-xs text-muted-foreground">
              {channelInfo.description}
            </p>
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>View Details</DropdownMenuItem>
            <DropdownMenuItem>Notification Settings</DropdownMenuItem>
            <DropdownMenuItem>Add Members</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Messages Area */}
      <ScrollArea className="flex-1 custom-scrollbar" ref={scrollRef}>
        <MessageList 
          messages={messages[activeChannel] || []} 
          onConvertToProject={handleConvertToProject}
        />
      </ScrollArea>

      {/* Composer */}
      <div className="border-t border-border p-4">
        <MessageComposer onSend={handleSendMessage} channelName={channelInfo.name} />
      </div>
    </div>
  );
};

export default ChatArea;