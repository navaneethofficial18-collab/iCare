"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";

export default function UserLogin() {
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
      const res = await fetch(`/api/auth/patient/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Login failed");
      }
      router.push(`/dashboard/patient`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center flex-1 bg-gradient-to-br from-indigo-50 via-white to-sky-50 p-4 sm:p-8">
      <div className="w-full max-w-md bg-white/70 backdrop-blur-xl p-8 rounded-2xl shadow-2xl border border-white/50 relative overflow-hidden">
        <div className="text-center mb-8 relative z-10">
          <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-sky-600 mb-2 tracking-tight">MedeonAI</h1>
          <p className="text-gray-500 font-medium">Sign in to your Member Portal</p>
        </div>

        {error && (
          <div className="bg-red-50/80 backdrop-blur-sm border-l-4 border-red-500 text-red-700 p-4 rounded-lg mb-6 text-sm relative z-10">
            <p className="font-semibold">Authentication Error</p>
            <p>{error}</p>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5 relative z-10">
          <div><label className="block text-sm font-semibold text-gray-700 mb-1.5">Email</label><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full p-3 border border-gray-200 rounded-xl" required /></div>
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="block text-sm font-semibold text-gray-700">Password</label>
              <a href={`/forgot-password`} className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors">Forgot Password?</a>
            </div>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full p-3 border border-gray-200 rounded-xl" required />
          </div>
          <button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-indigo-600 to-sky-600 text-white font-bold py-3.5 px-4 rounded-xl">{loading ? "Authenticating..." : "Secure Login"}</button>
        </form>
        
        <p className="text-center mt-8 text-sm font-medium text-gray-600 relative z-10 border-t border-gray-100 pt-6">
          New to MedeonAI? <a href={`/register`} className="text-indigo-600 font-bold hover:text-indigo-800 transition-colors">Create an account &rarr;</a>
        </p>
      </div>
    </div>
  );
}
