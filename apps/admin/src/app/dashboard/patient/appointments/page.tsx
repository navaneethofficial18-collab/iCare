"use client";
import React, { useState } from "react";
import Link from "next/link";
import OfflineIndicator from "@/components/OfflineIndicator";
import { localDb } from "@/lib/db/indexeddb";

export default function AppointmentsPage() {
  const [booking, setBooking] = useState(false);
  
  const handleBook = async () => {
    setBooking(true);
    // Simulate booking and saving to offline indexedDB
    try {
      if (!navigator.onLine) {
        await localDb.pendingActions.add({
          type: "BOOK_APPOINTMENT",
          payload: { url: "/api/appointments", method: "POST", data: { hospitalId: "1", date: new Date().toISOString() } },
          status: "pending",
          retryCount: 0,
          createdAt: new Date().toISOString()
        });
        alert("Saved offline. Will sync when online.");
      } else {
        // Normally fetch to server
        alert("Appointment booked and synced successfully.");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setBooking(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-soft p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <Link href="/dashboard/patient" className="text-primary font-medium hover:underline">&larr; Back to Dashboard</Link>
        <h1 className="text-3xl font-bold text-gray-900">Book Appointment</h1>
        
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h2 className="text-lg font-bold text-gray-800 mb-4">Apollo General Hospital</h2>
          <p className="text-gray-500 mb-6 font-medium text-sm">Next available slot: Tomorrow, 10:00 AM</p>
          <button 
            onClick={handleBook}
            disabled={booking}
            className="px-6 py-2.5 bg-primary text-white font-semibold rounded-lg hover:bg-primary-hover transition"
          >
            {booking ? "Booking..." : "Confirm Booking"}
          </button>
        </div>
      </div>
      <OfflineIndicator />
    </div>
  );
}
