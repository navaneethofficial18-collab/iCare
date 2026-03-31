"use client";
import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Loader from "@/components/ui/Loader";

export default function HospitalDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [chatMessages, setChatMessages] = useState<{ role: string; content: string }[]>([
    {
      role: "ai",
      content:
        "Umkho.AI Hospital Manager is ready. Ask for queue summaries, staffing suggestions, or operational insights.",
    },
  ]);
  const [aiInput, setAiInput] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    async function init() {
      try {
        const res = await fetch("/api/hospital/dashboard");
        if (!res.ok) {
          throw new Error("Load failed");
        }
        setData(await res.json());
      } catch {
        router.push("/login");
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
    if (!aiInput.trim() || !data?.hospital) return;

    const userMessage = aiInput.trim();
    const context = [
      `Hospital: ${data.hospital.name}`,
      `Doctors available: ${data.doctors?.filter((doctor: any) => doctor.isAvailable).length ?? 0}/${data.doctors?.length ?? 0}`,
      `Appointments today: ${data.appointments?.length ?? 0}`,
      `Admissions active: ${data.admissions?.length ?? 0}`,
      `Recent appointments: ${(data.appointments ?? [])
        .slice(0, 5)
        .map((appointment: any) => `${appointment.patientName || "Unknown"} - ${appointment.status} - ${appointment.doctorName || "Unassigned"}`)
        .join("; ")}`,
    ].join("\n");

    setAiInput("");
    setChatMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setAiLoading(true);

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: userMessage,
          context,
        }),
      });

      const json = await res.json();
      setChatMessages((prev) => [
        ...prev,
        { role: "ai", content: json.response || json.error || "No response received." },
      ]);
    } catch {
      setChatMessages((prev) => [
        ...prev,
        {
          role: "ai",
          content: "Umkho.AI could not be reached. Please try again shortly.",
        },
      ]);
    } finally {
      setAiLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader size="lg" />
      </div>
    );
  }

  if (!data || !data.hospital) {
    return <div className="p-10 text-center">Failed to load data.</div>;
  }

  return (
    <div className="min-h-screen bg-sky-50 font-sans pb-20">
      <header className="bg-white shadow px-6 py-4 flex justify-between items-center sticky top-0 z-40 border-b border-gray-200">
        <div className="font-bold text-xl text-sky-900 flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-sky-600 text-white flex justify-center items-center text-sm shadow">CS</div>
          iCare
          <span className="text-sky-700 bg-sky-50 px-2 flex-none py-1 rounded-full font-bold text-xs ml-2 border border-sky-100 uppercase tracking-wide">
            {data.hospital.name}
          </span>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => {
              fetch("/api/auth/logout", { method: "POST" }).then(() => router.push("/login"));
            }}
            className="text-sm text-red-600 hover:bg-red-50 font-semibold transition border border-red-200 px-4 py-1.5 rounded-lg"
          >
            Logout
          </button>
        </div>
      </header>

      <div className="bg-white border-b border-gray-200 shadow-sm sticky top-[65px] z-30">
        <div className="max-w-7xl mx-auto px-6 overflow-x-auto hide-scrollbar">
          <nav className="flex space-x-1 sm:space-x-8">
            {["overview", "appointments", "doctors", "admissions", "ai-manager"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-4 px-2 sm:px-4 text-sm font-bold capitalize transition border-b-[3px] whitespace-nowrap ${
                  activeTab === tab ? "border-sky-600 text-sky-700" : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                {tab.replace("-", " ")}
              </button>
            ))}
          </nav>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {activeTab === "overview" && (
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-gray-500 text-sm font-bold uppercase tracking-widest mb-1">Today's Appointments</h3>
              <p className="text-4xl font-extrabold text-gray-900">{data.appointments.length}</p>
            </div>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-gray-500 text-sm font-bold uppercase tracking-widest mb-1">Active Admissions</h3>
              <p className="text-4xl font-extrabold text-gray-900">{data.admissions.length}</p>
            </div>
            <div className="bg-gradient-to-br from-sky-600 to-indigo-700 rounded-2xl shadow-md border border-sky-800 p-6 text-white flex flex-col justify-between">
              <div>
                <h3 className="text-sky-100 text-sm font-bold uppercase tracking-widest mb-1">Available Doctors</h3>
                <p className="text-4xl font-extrabold">
                  {data.doctors.filter((doctor: any) => doctor.isAvailable).length}/{data.doctors.length}
                </p>
              </div>
              <button
                onClick={() => setActiveTab("doctors")}
                className="mt-4 bg-white/20 hover:bg-white/30 text-white font-medium py-2 px-4 rounded-lg text-sm text-left w-max backdrop-blur-sm transition"
              >
                Manage Roster -&gt;
              </button>
            </div>
          </div>
        )}

        {activeTab === "appointments" && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-100 bg-sky-50/50">
              <h2 className="text-lg font-bold text-gray-900">Patient Queue & Appointments</h2>
            </div>
            <div className="p-0 overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200 text-xs font-bold text-gray-500 uppercase tracking-widest">
                    <th className="p-4 pl-6">Patient</th>
                    <th className="p-4">Time</th>
                    <th className="p-4">Doctor</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 pr-6 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {data.appointments.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-gray-500">
                        No appointments found.
                      </td>
                    </tr>
                  ) : (
                    data.appointments.map((appointment: any) => (
                      <tr key={appointment.id} className="hover:bg-gray-50">
                        <td className="p-4 pl-6 font-semibold text-gray-900">{appointment.patientName || "Unknown"}</td>
                        <td className="p-4 text-sm text-gray-600">{new Date(appointment.appointmentDate).toLocaleString()}</td>
                        <td className="p-4 text-sm text-gray-600">{appointment.doctorName || "Unassigned"}</td>
                        <td className="p-4">
                          <span
                            className={`text-xs font-bold px-2.5 py-1 rounded-md uppercase tracking-wider ${
                              appointment.status === "confirmed" ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"
                            }`}
                          >
                            {appointment.status}
                          </span>
                        </td>
                        <td className="p-4 pr-6 text-right">
                          <button className="text-sky-600 font-semibold hover:text-sky-800 text-sm">Update</button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === "doctors" && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-100 bg-sky-50/50">
              <h2 className="text-lg font-bold text-gray-900">Doctor Roster</h2>
            </div>
            <div className="divide-y divide-gray-100">
              {data.doctors.length === 0 ? (
                <div className="p-8 text-center text-gray-500">No doctors found.</div>
              ) : (
                data.doctors.map((doctor: any) => (
                  <div key={doctor.id} className="p-6 flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-gray-900">{doctor.fullName}</p>
                      <p className="text-sm text-gray-500">{doctor.specialization || "General"}</p>
                    </div>
                    <span
                      className={`text-xs font-bold px-2.5 py-1 rounded-md uppercase tracking-wider ${
                        doctor.isAvailable ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {doctor.isAvailable ? "available" : "busy"}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === "admissions" && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-100 bg-sky-50/50">
              <h2 className="text-lg font-bold text-gray-900">Admissions</h2>
            </div>
            <div className="divide-y divide-gray-100">
              {data.admissions.length === 0 ? (
                <div className="p-8 text-center text-gray-500">No admissions found.</div>
              ) : (
                data.admissions.map((admission: any) => (
                  <div key={admission.id} className="p-6 flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-gray-900">{admission.patientName || "Unknown"}</p>
                      <p className="text-sm text-gray-500">
                        {admission.bedNumber ? `Bed ${admission.bedNumber}` : "Bed not assigned"} -{" "}
                        {new Date(admission.admissionDate).toLocaleString()}
                      </p>
                    </div>
                    <span className="text-xs font-bold px-2.5 py-1 rounded-md uppercase tracking-wider bg-blue-100 text-blue-700">
                      {admission.status}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === "ai-manager" && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center mt-6">
            <div className="w-16 h-16 bg-purple-100 text-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 text-3xl shadow-sm">AI</div>
            <h2 className="text-2xl font-bold text-gray-900">Umkho.AI Hospital Manager</h2>
            <p className="text-gray-500 mt-2 max-w-lg mx-auto">
              Analyze patient flow, staffing pressure, and operational bottlenecks with live hospital context.
            </p>
            <div className="mt-8 mx-auto max-w-3xl text-left border border-gray-200 rounded-xl overflow-hidden shadow-sm">
              <div className="bg-gray-50 p-4 border-b border-gray-200 flex items-center gap-2">
                <span className="block w-3 h-3 rounded-full bg-red-400"></span>
                <span className="block w-3 h-3 rounded-full bg-yellow-400"></span>
                <span className="block w-3 h-3 rounded-full bg-green-400"></span>
                <span className="text-xs font-bold ml-2 text-gray-400 uppercase tracking-widest">AI Terminal</span>
              </div>
              <div className="p-4 bg-gray-900 text-green-400 font-mono text-sm h-[360px] overflow-y-auto space-y-3">
                {chatMessages.map((message, index) => (
                  <div key={index}>
                    <p className={message.role === "user" ? "text-cyan-300" : "text-green-400"}>
                      {message.role === "user" ? "> Operator:" : "> Umkho.AI:"}
                    </p>
                    <p className="whitespace-pre-wrap text-gray-100 mt-1">{message.content}</p>
                  </div>
                ))}
                {aiLoading && (
                  <div>
                    <p className="text-green-400">&gt; Umkho.AI:</p>
                    <p className="text-gray-400 mt-1">Processing hospital context...</p>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>
              <form onSubmit={handleAiSubmit} className="p-2 bg-gray-900 border-t border-gray-800 flex gap-2">
                <input
                  type="text"
                  value={aiInput}
                  onChange={(e) => setAiInput(e.target.value)}
                  placeholder="Ask AI (e.g. Summarize queue risk for today...)"
                  className="w-full bg-transparent text-white outline-none font-mono text-sm px-2 focus:ring-1 focus:ring-green-400 rounded"
                  disabled={aiLoading}
                />
                <button
                  type="submit"
                  disabled={aiLoading || !aiInput.trim()}
                  className="px-4 py-2 text-sm font-bold text-white bg-purple-600 rounded hover:bg-purple-700 disabled:opacity-50"
                >
                  Send
                </button>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
