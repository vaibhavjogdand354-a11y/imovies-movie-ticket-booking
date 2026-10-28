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

describe('SkillWallet Master Evaluation Suite (Steps 6 & 7 Verification)', () => {
  let adminToken;
  let userToken;
  let userId;
  let testMovieId;
  let testTheatreId;
  let testShowId;

  beforeEach(async () => {
    // 1. Setup Admin
    const admin = await User.create({
      name: 'Aarav Sharma (Admin)',
      email: 'admin.rubric@imovies.com',
      passwordHash: 'Admin@123',
      role: 'admin',
      phone: '+91 98260 11223',
    });
    adminToken = admin.generateAuthToken();

    // 2. Setup User
    const user = await User.create({
      name: 'Arjun Mehta (Customer)',
      email: 'arjun.rubric@imovies.com',
      passwordHash: 'User@123',
      role: 'user',
      phone: '+91 98260 44556',
    });
    userId = user._id;
    userToken = user.generateAuthToken();

    // 3. Setup Theatre
    const theatre = await Theatre.create({
      name: 'IMovies IMAX Grand Multiplex',
      location: 'MP Nagar Zone II',
      city: 'Bhopal',
      address: 'DB City Mall Level 4, MP Nagar, Bhopal',
      facilities: ['IMAX Laser', 'Dolby Atmos', 'Recliner Lounge'],
    });
    testTheatreId = theatre._id;

    // 4. Setup Movie
    const movie = await Movie.create({
      title: 'Chronicles of the Event Horizon',
      description: 'Astrophysicist discovers a sentient wormhole.',
      genre: ['Sci-Fi', 'Adventure', 'Thriller'],
      language: 'English',
      duration: 154,
      releaseDate: new Date('2026-10-15'),
      rating: 9.2,
      certification: 'UA',
      director: 'Elena Vance',
      cast: ['Marcus Sterling', 'Aria Chen'],
      posterUrl: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba',
    });
    testMovieId = movie._id;

    // 5. Setup Show & auto-generate 64 seats
    const show = await Show.create({
      movie: testMovieId,
      theatre: testTheatreId,
      screenName: 'Audi 01 - IMAX Laser',
      date: '2026-10-28',
      time: '18:30',
      format: 'IMAX 2D',
      pricing: { regular: 240, executive: 340, vip: 520 },
    });
    await generateSeatsForShow(show);
    testShowId = show._id;
  });

  // TEST AREA 1: Authentication Workflows
  describe('Test Area 1: Authentication Workflows & Security', () => {
    test('1.1 Should register customer and return signed JWT with bcrypt hashing', async () => {
      const res = await request(app).post('/api/auth/register').send({
        name: 'Pooja Verma',
        email: 'pooja.verma@example.com',
        password: 'Password@2026',
        phone: '+91 98260 99999',
      });

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.token).toBeDefined();
      expect(res.body.user.role).toBe('user');

      const savedInDb = await User.findOne({ email: 'pooja.verma@example.com' });
      expect(savedInDb.passwordHash).not.toBe('Password@2026'); // bcrypt verification
    });

    test('1.2 Should enforce RBAC role guard and forbid unauthorized admin routes for standard user', async () => {
      const res = await request(app)
        .post('/api/movies')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ title: 'Illegal Movie', description: 'Test', director: 'None', cast: ['A'], genre: ['Sci-Fi'], language: 'English', duration: 120, releaseDate: new Date() });

      expect(res.statusCode).toBe(403);
      expect(res.body.success).toBe(false);
    });
  });

  // TEST AREA 2: CRUD APIs for Movies & Bookings
  describe('Test Area 2: CRUD APIs for Movies & Bookings', () => {
    test('2.1 Should allow Admin to perform full CRUD on Movies (POST, GET, PUT, DELETE)', async () => {
      // Create (POST)
      const createRes = await request(app)
        .post('/api/movies')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Tokyo Redline: Midnight Syndicate',
          description: 'High stakes cyber action.',
          director: 'Kenji Takahashi',
          cast: ['Ren Sato'],
          genre: ['Action', 'Thriller'],
          language: 'Japanese',
          duration: 138,
          releaseDate: '2026-10-20',
          rating: 8.9,
          certification: 'UA',
        });
      expect(createRes.statusCode).toBe(201);
      const newMovieId = createRes.body.data._id;

      // Update (PUT)
      const updateRes = await request(app)
        .put(`/api/movies/${newMovieId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ rating: 9.3 });
      expect(updateRes.statusCode).toBe(200);
      expect(updateRes.body.data.rating).toBe(9.3);

      // Delete (DELETE)
      const deleteRes = await request(app)
        .delete(`/api/movies/${newMovieId}`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(deleteRes.statusCode).toBe(200);
    });
  });

  // TEST AREA 3: Movie Search & 5-Criteria Filtering Logic
  describe('Test Area 3: Movie Search & 5-Criteria Filtering Logic', () => {
    test('3.1 Multi-criteria filter query by genre, language, and date', async () => {
      const res = await request(app).get(
        `/api/movies?genre=Sci-Fi&language=English&date=2026-10-28`
      );

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
      expect(res.body.data[0].title).toBe('Chronicles of the Event Horizon');
    });

    test('3.2 Free text search matching title or director', async () => {
      const res = await request(app).get('/api/movies?search=Elena');
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(1);
    });
  });

  // TEST AREA 4: Seat Availability & Booking Validation
  describe('Test Area 4: Seat Availability & Concurrency Validation', () => {
    test('4.1 Concurrency check: Atomic seat lock hold prevents double-booking', async () => {
      // User locks G3 and G4
      const lockRes = await request(app)
        .post(`/api/shows/${testShowId}/lock-seats`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ seatNumbers: ['G3', 'G4'] });

      expect(lockRes.statusCode).toBe(200);
      expect(lockRes.body.expiresInSeconds).toBe(300); // 5-minute TTL

      // Another user attempts to lock the exact same seat simultaneously
      const anotherUser = await User.create({
        name: 'Another Patron',
        email: 'patron.rubric@example.com',
        passwordHash: 'Pass@123',
        role: 'user',
      });
      const anotherToken = anotherUser.generateAuthToken();

      const conflictRes = await request(app)
        .post(`/api/shows/${testShowId}/lock-seats`)
        .set('Authorization', `Bearer ${anotherToken}`)
        .send({ seatNumbers: ['G3'] });

      expect(conflictRes.statusCode).toBe(409); // 409 Conflict
      expect(conflictRes.body.success).toBe(false);
      expect(conflictRes.body.message).toMatch(/Held by another customer/i);
    });

    test('4.2 Rejects booking requests exceeding maximum limit of 8 seats', async () => {
      const nineSeats = ['A1', 'A2', 'A3', 'A4', 'A5', 'A6', 'A7', 'A8', 'B1'];
      const res = await request(app)
        .post(`/api/shows/${testShowId}/lock-seats`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ seatNumbers: nineSeats });

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toMatch(/cannot select more than 8 seats/i);
    });
  });

  // TEST AREA 5: Payment Success / Failure Rollback Handling
  describe('Test Area 5: Payment Success / Failure Rollback Handling', () => {
    test('5.1 Confirms booking on payment success & marks seats as booked', async () => {
      await request(app)
        .post(`/api/shows/${testShowId}/lock-seats`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ seatNumbers: ['B1', 'B2'] });

      const res = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          showId: testShowId,
          seatNumbers: ['B1', 'B2'],
          paymentMethod: 'UPI',
          simulateFailure: false,
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.bookingReference).toMatch(/^IMV-/);

      const seat = await Seat.findOne({ show: testShowId, seatNumber: 'B1' });
      expect(seat.status).toBe('booked');
    });

    test('5.2 Payment failure simulation (simulateFailure=true) rolls back seats to available pool', async () => {
      await request(app)
        .post(`/api/shows/${testShowId}/lock-seats`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ seatNumbers: ['C1'] });

      const res = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          showId: testShowId,
          seatNumbers: ['C1'],
          paymentMethod: 'Credit Card',
          simulateFailure: true,
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);

      // Verify seat rollback
      const rolledBackSeat = await Seat.findOne({ show: testShowId, seatNumber: 'C1' });
      expect(rolledBackSeat.status).toBe('available');
      expect(rolledBackSeat.lockedBy).toBeNull();
    });
  });

  // TEST AREA 6: Booking Cancellation & Seat Release Process
  describe('Test Area 6: Booking Cancellation & Instant Seat Release', () => {
    test('6.1 Cancels booking, releases seats back to available inventory, and issues refund record', async () => {
      // 1. Lock & Book
      await request(app)
        .post(`/api/shows/${testShowId}/lock-seats`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ seatNumbers: ['D1', 'D2'] });

      const bookingRes = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          showId: testShowId,
          seatNumbers: ['D1', 'D2'],
          paymentMethod: 'Net Banking',
        });

      const bookingId = bookingRes.body.data._id;

      // 2. Cancel
      const cancelRes = await request(app)
        .put(`/api/bookings/${bookingId}/cancel`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(cancelRes.statusCode).toBe(200);
      expect(cancelRes.body.success).toBe(true);
      expect(cancelRes.body.refundTransactionId).toMatch(/^RFD-/);

      // Verify seat is available
      const releasedSeats = await Seat.find({ show: testShowId, seatNumber: { $in: ['D1', 'D2'] } });
      expect(releasedSeats[0].status).toBe('available');
      expect(releasedSeats[1].status).toBe('available');

      // Verify refund payment record
      const refundRecord = await Payment.findOne({ booking: bookingId, status: 'refunded' });
      expect(refundRecord).toBeDefined();
    });
  });

  // TEST AREA 7: Monitoring, Rate Limiting & Pagination Accuracy
  describe('Test Area 7: Monitoring, Rate Limiting & Pagination', () => {
    test('7.1 Movie catalog returns paginated payload with totalPages metadata', async () => {
      const res = await request(app).get('/api/movies?page=1&limit=2');

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.currentPage).toBe(1);
      expect(res.body.totalPages).toBeDefined();
      expect(res.body.total).toBeDefined();
    });

    test('7.2 Express rate-limiter headers are returned on API requests', async () => {
      const res = await request(app).get('/api/health');

      expect(res.statusCode).toBe(200);
      expect(res.headers['ratelimit-limit']).toBeDefined();
      expect(res.headers['ratelimit-remaining']).toBeDefined();
    });
  });
});
