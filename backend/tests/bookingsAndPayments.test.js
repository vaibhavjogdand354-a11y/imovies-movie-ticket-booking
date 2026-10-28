const request = require('supertest');
const { app } = require('../server');
const User = require('../models/User');
const Movie = require('../models/Movie');
const Theatre = require('../models/Theatre');
const Show = require('../models/Show');
const Seat = require('../models/Seat');
const Booking = require('../models/Booking');
const Payment = require('../models/Payment');
const { generateSeatsForShow } = require('../controllers/showController');

describe('Bookings, Payments Simulation & Cancellations Suite', () => {
  let userToken;
  let userId;
  let showId;

  beforeEach(async () => {
    const user = await User.create({
      name: 'Booking Tester',
      email: 'booking.tester@example.com',
      passwordHash: 'Pass@123',
      role: 'user',
    });
    userId = user._id;
    userToken = user.generateAuthToken();

    const movie = await Movie.create({
      title: 'Dune: Part Two',
      description: 'Epic Sci-Fi.',
      genre: ['Sci-Fi', 'Action'],
      language: 'English',
      duration: 166,
      releaseDate: new Date(),
      director: 'Denis Villeneuve',
      cast: ['Timothee Chalamet'],
    });

    const theatre = await Theatre.create({
      name: 'INOX Megaplex',
      location: 'Whitefield',
      city: 'Bengaluru',
      address: 'Phoenix Marketcity',
    });

    const show = await Show.create({
      movie: movie._id,
      theatre: theatre._id,
      screenName: 'IMAX Audi',
      date: '2026-11-05',
      time: '18:00',
      format: 'IMAX 2D',
      pricing: { regular: 200, executive: 300, vip: 500 },
    });
    await generateSeatsForShow(show);
    showId = show._id;
  });

  test('POST /api/bookings should successfully confirm booking when seats are locked', async () => {
    // 1. Lock seats C1 and C2 (Executive: 300 each = 600 base)
    await request(app)
      .post(`/api/shows/${showId}/lock-seats`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ seatNumbers: ['C1', 'C2'] });

    // 2. Book seats
    const res = await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        showId,
        seatNumbers: ['C1', 'C2'],
        paymentMethod: 'UPI',
        simulateFailure: false,
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.bookingReference).toMatch(/^IMV-[A-Z0-9]{5}$/);
    expect(res.body.data.totalAmount).toBe(600); // 300 * 2
    expect(res.body.data.convenienceFee).toBe(60); // 30 * 2
    expect(res.body.data.taxAmount).toBe(11); // 18% of 60 rounded
    expect(res.body.data.finalAmount).toBe(671);
    expect(res.body.data.status).toBe('confirmed');

    // Verify seats in database are now 'booked'
    const bookedSeats = await Seat.find({ show: showId, seatNumber: { $in: ['C1', 'C2'] } });
    expect(bookedSeats[0].status).toBe('booked');
    expect(bookedSeats[1].status).toBe('booked');

    // Verify Payment document
    const payment = await Payment.findOne({ booking: res.body.data._id });
    expect(payment).toBeDefined();
    expect(payment.status).toBe('success');
    expect(payment.amount).toBe(671);
  });

  test('POST /api/bookings with simulateFailure=true should fail transaction and rollback seats to available', async () => {
    // 1. Lock seats D1
    await request(app)
      .post(`/api/shows/${showId}/lock-seats`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ seatNumbers: ['D1'] });

    // 2. Book with failure simulation
    const res = await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        showId,
        seatNumbers: ['D1'],
        paymentMethod: 'Credit Card',
        simulateFailure: true,
      });

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/Payment simulation failure/i);

    // Verify seat is rolled back to 'available'
    const seat = await Seat.findOne({ show: showId, seatNumber: 'D1' });
    expect(seat.status).toBe('available');
    expect(seat.lockedBy).toBeNull();
  });

  test('PUT /api/bookings/:id/cancel should cancel confirmed booking, release seats, and issue refund', async () => {
    // 1. Lock & Book F1
    await request(app)
      .post(`/api/shows/${showId}/lock-seats`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ seatNumbers: ['F1'] });

    const bookingRes = await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        showId,
        seatNumbers: ['F1'],
        paymentMethod: 'Net Banking',
        simulateFailure: false,
      });

    const bookingId = bookingRes.body.data._id;

    // 2. Cancel booking
    const cancelRes = await request(app)
      .put(`/api/bookings/${bookingId}/cancel`)
      .set('Authorization', `Bearer ${userToken}`);

    expect(cancelRes.statusCode).toBe(200);
    expect(cancelRes.body.success).toBe(true);
    expect(cancelRes.body.refundTransactionId).toMatch(/^RFD-/);

    // Verify booking status
    const booking = await Booking.findById(bookingId);
    expect(booking.status).toBe('cancelled');
    expect(booking.isUpcoming).toBe(false);

    // Verify seat is back to 'available'
    const seat = await Seat.findOne({ show: showId, seatNumber: 'F1' });
    expect(seat.status).toBe('available');
    expect(seat.lockedBy).toBeNull();

    // Verify refund payment record
    const refundPayment = await Payment.findOne({
      booking: bookingId,
      status: 'refunded',
    });
    expect(refundPayment).toBeDefined();
  });
});
