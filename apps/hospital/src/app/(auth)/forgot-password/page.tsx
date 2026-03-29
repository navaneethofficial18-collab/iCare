"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";

export default function HospitalForgotPassword() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setMessage("If a provider account exists for this email, we have sent a password reset link.");
      setLoading(false);
    }, 1000);
  };

  return (
    <div className="flex items-center justify-center flex-1 bg-gradient-to-br from-emerald-50 via-white to-teal-50 p-4 sm:p-8">
      <div className="w-full max-w-md bg-white/70 backdrop-blur-xl p-8 rounded-2xl shadow-2xl border border-white/50 relative overflow-hidden">
        <div className="text-center mb-8 relative z-10">
          <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-600 mb-2 tracking-tight">iCare Hospital</h1>
          <p className="text-gray-500 font-medium">Provider Portal Recovery</p>
        </div>

        {message && (
          <div className="bg-green-50 text-green-700 p-4 rounded-lg mb-6 text-sm relative z-10 border border-green-100">
            <p>{message}</p>
          </div>
        )}

        {!message ? (
          <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Hospital / Provider Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full p-3 border border-gray-200 rounded-xl outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors" required placeholder="admin@hospital.com" />
            </div>
            <button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold py-3.5 px-4 rounded-xl shadow-md hover:shadow-lg transition-all">{loading ? "Sending..." : "Recover Account"}</button>
          </form>
        ) : (
          <button onClick={() => router.push('/login')} className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold py-3.5 px-4 rounded-xl shadow-md hover:shadow-lg transition-all relative z-10">Return to Login</button>
        )}
        
        <p className="text-center mt-8 text-sm font-medium text-gray-600 relative z-10 border-t border-gray-100 pt-6">
          Remembere your password? <a href={`/login`} className="text-emerald-600 font-bold hover:text-emerald-800 transition-colors">Sign in to portal &rarr;</a>
        </p>
      </div>
    </div>
  );
}
