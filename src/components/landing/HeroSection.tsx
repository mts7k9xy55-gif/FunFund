"use client";

import Link from "next/link";
import { ArrowRight, TrendingUp } from "lucide-react";

export default function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-gray-50 to-white py-16 lg:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="space-y-8">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full border border-gray-200 shadow-sm">
              <TrendingUp className="w-4 h-4 text-indigo-500" />
              <span className="text-sm text-gray-600">重み付き評価システム搭載</span>
            </div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight">
              <span className="text-gray-900">質的評価で </span>
              <span className="bg-gradient-to-r from-indigo-500 to-blue-500 bg-clip-text text-transparent">
                本当に価
              </span>
              <br />
              <span className="bg-gradient-to-r from-indigo-500 to-blue-500 bg-clip-text text-transparent">
                値ある
              </span>
              <span className="text-gray-900"> プロジェクト</span>
              <br />
              <span className="text-gray-900">を支援</span>
            </h1>

            {/* Description */}
            <p className="text-lg text-gray-600 max-w-xl">
              FunFundは単なる人気投票ではありません。革新性、実現可能性、社会的インパクト、チーム力、プレゼンテーションの5つの基準で、プロジェクトを多角的に評価します。
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-wrap gap-4">
              <Link
                href="/public"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-blue-500 text-white px-6 py-3 rounded-lg font-medium hover:opacity-90 transition-opacity"
              >
                プロジェクトを見る
                <ArrowRight className="w-4 h-4" />
              </Link>
              <a
                href="#evaluation"
                className="inline-flex items-center gap-2 bg-white text-gray-700 px-6 py-3 rounded-lg font-medium border border-gray-200 hover:bg-gray-50 transition-colors"
              >
                評価システムを学ぶ
              </a>
            </div>
          </div>

          {/* Right Image */}
          <div className="relative">
            <div className="relative rounded-2xl overflow-hidden shadow-2xl">
              <img
                src="https://images.unsplash.com/photo-1745847768382-816bfc32e1bb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxpbm5vdmF0aW9uJTIwdGVjaG5vbG9neSUyMGNvbGxhYm9yYXRpb258ZW58MXx8fHwxNzcwMjA4MzQyfDA&ixlib=rb-4.1.0&q=80&w=1080"
                alt="Innovation"
                className="w-full h-auto object-cover"
              />
            </div>
            {/* Decorative gradient blur */}
            <div className="absolute -z-10 -top-10 -right-10 w-72 h-72 bg-gradient-to-br from-indigo-400/30 to-blue-400/30 rounded-full blur-3xl" />
          </div>
        </div>
      </div>
    </section>
  );
}
