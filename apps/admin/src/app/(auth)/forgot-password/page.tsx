"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminForgotPassword() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setMessage("If an admin profile exists, secure instructions have been sent.");
      setLoading(false);
    }, 1000);
  };

  return (
    <div className="flex items-center justify-center flex-1 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-4 sm:p-8">
      <div className="w-full max-w-md bg-white/10 backdrop-blur-3xl p-8 rounded-3xl shadow-2xl border border-white/20">
        <div className="text-center mb-8 relative z-10">
          <h1 className="text-3xl font-extrabold text-white mb-2 tracking-tight">iCare Company</h1>
          <p className="text-gray-400 font-medium">Administrator Recovery</p>
        </div>

        {message && (
          <div className="bg-emerald-500/20 border border-emerald-500 text-emerald-100 p-4 rounded-lg mb-6 text-sm">
            <p>{message}</p>
          </div>
        )}

        {!message ? (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-1.5">Admin Reference ID</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full p-3 bg-gray-800/50 border border-gray-600 text-white rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" required placeholder="admin@icare.com" />
            </div>
            <button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 px-4 rounded-xl transition">{loading ? "Authorizing Request..." : "Request Reset"}</button>
          </form>
        ) : (
          <button onClick={() => router.push('/login')} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 px-4 rounded-xl transition">Return to Admin Access</button>
        )}
        
        <p className="text-center mt-8 text-sm font-medium text-gray-400 relative z-10 pt-6">
          <a href={`/login`} className="text-blue-400 font-bold hover:text-blue-300 transition-colors">&larr; Back to login</a>
        </p>
      </div>
    </div>
  );
}
