"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";

export default function UserRegister() {
  const router = useRouter();
  const [formData, setFormData] = useState({ email: "", password: "", fullName: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`/api/auth/patient/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Registration failed");
      }
      router.push(`/login`);
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
          <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-sky-600 mb-2 tracking-tight">iCare</h1>
          <p className="text-gray-500 font-medium tracking-wide">Create your Member account</p>
        </div>

        {error && <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-6 text-sm relative z-10"><p>{error}</p></div>}

        <form onSubmit={handleRegister} className="space-y-4 relative z-10">
          <div><label className="block text-sm font-semibold text-gray-700 mb-1.5">Full Name</label><input type="text" name="fullName" className="w-full p-3 border border-gray-200 rounded-xl" value={formData.fullName} onChange={handleChange} required /></div>
          <div><label className="block text-sm font-semibold text-gray-700 mb-1.5">Email</label><input type="email" name="email" className="w-full p-3 border border-gray-200 rounded-xl" value={formData.email} onChange={handleChange} required /></div>
          <div><label className="block text-sm font-semibold text-gray-700 mb-1.5">Password</label><input type="password" name="password" className="w-full p-3 border border-gray-200 rounded-xl" value={formData.password} onChange={handleChange} minLength={6} required /></div>
          
          <button type="submit" disabled={loading} className="w-full mt-2 bg-gradient-to-r from-indigo-600 to-sky-600 text-white font-bold py-3.5 px-4 rounded-xl">{loading ? "Registering..." : "Join iCare"}</button>
        </form>

        <p className="text-center mt-8 text-sm font-medium text-gray-600 relative z-10 border-t border-gray-100 pt-6">
          Already have an account? <a href={`/login`} className="text-indigo-600 font-bold hover:text-indigo-800">Sign in &rarr;</a>
        </p>
      </div>
    </div>
  );
}
