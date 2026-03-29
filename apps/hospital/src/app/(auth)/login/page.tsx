"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";

export default function HospitalLogin() {
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
      const res = await fetch(`/api/auth/hospital/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Login failed");
      }
      router.push(`/dashboard/hospital`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center flex-1 bg-gradient-to-br from-emerald-50 via-white to-teal-50 p-4 sm:p-8">
      <div className="w-full max-w-md bg-white/70 backdrop-blur-xl p-8 rounded-2xl shadow-2xl border border-white/50 relative overflow-hidden">
        <div className="text-center mb-8 relative z-10">
          <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-600 mb-2 tracking-tight">iCare Hospital</h1>
          <p className="text-gray-500 font-medium">Provider Portal Login</p>
        </div>

        {error && <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-6 text-sm">{error}</div>}

        <form onSubmit={handleLogin} className="space-y-5 relative z-10">
          <div><label className="block text-sm font-semibold text-gray-700 mb-1.5">Hospital Email</label><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full p-3 border border-gray-200 rounded-xl" required /></div>
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="block text-sm font-semibold text-gray-700">Password</label>
              <a href={`/forgot-password`} className="text-xs font-semibold text-emerald-600 hover:text-emerald-800 transition-colors">Forgot Password?</a>
            </div>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full p-3 border border-gray-200 rounded-xl" required />
          </div>
          <button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold py-3.5 px-4 rounded-xl">{loading ? "Authenticating..." : "Access Portal"}</button>
        </form>
        
        <p className="text-center mt-8 text-sm font-medium text-gray-600 relative z-10 border-t border-gray-100 pt-6">
          Have an invite? <a href={`/register`} className="text-emerald-600 font-bold hover:text-emerald-800">Register hospital &rarr;</a>
        </p>
      </div>
    </div>
  );
}
