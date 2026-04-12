"use client";
import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Loader from "@/components/ui/Loader";

export default function PatientDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("home");
  const router = useRouter();
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
        <div className="flex gap-2 overflow-x-auto hide-scrollbar snap-x pb-2">
          {[
            { id: "home", label: "Home" },
            { id: "hospitals", label: "Explore" },
            { id: "ai", label: "Umkho.AI" },
            { id: "records", label: "Records" },
            { id: "financial", label: "Finance" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`snap-center flex-none px-4 py-2.5 rounded-2xl text-sm font-bold transition-all duration-300 ${
                activeTab === tab.id ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20" : "bg-white text-gray-500 hover:bg-indigo-50 border border-gray-100 opacity-80"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === "home" && (
          <div className="space-y-6 animate-fade-in">
            <div className="grid grid-cols-2 gap-4">
              <InfoCard title="Blood Group" value={data.patient.bloodGroup || "O+"} />
              <InfoCard title="Allergies" value={data.patient.allergies || "None Reported"} />
            </div>

            <div>
              <div className="flex justify-between items-end mb-4 px-1">
                <h2 className="font-extrabold text-gray-900 tracking-tight text-xl">Upcoming Visits</h2>
                <button onClick={() => setActiveTab("hospitals")} className="text-indigo-600 text-sm font-bold hover:underline">Book New</button>
              </div>
              <div className="space-y-3">
                {data.appointments.filter((a: any) => ["pending", "confirmed"].includes(a.status)).length === 0 ? (
                  <EmptyCard message="No upcoming appointments." />
                ) : (
                  data.appointments.filter((a: any) => ["pending", "confirmed"].includes(a.status)).slice(0, 2).map((apt: any) => (
                    <div key={apt.id} className="bg-white border border-gray-100 p-5 rounded-3xl shadow-sm">
                      <h4 className="font-bold text-gray-900 text-lg">{apt.hospitalName}</h4>
                      <p className="text-gray-500 text-sm mt-1">{new Date(apt.appointmentDate).toLocaleString()}</p>
                      <p className="text-indigo-600 text-sm font-semibold mt-2 uppercase tracking-wide">{apt.status}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === "hospitals" && (
          <div className="space-y-4 animate-fade-in">
            <h2 className="font-extrabold text-gray-900 tracking-tight text-2xl">Find Care Facilities</h2>
            {data.availableHospitals.map((hosp: any) => (
              <div key={hosp.id} className="bg-white border border-gray-100 p-5 rounded-3xl shadow-sm">
                <h4 className="font-bold text-gray-900 text-lg leading-tight">{hosp.name}</h4>
                <p className="text-gray-500 text-sm mt-1">{hosp.address || "No address provided"}</p>
                {hosp.contactNumber && <p className="text-xs text-gray-400 mt-2">{hosp.contactNumber}</p>}
              </div>
            ))}
          </div>
        )}

        {activeTab === "ai" && (
          <div className="h-[600px] flex flex-col bg-white border border-gray-200 rounded-[2rem] shadow-xl overflow-hidden animate-fade-in relative">
            <div className="bg-gradient-to-r from-indigo-600 to-sky-600 p-5 text-white flex gap-3 items-center sticky top-0 z-10 shadow-md">
              <div className="w-12 h-12 bg-white/20 rounded-2xl backdrop-blur-sm flex items-center justify-center text-2xl shadow-inner border border-white/20">AI</div>
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
                  Hello {data.patient.fullName.split(" ")[0]}, I am your AI health companion. Please describe your symptoms or ask me about your medications.
                </div>
              </div>

              {chatMessages.map((msg, i) => (
                <div key={i} className={`flex gap-3 max-w-[85%] ${msg.role === "user" ? "ml-auto flex-row-reverse" : ""}`}>
                  <div className={`w-8 h-8 rounded-full flex-none flex items-center justify-center shadow-md ${msg.role === "user" ? "bg-gray-800" : "bg-gradient-to-br from-indigo-500 to-sky-500"}`}>
                    <span className="text-white text-xs">{msg.role === "user" ? "YOU" : "AI"}</span>
                  </div>
                  <div className={`p-4 rounded-2xl shadow-sm border text-sm leading-relaxed text-left ${msg.role === "user" ? "bg-gray-800 text-white rounded-tr-none border-gray-700" : "bg-white text-gray-700 rounded-tl-none border-gray-100"}`}>
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

        {activeTab === "records" && (
          <div className="space-y-6 animate-fade-in">
            <div className="bg-white border border-gray-200 rounded-[2rem] p-6 shadow-sm">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="font-extrabold text-gray-900 tracking-tight text-2xl">Medical Records</h2>
                  <p className="text-gray-500 mt-1 text-sm">Updates uploaded by your hospital and doctors appear here.</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-black text-indigo-700">{data.records.length}</p>
                  <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Records</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              {data.records.length === 0 ? (
                <EmptyCard message="No hospital records have been uploaded yet." />
              ) : (
                data.records.map((record: any) => (
                  <div key={record.id} className="bg-white border border-gray-100 p-5 rounded-3xl shadow-sm">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-bold text-gray-900 text-lg">{record.title}</p>
                        <p className="text-xs font-bold uppercase tracking-widest text-indigo-500 mt-1">
                          {record.hospitalName || "Hospital update"} {record.doctorName ? `- Dr. ${record.doctorName}` : ""}
                        </p>
                      </div>
                      <span className="text-xs font-semibold text-gray-500">{new Date(record.recordDate).toLocaleDateString()}</span>
                    </div>
                    <p className="text-sm text-gray-600 mt-3 leading-relaxed">{record.description}</p>
                  </div>
                ))
              )}
            </div>

            <div className="bg-white border border-gray-200 rounded-[2rem] p-6 shadow-sm">
              <h3 className="font-extrabold text-gray-900 tracking-tight text-xl">Prescriptions</h3>
              <div className="mt-4 space-y-3">
                {data.prescriptions.length === 0 ? (
                  <p className="text-sm text-gray-400">No prescriptions uploaded yet.</p>
                ) : (
                  data.prescriptions.map((prescription: any) => (
                    <div key={prescription.id} className="rounded-2xl border border-gray-100 bg-gray-50/60 p-4">
                      <p className="font-bold text-gray-900">{prescription.medication}</p>
                      <p className="text-sm text-gray-600 mt-1">{prescription.dosage || "Dosage not specified"}</p>
                      {prescription.instructions && <p className="text-sm text-gray-500 mt-2">{prescription.instructions}</p>}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === "financial" && (
          <div className="space-y-6 animate-fade-in">
            <div className="bg-white border border-gray-200 rounded-[2rem] p-6 shadow-sm">
              <h2 className="font-extrabold text-gray-900 tracking-tight text-2xl">Financial Hub</h2>
              <p className="text-gray-500 mt-1 text-sm">{`You have ${data.loans.length} loans and ${data.insurance.length} policies.`}</p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function InfoCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="bg-gradient-to-br from-indigo-50 to-white border border-indigo-100 p-5 rounded-3xl shadow-sm">
      <p className="text-gray-500 text-xs font-bold uppercase tracking-wider">{title}</p>
      <p className="text-xl font-black text-indigo-900 mt-3">{value}</p>
    </div>
  );
}

function EmptyCard({ message }: { message: string }) {
  return (
    <div className="bg-white border border-dashed border-gray-300 rounded-3xl p-8 text-center bg-gray-50/50">
      <p className="text-gray-400 font-medium">{message}</p>
    </div>
  );
}
