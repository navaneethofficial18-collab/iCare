"use client";
import React, { useState } from "react";
import Link from "next/link";

export default function LoansPage() {
  const [status, setStatus] = useState<"idle" | "submitting" | "approved">("idle");

  const applyForLoan = (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("submitting");
    setTimeout(() => {
      setStatus("approved");
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-gray-soft p-6">
      <div className="max-w-3xl mx-auto space-y-6">
        <Link href="/dashboard/patient" className="text-primary font-medium hover:underline">&larr; Back to Dashboard</Link>
        <h1 className="text-3xl font-bold text-gray-900">Healthcare Financing</h1>
        
        {status === "approved" ? (
          <div className="bg-green-50 p-8 rounded-2xl border border-green-200 text-center">
            <div className="text-5xl mb-4">🎉</div>
            <h2 className="text-2xl font-bold text-green-800 mb-2">Instant Approval!</h2>
            <p className="text-green-700">Your medical loan of $5,000 has been approved and disbursed directly to the requested hospital system.</p>
          </div>
        ) : (
          <form className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-4" onSubmit={applyForLoan}>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Loan Amount ($)</label>
              <input type="number" required min={500} max={20000} className="w-full p-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-primary outline-none" defaultValue={5000} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Reason for Loan</label>
              <textarea required className="w-full p-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-primary outline-none" placeholder="E.g., Emergency Surgery"></textarea>
            </div>
            <button 
              type="submit" 
              disabled={status === "submitting"}
              className="w-full py-3 bg-gray-900 text-white font-semibold rounded-lg hover:bg-gray-800 transition"
            >
              {status === "submitting" ? "Processing Analysis..." : "Submit Application"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
