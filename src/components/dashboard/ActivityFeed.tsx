// src/components/dashboard/ActivityFeed.tsx
// アクティビティフィードコンポーネント

"use client";

import { Clock, Star, Users, TrendingUp } from "lucide-react";

interface Activity {
  id: string;
  type: "evaluation" | "project" | "funding" | "comment";
  title: string;
  description: string;
  timestamp: number;
  user?: string;
}

interface ActivityFeedProps {
  activities?: Activity[];
  language?: "ja" | "en";
}

const activityIcons = {
  evaluation: Star,
  project: TrendingUp,
  funding: Users,
  comment: Clock,
};

const activityColors = {
  evaluation: "bg-yellow-100 text-yellow-700",
  project: "bg-indigo-100 text-indigo-700",
  funding: "bg-green-100 text-green-700",
  comment: "bg-gray-100 text-gray-700",
};

export default function ActivityFeed({
  activities = [],
  language = "ja",
}: ActivityFeedProps) {
  const formatTime = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 60) {
      return `${minutes}${language === "ja" ? "分前" : "m ago"}`;
    } else if (hours < 24) {
      return `${hours}${language === "ja" ? "時間前" : "h ago"}`;
    } else {
      return `${days}${language === "ja" ? "日前" : "d ago"}`;
    }
  };

  if (activities.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
        <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          {language === "ja" ? "アクティビティがありません" : "No activities"}
        </h3>
        <p className="text-sm text-gray-600">
          {language === "ja"
            ? "新しいアクティビティが表示されます"
            : "New activities will appear here"}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">
        {language === "ja" ? "アクティビティ" : "Activity Feed"}
      </h2>
      <div className="space-y-4">
        {activities.map((activity) => {
          const Icon = activityIcons[activity.type];
          const colorClass = activityColors[activity.type];

          return (
            <div
              key={activity.id}
              className="flex items-start gap-4 p-4 rounded-lg hover:bg-gray-50 transition-colors animate-fade-in"
            >
              <div className={`p-2 rounded-lg ${colorClass}`}>
                <Icon className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-sm font-semibold text-gray-900 truncate">
                    {activity.title}
                  </h3>
                  <span className="text-xs text-gray-500 ml-2 flex-shrink-0">
                    {formatTime(activity.timestamp)}
                  </span>
                </div>
                <p className="text-sm text-gray-600 line-clamp-2">
                  {activity.description}
                </p>
                {activity.user && (
                  <p className="text-xs text-gray-500 mt-1">
                    {language === "ja" ? "by" : "by"} {activity.user}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
