"use client";

import Link from "next/link";
import { TrendingUp } from "lucide-react";

export default function Header() {
  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-blue-500 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">FunFund</span>
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            <a
              href="#features"
              className="text-gray-600 hover:text-gray-900 transition-colors"
            >
              特徴
            </a>
            <a
              href="#evaluation"
              className="text-gray-600 hover:text-gray-900 transition-colors"
            >
              評価システム
            </a>
            <a
              href="#dashboard"
              className="text-gray-600 hover:text-gray-900 transition-colors"
            >
              ダッシュボード
            </a>
          </nav>

          {/* CTA Button */}
          <Link
            href="/public"
            className="bg-gradient-to-r from-indigo-500 to-blue-500 text-white px-5 py-2 rounded-lg font-medium hover:opacity-90 transition-opacity"
          >
            始める
          </Link>
        </div>
      </div>
    </header>
  );
}
