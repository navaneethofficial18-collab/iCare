"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";

export default function HospitalRegister() {
  const router = useRouter();
  const [formData, setFormData] = useState({ email: "", password: "", name: "", inviteToken: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`/api/auth/hospital/register`, {
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
    <div className="flex items-center justify-center flex-1 bg-gradient-to-br from-emerald-50 via-white to-teal-50 p-4 sm:p-8">
      <div className="w-full max-w-md bg-white/70 backdrop-blur-xl p-8 rounded-2xl shadow-2xl border border-white/50">
        <div className="text-center mb-8 relative z-10">
          <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-600 mb-2 tracking-tight">iCare Hospital</h1>
          <p className="text-gray-500 font-medium">Complete securely using your Invite Token</p>
        </div>

        {error && <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-6 text-sm"><p>{error}</p></div>}

        <form onSubmit={handleRegister} className="space-y-4">
          <div><label className="block text-sm font-semibold text-gray-700 mb-1.5">Official Name</label><input type="text" name="name" className="w-full p-3 border border-gray-200 rounded-xl" value={formData.name} onChange={handleChange} required /></div>
          <div><label className="block text-sm font-semibold text-gray-700 mb-1.5">Contact Email</label><input type="email" name="email" className="w-full p-3 border border-gray-200 rounded-xl" value={formData.email} onChange={handleChange} required /></div>
          <div><label className="block text-sm font-semibold text-gray-700 mb-1.5">Password</label><input type="password" name="password" className="w-full p-3 border border-gray-200 rounded-xl" value={formData.password} onChange={handleChange} minLength={6} required /></div>
          <div><label className="block text-sm font-semibold text-gray-700 mb-1.5">Company Invite Token</label><input type="text" name="inviteToken" className="w-full p-3 border border-emerald-300 rounded-xl bg-emerald-50 text-emerald-900 font-mono tracking-wider" value={formData.inviteToken} onChange={handleChange} required /></div>
          
          <button type="submit" disabled={loading} className="w-full mt-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold py-3.5 px-4 rounded-xl">{loading ? "Registering..." : "Submit Registration"}</button>
        </form>

        <p className="text-center mt-6 text-sm font-medium text-gray-600 border-t border-gray-100 pt-6">
          <a href={`/login`} className="text-emerald-600 font-bold hover:text-emerald-800">Back to Login</a>
        </p>
      </div>
    </div>
  );
}
