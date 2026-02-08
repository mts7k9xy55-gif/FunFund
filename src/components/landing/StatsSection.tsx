"use client";

const stats = [
  { value: "5", label: "評価基準" },
  { value: "100%", label: "リアルタイム更新" },
  { value: "∞", label: "柔軟な重み付け" },
  { value: "MIT", label: "オープンソース" },
];

export default function StatsSection() {
  return (
    <section className="py-12 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <div key={index} className="text-center">
              <div className="text-4xl sm:text-5xl font-bold text-indigo-600 mb-2">
                {stat.value}
              </div>
              <div className="text-sm text-gray-600">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
