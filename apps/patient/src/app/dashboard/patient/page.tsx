"use client";
import React, { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Loader from "@/components/ui/Loader";

export default function PatientDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("home");
  const router = useRouter();

  // AI Chat State
  const [chatMessages, setChatMessages] = useState<{ role: string; content: string }[]>([]);
  const [aiInput, setAiInput] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function init() {
      try {
        const res = await fetch("/api/patient/dashboard");
        if (!res.ok) throw new Error("Load failed");
        setData(await res.json());
      } catch {
        router.push("/login/patient");
      } finally {
        setLoading(false);
      }
    }
    init();
  }, [router]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  const handleAiSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiInput.trim()) return;

    const userMessage = aiInput;
    setAiInput("");
    setChatMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setAiLoading(true);

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // Constructing context context from history
        body: JSON.stringify({
          prompt: userMessage,
          context: chatMessages.map((m) => `${m.role}: ${m.content}`).join("\n") + `\nPatient Profile context: Name ${data.patient.fullName}`,
        }),
      });

      const json = await res.json();
      setChatMessages((prev) => [...prev, { role: "ai", content: json.response || json.error }]);
    } catch {
      setChatMessages((prev) => [...prev, { role: "ai", content: "Error connecting to Umkho.AI Server." }]);
    } finally {
      setAiLoading(false);
    }
  };

  if (loading) return <div className="h-screen flex items-center justify-center bg-gray-50"><Loader size="lg" /></div>;
  if (!data || !data.patient) return <div className="p-10 text-center">Failed to load data.</div>;

  return (
    <div className="min-h-screen bg-[#FDFDFD] font-sans pb-24">
      {/* Mobile-First Header */}
      <header className="bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-50 border-b border-gray-100 p-4 flex justify-between items-center transition-all duration-300">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-sky-500 text-white flex justify-center items-center shadow-lg shadow-indigo-500/30">
            <span className="font-bold text-lg">CS</span>
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-800 to-sky-700 tracking-tight">iCare</h1>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none mt-0.5">Welcome, {data.patient.fullName.split(" ")[0]}</p>
          </div>
        </div>
        <button onClick={() => { fetch("/api/auth/logout", { method: "POST" }).then(() => router.push("/login/patient")); }} className="w-10 h-10 rounded-full bg-gray-50 hover:bg-gray-100 flex items-center justify-center transition border border-gray-200">
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
        </button>
      </header>
      
      <main className="max-w-xl mx-auto px-4 py-6 space-y-8">
        {/* Navigation Tabs */}
        <div className="flex gap-2 overflow-x-auto hide-scrollbar snap-x pb-2">
          {[
            { id: "home", icon: "🏠", label: "Home" },
            { id: "hospitals", icon: "🏥", label: "Explore" },
            { id: "ai", icon: "🧬", label: "Umkho.AI" },
            { id: "records", icon: "📋", label: "Records" },
            { id: "financial", icon: "💳", label: "Finance" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`snap-center flex-none px-4 py-2.5 rounded-2xl text-sm font-bold flex items-center gap-2 transition-all duration-300 ${
                activeTab === tab.id ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20 scale-100" : "bg-white text-gray-500 hover:bg-indigo-50 border border-gray-100 scale-95 opacity-80"
              }`}
            >
              <span>{tab.icon}</span> {tab.label}
            </button>
          ))}
        </div>

        {/* --- HOME TAB --- */}
        {activeTab === "home" && (
          <div className="space-y-6 animate-fade-in">
            {/* Vitals / Quick Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gradient-to-br from-rose-50 to-white border border-rose-100 p-5 rounded-3xl shadow-sm">
                <span className="text-rose-500 text-2xl drop-shadow-sm">🩸</span>
                <p className="text-gray-500 text-xs font-bold uppercase tracking-wider mt-3">Blood Group</p>
                <p className="text-xl font-black text-rose-900">{data.patient.bloodGroup || "O+"}</p>
              </div>
              <div className="bg-gradient-to-br from-amber-50 to-white border border-amber-100 p-5 rounded-3xl shadow-sm">
                <span className="text-amber-500 text-2xl drop-shadow-sm">🤧</span>
                <p className="text-gray-500 text-xs font-bold uppercase tracking-wider mt-3">Allergies</p>
                <p className="text-lg font-bold text-amber-900 truncate">{data.patient.allergies || "None Reported"}</p>
              </div>
            </div>

            {/* Upcoming Appointments */}
            <div>
              <div className="flex justify-between items-end mb-4 px-1">
                <h2 className="font-extrabold text-gray-900 tracking-tight text-xl">Upcoming Visits</h2>
                <button onClick={() => setActiveTab("hospitals")} className="text-indigo-600 text-sm font-bold hover:underline">Book New</button>
              </div>
              <div className="space-y-3">
                {data.appointments.filter((a: any) => ["pending", "confirmed"].includes(a.status)).length === 0 ? (
                  <div className="bg-white border border-dashed border-gray-300 rounded-3xl p-8 text-center bg-gray-50/50">
                    <p className="text-gray-400 font-medium">No upcoming appointments.</p>
                  </div>
                ) : (
                  data.appointments.filter((a: any) => ["pending", "confirmed"].includes(a.status)).slice(0, 2).map((apt: any) => (
                    <div key={apt.id} className="bg-white border border-gray-100 p-5 rounded-3xl shadow-sm hover:shadow-md transition-shadow flex items-center gap-4 group">
                      <div className="bg-indigo-50 text-indigo-600 w-14 h-14 rounded-2xl flex flex-col justify-center items-center font-bold flex-none group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                        <span className="text-xs uppercase leading-none">{new Date(apt.appointmentDate).toLocaleString('default', { month: 'short' })}</span>
                        <span className="text-xl leading-none mt-1">{new Date(apt.appointmentDate).getDate()}</span>
                      </div>
                      <div className="flex-1 overflow-hidden">
                        <h4 className="font-bold text-gray-900 truncate text-lg">{apt.hospitalName}</h4>
                        <p className="text-gray-500 text-sm font-medium">{new Date(apt.appointmentDate).toLocaleString('default', { hour: 'numeric', minute: '2-digit' })} • {apt.status}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* --- EXPLORE HOSPITALS TAB --- */}
        {activeTab === "hospitals" && (
          <div className="space-y-6 animate-fade-in">
            <h2 className="font-extrabold text-gray-900 tracking-tight text-2xl mb-2">Find Care Facilities</h2>
            <div className="relative">
              <input type="text" placeholder="Search near you..." className="w-full bg-white border border-gray-200 p-4 pl-12 rounded-2xl shadow-sm outline-none focus:ring-4 focus:ring-indigo-500/20 font-medium text-gray-700 transition" />
              <svg className="w-5 h-5 absolute left-4 top-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
            </div>
            
            <div className="space-y-4 pt-2">
              {data.availableHospitals.map((hosp: any) => (
                <div key={hosp.id} className="bg-white border border-gray-100 p-5 rounded-3xl shadow-sm relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-50 rounded-bl-full -z-0 opacity-50 transition-transform group-hover:scale-110"></div>
                  <div className="flex justify-between items-start relative z-10">
                    <div>
                      <h4 className="font-bold text-gray-900 text-lg leading-tight">{hosp.name}</h4>
                      <p className="text-gray-500 text-sm mt-1 mb-3 max-w-[200px] truncate">{hosp.address || "No address provided"}</p>
                      <button className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold py-2 px-5 rounded-xl shadow-md shadow-indigo-600/20 transition-transform active:scale-95">Book Visit</button>
                    </div>
                    <div className="bg-emerald-50 text-emerald-600 w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-sm border border-emerald-100">
                      ★ 4.9
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* --- AI ASSISTANT TAB --- */}
        {activeTab === "ai" && (
          <div className="h-[600px] flex flex-col bg-white border border-gray-200 rounded-[2rem] shadow-xl overflow-hidden animate-fade-in relative">
            <div className="bg-gradient-to-r from-indigo-600 to-sky-600 p-5 text-white flex gap-3 items-center sticky top-0 z-10 shadow-md">
              <div className="w-12 h-12 bg-white/20 rounded-2xl backdrop-blur-sm flex items-center justify-center text-2xl shadow-inner border border-white/20">🧬</div>
              <div>
                <h3 className="font-bold text-lg leading-tight">Umkho.AI Assistant</h3>
                <p className="text-indigo-100 text-xs font-semibold uppercase tracking-wider">Health Symptom Checker</p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-gray-50/50 relative">
              <div className="flex gap-3 max-w-[85%]">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-sky-500 flex-none flex items-center justify-center shadow-md">
                  <span className="text-white text-xs">AI</span>
                </div>
                <div className="bg-white p-4 rounded-2xl rounded-tl-none shadow-sm border border-gray-100 text-gray-700 text-sm leading-relaxed text-left">
                  Hello {data.patient.fullName.split(" ")[0]}, I am your AI health companion. Please describe your symptoms or ask me about your medications!
                </div>
              </div>

              {chatMessages.map((msg, i) => (
                <div key={i} className={`flex gap-3 max-w-[85%] ${msg.role === 'user' ? 'ml-auto flex-row-reverse' : ''}`}>
                  <div className={`w-8 h-8 rounded-full flex-none flex items-center justify-center shadow-md ${msg.role === 'user' ? 'bg-gray-800' : 'bg-gradient-to-br from-indigo-500 to-sky-500'}`}>
                    <span className="text-white text-xs">{msg.role === 'user' ? 'YOU' : 'AI'}</span>
                  </div>
                  <div className={`p-4 rounded-2xl shadow-sm border text-sm leading-relaxed text-left ${msg.role === 'user' ? 'bg-gray-800 text-white rounded-tr-none border-gray-700' : 'bg-white text-gray-700 rounded-tl-none border-gray-100'}`}>
                    {msg.content}
                  </div>
                </div>
              ))}
              {aiLoading && (
                <div className="flex gap-3 max-w-[85%]">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-sky-500 flex-none flex items-center justify-center shadow-md"><span className="text-white text-xs">AI</span></div>
                  <div className="bg-white px-5 py-4 rounded-2xl rounded-tl-none shadow-sm border border-gray-100 flex items-center gap-1">
                    <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce delay-75"></div>
                    <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce delay-150"></div>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            <form onSubmit={handleAiSubmit} className="p-4 bg-white border-t border-gray-100 flex gap-2">
              <input type="text" placeholder="Type a message..." className="flex-1 p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-4 focus:ring-indigo-500/20 focus:bg-white transition text-sm text-gray-800 font-medium" value={aiInput} onChange={(e) => setAiInput(e.target.value)} disabled={aiLoading} />
              <button disabled={aiLoading || !aiInput.trim()} type="submit" className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white p-3 rounded-xl shadow-md transition-transform active:scale-95">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path></svg>
              </button>
            </form>
          </div>
        )}

        {/* --- OTHER TABS (Records/Finance Placeholder for brevity) --- */}
        {(activeTab === "records" || activeTab === "financial") && (
          <div className="bg-white border border-gray-200 rounded-[2rem] p-10 text-center shadow-sm animate-fade-in">
            <span className="text-4xl">{activeTab === 'records' ? '📋' : '💳'}</span>
            <h2 className="font-extrabold text-gray-900 mt-4 tracking-tight capitalize">{activeTab} Hub</h2>
            <p className="text-gray-500 mt-2 text-sm">{activeTab === 'records' ? `You have ${data.records.length} records and ${data.prescriptions.length} prescriptions on file.` : `You have ${data.loans.length} loans and ${data.insurance.length} policies.`}</p>
          </div>
        )}

      </main>
    </div>
  );
}
