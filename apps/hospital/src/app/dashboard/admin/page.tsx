"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Loader from "@/components/ui/Loader";

export default function AdminDashboard() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // state for Hospitals & Invites
  const [hospitals, setHospitals] = useState<any[]>([]);
  const [invites, setInvites] = useState<any[]>([]);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteMessage, setInviteMessage] = useState("");

  useEffect(() => {
    async function init() {
      try {
        const res = await fetch("/api/auth/me");
        if (!res.ok) throw new Error("Not logged in");
        const data = await res.json();
        if (data.user.role !== "admin") throw new Error("unauthorized");
        setProfile(data.user);

        // Fetch data
        const [hospReq, invReq] = await Promise.all([
          fetch("/api/admin/hospitals"),
          fetch("/api/admin/hospitals/invite")
        ]);

        if (hospReq.ok) setHospitals(await hospReq.json());
        if (invReq.ok) setInvites(await invReq.json());

      } catch (err) {
        router.push("/login/admin"); 
      } finally {
        setLoading(false);
      }
    }
    init();
  }, [router]);

  const generateInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviteLoading(true);
    setInviteMessage("");
    try {
      const res = await fetch("/api/admin/hospitals/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setInviteMessage(`Invite Generated! Token: ${data.token}`);
      setInviteEmail("");
      
      // Refresh invites
      const invReq = await fetch("/api/admin/hospitals/invite");
      if (invReq.ok) setInvites(await invReq.json());

    } catch (err: any) {
      setInviteMessage("Error: " + err.message);
    } finally {
      setInviteLoading(false);
    }
  };

  const updateHospitalStatus = async (id: string, status: "approved" | "rejected") => {
    try {
      const res = await fetch("/api/admin/hospitals", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status })
      });
      if (res.ok) {
        setHospitals(hospitals.map(h => h.id === id ? { ...h, approvalStatus: status } : h));
      }
    } catch {
      alert("Failed to update status");
    }
  };

  if (loading) return <div className="h-screen flex items-center justify-center"><Loader size="lg" /></div>;

  return (
    <div className="min-h-screen bg-gray-50 pb-24 font-sans">
      <header className="bg-white shadow-sm px-6 py-4 flex justify-between items-center sticky top-0 z-40 border-b border-gray-200">
        <div className="font-bold text-xl text-indigo-900 flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex justify-center items-center text-sm shadow-md">CS</div>
          MedeonAI 
          <span className="text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-full font-bold text-xs ml-2 border border-indigo-100 uppercase tracking-wide">Admin Portal</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm font-semibold text-gray-700 hidden md:block bg-gray-100 px-3 py-1 rounded-full">{profile?.email}</span>
          <button onClick={() => { fetch("/api/auth/logout", { method: "POST" }).then(() => router.push("/login/admin")); }} className="text-sm text-red-600 hover:text-white hover:bg-red-500 font-semibold transition border border-red-200 px-4 py-1.5 rounded-lg">Logout</button>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-10 border-b border-gray-200 pb-6">
          <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">Platform Operations</h1>
          <p className="text-gray-500 mt-2 text-lg">Manage hospital onboardings, invites, and system-wide policies securely.</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          
          {/* HOSPITAL ONBOARDING */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
            <div className="px-6 py-5 border-b border-gray-100 bg-emerald-50/50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-emerald-600 text-2xl">🏥</span>
                <h2 className="text-lg font-bold text-gray-900">Hospital Onboarding</h2>
              </div>
            </div>
            
            <div className="p-6 bg-white border-b border-gray-100">
              <h3 className="font-bold text-gray-800 tracking-wide text-sm mb-4">SEND NEW INVITE</h3>
              <form onSubmit={generateInvite} className="flex gap-3">
                <input 
                  type="email" 
                  required 
                  placeholder="Hospital Contact Email" 
                  className="w-full p-2.5 rounded-lg border border-gray-300 outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50 text-sm"
                  value={inviteEmail}
                  onChange={e => setInviteEmail(e.target.value)}
                />
                <button type="submit" disabled={inviteLoading} className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-lg font-bold text-sm transition shadow-sm whitespace-nowrap">
                  {inviteLoading ? "..." : "Generate Token"}
                </button>
              </form>
              {inviteMessage && (
                <div className="mt-4 p-3 rounded-lg bg-indigo-50 text-indigo-700 text-sm font-mono border border-indigo-100 overflow-x-auto">
                  {inviteMessage}
                </div>
              )}
            </div>

            <div className="p-0 flex-1 bg-gray-50 overflow-y-auto max-h-[400px]">
              <div className="px-6 py-3 border-b border-gray-200 bg-white sticky top-0"><h3 className="font-bold text-xs text-gray-500 uppercase tracking-widest">Active Invites</h3></div>
              {invites.length === 0 ? (
                <p className="p-6 text-gray-500 text-sm text-center">No active hospital invitations.</p>
              ) : (
                <ul className="divide-y divide-gray-200">
                  {invites.map(inv => (
                    <li key={inv.id} className="p-4 flex justify-between items-center bg-white hover:bg-gray-50 transition">
                      <div>
                        <p className="font-semibold text-gray-900 text-sm">{inv.email}</p>
                        <p className="font-mono text-xs text-gray-500 mt-1">{inv.token}</p>
                      </div>
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-md uppercase tracking-wider ${inv.status === 'accepted' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>{inv.status}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* HOSPITAL DIRECTORY & APPROVALS */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-100 bg-indigo-50/50 flex flex-col justify-center">
              <div className="flex items-center gap-3">
                <span className="text-indigo-600 text-2xl">📋</span>
                <h2 className="text-lg font-bold text-gray-900">Hospital Directory & Approvals</h2>
              </div>
            </div>
            <div className="p-0 max-h-[600px] overflow-y-auto">
              {hospitals.length === 0 ? (
                <div className="p-10 text-center">
                  <div className="text-4xl mb-3">🏥</div>
                  <p className="text-gray-500 font-medium">No registered hospitals yet.</p>
                </div>
              ) : (
                <ul className="divide-y divide-gray-100">
                  {hospitals.map(h => (
                    <li key={h.id} className="p-6 hover:bg-gray-50 transition border-l-4 border-transparent hover:border-indigo-500">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="font-bold text-gray-900 text-lg">{h.name}</h4>
                          <p className="text-sm text-gray-500 font-medium flex items-center gap-1 mt-1">
                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path></svg>
                            {h.contactNumber || "N/A"}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className={`text-xs font-bold px-3 py-1.5 rounded-lg uppercase tracking-wider ${h.approvalStatus === 'approved' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : h.approvalStatus === 'rejected' ? 'bg-red-100 text-red-800 border border-red-200' : 'bg-amber-100 text-amber-800 border border-amber-200'}`}>
                            {h.approvalStatus}
                          </span>
                        </div>
                      </div>
                      
                      {h.approvalStatus === "pending" && (
                        <div className="flex gap-3 mt-4">
                          <button onClick={() => updateHospitalStatus(h.id, "approved")} className="flex-1 bg-indigo-600 border border-indigo-700 text-white py-2 rounded-lg text-sm font-bold shadow-sm hover:bg-indigo-700 transition">Approve Provider</button>
                          <button onClick={() => updateHospitalStatus(h.id, "rejected")} className="flex-1 bg-white border border-gray-300 text-red-600 py-2 rounded-lg text-sm font-bold hover:bg-red-50 transition shadow-sm">Reject</button>
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
