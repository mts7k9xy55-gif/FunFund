"use client";

import dynamic from "next/dynamic";

const FunFundApp = dynamic(() => import("@/components/NewFunFundApp"), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-purple-50">
      <div className="text-xl text-gray-600">Loading FunFund...</div>
    </div>
  ),
});

export default function Home() {
  return <FunFundApp />;
}
