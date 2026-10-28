import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Ticket, Calendar, Clock, MapPin, AlertCircle, CheckCircle2, XCircle, RefreshCw } from 'lucide-react';
import { formatCurrency } from '../utils/formatters';
import TicketPassModal from '../components/TicketPassModal';

const MyBookingsPage = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [cancellingId, setCancellingId] = useState(null);
  const [feedbackMsg, setFeedbackMsg] = useState(null);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const params = {};
      if (statusFilter !== 'all') {
        params.status = statusFilter;
      }
      const res = await api.get('/bookings/my', { params });
      if (res.data.success) {
        setBookings(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching bookings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [statusFilter]);

  const handleCancelBooking = async (bookingId) => {
    const confirm = window.confirm(
      'Are you sure you want to cancel this booking? Full refund will be initiated and seats will be released.'
    );
    if (!confirm) return;

    try {
      setCancellingId(bookingId);
      const res = await api.put(`/bookings/${bookingId}/cancel`);
      if (res.data.success) {
        setFeedbackMsg(
          `Booking cancelled. Refund of ${formatCurrency(res.data.refundAmount)} initiated! (Txn: ${
            res.data.refundTransactionId
          })`
        );
        fetchBookings();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to cancel booking.');
    } finally {
      setCancellingId(null);
    }
  };

  const getStatusBadge = (b) => {
    if (b.status === 'cancelled') {
      return (
        <span className="flex items-center gap-1 text-[11px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/30 px-2.5 py-0.5 rounded-full">
          <XCircle className="w-3 h-3" /> Cancelled
        </span>
      );
    }
    if (b.isUpcoming) {
      return (
        <span className="flex items-center gap-1 text-[11px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2.5 py-0.5 rounded-full">
          <CheckCircle2 className="w-3 h-3" /> Confirmed • Upcoming
        </span>
      );
    }
    return (
      <span className="flex items-center gap-1 text-[11px] font-bold bg-gray-700/50 text-gray-400 border border-gray-600/30 px-2.5 py-0.5 rounded-full">
        Completed
      </span>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-2">
            <Ticket className="w-7 h-7 text-red-600" /> My Booking History
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Track confirmed tickets, view digital boarding passes, and manage cancellations.
          </p>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 bg-gray-900/90 p-1.5 rounded-xl border border-gray-800">
          {[
            { id: 'all', label: 'All' },
            { id: 'upcoming', label: 'Upcoming' },
            { id: 'past', label: 'Past' },
            { id: 'cancelled', label: 'Cancelled' },
          ].map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setStatusFilter(id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                statusFilter === id
                  ? 'bg-red-600 text-white shadow'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {feedbackMsg && (
        <div className="mb-6 p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/50 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{feedbackMsg}</span>
        </div>
      )}

      {/* Bookings List */}
      {loading ? (
        <div className="py-24 text-center">
          <RefreshCw className="w-10 h-10 animate-spin mx-auto text-red-600 mb-3" />
          <p className="text-sm text-gray-400">Loading your bookings...</p>
        </div>
      ) : bookings.length === 0 ? (
        <div className="text-center py-24 glass-panel rounded-2xl border border-gray-800">
          <Ticket className="w-12 h-12 text-gray-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-white mb-1">No bookings found</h3>
          <p className="text-xs text-gray-400 max-w-sm mx-auto mb-4">
            You don't have any {statusFilter !== 'all' ? statusFilter : ''} bookings yet. Browse current blockbusters and reserve your seats today!
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map((booking) => {
            const show = booking.show || {};
            const movie = show.movie || {};
            const theatre = show.theatre || {};

            return (
              <div
                key={booking._id}
                className="glass-panel p-5 sm:p-6 rounded-2xl border border-gray-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 hover:border-gray-700 transition"
              >
                {/* Poster & Movie Info */}
                <div className="flex gap-4 items-center">
                  <div className="w-16 h-24 sm:w-20 sm:h-28 rounded-xl overflow-hidden bg-gray-950 border border-gray-800 shrink-0">
                    <img
                      src={movie.posterUrl || 'https://via.placeholder.com/150'}
                      alt={movie.title}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-red-400 bg-red-950/40 px-2 py-0.5 rounded border border-red-800/40">
                        {booking.bookingReference}
                      </span>
                      {getStatusBadge(booking)}
                    </div>
                    <h3 className="font-bold text-base text-white">{movie.title || 'Movie'}</h3>
                    <p className="text-xs text-gray-400 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-gray-500" />
                      {theatre.name} ({theatre.city})
                    </p>
                    <p className="text-xs text-gray-400">
                      {show.screenName} • {show.format}
                    </p>
                  </div>
                </div>

                {/* Show Details & Seats */}
                <div className="space-y-2 text-xs">
                  <div className="flex items-center gap-4 text-gray-300">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-gray-400" />
                      {show.date}
                    </span>
                    <span className="flex items-center gap-1 font-mono font-bold text-emerald-400">
                      <Clock className="w-3.5 h-3.5 text-emerald-400" />
                      {show.time}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500 mr-2">Seats ({booking.seats?.length}):</span>
                    <span className="font-mono font-bold text-white bg-gray-800 px-2 py-0.5 rounded">
                      {booking.seats?.join(', ')}
                    </span>
                  </div>
                  <div className="text-gray-400">
                    <span>Total Paid: </span>
                    <span className="font-mono font-bold text-white">{formatCurrency(booking.finalAmount)}</span>
                    <span className="text-[10px] text-gray-500 ml-1">via {booking.paymentMethod}</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex md:flex-col gap-2 w-full md:w-auto">
                  <button
                    onClick={() => setSelectedTicket(booking)}
                    className="flex-1 md:flex-initial px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-200 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5"
                  >
                    <Ticket className="w-3.5 h-3.5 text-red-500" /> View Pass
                  </button>

                  {booking.status === 'confirmed' && (
                    <button
                      disabled={cancellingId === booking._id}
                      onClick={() => handleCancelBooking(booking._id)}
                      className="flex-1 md:flex-initial px-4 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5"
                    >
                      {cancellingId === booking._id ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <XCircle className="w-3.5 h-3.5" />
                      )}
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Ticket Modal */}
      <TicketPassModal
        isOpen={!!selectedTicket}
        onClose={() => setSelectedTicket(null)}
        booking={selectedTicket}
      />
    </div>
  );
};

export default MyBookingsPage;
