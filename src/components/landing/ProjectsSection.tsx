"use client";

import Link from "next/link";
import { Star, ArrowRight } from "lucide-react";

interface Project {
  id: string;
  image: string;
  category: string;
  categoryColor: string;
  title: string;
  description: string;
  score: number;
  evaluations: number;
  fundingPercent: number;
  fundingCurrent: string;
  fundingGoal: string;
  daysLeft: number;
}

const projects: Project[] = [
  {
    id: "solar",
    image:
      "https://images.unsplash.com/photo-1628206554160-63e8c921e398?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800",
    category: "環境・エネルギー",
    categoryColor: "bg-emerald-100 text-emerald-700",
    title: "地域密着型ソーラーパネル共同購入",
    description:
      "地域コミュニティで太陽光発電を共同導入し、エネルギーコストを削減。持続可能な社会を実現します。",
    score: 4.52,
    evaluations: 28,
    fundingPercent: 85,
    fundingCurrent: "¥4,250,000",
    fundingGoal: "¥5,000,000",
    daysLeft: 15,
  },
  {
    id: "education",
    image:
      "https://images.unsplash.com/photo-1759143103113-6696d40598bf?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800",
    category: "教育・テクノロジー",
    categoryColor: "bg-blue-100 text-blue-700",
    title: "プログラミング教育プラットフォーム",
    description:
      "子どもたちに楽しく学べるプログラミング教育を。AIを活用した個別最適化学習システム。",
    score: 4.38,
    evaluations: 35,
    fundingPercent: 70,
    fundingCurrent: "¥2,100,000",
    fundingGoal: "¥3,000,000",
    daysLeft: 22,
  },
  {
    id: "healthcare",
    image:
      "https://images.unsplash.com/photo-1695048441368-e913925d1e54?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800",
    category: "ヘルスケア",
    categoryColor: "bg-pink-100 text-pink-700",
    title: "遠隔医療診断システム",
    description:
      "地方在住者でも専門医の診断を受けられる、AIアシスト付き遠隔医療プラットフォーム。",
    score: 4.65,
    evaluations: 42,
    fundingPercent: 70,
    fundingCurrent: "¥5,600,000",
    fundingGoal: "¥8,000,000",
    daysLeft: 30,
  },
];

export default function ProjectsSection() {
  return (
    <section id="dashboard" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            注目のプロジェクト
          </h2>
          <p className="text-lg text-gray-600">
            高評価を獲得しているプロジェクトをご覧ください
          </p>
        </div>

        {/* Project Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {projects.map((project) => (
            <div
              key={project.id}
              className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-lg transition-shadow"
            >
              {/* Image */}
              <div className="relative h-48 overflow-hidden">
                <img
                  src={project.image}
                  alt={project.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-3 left-3">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${project.categoryColor}`}
                  >
                    {project.category}
                  </span>
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {project.title}
                </h3>
                <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                  {project.description}
                </p>

                {/* Score */}
                <div className="flex items-center gap-4 mb-4">
                  <div className="flex items-center gap-1">
                    <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
                    <span className="text-sm text-gray-600">重み付きスコア</span>
                  </div>
                  <span className="text-xl font-bold text-indigo-600">
                    {project.score}
                  </span>
                  <span className="text-xs text-gray-500">
                    {project.evaluations}件の評価
                  </span>
                </div>

                {/* Funding Progress */}
                <div className="mb-4">
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-gray-600">資金調達</span>
                    <span className="font-medium text-gray-900">
                      {project.fundingPercent}%
                    </span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-indigo-500 to-blue-500 rounded-full"
                      style={{ width: `${project.fundingPercent}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-500 mt-1">
                    <span>
                      {project.fundingCurrent} / {project.fundingGoal}
                    </span>
                    <span>{project.daysLeft}日</span>
                  </div>
                </div>

                {/* CTA */}
                <Link
                  href="/public"
                  className="inline-flex items-center gap-2 text-indigo-600 font-medium text-sm hover:text-indigo-700"
                >
                  プロジェクトを見る
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* View All Button */}
        <div className="text-center">
          <Link
            href="/public"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-blue-500 text-white px-8 py-3 rounded-lg font-medium hover:opacity-90 transition-opacity"
          >
            全てのプロジェクトを見る
          </Link>
        </div>
      </div>
    </section>
  );
}
