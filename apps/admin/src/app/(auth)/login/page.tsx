"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLogin() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`/api/auth/admin/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Login failed");
      }
      router.push(`/dashboard/admin`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center flex-1 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-4 sm:p-8">
      <div className="w-full max-w-md bg-white/10 backdrop-blur-3xl p-8 rounded-3xl shadow-2xl border border-white/20">
        <div className="text-center mb-8 relative z-10">
          <h1 className="text-3xl font-extrabold text-white mb-2 tracking-tight">MedeonAI Company</h1>
          <p className="text-gray-400 font-medium">Administrator Login</p>
        </div>

        {error && <div className="bg-red-500/20 border border-red-500 text-red-100 p-4 rounded-lg mb-6 text-sm">{error}</div>}

        <form onSubmit={handleLogin} className="space-y-5">
          <div><label className="block text-sm font-semibold text-gray-300 mb-1.5">Admin Reference ID</label><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full p-3 bg-gray-800/50 border border-gray-600 text-white rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" required /></div>
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="block text-sm font-semibold text-gray-300">Passcode</label>
              <a href={`/forgot-password`} className="text-xs font-semibold text-blue-400 hover:text-blue-300 transition-colors">Forgot Passcode?</a>
            </div>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full p-3 bg-gray-800/50 border border-gray-600 text-white rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" required />
          </div>
          <button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 px-4 rounded-xl transition">{loading ? "Authorizing..." : "Admin Access"}</button>
        </form>
      </div>
    </div>
  );
}
