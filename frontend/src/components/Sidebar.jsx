import { useState } from "react";
import { Hash, FolderKanban, ChevronDown, ChevronRight, Plus, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

const MOCK_CHANNELS = [
  { id: "general", name: "general", unread: 0 },
  { id: "random", name: "random", unread: 3 },
  { id: "design", name: "design", unread: 0 },
  { id: "engineering", name: "engineering", unread: 12 },
  { id: "marketing", name: "marketing", unread: 0 },
];

const MOCK_PROJECTS = [
  { id: "website-redesign", name: "Website Redesign", unread: 5 },
  { id: "mobile-app", name: "Mobile App v2", unread: 0 },
  { id: "api-integration", name: "API Integration", unread: 2 },
];

const Sidebar = ({ 
  activeChannel, 
  activeChannelType,
  setActiveChannel, 
  setActiveChannelType,
  darkMode,
  setDarkMode 
}) => {
  const [channelsExpanded, setChannelsExpanded] = useState(true);
  const [projectsExpanded, setProjectsExpanded] = useState(true);

  const handleChannelClick = (channelId, type) => {
    setActiveChannel(channelId);
    setActiveChannelType(type);
  };

  return (
    <div className="w-64 bg-sidebar border-r border-border flex flex-col h-full">
      {/* Header */}
      <div className="h-14 border-b border-border flex items-center justify-between px-4">
        <h1 className="font-semibold text-lg text-sidebar-foreground">Workspace</h1>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => setDarkMode(!darkMode)}
        >
          {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>
      </div>

      {/* Sidebar Content */}
      <ScrollArea className="flex-1 custom-scrollbar">
        <div className="p-2 space-y-1">
          {/* Channels Section */}
          <div className="py-1">
            <button
              onClick={() => setChannelsExpanded(!channelsExpanded)}
              className="w-full flex items-center justify-between px-2 py-1.5 text-sm font-medium text-sidebar-foreground hover:bg-sidebar-hover rounded-md transition-smooth"
            >
              <div className="flex items-center gap-1">
                {channelsExpanded ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
                <span>Channels</span>
              </div>
              <Plus className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100" />
            </button>
            
            {channelsExpanded && (
              <div className="mt-1 space-y-0.5">
                {MOCK_CHANNELS.map((channel) => (
                  <button
                    key={channel.id}
                    onClick={() => handleChannelClick(channel.id, "channel")}
                    className={cn(
                      "w-full flex items-center justify-between px-2 py-1.5 rounded-md text-sm transition-smooth group",
                      activeChannel === channel.id && activeChannelType === "channel"
                        ? "bg-sidebar-active text-accent-foreground font-medium"
                        : "text-sidebar-foreground hover:bg-sidebar-hover"
                    )}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <Hash className="h-4 w-4 flex-shrink-0" />
                      <span className="truncate">{channel.name}</span>
                    </div>
                    {channel.unread > 0 && (
                      <span className="flex-shrink-0 bg-destructive text-destructive-foreground text-xs font-medium px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                        {channel.unread}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Projects Section */}
          <div className="py-1">
            <button
              onClick={() => setProjectsExpanded(!projectsExpanded)}
              className="w-full flex items-center justify-between px-2 py-1.5 text-sm font-medium text-sidebar-foreground hover:bg-sidebar-hover rounded-md transition-smooth"
            >
              <div className="flex items-center gap-1">
                {projectsExpanded ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
                <span>Projects</span>
              </div>
              <Plus className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100" />
            </button>
            
            {projectsExpanded && (
              <div className="mt-1 space-y-0.5">
                {MOCK_PROJECTS.map((project) => (
                  <button
                    key={project.id}
                    onClick={() => handleChannelClick(project.id, "project")}
                    className={cn(
                      "w-full flex items-center justify-between px-2 py-1.5 rounded-md text-sm transition-smooth group",
                      activeChannel === project.id && activeChannelType === "project"
                        ? "bg-sidebar-active text-accent-foreground font-medium"
                        : "text-sidebar-foreground hover:bg-sidebar-hover"
                    )}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <FolderKanban className="h-4 w-4 flex-shrink-0" />
                      <span className="truncate">{project.name}</span>
                    </div>
                    {project.unread > 0 && (
                      <span className="flex-shrink-0 bg-destructive text-destructive-foreground text-xs font-medium px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                        {project.unread}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </ScrollArea>
    </div>
  );
};

export default Sidebar;
