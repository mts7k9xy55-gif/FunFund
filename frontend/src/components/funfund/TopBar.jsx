import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";

const TopBar = ({ onMenuClick, activeSpace, language }) => {
  const getSpaceName = () => {
    if (activeSpace.type === "dm") return language === "ja" ? "DM" : "DM";
    if (activeSpace.type === "group") return activeSpace.name;
    return language === "ja" ? "全体議論" : "Public Discussion";
  };

  return (
    <div className="h-16 border-b border-border flex items-center px-6 bg-surface">
      <h1 className="text-xl font-bold text-text-primary">FunFund</h1>
      <div className="ml-6 text-base text-text-secondary">
        {getSpaceName()}
      </div>
      <Button
        variant="ghost"
        size="lg"
        className="ml-auto h-12 w-12"
        onClick={onMenuClick}
      >
        <Menu className="h-7 w-7" />
      </Button>
    </div>
  );
};

export default TopBar;