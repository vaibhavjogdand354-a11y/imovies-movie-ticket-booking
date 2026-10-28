import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import SeatGrid from '../components/SeatGrid';
import CheckoutModal from '../components/CheckoutModal';
import TicketPassModal from '../components/TicketPassModal';
import { Film, MapPin, Calendar, Clock, ChevronLeft, RefreshCw, AlertCircle } from 'lucide-react';

const BookingPage = () => {
  const { showId } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated, token } = useAuth();
  const { socket, joinShow, leaveShow } = useSocket();

  const [show, setShow] = useState(null);
  const [seats, setSeats] = useState([]);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [holdExpiresAt, setHoldExpiresAt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  // Modals
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [confirmedBooking, setConfirmedBooking] = useState(null);

  // 1. Fetch Show and Seats
  const fetchShowAndSeats = useCallback(async () => {
    try {
      setLoading(true);
      const [showRes, seatsRes] = await Promise.all([
        api.get(`/shows/${showId}`),
        api.get(`/shows/${showId}/seats`),
      ]);

      if (showRes.data.success) {
        setShow(showRes.data.data.show);
      }
      if (seatsRes.data.success) {
        setSeats(seatsRes.data.data);
      }
    } catch (err) {
      console.error('Failed to load show and seats:', err);
      setErrorMsg(err.response?.data?.message || 'Failed to load showtime data.');
    } finally {
      setLoading(false);
    }
  }, [showId]);

  useEffect(() => {
    fetchShowAndSeats();
  }, [fetchShowAndSeats]);

  // 2. Real-time Socket.IO synchronization for this show room
  useEffect(() => {
    if (!socket || !showId) return;

    joinShow(showId);

    // Socket listener: another customer locked seats
    const handleSeatsLocked = ({ seatNumbers, lockedBy, lockedUntil }) => {
      setSeats((prev) =>
        prev.map((s) => {
          if (seatNumbers.includes(s.seatNumber)) {
            const isMe = user && lockedBy === user._id;
            return {
              ...s,
              status: 'locked',
              isLockedByMe: isMe,
              lockedUntil,
            };
          }
          return s;
        })
      );
    };

    // Socket listener: seats were unlocked/released
    const handleSeatsUnlocked = ({ seatNumbers }) => {
      setSeats((prev) =>
        prev.map((s) => {
          if (seatNumbers.length === 0 || seatNumbers.includes(s.seatNumber)) {
            return {
              ...s,
              status: 'available',
              isLockedByMe: false,
              lockedUntil: null,
            };
          }
          return s;
        })
      );
    };

    // Socket listener: seats confirmed booked
    const handleSeatsBooked = ({ seatNumbers }) => {
      setSeats((prev) =>
        prev.map((s) => {
          if (seatNumbers.includes(s.seatNumber)) {
            return {
              ...s,
              status: 'booked',
              isLockedByMe: false,
            };
          }
          return s;
        })
      );
    };

    socket.on('seats_locked', handleSeatsLocked);
    socket.on('seats_unlocked', handleSeatsUnlocked);
    socket.on('seats_booked', handleSeatsBooked);

    return () => {
      leaveShow(showId);
      socket.off('seats_locked', handleSeatsLocked);
      socket.off('seats_unlocked', handleSeatsUnlocked);
      socket.off('seats_booked', handleSeatsBooked);
    };
  }, [socket, showId, user, joinShow, leaveShow]);

  // 3. Handle Seat Selection & Hold
  const handleToggleSeat = async (seat) => {
    if (!isAuthenticated) {
      navigate('/login?redirect=' + encodeURIComponent(window.location.pathname));
      return;
    }

    const isAlreadySelected = selectedSeats.includes(seat.seatNumber);
    let updatedSelection = [];

    if (isAlreadySelected) {
      updatedSelection = selectedSeats.filter((num) => num !== seat.seatNumber);
    } else {
      if (selectedSeats.length >= 8) {
        alert('You can select a maximum of 8 seats per transaction.');
        return;
      }
      updatedSelection = [...selectedSeats, seat.seatNumber];
    }

    setSelectedSeats(updatedSelection);
    setErrorMsg(null);

    // Call backend to lock seats
    if (updatedSelection.length > 0) {
      try {
        setActionLoading(true);
        const res = await api.post(`/shows/${showId}/lock-seats`, {
          seatNumbers: updatedSelection,
        });

        if (res.data.success) {
          setHoldExpiresAt(res.data.lockedUntil);
        }
      } catch (err) {
        const error = err.response?.data?.message || 'Failed to hold seat.';
        setErrorMsg(error);
        // Refresh seats to get newest state
        fetchShowAndSeats();
        setSelectedSeats([]);
      } finally {
        setActionLoading(false);
      }
    } else {
      // Unlocked all seats
      try {
        await api.post(`/shows/${showId}/unlock-seats`, {
          seatNumbers: [seat.seatNumber],
        });
        setHoldExpiresAt(null);
      } catch (err) {
        console.error('Error unlocking seat:', err);
      }
    }
  };

  // 4. Proceed to Checkout Gateway
  const handleProceedToCheckout = () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    setIsCheckoutOpen(true);
  };

  // 5. Confirm Payment & Process Booking (with simulation test branch)
  const handleConfirmPayment = async ({ paymentMethod, simulateFailure }) => {
    try {
      setIsProcessingPayment(true);
      setErrorMsg(null);

      const res = await api.post('/bookings', {
        showId,
        seatNumbers: selectedSeats,
        paymentMethod,
        simulateFailure,
      });

      if (res.data.success) {
        setIsCheckoutOpen(false);
        setConfirmedBooking(res.data.data);
        setSelectedSeats([]);
        setHoldExpiresAt(null);
        fetchShowAndSeats();
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Transaction could not be completed.';
      setErrorMsg(msg);
      // If payment failed (or simulated failure), seats were rolled back by backend
      if (simulateFailure || err.response?.status === 400) {
        setSelectedSeats([]);
        setHoldExpiresAt(null);
        fetchShowAndSeats();
      }
    } finally {
      setIsProcessingPayment(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <RefreshCw className="w-10 h-10 animate-spin text-red-600" />
      </div>
    );
  }

  if (!show) {
    return (
      <div className="max-w-4xl mx-auto py-20 px-4 text-center">
        <h2 className="text-xl font-bold text-white mb-4">Showtime not found</h2>
        <button
          onClick={() => navigate('/')}
          className="px-4 py-2 bg-red-600 text-white rounded-xl text-xs font-bold"
        >
          Return to Movies
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Back button */}
      <button
        onClick={() => navigate(`/movies/${show.movie?._id}`)}
        className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white mb-6 transition"
      >
        <ChevronLeft className="w-4 h-4" /> Back to Movie Details
      </button>

      {/* Showtime Banner */}
      <div className="glass-panel p-5 sm:p-6 rounded-2xl border border-gray-800 shadow-xl mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs bg-red-600 text-white font-bold px-2 py-0.5 rounded">
              {show.format}
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-white">{show.movie?.title}</h1>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-xs text-gray-400 mt-2">
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-gray-500" />
              {show.theatre?.name} ({show.theatre?.city})
            </span>
            <span>•</span>
            <span className="text-white font-medium">{show.screenName}</span>
            <span>•</span>
            <span className="flex items-center gap-1 text-gray-300">
              <Calendar className="w-3.5 h-3.5" />
              {show.date}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1 text-emerald-400 font-bold font-mono">
              <Clock className="w-3.5 h-3.5" />
              {show.time}
            </span>
          </div>
        </div>
      </div>

      {/* Global Error Banner */}
      {errorMsg && (
        <div className="mb-6 p-4 bg-red-950/40 border border-red-500/60 rounded-2xl flex items-center gap-3 text-xs text-red-300 animate-in fade-in">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Interactive 8x8 Seat Grid & Hold Timer */}
      <SeatGrid
        show={show}
        seats={seats}
        selectedSeats={selectedSeats}
        holdExpiresAt={holdExpiresAt}
        onToggleSeat={handleToggleSeat}
        onProceedToCheckout={handleProceedToCheckout}
        loading={actionLoading}
      />

      {/* Checkout Gateway Modal */}
      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        show={show}
        selectedSeats={selectedSeats}
        onConfirmPayment={handleConfirmPayment}
        isProcessing={isProcessingPayment}
        error={errorMsg}
      />

      {/* Ticket Boarding Pass Modal */}
      <TicketPassModal
        isOpen={!!confirmedBooking}
        onClose={() => {
          setConfirmedBooking(null);
          navigate('/my-bookings');
        }}
        booking={confirmedBooking}
      />
    </div>
  );
};

export default BookingPage;
