const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const User = require('../models/User');
const Movie = require('../models/Movie');
const Theatre = require('../models/Theatre');
const Show = require('../models/Show');
const Seat = require('../models/Seat');
const Booking = require('../models/Booking');
const Payment = require('../models/Payment');
const Notification = require('../models/Notification');
const { generateSeatsForShow } = require('../controllers/showController');

const seedData = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/imovies_db';
    console.log(`[Seed Script] Connecting to MongoDB: ${mongoUri}`);
    await mongoose.connect(mongoUri);

    console.log('[Seed Script] Purging old collections...');
    await Promise.all([
      User.deleteMany({}),
      Movie.deleteMany({}),
      Theatre.deleteMany({}),
      Show.deleteMany({}),
      Seat.deleteMany({}),
      Booking.deleteMany({}),
      Payment.deleteMany({}),
      Notification.deleteMany({}),
    ]);
    console.log('[Seed Script] Collections cleared.');

    // 1. Create Users
    console.log('[Seed Script] Seeding initial users...');
    const adminUser = await User.create({
      name: 'System Administrator',
      email: 'admin@imovies.com',
      passwordHash: 'Admin@123', // Pre-save hook will bcrypt hash this
      role: 'admin',
      phone: '+91 9876543210',
    });

    const standardUser = await User.create({
      name: 'Rahul Sharma',
      email: 'user@imovies.com',
      passwordHash: 'User@123',
      role: 'user',
      phone: '+91 9123456789',
    });

    console.log(`[Seed Script] Users created:`);
    console.log(`  - Admin: admin@imovies.com (Password: Admin@123)`);
    console.log(`  - Customer: user@imovies.com (Password: User@123)`);

    // 2. Create Theatres
    console.log('[Seed Script] Seeding premium theatres...');
    const theatres = await Theatre.insertMany([
      {
        name: 'PVR ICON: Gold Class',
        location: 'Infiniti Mall, Andheri West',
        city: 'Mumbai',
        address: 'New Link Rd, Oshiwara, Andheri West, Mumbai, Maharashtra 400053',
        facilities: ['Dolby Atmos', '4K Laser Projection', 'Recliner Seats', 'Gourmet Food Court', 'Valet Parking'],
      },
      {
        name: 'INOX Megaplex',
        location: 'Phoenix Marketcity, Whitefield',
        city: 'Bengaluru',
        address: 'Whitefield Main Rd, Devasandra Industrial Estate, Bengaluru, Karnataka 560048',
        facilities: ['IMAX with Laser', 'Dolby Atmos', 'In-Seat Dining', 'Wheelchair Accessible'],
      },
      {
        name: 'Cinepolis VIP Club',
        location: 'DLF Avenue, Saket',
        city: 'New Delhi',
        address: 'Press Enclave Marg, Saket District Centre, Sector 6, New Delhi, Delhi 110017',
        facilities: ['VIP Recliner Lounges', 'Dolby 7.1', 'Chef-crafted Menu', 'Butler Service'],
      },
      {
        name: 'PVR Superplex 4DX',
        location: 'Inorbit Mall, Hitec City',
        city: 'Hyderabad',
        address: 'APIIC Software Layout, Mindspace, Madhapur, Hyderabad, Telangana 500081',
        facilities: ['4DX Motion Seats', 'Dolby Atmos', 'Snack Bar', 'Gaming Zone'],
      },
    ]);

    // 3. Create Blockbuster Movies
    console.log('[Seed Script] Seeding movies...');
    const movies = await Movie.insertMany([
      {
        title: 'Oppenheimer',
        description: 'The story of American scientist J. Robert Oppenheimer and his role in the development of the atomic bomb during World War II.',
        genre: ['Biography', 'Drama', 'History'],
        language: 'English',
        duration: 180,
        releaseDate: new Date('2023-07-21'),
        rating: 8.9,
        certification: 'UA',
        director: 'Christopher Nolan',
        cast: ['Cillian Murphy', 'Emily Blunt', 'Matt Damon', 'Robert Downey Jr.', 'Florence Pugh'],
        posterUrl: 'https://images.unsplash.com/photo-1578328819058-b69f3a3b0f6b?auto=format&fit=crop&w=800&q=80',
        bannerUrl: 'https://images.unsplash.com/photo-1478760329108-5c3ed9d495a0?auto=format&fit=crop&w=1600&q=80',
      },
      {
        title: 'Interstellar',
        description: 'When Earth becomes uninhabitable in the future, a farmer and ex-NASA pilot, Joseph Cooper, is tasked to pilot a spacecraft, along with a team of researchers, to find a new planet for humans.',
        genre: ['Sci-Fi', 'Adventure', 'Drama'],
        language: 'English',
        duration: 169,
        releaseDate: new Date('2024-10-15'),
        rating: 8.7,
        certification: 'UA',
        director: 'Christopher Nolan',
        cast: ['Matthew McConaughey', 'Anne Hathaway', 'Jessica Chastain', 'Michael Caine'],
        posterUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=800&q=80',
        bannerUrl: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?auto=format&fit=crop&w=1600&q=80',
      },
      {
        title: 'Dune: Part Two',
        description: 'Paul Atreides unites with Chani and the Fremen while seeking revenge against the conspirators who destroyed his family.',
        genre: ['Sci-Fi', 'Adventure', 'Action'],
        language: 'English',
        duration: 166,
        releaseDate: new Date('2024-03-01'),
        rating: 8.6,
        certification: 'UA',
        director: 'Denis Villeneuve',
        cast: ['Timothée Chalamet', 'Zendaya', 'Rebecca Ferguson', 'Javier Bardem', 'Austin Butler'],
        posterUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=800&q=80',
        bannerUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1600&q=80',
      },
      {
        title: 'Inception',
        description: 'A thief who steals corporate secrets through the use of dream-sharing technology is given the inverse task of planting an idea into the mind of a C.E.O.',
        genre: ['Action', 'Sci-Fi', 'Thriller'],
        language: 'English',
        duration: 148,
        releaseDate: new Date('2023-11-10'),
        rating: 8.8,
        certification: 'UA',
        director: 'Christopher Nolan',
        cast: ['Leonardo DiCaprio', 'Joseph Gordon-Levitt', 'Elliot Page', 'Tom Hardy', 'Ken Watanabe'],
        posterUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=800&q=80',
        bannerUrl: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=1600&q=80',
      },
      {
        title: 'Avengers: Endgame',
        description: 'After the devastating events of Infinity War, the universe is in ruins. With the help of remaining allies, the Avengers assemble once more in order to reverse Thanos actions.',
        genre: ['Action', 'Sci-Fi', 'Adventure'],
        language: 'English',
        duration: 181,
        releaseDate: new Date('2024-05-01'),
        rating: 8.4,
        certification: 'UA',
        director: 'Anthony Russo, Joe Russo',
        cast: ['Robert Downey Jr.', 'Chris Evans', 'Mark Ruffalo', 'Chris Hemsworth', 'Scarlett Johansson'],
        posterUrl: 'https://images.unsplash.com/photo-1635805737707-575885ab0820?auto=format&fit=crop&w=800&q=80',
        bannerUrl: 'https://images.unsplash.com/photo-1568876694728-451bbf694b83?auto=format&fit=crop&w=1600&q=80',
      },
      {
        title: 'RRR',
        description: 'A fearless revolutionary and an officer in the British force, who once were best friends, join together in an epic fight against the tyrannical British Raj.',
        genre: ['Action', 'Drama'],
        language: 'Telugu',
        duration: 182,
        releaseDate: new Date('2024-04-12'),
        rating: 8.0,
        certification: 'UA',
        director: 'S. S. Rajamouli',
        cast: ['N. T. Rama Rao Jr.', 'Ram Charan', 'Alia Bhatt', 'Ajay Devgn'],
        posterUrl: 'https://images.unsplash.com/photo-1594909122845-11baa439b7bf?auto=format&fit=crop&w=800&q=80',
        bannerUrl: 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?auto=format&fit=crop&w=1600&q=80',
      },
    ]);

    // 4. Create Shows & 64 Auditorium Seats for each show
    console.log('[Seed Script] Creating shows and generating auditorium seat matrices...');
    const today = new Date();
    const formatDate = (date) => date.toISOString().split('T')[0];

    const todayStr = formatDate(today);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = formatDate(tomorrow);
    const dayAfter = new Date(today);
    dayAfter.setDate(dayAfter.getDate() + 2);
    const dayAfterStr = formatDate(dayAfter);

    const showConfigs = [
      // Oppenheimer shows
      { movie: movies[0]._id, theatre: theatres[0]._id, screenName: 'IMAX Laser Audi 1', date: todayStr, time: '14:30', format: 'IMAX 2D' },
      { movie: movies[0]._id, theatre: theatres[0]._id, screenName: 'IMAX Laser Audi 1', date: todayStr, time: '18:45', format: 'IMAX 2D' },
      { movie: movies[0]._id, theatre: theatres[1]._id, screenName: 'Screen 2 Audi', date: tomorrowStr, time: '15:00', format: '2D' },
      // Interstellar shows
      { movie: movies[1]._id, theatre: theatres[1]._id, screenName: 'Audi 1 4K', date: todayStr, time: '16:00', format: '2D' },
      { movie: movies[1]._id, theatre: theatres[2]._id, screenName: 'VIP Lounge Audi', date: tomorrowStr, time: '19:30', format: '2D' },
      // Dune Part Two shows
      { movie: movies[2]._id, theatre: theatres[2]._id, screenName: 'Screen 3 Dolby', date: todayStr, time: '20:00', format: '3D' },
      { movie: movies[2]._id, theatre: theatres[3]._id, screenName: '4DX Motion Hall', date: tomorrowStr, time: '17:15', format: '4DX' },
      // Inception shows
      { movie: movies[3]._id, theatre: theatres[0]._id, screenName: 'Gold Audi 2', date: tomorrowStr, time: '21:00', format: '2D' },
      // Avengers shows
      { movie: movies[4]._id, theatre: theatres[3]._id, screenName: 'Audi 4 Large', date: dayAfterStr, time: '18:00', format: '3D' },
      // RRR shows
      { movie: movies[5]._id, theatre: theatres[3]._id, screenName: 'Screen 1 Atmos', date: todayStr, time: '21:15', format: '2D' },
    ];

    const createdShows = [];
    for (const cfg of showConfigs) {
      const show = await Show.create({
        ...cfg,
        pricing: {
          regular: 180,
          executive: 280,
          vip: 450,
        },
      });
      await generateSeatsForShow(show);
      createdShows.push(show);
    }
    console.log(`[Seed Script] Created ${createdShows.length} shows with full 64-seat layouts.`);

    // 5. Seed a Sample Confirmed Booking
    console.log('[Seed Script] Seeding sample booking and payment...');
    const targetShow = createdShows[0]; // Oppenheimer today 14:30
    const bookedSeatNumbers = ['A1', 'A2'];

    // Update seats in DB to 'booked'
    await Seat.updateMany(
      { show: targetShow._id, seatNumber: { $in: bookedSeatNumbers } },
      { $set: { status: 'booked', lockedBy: standardUser._id } }
    );

    const baseAmount = 450 * 2; // VIP seats
    const convenienceFee = 60;
    const taxAmount = 11;
    const finalAmount = baseAmount + convenienceFee + taxAmount;
    const bookingRef = 'IMV-8K9P2';
    const txnId = `TXN-${Date.now()}-9999`;

    const sampleBooking = await Booking.create({
      bookingReference: bookingRef,
      user: standardUser._id,
      show: targetShow._id,
      seats: bookedSeatNumbers,
      totalAmount: baseAmount,
      convenienceFee,
      taxAmount,
      finalAmount,
      paymentMethod: 'UPI',
      transactionId: txnId,
      status: 'confirmed',
      isUpcoming: true,
    });

    await Payment.create({
      booking: sampleBooking._id,
      user: standardUser._id,
      transactionId: txnId,
      method: 'UPI',
      amount: finalAmount,
      status: 'success',
    });

    await Notification.create({
      user: standardUser._id,
      title: 'Booking Confirmed!',
      message: `Your tickets for Oppenheimer (Seats: A1, A2) at ${theatres[0].name} are confirmed! Booking Ref: ${bookingRef}`,
      type: 'booking_confirmation',
      isRead: false,
    });

    console.log('[Seed Script] Sample booking seeded successfully.');
    console.log('[Seed Script] Database successfully seeded with production-grade test data!');
    process.exit(0);
  } catch (error) {
    console.error('[Seed Script Error]:', error);
    process.exit(1);
  }
};

seedData();
