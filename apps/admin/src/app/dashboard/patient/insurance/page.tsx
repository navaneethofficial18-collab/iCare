"use client";
import React from "react";
import Link from "next/link";

export default function InsurancePage() {
  return (
    <div className="min-h-screen bg-gray-soft p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <Link href="/dashboard/patient" className="text-primary font-medium hover:underline">&larr; Back to Dashboard</Link>
        <h1 className="text-3xl font-bold text-gray-900">Health Insurance</h1>
        
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-blue-100 overflow-hidden relative">
            <div className="absolute top-0 right-0 bg-blue-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">Recommended</div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">iCare Platinum Plus</h2>
            <p className="text-gray-500 text-sm mb-4">Comprehensive coverage for families.</p>
            <div className="text-2xl font-black text-gray-800 mb-6">$120<span className="text-sm font-medium text-gray-500">/mo</span></div>
            <button className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition">Subscribe</button>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h2 className="text-xl font-bold text-gray-900 mb-2">iCare Base</h2>
            <p className="text-gray-500 text-sm mb-4">Essential coverage for individuals.</p>
            <div className="text-2xl font-black text-gray-800 mb-6">$45<span className="text-sm font-medium text-gray-500">/mo</span></div>
            <button className="w-full py-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-800 font-semibold rounded-lg transition">Select Plan</button>
          </div>
        </div>
      </div>
    </div>
  );
}
