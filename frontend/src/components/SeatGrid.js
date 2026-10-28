import React, { useState, useEffect } from 'react';
import { Lock, Check, Clock, AlertTriangle, ShieldCheck } from 'lucide-react';
import { formatCurrency } from '../utils/formatters';

const SeatGrid = ({
  show,
  seats = [],
  selectedSeats = [],
  holdExpiresAt,
  onToggleSeat,
  onProceedToCheckout,
  loading = false,
}) => {
  // Timer state for 5-minute hold countdown
  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    if (!holdExpiresAt) {
      setTimeLeft(0);
      return;
    }

    const updateTimer = () => {
      const now = new Date().getTime();
      const target = new Date(holdExpiresAt).getTime();
      const diff = Math.max(0, Math.floor((target - now) / 1000));
      setTimeLeft(diff);
    };

    updateTimer();
    const timer = setInterval(updateTimer, 1000);
    return () => clearInterval(timer);
  }, [holdExpiresAt]);

  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Group seats by rows A to H
  const rows = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
  const seatsByRow = rows.reduce((acc, row) => {
    acc[row] = seats.filter((s) => s.row === row).sort((a, b) => a.column - b.column);
    return acc;
  }, {});

  // Pricing calculations
  const selectedSeatObjects = seats.filter((s) => selectedSeats.includes(s.seatNumber));
  const baseTotal = selectedSeatObjects.reduce((sum, s) => sum + s.price, 0);
  const convenienceFee = selectedSeats.length * 30;
  const taxAmount = Math.round(convenienceFee * 0.18);
  const finalTotal = baseTotal + convenienceFee + taxAmount;

  const getSeatColor = (seat) => {
    const isSelected = selectedSeats.includes(seat.seatNumber);

    if (seat.status === 'booked') {
      return 'bg-gray-800 text-gray-600 border-gray-700/50 cursor-not-allowed';
    }
    if (seat.status === 'locked' && !seat.isLockedByMe && !isSelected) {
      return 'bg-amber-950/40 text-amber-500 border-amber-600/50 cursor-not-allowed animate-pulse';
    }
    if (isSelected) {
      return 'bg-red-600 text-white border-red-500 shadow-lg shadow-red-600/40 scale-105';
    }
    // Available colors by tier
    if (seat.tier === 'vip') {
      return 'bg-gray-900 text-amber-300 border-amber-500/40 hover:border-amber-400 hover:bg-amber-500/10';
    }
    if (seat.tier === 'executive') {
      return 'bg-gray-900 text-sky-300 border-sky-500/40 hover:border-sky-400 hover:bg-sky-500/10';
    }
    return 'bg-gray-900 text-emerald-300 border-emerald-500/40 hover:border-emerald-400 hover:bg-emerald-500/10';
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Auditorium Map (2 Columns) */}
      <div className="lg:col-span-2 glass-panel p-6 rounded-2xl border border-gray-800 flex flex-col items-center">
        {/* Curved Cinema Screen */}
        <div className="w-full mb-8 text-center">
          <div className="cinema-screen" />
          <p className="text-[11px] font-mono tracking-widest text-sky-400/80 uppercase mt-2">
            Screen This Way
          </p>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-xs mb-8 text-gray-400 bg-gray-900/60 px-4 py-2 rounded-xl border border-gray-800">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-md border border-gray-600 bg-gray-900" />
            <span>Available</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-md bg-red-600 border border-red-500" />
            <span>Selected</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-md bg-amber-950/40 border border-amber-600/60 flex items-center justify-center text-amber-500">
              <Lock className="w-3 h-3" />
            </div>
            <span>Held (Other)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-md bg-gray-800 border border-gray-700" />
            <span>Booked</span>
          </div>
        </div>

        {/* 8x8 Grid */}
        <div className="space-y-6 w-full max-w-lg">
          {/* VIP Section: Rows A & B */}
          <div>
            <div className="flex items-center justify-between text-xs text-amber-400 font-semibold mb-2 px-2 border-b border-amber-500/20 pb-1">
              <span>VIP Tier — ₹{show?.pricing?.vip || 450}</span>
              <span className="text-[11px] text-gray-400">Rows A - B</span>
            </div>
            <div className="space-y-2">
              {['A', 'B'].map((rowLetter) => (
                <div key={rowLetter} className="flex items-center justify-center gap-2">
                  <span className="w-4 text-xs font-mono font-bold text-gray-500 text-center">
                    {rowLetter}
                  </span>
                  <div className="flex gap-2">
                    {seatsByRow[rowLetter]?.map((seat) => (
                      <button
                        key={seat._id}
                        disabled={
                          seat.status === 'booked' ||
                          (seat.status === 'locked' && !seat.isLockedByMe && !selectedSeats.includes(seat.seatNumber))
                        }
                        onClick={() => onToggleSeat(seat)}
                        className={`w-8 h-8 sm:w-9 sm:h-9 rounded-lg border text-xs font-bold transition-all duration-200 flex items-center justify-center ${getSeatColor(
                          seat
                        )}`}
                        title={`${seat.seatNumber} (${seat.tier.toUpperCase()} - ₹${seat.price})`}
                      >
                        {seat.seatNumber}
                      </button>
                    ))}
                  </div>
                  <span className="w-4 text-xs font-mono font-bold text-gray-500 text-center">
                    {rowLetter}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Executive Section: Rows C, D, E */}
          <div>
            <div className="flex items-center justify-between text-xs text-sky-400 font-semibold mb-2 px-2 border-b border-sky-500/20 pb-1">
              <span>Executive Tier — ₹{show?.pricing?.executive || 280}</span>
              <span className="text-[11px] text-gray-400">Rows C - E</span>
            </div>
            <div className="space-y-2">
              {['C', 'D', 'E'].map((rowLetter) => (
                <div key={rowLetter} className="flex items-center justify-center gap-2">
                  <span className="w-4 text-xs font-mono font-bold text-gray-500 text-center">
                    {rowLetter}
                  </span>
                  <div className="flex gap-2">
                    {seatsByRow[rowLetter]?.map((seat) => (
                      <button
                        key={seat._id}
                        disabled={
                          seat.status === 'booked' ||
                          (seat.status === 'locked' && !seat.isLockedByMe && !selectedSeats.includes(seat.seatNumber))
                        }
                        onClick={() => onToggleSeat(seat)}
                        className={`w-8 h-8 sm:w-9 sm:h-9 rounded-lg border text-xs font-bold transition-all duration-200 flex items-center justify-center ${getSeatColor(
                          seat
                        )}`}
                        title={`${seat.seatNumber} (${seat.tier.toUpperCase()} - ₹${seat.price})`}
                      >
                        {seat.seatNumber}
                      </button>
                    ))}
                  </div>
                  <span className="w-4 text-xs font-mono font-bold text-gray-500 text-center">
                    {rowLetter}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Regular Section: Rows F, G, H */}
          <div>
            <div className="flex items-center justify-between text-xs text-emerald-400 font-semibold mb-2 px-2 border-b border-emerald-500/20 pb-1">
              <span>Regular Tier — ₹{show?.pricing?.regular || 180}</span>
              <span className="text-[11px] text-gray-400">Rows F - H</span>
            </div>
            <div className="space-y-2">
              {['F', 'G', 'H'].map((rowLetter) => (
                <div key={rowLetter} className="flex items-center justify-center gap-2">
                  <span className="w-4 text-xs font-mono font-bold text-gray-500 text-center">
                    {rowLetter}
                  </span>
                  <div className="flex gap-2">
                    {seatsByRow[rowLetter]?.map((seat) => (
                      <button
                        key={seat._id}
                        disabled={
                          seat.status === 'booked' ||
                          (seat.status === 'locked' && !seat.isLockedByMe && !selectedSeats.includes(seat.seatNumber))
                        }
                        onClick={() => onToggleSeat(seat)}
                        className={`w-8 h-8 sm:w-9 sm:h-9 rounded-lg border text-xs font-bold transition-all duration-200 flex items-center justify-center ${getSeatColor(
                          seat
                        )}`}
                        title={`${seat.seatNumber} (${seat.tier.toUpperCase()} - ₹${seat.price})`}
                      >
                        {seat.seatNumber}
                      </button>
                    ))}
                  </div>
                  <span className="w-4 text-xs font-mono font-bold text-gray-500 text-center">
                    {rowLetter}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Booking Summary Sidebar (1 Column) */}
      <div className="space-y-6">
        {/* Live Hold Timer (Visible when seats held) */}
        {selectedSeats.length > 0 && holdExpiresAt && (
          <div
            className={`p-4 rounded-2xl border transition-all ${
              timeLeft < 60
                ? 'bg-red-950/40 border-red-500/80 text-red-200'
                : 'bg-amber-950/30 border-amber-500/50 text-amber-200'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider">
                <Clock className="w-4 h-4 animate-spin" /> Seat Hold Countdown
              </span>
              <span className="font-mono text-base font-extrabold">{formatTimer(timeLeft)}</span>
            </div>
            <p className="text-xs text-gray-300">
              {timeLeft > 0
                ? `Seats are temporarily reserved. Complete checkout before timer hits 0:00.`
                : `Reservation expired. Seats have been returned to available pool.`}
            </p>
            {/* Progress bar */}
            <div className="w-full bg-gray-800 h-1.5 rounded-full mt-3 overflow-hidden">
              <div
                className={`h-full transition-all duration-1000 ${
                  timeLeft < 60 ? 'bg-red-500' : 'bg-amber-400'
                }`}
                style={{ width: `${Math.min(100, (timeLeft / 300) * 100)}%` }}
              />
            </div>
          </div>
        )}

        {/* Price Breakdown Panel */}
        <div className="glass-panel p-6 rounded-2xl border border-gray-800 shadow-xl space-y-5">
          <h3 className="text-base font-bold text-white border-b border-gray-800 pb-3 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" /> Booking Breakdown
          </h3>

          <div>
            <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
              <span>Selected Seats:</span>
              <span className="font-semibold text-white">{selectedSeats.length} / 8 max</span>
            </div>
            {selectedSeats.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {selectedSeats.map((sn) => (
                  <span
                    key={sn}
                    className="bg-red-600/20 text-red-400 border border-red-500/40 px-2 py-0.5 rounded text-xs font-mono font-bold"
                  >
                    {sn}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-500 italic">No seats selected yet. Click any seat on the auditorium map.</p>
            )}
          </div>

          <div className="space-y-2.5 pt-3 border-t border-gray-800 text-xs">
            <div className="flex justify-between text-gray-300">
              <span>Ticket Subtotal</span>
              <span className="font-mono">{formatCurrency(baseTotal)}</span>
            </div>
            <div className="flex justify-between text-gray-400">
              <span>Convenience Fee (₹30/seat)</span>
              <span className="font-mono">{formatCurrency(convenienceFee)}</span>
            </div>
            <div className="flex justify-between text-gray-400">
              <span>Integrated GST (18%)</span>
              <span className="font-mono">{formatCurrency(taxAmount)}</span>
            </div>
            <div className="flex justify-between text-sm font-bold text-white pt-3 border-t border-gray-800">
              <span>Final Amount</span>
              <span className="font-mono text-base text-red-400">{formatCurrency(finalTotal)}</span>
            </div>
          </div>

          <button
            disabled={selectedSeats.length === 0 || loading || (holdExpiresAt && timeLeft === 0)}
            onClick={onProceedToCheckout}
            className={`w-full py-3.5 px-4 rounded-xl font-bold text-sm shadow-xl transition-all ${
              selectedSeats.length > 0 && !(holdExpiresAt && timeLeft === 0)
                ? 'bg-red-600 hover:bg-red-700 text-white shadow-red-600/30 transform hover:-translate-y-0.5'
                : 'bg-gray-800 text-gray-500 cursor-not-allowed border border-gray-700/50'
            }`}
          >
            {loading ? 'Holding Seats...' : 'Proceed to Checkout'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SeatGrid;
