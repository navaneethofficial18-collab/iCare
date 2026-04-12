"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";

async function readApiResponse(res: Response) {
  const contentType = res.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    throw new Error("The server returned an unexpected response.");
  }

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.error ?? "Request failed");
  }

  return data;
}

export default function HospitalForgotPassword() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await readApiResponse(res);
      setMessage(data.message);
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
          <p className="text-gray-500 font-medium">Provider Portal Recovery</p>
        </div>

        {message && (
          <div className="bg-green-50 text-green-700 p-4 rounded-lg mb-6 text-sm relative z-10 border border-green-100">
            <p>{message}</p>
          </div>
        )}
        {error && (
          <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-6 text-sm relative z-10 border border-red-100">
            <p>{error}</p>
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
