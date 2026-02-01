import { ScrollArea } from "@/components/ui/scroll-area";
import FeedItem from "./FeedItem";

const DiscussionFeed = ({ items, onEvaluate, onReply, language }) => {
  // Build hierarchical structure
  const buildTree = () => {
    const itemMap = {};
    const rootItems = [];

    // First pass: create map
    items.forEach(item => {
      itemMap[item.id] = { ...item, children: [] };
    });

    // Second pass: build tree
    items.forEach(item => {
      if (item.targetId && itemMap[item.targetId]) {
        itemMap[item.targetId].children.push(itemMap[item.id]);
      } else if (!item.targetId) {
        rootItems.push(itemMap[item.id]);
      }
    });

    return rootItems;
  };

  const tree = buildTree();

  return (
    <ScrollArea className="h-full minimal-scrollbar">
      <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">
        {tree.length === 0 ? (
          <div className="text-center py-20 text-text-tertiary text-base">
            {language === "ja" ? "まだ投稿がありません" : "No posts yet"}
          </div>
        ) : (
          tree.map((item) => (
            <FeedItem
              key={item.id}
              item={item}
              onEvaluate={onEvaluate}
              onReply={onReply}
              language={language}
              depth={0}
            />
          ))
        )}
      </div>
    </ScrollArea>
  );
};

export default DiscussionFeed;