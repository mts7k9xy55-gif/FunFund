"use client";

import { Search, ClipboardList, Sliders, RefreshCw } from "lucide-react";

const steps = [
  {
    number: 1,
    icon: Search,
    title: "プロジェクトを発見",
    description: "革新的なアイデアやプロジェクトを見つけて、詳細を確認します",
    color: "bg-blue-100 text-blue-600",
  },
  {
    number: 2,
    icon: ClipboardList,
    title: "5つの基準で評価",
    description:
      "革新性、実現可能性、社会的インパクト、チーム力、プレゼンテーションをそれぞれ評価",
    color: "bg-pink-100 text-pink-600",
  },
  {
    number: 3,
    icon: Sliders,
    title: "重みを設定",
    description: "あなたが重要だと思う基準に、より大きな重みを設定できます",
    color: "bg-purple-100 text-purple-600",
  },
  {
    number: 4,
    icon: RefreshCw,
    title: "リアルタイムで集計",
    description:
      "全ての評価が自動的に集計され、プロジェクトのスコアが更新されます",
    color: "bg-emerald-100 text-emerald-600",
  },
];

const weightDistribution = [
  { name: "革新性", weight: 30, color: "bg-indigo-500" },
  { name: "実現可能性", weight: 20, color: "bg-blue-500" },
  { name: "社会的インパクト", weight: 25, color: "bg-emerald-500" },
  { name: "チーム力", weight: 15, color: "bg-purple-500" },
  { name: "プレゼンテーション", weight: 10, color: "bg-pink-500" },
];

export default function HowItWorksSection() {
  return (
    <section className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            どのように動くのか
          </h2>
          <p className="text-lg text-gray-600">
            4つのシンプルなステップで、質的評価を実現
          </p>
        </div>

        {/* Steps */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-20">
          {steps.map((step) => (
            <div key={step.number} className="text-center">
              <div className="relative inline-flex items-center justify-center mb-6">
                <div
                  className={`w-16 h-16 rounded-2xl ${step.color} flex items-center justify-center`}
                >
                  <step.icon className="w-8 h-8" />
                </div>
                <div className="absolute -top-2 -left-2 w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                  {step.number}
                </div>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {step.title}
              </h3>
              <p className="text-gray-600 text-sm">{step.description}</p>
            </div>
          ))}
        </div>

        {/* Why Weighting Matters */}
        <div className="bg-white rounded-2xl p-8 sm:p-10 shadow-sm border border-gray-100">
          <div className="grid lg:grid-cols-2 gap-10 items-center">
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                なぜ重み付けが重要なのか？
              </h3>
              <p className="text-gray-600 mb-4">
                すべての評価基準が同じ重要度とは限りません。例えば、環境プロジェクトでは「社会的インパクト」を重視し、テクノロジープロジェクトでは「革新性」を重視するかもしれません。
              </p>
              <p className="text-gray-600">
                重み付けシステムにより、評価者の価値観を反映した、より公平で多様な評価が可能になります。
              </p>
            </div>

            {/* Weight Distribution Chart */}
            <div className="space-y-4">
              {weightDistribution.map((item) => (
                <div key={item.name} className="flex items-center gap-4">
                  <div className="w-32 text-sm text-gray-700">{item.name}</div>
                  <div className="flex-1 h-4 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${item.color} rounded-full`}
                      style={{ width: `${item.weight * 3}%` }}
                    />
                  </div>
                  <div className="w-12 text-sm font-medium text-gray-900 text-right">
                    {item.weight}%
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
