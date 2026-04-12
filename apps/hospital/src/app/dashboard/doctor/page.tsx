"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Loader from "@/components/ui/Loader";

const emptyForm = { patientEmail: "", title: "", description: "", medication: "", dosage: "", instructions: "" };

export default function DoctorDashboard() {
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyForm);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  const loadDashboard = async () => {
    const res = await fetch("/api/doctor/dashboard");
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage("");

    try {
      const res = await fetch("/api/doctor/patient-records", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Unable to upload patient record");
      }
      setForm(emptyForm);
      setMessage(json.message);
      await loadDashboard();
    } catch (error: any) {
      setMessage(error.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader size="lg" />
      </div>
    );
  }

  if (!data?.doctor) {
    return <div className="p-10 text-center">Doctor profile not found.</div>;
  }

  return (
    <div className="min-h-screen bg-emerald-50/40 pb-16">
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-emerald-900">Doctor Workspace</h1>
          <p className="text-sm text-gray-500">
            {data.doctor.fullName} {data.doctor.specialization ? `- ${data.doctor.specialization}` : ""} at {data.hospital?.name || "your hospital"}
          </p>
        </div>
        <button
          onClick={() => fetch("/api/auth/logout", { method: "POST" }).then(() => router.push("/login"))}
          className="text-sm text-red-600 hover:bg-red-50 font-semibold transition border border-red-200 px-4 py-1.5 rounded-lg"
        >
          Logout
        </button>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8 grid lg:grid-cols-[1.1fr,1fr] gap-6">
        <section className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100 bg-emerald-50/70">
            <h2 className="text-lg font-bold text-gray-900">Upload Patient Information</h2>
            <p className="text-sm text-gray-500 mt-1">Use the patient’s registered email so the update appears in their patient portal.</p>
          </div>
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <Field label="Patient Registered Email" value={form.patientEmail} onChange={(value) => setForm((prev) => ({ ...prev, patientEmail: value }))} placeholder="patient@email.com" />
            <Field label="Record Title" value={form.title} onChange={(value) => setForm((prev) => ({ ...prev, title: value }))} placeholder="Consultation summary" />
            <TextField label="Clinical Notes" value={form.description} onChange={(value) => setForm((prev) => ({ ...prev, description: value }))} placeholder="Symptoms, findings, diagnosis, and advice" />
            <div className="grid md:grid-cols-2 gap-4">
              <Field label="Medication" value={form.medication} onChange={(value) => setForm((prev) => ({ ...prev, medication: value }))} placeholder="Medicine name" />
              <Field label="Dosage" value={form.dosage} onChange={(value) => setForm((prev) => ({ ...prev, dosage: value }))} placeholder="How often to take it" />
            </div>
            <TextField label="Prescription Instructions" value={form.instructions} onChange={(value) => setForm((prev) => ({ ...prev, instructions: value }))} placeholder="Follow-up instructions or warnings" />
            {message && <p className="text-sm font-medium text-emerald-700">{message}</p>}
            <button type="submit" disabled={saving} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-4 rounded-xl">
              {saving ? "Uploading..." : "Upload to Patient Portal"}
            </button>
          </form>
        </section>

        <section className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100 bg-emerald-50/70">
            <h2 className="text-lg font-bold text-gray-900">Recent Uploads</h2>
          </div>
          <div className="divide-y divide-gray-100">
            {data.recentRecords?.length === 0 ? (
              <div className="p-8 text-center text-gray-500">No patient updates uploaded yet.</div>
            ) : (
              data.recentRecords?.map((record: any) => (
                <div key={record.id} className="p-6">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-semibold text-gray-900">{record.patientName || "Unknown patient"}</p>
                    <span className="text-xs text-gray-500">{new Date(record.recordDate).toLocaleString()}</span>
                  </div>
                  <p className="text-sm font-medium text-emerald-700 mt-1">{record.title}</p>
                  <p className="text-sm text-gray-600 mt-2">{record.description}</p>
                </div>
              ))
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

function Field({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (value: string) => void; placeholder: string }) {
  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-1.5">{label}</label>
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="w-full p-3 border border-gray-200 rounded-xl" />
    </div>
  );
}

function TextField({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (value: string) => void; placeholder: string }) {
  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-1.5">{label}</label>
      <textarea value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} rows={4} className="w-full p-3 border border-gray-200 rounded-xl" />
    </div>
  );
}
