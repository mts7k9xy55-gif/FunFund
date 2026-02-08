"use client";

import { useState } from "react";
import { Lightbulb, CircleCheck, Globe, Users, Presentation } from "lucide-react";

interface Criterion {
  id: string;
  name: string;
  icon: React.ElementType;
  score: number;
  weight: number;
  color: string;
}

const initialCriteria: Criterion[] = [
  { id: "innovation", name: "革新性", icon: Lightbulb, score: 4, weight: 25, color: "text-amber-500" },
  { id: "feasibility", name: "実現可能性", icon: CircleCheck, score: 5, weight: 20, color: "text-emerald-500" },
  { id: "impact", name: "社会的インパクト", icon: Globe, score: 5, weight: 30, color: "text-blue-500" },
  { id: "team", name: "チーム力", icon: Users, score: 3, weight: 15, color: "text-purple-500" },
  { id: "presentation", name: "プレゼンテーション", icon: Presentation, score: 4, weight: 10, color: "text-pink-500" },
];

export default function DemoSection() {
  const [criteria, setCriteria] = useState(initialCriteria);

  const updateCriterion = (id: string, field: "score" | "weight", value: number) => {
    setCriteria((prev) =>
      prev.map((c) => (c.id === id ? { ...c, [field]: value } : c))
    );
  };

  // Calculate weighted average
  const totalWeight = criteria.reduce((sum, c) => sum + c.weight, 0);
  const weightedSum = criteria.reduce((sum, c) => sum + c.score * c.weight, 0);
  const weightedAverage = totalWeight > 0 ? weightedSum / totalWeight : 0;
  const percentage = (weightedAverage / 5) * 100;

  return (
    <section id="evaluation" className="py-20 bg-gradient-to-br from-indigo-600 via-blue-600 to-indigo-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            インタラクティブデモ
          </h2>
          <p className="text-lg text-indigo-100">
            実際に重み付き評価システムを体験してみましょう
          </p>
        </div>

        {/* Demo Card */}
        <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-2xl max-w-4xl mx-auto">
          <h3 className="text-xl font-semibold text-gray-900 mb-2">評価システム</h3>
          <p className="text-gray-600 mb-6">
            スライダーを動かして、各基準のスコアと重みを調整してみましょう
          </p>

          {/* Criteria Sliders */}
          <div className="space-y-6 mb-8">
            {criteria.map((criterion) => (
              <div key={criterion.id} className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <criterion.icon className={`w-5 h-5 ${criterion.color}`} />
                    <span className="font-medium text-gray-900">{criterion.name}</span>
                  </div>
                  <div className="text-sm text-gray-600">
                    スコア: {criterion.score}/5　重み: {criterion.weight}%
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Score Slider */}
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">
                      スコア (1-5)
                    </label>
                    <input
                      type="range"
                      min="1"
                      max="5"
                      value={criterion.score}
                      onChange={(e) =>
                        updateCriterion(criterion.id, "score", parseInt(e.target.value))
                      }
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                    />
                  </div>

                  {/* Weight Slider */}
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">
                      重み (0-100%)
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={criterion.weight}
                      onChange={(e) =>
                        updateCriterion(criterion.id, "weight", parseInt(e.target.value))
                      }
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Result */}
          <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
            <div className="grid sm:grid-cols-2 gap-6">
              <div>
                <div className="text-sm text-gray-600 mb-1">重み付き平均スコア</div>
                <div className="text-4xl font-bold text-indigo-600">
                  {weightedAverage.toFixed(2)} / 5.00
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600 mb-1">パーセンテージ</div>
                <div className="text-4xl font-bold text-indigo-600">
                  {percentage.toFixed(1)}%
                </div>
              </div>
            </div>
            <div className="mt-4 text-center text-sm text-gray-500">
              計算式: Σ(スコア × 重み) / Σ(重み)
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
