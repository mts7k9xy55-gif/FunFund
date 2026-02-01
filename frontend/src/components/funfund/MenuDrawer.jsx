import { X, MessageSquare, Users, Globe, Languages } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

const MOCK_DMS = [
  { id: "dm1", name: "Alice", unread: 2 },
  { id: "dm2", name: "Bob", unread: 0 },
];

const MOCK_GROUPS = [
  { id: "g1", name: "デザインチーム", unread: 5 },
  { id: "g2", name: "開発チーム", unread: 0 },
];

const MenuDrawer = ({ show, onClose, activeSpace, setActiveSpace, language, setLanguage }) => {
  if (!show) return null;

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black/50 z-40"
        onClick={onClose}
      />
      
      {/* Drawer */}
      <div className="fixed right-0 top-0 h-full w-80 bg-surface border-l border-border z-50 flex flex-col">
        {/* Header */}
        <div className="h-16 border-b border-border flex items-center justify-between px-4">
          <h2 className="text-lg font-bold text-text-primary">
            {language === "ja" ? "メニュー" : "Menu"}
          </h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-4 space-y-6">
            {/* Language */}
            <div>
              <div className="text-sm font-medium text-text-tertiary mb-2 flex items-center gap-2">
                <Languages className="h-4 w-4" />
                {language === "ja" ? "言語" : "Language"}
              </div>
              <div className="flex gap-2">
                <Button
                  variant={language === "ja" ? "default" : "outline"}
                  size="sm"
                  className="flex-1"
                  onClick={() => setLanguage("ja")}
                >
                  日本語
                </Button>
                <Button
                  variant={language === "en" ? "default" : "outline"}
                  size="sm"
                  className="flex-1"
                  onClick={() => setLanguage("en")}
                >
                  English
                </Button>
              </div>
            </div>

            {/* Public/SNS */}
            <div>
              <div className="text-sm font-medium text-text-tertiary mb-2 flex items-center gap-2">
                <Globe className="h-4 w-4" />
                {language === "ja" ? "掲示板（オープン）" : "Public Board"}
              </div>
              <button
                onClick={() => {
                  setActiveSpace({ type: "public", id: "general" });
                  onClose();
                }}
                className={`w-full text-left px-3 py-2 rounded text-base transition-colors ${
                  activeSpace.type === "public"
                    ? "bg-accent-light text-accent font-medium"
                    : "hover:bg-surface-hover text-text-secondary"
                }`}
              >
                {language === "ja" ? "全体議論" : "General Discussion"}
              </button>
            </div>

            {/* DM */}
            <div>
              <div className="text-sm font-medium text-text-tertiary mb-2 flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                DM
              </div>
              <div className="space-y-1">
                {MOCK_DMS.map((dm) => (
                  <button
                    key={dm.id}
                    onClick={() => {
                      setActiveSpace({ type: "dm", id: dm.id, name: dm.name });
                      onClose();
                    }}
                    className="w-full text-left px-3 py-2 rounded text-base hover:bg-surface-hover text-text-secondary transition-colors flex items-center justify-between"
                  >
                    <span>{dm.name}</span>
                    {dm.unread > 0 && (
                      <span className="bg-destructive text-white text-xs px-2 py-0.5 rounded-full">
                        {dm.unread}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Groups */}
            <div>
              <div className="text-sm font-medium text-text-tertiary mb-2 flex items-center gap-2">
                <Users className="h-4 w-4" />
                {language === "ja" ? "グループ" : "Groups"}
              </div>
              <div className="space-y-1">
                {MOCK_GROUPS.map((group) => (
                  <button
                    key={group.id}
                    onClick={() => {
                      setActiveSpace({ type: "group", id: group.id, name: group.name });
                      onClose();
                    }}
                    className="w-full text-left px-3 py-2 rounded text-base hover:bg-surface-hover text-text-secondary transition-colors flex items-center justify-between"
                  >
                    <span>{group.name}</span>
                    {group.unread > 0 && (
                      <span className="bg-destructive text-white text-xs px-2 py-0.5 rounded-full">
                        {group.unread}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </ScrollArea>
      </div>
    </>
  );
};

export default MenuDrawer;