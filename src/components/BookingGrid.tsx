"use client";

import { useState, useEffect, useCallback } from "react";
import { cn, getSlots, formatHour, COURTS, todayString, displayDate } from "@/lib/utils";

interface Booking {
  id: string;
  court: number;
  startTime: number;
  endTime: number;
  userId: string;
  user: { name: string };
}

interface BookingGridProps {
  currentUserId: string;
  hasActiveMembership: boolean;
  isAdmin?: boolean;
}

export function BookingGrid({ currentUserId, hasActiveMembership, isAdmin = false }: BookingGridProps) {
  const [selectedDate, setSelectedDate] = useState(todayString());
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const slots = getSlots();

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/bookings?date=${selectedDate}`);
      if (!res.ok) throw new Error("Failed to load bookings");
      const data = await res.json();
      setBookings(data);
    } catch {
      setError("Could not load bookings. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const getBooking = (court: number, startTime: number): Booking | undefined =>
    bookings.find((b) => b.court === court && b.startTime === startTime);

  async function handleBook(court: number, startTime: number) {
    if (!hasActiveMembership) {
      setError("You need an active membership to book a court.");
      return;
    }
    const key = `${court}-${startTime}`;
    setActionLoading(key);
    setError(null);
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ court, date: selectedDate, startTime }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not create booking.");
      } else {
        await fetchBookings();
      }
    } finally {
      setActionLoading(null);
    }
  }

  async function handleCancel(bookingId: string) {
    setActionLoading(bookingId);
    setError(null);
    try {
      const res = await fetch(`/api/bookings/${bookingId}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not cancel booking.");
      } else {
        await fetchBookings();
      }
    } finally {
      setActionLoading(null);
    }
  }

  const today = todayString();
  const maxDate = isAdmin ? undefined : (() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toLocaleDateString("en-CA"); // YYYY-MM-DD in local time
  })();

  return (
    <div className="space-y-6">
      {/* Date picker */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Select Date</label>
          <input
            type="date"
            value={selectedDate}
            min={today}
            {...(maxDate ? { max: maxDate } : {})}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
        </div>
        <div className="sm:mt-6">
          <p className="text-base font-semibold text-gray-800">{displayDate(selectedDate)}</p>
        </div>
      </div>

      {!hasActiveMembership && (
        <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800">
          You need an <a href="/membership" className="font-semibold underline">active membership</a> to book courts.
        </div>
      )}

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
          <button onClick={() => setError(null)} className="ml-2 font-semibold underline">Dismiss</button>
        </div>
      )}

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-xs font-medium">
        <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-brand-100 border border-brand-300" />Available</span>
        <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-blue-100 border border-blue-400" />Your booking</span>
        <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-gray-200 border border-gray-300" />Booked</span>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="flex h-40 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-200 border-t-brand-600" />
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-gray-100">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 w-28">
                  Time
                </th>
                {COURTS.map((court) => (
                  <th
                    key={court}
                    className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-gray-500"
                  >
                    Court {court}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {slots.map((slot) => (
                <tr key={slot} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 text-sm font-medium text-gray-600 whitespace-nowrap">
                    {formatHour(slot)}
                  </td>
                  {COURTS.map((court) => {
                    const booking = getBooking(court, slot);
                    const isMyBooking = booking?.userId === currentUserId;
                    const canCancel = isMyBooking || isAdmin;
                    const isBooked = !!booking;
                    const key = `${court}-${slot}`;
                    const isBusy = actionLoading === key || actionLoading === booking?.id;

                    return (
                      <td key={court} className="px-4 py-2 text-center">
                        {isBooked ? (
                          canCancel ? (
                            <div className="inline-flex flex-col items-center gap-1">
                              <span className={cn(
                                "rounded-full px-3 py-1 text-xs font-semibold border",
                                isMyBooking
                                  ? "bg-blue-100 text-blue-700 border-blue-200"
                                  : "bg-gray-100 text-gray-600 border-gray-200"
                              )}>
                                {isMyBooking ? "You" : booking.user.name.split(" ")[0]}
                              </span>
                              <button
                                onClick={() => handleCancel(booking.id)}
                                disabled={isBusy}
                                className="text-xs text-red-500 hover:text-red-700 hover:underline disabled:opacity-50"
                              >
                                {isBusy ? "Cancelling…" : "Cancel"}
                              </button>
                            </div>
                          ) : (
                            <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-500 border border-gray-200">
                              {booking.user.name.split(" ")[0]}
                            </span>
                          )
                        ) : (
                          <button
                            onClick={() => handleBook(court, slot)}
                            disabled={!hasActiveMembership || isBusy}
                            className={cn(
                              "rounded-full px-4 py-1 text-xs font-semibold transition-colors border",
                              hasActiveMembership
                                ? "bg-brand-50 border-brand-300 text-brand-700 hover:bg-brand-100 disabled:opacity-50"
                                : "bg-gray-50 border-gray-200 text-gray-400 cursor-not-allowed"
                            )}
                          >
                            {isBusy ? "…" : "Book"}
                          </button>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
