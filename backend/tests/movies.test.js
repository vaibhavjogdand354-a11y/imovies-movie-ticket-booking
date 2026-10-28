const request = require('supertest');
const { app } = require('../server');
const Movie = require('../models/Movie');
const User = require('../models/User');

describe('Movies Catalog & RBAC Suite', () => {
  let adminToken;
  let userToken;

  beforeEach(async () => {
    // Create Admin User
    const admin = await User.create({
      name: 'Admin Test',
      email: 'admin.test@imovies.com',
      passwordHash: 'Admin@123',
      role: 'admin',
    });
    adminToken = admin.generateAuthToken();

    // Create Normal User
    const user = await User.create({
      name: 'User Test',
      email: 'user.test@imovies.com',
      passwordHash: 'User@123',
      role: 'user',
    });
    userToken = user.generateAuthToken();

    // Create Sample Movies
    await Movie.insertMany([
      {
        title: 'Interstellar',
        description: 'Deep space exploration through wormholes to save humanity.',
        genre: ['Sci-Fi', 'Adventure'],
        language: 'English',
        duration: 169,
        releaseDate: new Date('2024-01-01'),
        rating: 8.7,
        certification: 'UA',
        director: 'Christopher Nolan',
        cast: ['Matthew McConaughey', 'Anne Hathaway'],
      },
      {
        title: 'RRR',
        description: 'Epic action tale of two Indian revolutionaries.',
        genre: ['Action', 'Drama'],
        language: 'Telugu',
        duration: 182,
        releaseDate: new Date('2024-02-01'),
        rating: 8.0,
        certification: 'UA',
        director: 'S. S. Rajamouli',
        cast: ['NTR Jr', 'Ram Charan'],
      },
    ]);
  });

  test('GET /api/movies should return list of active movies', async () => {
    const res = await request(app).get('/api/movies');

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBe(2);
  });

  test('GET /api/movies with genre filter should filter results correctly', async () => {
    const res = await request(app).get('/api/movies?genre=Sci-Fi');

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].title).toBe('Interstellar');
  });

  test('GET /api/movies with language filter should filter results correctly', async () => {
    const res = await request(app).get('/api/movies?language=Telugu');

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].title).toBe('RRR');
  });

  test('POST /api/movies should allow admin to create a new movie', async () => {
    const newMovie = {
      title: 'Oppenheimer',
      description: 'The story of J. Robert Oppenheimer.',
      genre: ['Biography', 'Drama'],
      language: 'English',
      duration: 180,
      releaseDate: '2024-07-21',
      rating: 8.9,
      certification: 'UA',
      director: 'Christopher Nolan',
      cast: ['Cillian Murphy'],
    };

    const res = await request(app)
      .post('/api/movies')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(newMovie);

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.title).toBe('Oppenheimer');
  });

  test('POST /api/movies should forbid standard user with 403 Forbidden', async () => {
    const newMovie = {
      title: 'Unauthorized Movie Creation',
      description: 'Should fail',
      genre: ['Action'],
      language: 'English',
      duration: 120,
      releaseDate: '2024-01-01',
      director: 'Nobody',
      cast: ['Nobody'],
    };

    const res = await request(app)
      .post('/api/movies')
      .set('Authorization', `Bearer ${userToken}`)
      .send(newMovie);

    expect(res.statusCode).toBe(403);
    expect(res.body.success).toBe(false);
  });
});
