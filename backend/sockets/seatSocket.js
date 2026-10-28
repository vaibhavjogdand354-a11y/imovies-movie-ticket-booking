const Seat = require('../models/Seat');
const jwt = require('jsonwebtoken');

/**
 * Real-time Socket.IO handler for Auditorium Seat Locking & Live Status
 */
const setupSeatSocket = (io) => {
  // In-memory map of active timers to auto-broadcast release when 5-minute hold expires
  const activeHoldTimers = new Map();

  io.on('connection', (socket) => {
    // 1. Join Show Room
    socket.on('join_show', async ({ showId }) => {
      if (!showId) return;
      const room = `show_${showId}`;
      socket.join(room);

      // Clean up any expired locks immediately
      try {
        await Seat.releaseExpiredLocks(showId);
      } catch (err) {
        console.error(`[Socket] Error releasing expired locks for show ${showId}:`, err.message);
      }
    });

    // 2. Leave Show Room
    socket.on('leave_show', ({ showId }) => {
      if (!showId) return;
      socket.leave(`show_${showId}`);
    });

    // 3. Request Seat Lock via WebSocket
    socket.on('request_seat_lock', async ({ showId, seatNumbers, token }, callback) => {
      try {
        if (!token) {
          if (callback) callback({ success: false, message: 'Authentication required to hold seats.' });
          return;
        }

        const decoded = jwt.verify(
          token,
          process.env.JWT_SECRET || 'imovies_super_secret_jwt_key_2026_skillwallet_secure'
        );
        const userId = decoded.id;

        await Seat.releaseExpiredLocks(showId);

        // Check availability
        const seats = await Seat.find({
          show: showId,
          seatNumber: { $in: seatNumbers },
        });

        const now = new Date();
        const conflicting = seats.filter(
          (s) =>
            s.status === 'booked' ||
            (s.status === 'locked' && s.lockedBy && s.lockedBy.toString() !== userId && s.lockedUntil > now)
        );

        if (conflicting.length > 0) {
          if (callback) {
            callback({
              success: false,
              message: 'One or more seats are already held or booked.',
              conflicts: conflicting.map((s) => s.seatNumber),
            });
          }
          return;
        }

        const lockedUntil = new Date(Date.now() + 5 * 60 * 1000);

        await Seat.updateMany(
          {
            show: showId,
            seatNumber: { $in: seatNumbers },
          },
          {
            $set: {
              status: 'locked',
              lockedBy: userId,
              lockedUntil,
            },
          }
        );

        // Broadcast to everyone in this show room
        io.to(`show_${showId}`).emit('seats_locked', {
          showId,
          seatNumbers,
          lockedBy: userId,
          lockedUntil,
        });

        // Set timer key
        const timerKey = `${showId}_${userId}_${seatNumbers.sort().join('_')}`;
        if (activeHoldTimers.has(timerKey)) {
          clearTimeout(activeHoldTimers.get(timerKey));
        }

        // Schedule auto-release after 5 minutes
        const timer = setTimeout(async () => {
          try {
            const expiredSeats = await Seat.find({
              show: showId,
              seatNumber: { $in: seatNumbers },
              status: 'locked',
              lockedBy: userId,
              lockedUntil: { $lte: new Date() },
            });

            if (expiredSeats.length > 0) {
              await Seat.updateMany(
                {
                  _id: { $in: expiredSeats.map((s) => s._id) },
                },
                {
                  $set: {
                    status: 'available',
                    lockedBy: null,
                    lockedUntil: null,
                  },
                }
              );

              io.to(`show_${showId}`).emit('seats_unlocked', {
                showId,
                seatNumbers: expiredSeats.map((s) => s.seatNumber),
                reason: 'timeout',
              });
            }
            activeHoldTimers.delete(timerKey);
          } catch (err) {
            console.error('[Socket Timer] Error auto-releasing expired seats:', err.message);
          }
        }, 5 * 60 * 1000);

        activeHoldTimers.set(timerKey, timer);

        if (callback) {
          callback({
            success: true,
            seatNumbers,
            lockedUntil,
          });
        }
      } catch (err) {
        if (callback) callback({ success: false, message: err.message });
      }
    });

    // 4. Request Seat Unlock via WebSocket
    socket.on('request_seat_unlock', async ({ showId, seatNumbers, token }, callback) => {
      try {
        if (!token) return;
        const decoded = jwt.verify(
          token,
          process.env.JWT_SECRET || 'imovies_super_secret_jwt_key_2026_skillwallet_secure'
        );
        const userId = decoded.id;

        await Seat.updateMany(
          {
            show: showId,
            seatNumber: { $in: seatNumbers },
            lockedBy: userId,
            status: 'locked',
          },
          {
            $set: {
              status: 'available',
              lockedBy: null,
              lockedUntil: null,
            },
          }
        );

        io.to(`show_${showId}`).emit('seats_unlocked', {
          showId,
          seatNumbers,
          reason: 'manual_release',
        });

        if (callback) callback({ success: true });
      } catch (err) {
        if (callback) callback({ success: false, message: err.message });
      }
    });

    socket.on('disconnect', () => {
      // Clean disconnect
    });
  });
};

module.exports = setupSeatSocket;
