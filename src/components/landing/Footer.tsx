"use client";

import Link from "next/link";
import { TrendingUp } from "lucide-react";
import { FaXTwitter, FaGithub, FaDiscord } from "react-icons/fa6";

const footerLinks = {
  product: {
    title: "プロダクト",
    links: [
      { label: "特徴", href: "#features" },
      { label: "評価システム", href: "#evaluation" },
      { label: "料金", href: "#" },
    ],
  },
  resources: {
    title: "リソース",
    links: [
      { label: "ドキュメント", href: "#" },
      { label: "API", href: "#" },
      { label: "GitHub", href: "#" },
    ],
  },
  company: {
    title: "会社",
    links: [
      { label: "会社概要", href: "#" },
      { label: "お問い合わせ", href: "#" },
      { label: "プライバシー", href: "#" },
    ],
  },
};

const socialLinks = [
  { icon: FaXTwitter, href: "#", label: "Twitter" },
  { icon: FaGithub, href: "#", label: "GitHub" },
  { icon: FaDiscord, href: "#", label: "Discord" },
];

export default function Footer() {
  return (
    <footer className="bg-gray-50 border-t border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid lg:grid-cols-5 gap-8">
          {/* Logo & Description */}
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-blue-500 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">FunFund</span>
            </Link>
            <p className="text-gray-600 text-sm max-w-sm">
              重み付き評価で本当に価値あるプロジェクトを支援する、次世代クラウドファンディングプラットフォーム
            </p>
          </div>

          {/* Links */}
          {Object.values(footerLinks).map((section) => (
            <div key={section.title}>
              <h4 className="font-semibold text-gray-900 mb-4">{section.title}</h4>
              <ul className="space-y-3">
                {section.links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-gray-600 hover:text-gray-900 text-sm transition-colors"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom */}
        <div className="mt-12 pt-8 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-gray-500 text-sm">
            © 2026 FunFund. All rights reserved. MIT License
          </p>
          <div className="flex items-center gap-4">
            {socialLinks.map((social) => (
              <a
                key={social.label}
                href={social.href}
                className="w-10 h-10 bg-white rounded-full border border-gray-200 flex items-center justify-center text-gray-600 hover:text-indigo-600 hover:border-indigo-200 transition-colors"
                aria-label={social.label}
              >
                <social.icon className="w-5 h-5" />
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
