const request = require('supertest');
const { app } = require('../server');
const User = require('../models/User');
const Movie = require('../models/Movie');
const Theatre = require('../models/Theatre');
const Show = require('../models/Show');
const Seat = require('../models/Seat');

describe('Shows & Real-time Seat Locking Suite', () => {
  let adminToken;
  let user1Token;
  let user2Token;
  let showId;

  beforeEach(async () => {
    // Admin
    const admin = await User.create({
      name: 'Admin User',
      email: 'admin@shows.test',
      passwordHash: 'Pass@123',
      role: 'admin',
    });
    adminToken = admin.generateAuthToken();

    // User 1
    const user1 = await User.create({
      name: 'User One',
      email: 'user1@shows.test',
      passwordHash: 'Pass@123',
      role: 'user',
    });
    user1Token = user1.generateAuthToken();

    // User 2
    const user2 = await User.create({
      name: 'User Two',
      email: 'user2@shows.test',
      passwordHash: 'Pass@123',
      role: 'user',
    });
    user2Token = user2.generateAuthToken();

    // Movie
    const movie = await Movie.create({
      title: 'Inception',
      description: 'Dream sharing thriller.',
      genre: ['Action', 'Sci-Fi'],
      language: 'English',
      duration: 148,
      releaseDate: new Date(),
      director: 'Christopher Nolan',
      cast: ['Leonardo DiCaprio'],
    });

    // Theatre
    const theatre = await Theatre.create({
      name: 'PVR ICON',
      location: 'Andheri West',
      city: 'Mumbai',
      address: 'Infiniti Mall',
    });

    // Create show via admin API
    const showRes = await request(app)
      .post('/api/shows')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        movie: movie._id,
        theatre: theatre._id,
        screenName: 'Screen 1 IMAX',
        date: '2026-11-01',
        time: '19:00',
        format: 'IMAX 2D',
        pricing: { regular: 180, executive: 280, vip: 450 },
      });

    showId = showRes.body.data._id;
  });

  test('Show creation should auto-generate exactly 64 auditorium seats (8x8 grid)', async () => {
    const seats = await Seat.find({ show: showId });
    expect(seats.length).toBe(64);

    const vipSeats = seats.filter((s) => s.tier === 'vip');
    expect(vipSeats.length).toBe(16); // Rows A & B (8 x 2 = 16)
    expect(vipSeats[0].price).toBe(450);

    const regularSeats = seats.filter((s) => s.tier === 'regular');
    expect(regularSeats.length).toBe(24); // Rows F, G, H (8 x 3 = 24)
    expect(regularSeats[0].price).toBe(180);
  });

  test('GET /api/shows/:id/seats should return all 64 seats with available status', async () => {
    const res = await request(app).get(`/api/shows/${showId}/seats`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBe(64);
    expect(res.body.data[0].status).toBe('available');
  });

  test('POST /api/shows/:id/lock-seats should hold seats for user 1', async () => {
    const res = await request(app)
      .post(`/api/shows/${showId}/lock-seats`)
      .set('Authorization', `Bearer ${user1Token}`)
      .send({ seatNumbers: ['A1', 'A2'] });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.seatNumbers).toEqual(['A1', 'A2']);

    const lockedSeats = await Seat.find({ show: showId, seatNumber: { $in: ['A1', 'A2'] } });
    expect(lockedSeats[0].status).toBe('locked');
    expect(lockedSeats[0].lockedUntil).toBeDefined();
  });

  test('POST /api/shows/:id/lock-seats should reject conflicting lock from user 2 with 409 Conflict', async () => {
    // User 1 locks A1
    await request(app)
      .post(`/api/shows/${showId}/lock-seats`)
      .set('Authorization', `Bearer ${user1Token}`)
      .send({ seatNumbers: ['A1'] });

    // User 2 attempts to lock A1
    const res = await request(app)
      .post(`/api/shows/${showId}/lock-seats`)
      .set('Authorization', `Bearer ${user2Token}`)
      .send({ seatNumbers: ['A1', 'A2'] });

    expect(res.statusCode).toBe(409);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/Held by another customer/i);
  });

  test('POST /api/shows/:id/unlock-seats should release locked seats', async () => {
    // User 1 locks B1
    await request(app)
      .post(`/api/shows/${showId}/lock-seats`)
      .set('Authorization', `Bearer ${user1Token}`)
      .send({ seatNumbers: ['B1'] });

    // User 1 unlocks B1
    const res = await request(app)
      .post(`/api/shows/${showId}/unlock-seats`)
      .set('Authorization', `Bearer ${user1Token}`)
      .send({ seatNumbers: ['B1'] });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);

    const seat = await Seat.findOne({ show: showId, seatNumber: 'B1' });
    expect(seat.status).toBe('available');
    expect(seat.lockedBy).toBeNull();
  });
});
