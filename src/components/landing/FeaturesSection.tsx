"use client";

import { Layers, Sliders, RefreshCw } from "lucide-react";

const features = [
  {
    icon: Layers,
    title: "5つの評価軸",
    description:
      "革新性、実現可能性、社会的インパクト、チーム力、プレゼンテーションで多角的に評価",
    color: "bg-indigo-100 text-indigo-600",
  },
  {
    icon: Sliders,
    title: "重み付けシステム",
    description:
      "評価者が各基準に重みを設定でき、より柔軟で公平な評価が可能",
    color: "bg-pink-100 text-pink-600",
  },
  {
    icon: RefreshCw,
    title: "リアルタイム集計",
    description:
      "Convexによるリアルタイム更新で、常に最新の評価スコアを確認可能",
    color: "bg-blue-100 text-blue-600",
  },
];

export default function FeaturesSection() {
  return (
    <section id="features" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            なぜ<span className="text-indigo-600">FunFund</span>なのか
          </h2>
          <p className="text-lg text-gray-600">
            従来のクラウドファンディングを超えた、新しい評価の形
          </p>
        </div>

        {/* Feature Cards */}
        <div className="grid md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
            >
              <div
                className={`w-14 h-14 rounded-xl ${feature.color} flex items-center justify-center mb-6`}
              >
                <feature.icon className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                {feature.title}
              </h3>
              <p className="text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
