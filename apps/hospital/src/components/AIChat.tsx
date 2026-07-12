"use client";
import React, { useState } from "react";

export default function AIChat() {
  const [symptoms, setSymptoms] = useState("");
  const [response, setResponse] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleDiagnose = async () => {
    if (!symptoms.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/ai/symptom-checker", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symptoms }),
      });
      const data = await res.json();
      setResponse(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm mt-6">
      <h3 className="text-xl font-bold text-gray-800 mb-2">🤖 AI Doctor Assistant</h3>
      <p className="text-gray-500 text-sm mb-4">Describe your symptoms for a preliminary analysis powered by CareSync AI.</p>
      <textarea
        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition resize-none h-24 text-gray-800"
        placeholder="E.g., I have a severe headache, slight fever, and feel nauseous..."
        value={symptoms}
        onChange={(e) => setSymptoms(e.target.value)}
      ></textarea>
      
      <button
        onClick={handleDiagnose}
        disabled={loading}
        className="mt-3 px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover transition font-medium text-sm disabled:opacity-50"
      >
        {loading ? "Analyzing..." : "Analyze Symptoms"}
      </button>

      {response && (
        <div className="mt-6 p-4 bg-red-50 rounded-lg border border-red-100">
          <h4 className="font-semibold text-primary">Analysis Result</h4>
          <div className="mt-2 text-sm text-gray-800 space-y-2">
            <p><strong>Condition:</strong> {response.condition}</p>
            <p><strong>Severity:</strong> <span className="capitalize">{response.severity}</span></p>
            <p><strong>Next Step:</strong> {response.nextStep}</p>
          </div>
          <p className="text-xs text-gray-500 mt-4 italic">
            Disclaimer: This is an AI-generated analysis and does not replace professional medical advice. Please consult a human doctor for severe conditions.
          </p>
        </div>
      )}
    </div>
  );
}
