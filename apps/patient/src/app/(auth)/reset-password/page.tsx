"use client";
import React, { Suspense, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

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

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = useMemo(() => searchParams.get("token") ?? "", [searchParams]);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!token) {
      setError("This reset link is invalid.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
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
    <div className="flex items-center justify-center flex-1 bg-gradient-to-br from-indigo-50 via-white to-sky-50 p-4 sm:p-8">
      <div className="w-full max-w-md bg-white/70 backdrop-blur-xl p-8 rounded-2xl shadow-2xl border border-white/50">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-sky-600 mb-2 tracking-tight">MedeonAI</h1>
          <p className="text-gray-500 font-medium">Choose a new password</p>
        </div>

        {message ? (
          <div className="space-y-5">
            <div className="bg-green-50 border-l-4 border-green-500 text-green-700 p-4 rounded-lg text-sm">
              <p>{message}</p>
            </div>
            <Link href="/login" className="block w-full text-center bg-gradient-to-r from-indigo-600 to-sky-600 text-white font-bold py-3.5 px-4 rounded-xl">
              Return to Login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded-lg text-sm">
                <p>{error}</p>
              </div>
            )}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">New Password</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full p-3 border border-gray-200 rounded-xl" required />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Confirm Password</label>
              <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full p-3 border border-gray-200 rounded-xl" required />
            </div>
            <button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-indigo-600 to-sky-600 text-white font-bold py-3.5 px-4 rounded-xl">
              {loading ? "Updating..." : "Update Password"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center flex-1 bg-gradient-to-br from-indigo-50 via-white to-sky-50 p-4 sm:p-8">Loading...</div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
