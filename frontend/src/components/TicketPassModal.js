import React from 'react';
import { CheckCircle2, Ticket, QrCode, Printer, X, Download } from 'lucide-react';
import { formatCurrency } from '../utils/formatters';

const TicketPassModal = ({ isOpen, onClose, booking }) => {
  if (!isOpen || !booking) return null;

  const show = booking.show || {};
  const movie = show.movie || {};
  const theatre = show.theatre || {};

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-md bg-gradient-to-b from-gray-900 via-gray-900 to-[#0B0F19] rounded-3xl border border-gray-700/80 shadow-2xl overflow-hidden print:m-0 print:border-none">
        {/* Top Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 text-gray-400 hover:text-white rounded-full bg-gray-900/80 hover:bg-gray-800 transition print:hidden"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Success Header Banner */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-6 text-center text-white relative">
          <CheckCircle2 className="w-12 h-12 mx-auto mb-2 text-white drop-shadow" />
          <h2 className="text-xl font-extrabold tracking-tight">Booking Confirmed!</h2>
          <p className="text-xs text-emerald-100 font-mono tracking-wider mt-0.5">
            REF: {booking.bookingReference}
          </p>
        </div>

        {/* Ticket Body */}
        <div className="p-6 space-y-5">
          {/* Movie Details */}
          <div className="flex gap-4 items-center">
            {movie.posterUrl && (
              <img
                src={movie.posterUrl}
                alt={movie.title}
                className="w-16 h-24 object-cover rounded-xl shadow border border-gray-800 shrink-0"
              />
            )}
            <div className="flex-1 min-w-0">
              <span className="text-[10px] bg-red-600 text-white font-bold px-2 py-0.5 rounded">
                {show.format || '2D'}
              </span>
              <h3 className="font-extrabold text-base text-white mt-1 line-clamp-1">
                {movie.title || 'Movie Title'}
              </h3>
              <p className="text-xs text-gray-400 line-clamp-1">{theatre.name || 'Cinema Hall'}</p>
              <p className="text-[11px] text-gray-500">{theatre.city || 'City'}</p>
            </div>
          </div>

          {/* Ticket Specs Grid */}
          <div className="grid grid-cols-2 gap-3 p-4 rounded-2xl bg-gray-950 border border-gray-800 text-xs">
            <div>
              <span className="text-[10px] text-gray-500 uppercase tracking-wider block">Date</span>
              <span className="font-semibold text-gray-200">{show.date}</span>
            </div>
            <div>
              <span className="text-[10px] text-gray-500 uppercase tracking-wider block">Time</span>
              <span className="font-semibold text-gray-200">{show.time}</span>
            </div>
            <div>
              <span className="text-[10px] text-gray-500 uppercase tracking-wider block">Audi / Screen</span>
              <span className="font-semibold text-gray-200">{show.screenName || 'Screen 1'}</span>
            </div>
            <div>
              <span className="text-[10px] text-gray-500 uppercase tracking-wider block">Seats</span>
              <span className="font-bold text-red-400 font-mono">{booking.seats?.join(', ')}</span>
            </div>
          </div>

          {/* Perforated Divider Simulation */}
          <div className="relative flex items-center justify-between my-2">
            <div className="w-5 h-5 rounded-full bg-[#0B0F19] -ml-9 border-r border-gray-700" />
            <div className="w-full border-b-2 border-dashed border-gray-700 mx-2" />
            <div className="w-5 h-5 rounded-full bg-[#0B0F19] -mr-9 border-l border-gray-700" />
          </div>

          {/* Simulated QR & Total */}
          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-white rounded-xl shadow">
                <QrCode className="w-10 h-10 text-gray-900" />
              </div>
              <div className="text-[11px] text-gray-400">
                <p className="font-mono font-bold text-gray-300">Scan at entrance</p>
                <p>Status: {booking.status?.toUpperCase()}</p>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[10px] text-gray-400 uppercase tracking-wider block">Paid</span>
              <span className="text-base font-extrabold font-mono text-emerald-400">
                {formatCurrency(booking.finalAmount)}
              </span>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-6 pt-2 pb-6 border-t border-gray-800 flex gap-3 print:hidden">
          <button
            onClick={handlePrint}
            className="flex-1 py-3 bg-gray-800 hover:bg-gray-700 text-gray-200 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition"
          >
            <Printer className="w-4 h-4" /> Print / Save
          </button>
          <button
            onClick={onClose}
            className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-red-600/30 transition"
          >
            <Ticket className="w-4 h-4" /> Done
          </button>
        </div>
      </div>
    </div>
  );
};

export default TicketPassModal;
