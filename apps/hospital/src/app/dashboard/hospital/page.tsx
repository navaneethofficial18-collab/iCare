"use client";
import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Loader from "@/components/ui/Loader";

type DashboardData = {
  hospital: { id: string; name: string };
  doctors: Array<{
    id: string;
    fullName: string;
    specialization?: string | null;
    contactNumber?: string | null;
    isAvailable?: boolean | null;
    email?: string | null;
  }>;
  appointments: Array<any>;
  admissions: Array<any>;
  recentRecords: Array<any>;
  patientDirectory: Array<{ id: string; fullName: string; email?: string | null }>;
};

const emptyDoctorForm = { email: "", fullName: "", specialization: "", contactNumber: "" };
const emptyRecordForm = { patientEmail: "", title: "", description: "", medication: "", dosage: "", instructions: "", doctorId: "" };

export default function HospitalDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [doctorForm, setDoctorForm] = useState(emptyDoctorForm);
  const [recordForm, setRecordForm] = useState(emptyRecordForm);
  const [doctorSaving, setDoctorSaving] = useState(false);
  const [recordSaving, setRecordSaving] = useState(false);
  const [doctorMessage, setDoctorMessage] = useState("");
  const [recordMessage, setRecordMessage] = useState("");
  const [chatMessages, setChatMessages] = useState<{ role: string; content: string }[]>([
    {
      role: "ai",
      content:
        "CareSync AI Hospital Manager is live. Ask about staffing, patient records, queue delays, or doctor coverage.",
    },
  ]);
  const [aiInput, setAiInput] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const loadDashboard = async () => {
    const res = await fetch("/api/hospital/dashboard");
    if (!res.ok) {
      throw new Error("Load failed");
    }
    const json = await res.json();
    setData(json);
  };

  useEffect(() => {
    async function init() {
      try {
        await loadDashboard();
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
      `Doctors available: ${data.doctors?.filter((doctor) => doctor.isAvailable).length ?? 0}/${data.doctors?.length ?? 0}`,
      `Appointments today: ${data.appointments?.length ?? 0}`,
      `Admissions active: ${data.admissions?.length ?? 0}`,
      `Tracked patients: ${data.patientDirectory?.length ?? 0}`,
      `Recent records: ${(data.recentRecords ?? [])
        .slice(0, 4)
        .map((record) => `${record.patientName || "Unknown"} - ${record.title} - ${record.doctorName || "Hospital update"}`)
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
          content: "CareSync AI could not be reached. Please try again shortly.",
        },
      ]);
    } finally {
      setAiLoading(false);
    }
  };

  const handleDoctorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setDoctorSaving(true);
    setDoctorMessage("");

    try {
      const res = await fetch("/api/hospital/doctors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(doctorForm),
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Unable to add doctor");
      }
      setDoctorMessage(json.message);
      setDoctorForm(emptyDoctorForm);
      await loadDashboard();
    } catch (error: any) {
      setDoctorMessage(error.message);
    } finally {
      setDoctorSaving(false);
    }
  };

  const handleRecordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRecordSaving(true);
    setRecordMessage("");

    try {
      const res = await fetch("/api/hospital/patient-records", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(recordForm),
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Unable to upload patient record");
      }
      setRecordMessage(json.message);
      setRecordForm(emptyRecordForm);
      await loadDashboard();
    } catch (error: any) {
      setRecordMessage(error.message);
    } finally {
      setRecordSaving(false);
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
          MedeonAI
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
            {["overview", "appointments", "doctors", "patients", "admissions", "ai-manager"].map((tab) => (
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

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-6">
        {activeTab === "overview" && (
          <>
            <div className="grid md:grid-cols-4 gap-6">
              <StatCard title="Today's Appointments" value={String(data.appointments.length)} />
              <StatCard title="Active Admissions" value={String(data.admissions.length)} />
              <StatCard title="Tracked Patients" value={String(data.patientDirectory.length)} />
              <div className="bg-gradient-to-br from-sky-600 to-indigo-700 rounded-2xl shadow-md border border-sky-800 p-6 text-white flex flex-col justify-between">
                <div>
                  <h3 className="text-sky-100 text-sm font-bold uppercase tracking-widest mb-1">Available Doctors</h3>
                  <p className="text-4xl font-extrabold">
                    {data.doctors.filter((doctor) => doctor.isAvailable).length}/{data.doctors.length}
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab("doctors")}
                  className="mt-4 bg-white/20 hover:bg-white/30 text-white font-medium py-2 px-4 rounded-lg text-sm text-left w-max backdrop-blur-sm transition"
                >
                  Manage Doctors -&gt;
                </button>
              </div>
            </div>

            <section className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-6 py-5 border-b border-gray-100 bg-sky-50/50">
                <h2 className="text-lg font-bold text-gray-900">Recent Patient Updates</h2>
              </div>
              <div className="divide-y divide-gray-100">
                {data.recentRecords.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">No patient updates have been uploaded yet.</div>
                ) : (
                  data.recentRecords.slice(0, 5).map((record) => (
                    <div key={record.id} className="p-6">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="font-semibold text-gray-900">{record.patientName || "Unknown patient"}</p>
                        <span className="text-xs font-semibold text-gray-500">
                          {new Date(record.recordDate).toLocaleString()}
                        </span>
                      </div>
                      <p className="mt-1 font-medium text-sky-700">{record.title}</p>
                      <p className="mt-2 text-sm text-gray-600">{record.description}</p>
                      <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                        {record.doctorName ? `Uploaded by Dr. ${record.doctorName}` : "Uploaded by hospital team"}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </section>
          </>
        )}

        {activeTab === "appointments" && (
          <DataTable
            title="Patient Queue & Appointments"
            emptyMessage="No appointments found."
            rows={data.appointments.map((appointment) => (
              <tr key={appointment.id} className="hover:bg-gray-50">
                <td className="p-4 pl-6 font-semibold text-gray-900">{appointment.patientName || "Unknown"}</td>
                <td className="p-4 text-sm text-gray-600">{new Date(appointment.appointmentDate).toLocaleString()}</td>
                <td className="p-4 text-sm text-gray-600">{appointment.doctorName || "Unassigned"}</td>
                <td className="p-4">
                  <span className="text-xs font-bold px-2.5 py-1 rounded-md uppercase tracking-wider bg-orange-100 text-orange-700">
                    {appointment.status}
                  </span>
                </td>
              </tr>
            ))}
            columns={["Patient", "Time", "Doctor", "Status"]}
          />
        )}

        {activeTab === "doctors" && (
          <div className="grid lg:grid-cols-[1.1fr,1fr] gap-6">
            <section className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-6 py-5 border-b border-gray-100 bg-sky-50/50">
                <h2 className="text-lg font-bold text-gray-900">Invite or Add Doctors</h2>
                <p className="text-sm text-gray-500 mt-1">Use the doctor’s registered email. They’ll receive a reset/sign-in email for the doctor portal.</p>
              </div>
              <form onSubmit={handleDoctorSubmit} className="p-6 space-y-4">
                <Input label="Doctor Email" value={doctorForm.email} onChange={(value) => setDoctorForm((prev) => ({ ...prev, email: value }))} placeholder="doctor@hospital.com" />
                <Input label="Full Name" value={doctorForm.fullName} onChange={(value) => setDoctorForm((prev) => ({ ...prev, fullName: value }))} placeholder="Dr. Priya Sharma" />
                <Input label="Specialization" value={doctorForm.specialization} onChange={(value) => setDoctorForm((prev) => ({ ...prev, specialization: value }))} placeholder="Cardiology" />
                <Input label="Contact Number" value={doctorForm.contactNumber} onChange={(value) => setDoctorForm((prev) => ({ ...prev, contactNumber: value }))} placeholder="+91 98765 43210" />
                {doctorMessage && <p className="text-sm font-medium text-sky-700">{doctorMessage}</p>}
                <button type="submit" disabled={doctorSaving} className="bg-sky-600 hover:bg-sky-700 text-white font-bold py-3 px-4 rounded-xl">
                  {doctorSaving ? "Saving..." : "Add Doctor"}
                </button>
              </form>
            </section>

            <section className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-6 py-5 border-b border-gray-100 bg-sky-50/50">
                <h2 className="text-lg font-bold text-gray-900">Doctor Roster</h2>
              </div>
              <div className="divide-y divide-gray-100">
                {data.doctors.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">No doctors found.</div>
                ) : (
                  data.doctors.map((doctor) => (
                    <div key={doctor.id} className="p-6 flex items-start justify-between gap-4">
                      <div>
                        <p className="font-semibold text-gray-900">{doctor.fullName}</p>
                        <p className="text-sm text-gray-500">{doctor.specialization || "General practice"}</p>
                        <p className="text-sm text-gray-500">{doctor.email || "No linked email yet"}</p>
                        {doctor.contactNumber && <p className="text-xs text-gray-400 mt-1">{doctor.contactNumber}</p>}
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
            </section>
          </div>
        )}

        {activeTab === "patients" && (
          <div className="grid lg:grid-cols-[1.1fr,1fr] gap-6">
            <section className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-6 py-5 border-b border-gray-100 bg-sky-50/50">
                <h2 className="text-lg font-bold text-gray-900">Upload Patient Details</h2>
                <p className="text-sm text-gray-500 mt-1">These updates will appear in the patient portal record section.</p>
              </div>
              <form onSubmit={handleRecordSubmit} className="p-6 space-y-4">
                <Input label="Patient Registered Email" value={recordForm.patientEmail} onChange={(value) => setRecordForm((prev) => ({ ...prev, patientEmail: value }))} placeholder="patient@email.com" />
                <Input label="Record Title" value={recordForm.title} onChange={(value) => setRecordForm((prev) => ({ ...prev, title: value }))} placeholder="Discharge summary" />
                <TextArea label="Clinical Notes / Details" value={recordForm.description} onChange={(value) => setRecordForm((prev) => ({ ...prev, description: value }))} placeholder="Vitals, diagnosis, follow-up instructions, or treatment summary" />
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Assign Doctor</label>
                  <select value={recordForm.doctorId} onChange={(e) => setRecordForm((prev) => ({ ...prev, doctorId: e.target.value }))} className="w-full p-3 border border-gray-200 rounded-xl">
                    <option value="">Hospital team / no doctor selected</option>
                    {data.doctors.map((doctor) => (
                      <option key={doctor.id} value={doctor.id}>
                        {doctor.fullName} {doctor.specialization ? `- ${doctor.specialization}` : ""}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <Input label="Medication" value={recordForm.medication} onChange={(value) => setRecordForm((prev) => ({ ...prev, medication: value }))} placeholder="Amoxicillin 500mg" />
                  <Input label="Dosage" value={recordForm.dosage} onChange={(value) => setRecordForm((prev) => ({ ...prev, dosage: value }))} placeholder="Twice daily for 5 days" />
                </div>
                <TextArea label="Prescription Instructions" value={recordForm.instructions} onChange={(value) => setRecordForm((prev) => ({ ...prev, instructions: value }))} placeholder="Take after meals and return if fever persists" />
                {recordMessage && <p className="text-sm font-medium text-sky-700">{recordMessage}</p>}
                <button type="submit" disabled={recordSaving} className="bg-sky-600 hover:bg-sky-700 text-white font-bold py-3 px-4 rounded-xl">
                  {recordSaving ? "Uploading..." : "Upload Patient Record"}
                </button>
              </form>
            </section>

            <section className="space-y-6">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-6 py-5 border-b border-gray-100 bg-sky-50/50">
                  <h2 className="text-lg font-bold text-gray-900">Tracked Patients</h2>
                </div>
                <div className="divide-y divide-gray-100">
                  {data.patientDirectory.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">No linked patients yet.</div>
                  ) : (
                    data.patientDirectory.map((patient) => (
                      <div key={patient.id} className="p-5">
                        <p className="font-semibold text-gray-900">{patient.fullName}</p>
                        <p className="text-sm text-gray-500">{patient.email || "Email will appear after a linked record lookup"}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-6 py-5 border-b border-gray-100 bg-sky-50/50">
                  <h2 className="text-lg font-bold text-gray-900">Latest Uploaded Records</h2>
                </div>
                <div className="divide-y divide-gray-100">
                  {data.recentRecords.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">No records uploaded yet.</div>
                  ) : (
                    data.recentRecords.slice(0, 6).map((record) => (
                      <div key={record.id} className="p-5">
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-semibold text-gray-900">{record.patientName || "Unknown patient"}</p>
                          <span className="text-xs font-semibold text-gray-500">{new Date(record.recordDate).toLocaleDateString()}</span>
                        </div>
                        <p className="text-sm font-medium text-sky-700 mt-1">{record.title}</p>
                        <p className="text-sm text-gray-600 mt-2">{record.description}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </section>
          </div>
        )}

        {activeTab === "admissions" && (
          <section className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-100 bg-sky-50/50">
              <h2 className="text-lg font-bold text-gray-900">Admissions</h2>
            </div>
            <div className="divide-y divide-gray-100">
              {data.admissions.length === 0 ? (
                <div className="p-8 text-center text-gray-500">No admissions found.</div>
              ) : (
                data.admissions.map((admission) => (
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
          </section>
        )}

        {activeTab === "ai-manager" && (
          <section className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center mt-6">
            <div className="w-16 h-16 bg-purple-100 text-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 text-3xl shadow-sm">AI</div>
            <h2 className="text-2xl font-bold text-gray-900">CareSync AI Hospital Manager</h2>
            <p className="text-gray-500 mt-2 max-w-2xl mx-auto">
              Ask about staffing, coverage, queue bottlenecks, patient-record workflows, or what to improve next in today&apos;s hospital operations.
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
                      {message.role === "user" ? "> Operator:" : "> CareSync AI:"}
                    </p>
                    <p className="whitespace-pre-wrap text-gray-100 mt-1">{message.content}</p>
                  </div>
                ))}
                {aiLoading && (
                  <div>
                    <p className="text-green-400">&gt; CareSync AI:</p>
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
                  placeholder="Ask AI about queues, doctors, patient records, or admissions..."
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
          </section>
        )}
      </main>
    </div>
  );
}

function StatCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
      <h3 className="text-gray-500 text-sm font-bold uppercase tracking-widest mb-1">{title}</h3>
      <p className="text-4xl font-extrabold text-gray-900">{value}</p>
    </div>
  );
}

function DataTable({
  title,
  columns,
  rows,
  emptyMessage,
}: {
  title: string;
  columns: string[];
  rows: React.ReactNode[];
  emptyMessage: string;
}) {
  return (
    <section className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="px-6 py-5 border-b border-gray-100 bg-sky-50/50">
        <h2 className="text-lg font-bold text-gray-900">{title}</h2>
      </div>
      <div className="p-0 overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200 text-xs font-bold text-gray-500 uppercase tracking-widest">
              {columns.map((column, index) => (
                <th key={column} className={`p-4 ${index === 0 ? "pl-6" : ""}`}>
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="p-8 text-center text-gray-500">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              rows
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function Input({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-1.5">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full p-3 border border-gray-200 rounded-xl"
      />
    </div>
  );
}

function TextArea({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-1.5">{label}</label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={4}
        className="w-full p-3 border border-gray-200 rounded-xl"
      />
    </div>
  );
}
