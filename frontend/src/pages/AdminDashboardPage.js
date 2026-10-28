import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  Shield,
  TrendingUp,
  Ticket,
  Film,
  Calendar,
  Building,
  Plus,
  Trash2,
  Edit2,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
} from 'lucide-react';
import { formatCurrency } from '../utils/formatters';

const AdminDashboardPage = () => {
  const { user, isAdmin } = useAuth();

  const [activeTab, setActiveTab] = useState('metrics'); // 'metrics', 'movies', 'shows', 'theatres', 'bookings'
  const [metrics, setMetrics] = useState(null);
  const [movies, setMovies] = useState([]);
  const [theatres, setTheatres] = useState([]);
  const [shows, setShows] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [isAddMovieModal, setIsAddMovieModal] = useState(false);
  const [isAddShowModal, setIsAddShowModal] = useState(false);
  const [isAddTheatreModal, setIsAddTheatreModal] = useState(false);

  // New Movie Form
  const [movieForm, setMovieForm] = useState({
    title: '',
    description: '',
    genre: 'Action, Sci-Fi',
    language: 'English',
    duration: 150,
    releaseDate: new Date().toISOString().split('T')[0],
    rating: 8.5,
    certification: 'UA',
    director: '',
    cast: '',
    posterUrl: '',
    bannerUrl: '',
  });

  // New Show Form
  const [showForm, setShowForm] = useState({
    movie: '',
    theatre: '',
    screenName: 'Screen 1 - 4K Audi',
    date: new Date().toISOString().split('T')[0],
    time: '18:00',
    format: '2D',
    pricing: { regular: 180, executive: 280, vip: 450 },
  });

  // New Theatre Form
  const [theatreForm, setTheatreForm] = useState({
    name: '',
    location: '',
    city: 'Mumbai',
    address: '',
    facilities: 'Dolby Atmos, 4K Projection, Recliner Seats',
  });

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      const [metricsRes, moviesRes, theatresRes, showsRes] = await Promise.all([
        api.get('/admin/metrics'),
        api.get('/movies?limit=50'),
        api.get('/theatres'),
        api.get('/shows'),
      ]);

      if (metricsRes.data.success) setMetrics(metricsRes.data.data);
      if (moviesRes.data.success) setMovies(moviesRes.data.data);
      if (theatresRes.data.success) setTheatres(theatresRes.data.data);
      if (showsRes.data.success) setShows(showsRes.data.data);

      if (moviesRes.data.data.length > 0 && !showForm.movie) {
        setShowForm((prev) => ({ ...prev, movie: moviesRes.data.data[0]._id }));
      }
      if (theatresRes.data.data.length > 0 && !showForm.theatre) {
        setShowForm((prev) => ({ ...prev, theatre: theatresRes.data.data[0]._id }));
      }
    } catch (err) {
      console.error('Error fetching admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchAdminData();
    }
  }, [isAdmin]);

  if (!isAdmin) {
    return (
      <div className="max-w-md mx-auto py-24 text-center">
        <AlertTriangle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
        <h2 className="text-xl font-bold text-white mb-2">Access Denied</h2>
        <p className="text-xs text-gray-400">
          You must have administrator privileges to view this control panel.
        </p>
      </div>
    );
  }

  // Handle Add Movie
  const handleCreateMovie = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/movies', movieForm);
      if (res.data.success) {
        setIsAddMovieModal(false);
        fetchAdminData();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create movie.');
    }
  };

  // Handle Add Show
  const handleCreateShow = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/shows', showForm);
      if (res.data.success) {
        setIsAddShowModal(false);
        fetchAdminData();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to schedule show.');
    }
  };

  // Handle Add Theatre
  const handleCreateTheatre = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/theatres', theatreForm);
      if (res.data.success) {
        setIsAddTheatreModal(false);
        fetchAdminData();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to add theatre.');
    }
  };

  // Handle Delete Show
  const handleDeleteShow = async (id) => {
    if (!window.confirm('Delete this show and its 64 seat records?')) return;
    try {
      await api.delete(`/shows/${id}`);
      fetchAdminData();
    } catch (err) {
      alert('Failed to delete show');
    }
  };

  // Handle Delete Movie
  const handleDeleteMovie = async (id) => {
    if (!window.confirm('Delete this movie?')) return;
    try {
      await api.delete(`/movies/${id}`);
      fetchAdminData();
    } catch (err) {
      alert('Failed to delete movie');
    }
  };

  const summary = metrics?.summary || {};

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Admin Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs font-bold px-2 py-0.5 rounded flex items-center gap-1">
              <Shield className="w-3.5 h-3.5" /> Administrative Control Panel
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white">IMovies Management Suite</h1>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsAddMovieModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl shadow transition"
          >
            <Plus className="w-4 h-4" /> Add Movie
          </button>
          <button
            onClick={() => setIsAddShowModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow transition"
          >
            <Calendar className="w-4 h-4" /> Schedule Show
          </button>
        </div>
      </div>

      {/* 4 Summary Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="glass-panel p-5 rounded-2xl border border-gray-800">
          <div className="flex items-center justify-between text-gray-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Gross Revenue</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-black font-mono text-white">
            {formatCurrency(summary.totalRevenue || 0)}
          </p>
          <p className="text-[11px] text-gray-500 mt-1">From confirmed bookings</p>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-gray-800">
          <div className="flex items-center justify-between text-gray-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Tickets Booked</span>
            <Ticket className="w-4 h-4 text-red-500" />
          </div>
          <p className="text-2xl font-black font-mono text-white">{summary.totalTickets || 0}</p>
          <p className="text-[11px] text-gray-500 mt-1">Across all showtimes</p>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-gray-800">
          <div className="flex items-center justify-between text-gray-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Active Movies</span>
            <Film className="w-4 h-4 text-sky-400" />
          </div>
          <p className="text-2xl font-black font-mono text-white">{summary.activeMovies || 0}</p>
          <p className="text-[11px] text-gray-500 mt-1">Catalog titles running</p>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-gray-800">
          <div className="flex items-center justify-between text-gray-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Scheduled Shows</span>
            <Calendar className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl font-black font-mono text-white">{summary.activeShows || 0}</p>
          <p className="text-[11px] text-gray-500 mt-1">In 4 premier partner theatres</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-gray-800 mb-6 pb-2 overflow-x-auto text-xs font-bold">
        {[
          { id: 'metrics', label: 'Revenue & Analytics' },
          { id: 'movies', label: `Movies (${movies.length})` },
          { id: 'shows', label: `Showtimes (${shows.length})` },
          { id: 'theatres', label: `Theatres (${theatres.length})` },
          { id: 'bookings', label: 'Recent Transactions' },
        ].map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`px-4 py-2 rounded-xl transition ${
              activeTab === id
                ? 'bg-red-600 text-white shadow'
                : 'text-gray-400 hover:text-white hover:bg-gray-800'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Tab 1: Revenue Breakdown */}
      {activeTab === 'metrics' && (
        <div className="space-y-6">
          <div className="glass-panel p-6 rounded-2xl border border-gray-800">
            <h3 className="font-bold text-base text-white mb-4">Revenue Breakdown by Title</h3>
            <div className="space-y-4">
              {metrics?.revenueByMovie?.map((item) => (
                <div key={item._id} className="flex items-center justify-between p-3 rounded-xl bg-gray-900/60 border border-gray-800">
                  <div className="flex items-center gap-3">
                    <img
                      src={item.posterUrl || 'https://via.placeholder.com/50'}
                      alt={item.title}
                      className="w-10 h-14 object-cover rounded-lg border border-gray-800"
                    />
                    <div>
                      <h4 className="font-bold text-sm text-white">{item.title}</h4>
                      <p className="text-xs text-gray-400">{item.ticketsSold} tickets sold • {item.bookingsCount} orders</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-mono font-bold text-base text-emerald-400">
                      {formatCurrency(item.revenue)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Movie Management */}
      {activeTab === 'movies' && (
        <div className="glass-panel rounded-2xl border border-gray-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-gray-300">
              <thead className="bg-gray-900/80 text-gray-400 border-b border-gray-800 uppercase tracking-wider">
                <tr>
                  <th className="p-4">Movie</th>
                  <th className="p-4">Genre</th>
                  <th className="p-4">Language</th>
                  <th className="p-4">Duration</th>
                  <th className="p-4">Rating</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {movies.map((m) => (
                  <tr key={m._id} className="hover:bg-gray-800/40 transition">
                    <td className="p-4 flex items-center gap-3">
                      <img src={m.posterUrl} alt={m.title} className="w-8 h-12 object-cover rounded" />
                      <div>
                        <p className="font-bold text-white text-sm">{m.title}</p>
                        <p className="text-[11px] text-gray-500">{m.director}</p>
                      </div>
                    </td>
                    <td className="p-4">{m.genre?.join(', ')}</td>
                    <td className="p-4">{m.language}</td>
                    <td className="p-4">{m.duration} mins</td>
                    <td className="p-4 font-mono font-bold text-amber-400">{m.rating}</td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => handleDeleteMovie(m._id)}
                        className="p-1.5 text-gray-400 hover:text-rose-400 hover:bg-rose-500/10 rounded transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Shows Scheduler */}
      {activeTab === 'shows' && (
        <div className="glass-panel rounded-2xl border border-gray-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-gray-300">
              <thead className="bg-gray-900/80 text-gray-400 border-b border-gray-800 uppercase tracking-wider">
                <tr>
                  <th className="p-4">Movie</th>
                  <th className="p-4">Theatre & City</th>
                  <th className="p-4">Screen</th>
                  <th className="p-4">Date & Time</th>
                  <th className="p-4">Format</th>
                  <th className="p-4">Pricing</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {shows.map((s) => (
                  <tr key={s._id} className="hover:bg-gray-800/40 transition">
                    <td className="p-4 font-bold text-white">{s.movie?.title}</td>
                    <td className="p-4">
                      {s.theatre?.name} ({s.theatre?.city})
                    </td>
                    <td className="p-4">{s.screenName}</td>
                    <td className="p-4 font-mono font-semibold text-emerald-400">
                      {s.date} at {s.time}
                    </td>
                    <td className="p-4">
                      <span className="bg-red-600/20 text-red-400 px-2 py-0.5 rounded text-[11px] font-bold">
                        {s.format}
                      </span>
                    </td>
                    <td className="p-4 text-[11px]">
                      Reg: ₹{s.pricing?.regular} | Exec: ₹{s.pricing?.executive} | VIP: ₹{s.pricing?.vip}
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => handleDeleteShow(s._id)}
                        className="p-1.5 text-gray-400 hover:text-rose-400 hover:bg-rose-500/10 rounded transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 4: Theatres */}
      {activeTab === 'theatres' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={() => setIsAddTheatreModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-white text-xs font-bold rounded-xl transition"
            >
              <Plus className="w-3.5 h-3.5" /> Add Partner Theatre
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {theatres.map((t) => (
              <div key={t._id} className="glass-panel p-5 rounded-2xl border border-gray-800 space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-white text-base">{t.name}</h3>
                  <span className="bg-sky-500/10 text-sky-400 px-2 py-0.5 rounded text-xs font-bold">
                    {t.city}
                  </span>
                </div>
                <p className="text-xs text-gray-400">{t.location} • {t.address}</p>
                <div className="flex flex-wrap gap-1.5 pt-2">
                  {t.facilities?.map((f) => (
                    <span key={f} className="text-[10px] bg-gray-900 border border-gray-800 text-gray-300 px-2 py-0.5 rounded">
                      {f}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 5: Recent Transactions */}
      {activeTab === 'bookings' && (
        <div className="glass-panel rounded-2xl border border-gray-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-gray-300">
              <thead className="bg-gray-900/80 text-gray-400 border-b border-gray-800 uppercase tracking-wider">
                <tr>
                  <th className="p-4">Reference</th>
                  <th className="p-4">User</th>
                  <th className="p-4">Movie</th>
                  <th className="p-4">Seats</th>
                  <th className="p-4">Amount</th>
                  <th className="p-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {metrics?.recentBookings?.map((b) => (
                  <tr key={b._id} className="hover:bg-gray-800/40 transition">
                    <td className="p-4 font-mono font-bold text-red-400">{b.bookingReference}</td>
                    <td className="p-4">{b.user?.name || 'Customer'}</td>
                    <td className="p-4 font-semibold text-white">{b.show?.movie?.title}</td>
                    <td className="p-4 font-mono">{b.seats?.join(', ')}</td>
                    <td className="p-4 font-mono font-bold text-emerald-400">{formatCurrency(b.finalAmount)}</td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                        b.status === 'confirmed' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                      }`}>
                        {b.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Movie Modal */}
      {isAddMovieModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="glass-panel p-6 rounded-2xl border border-gray-700 max-w-lg w-full space-y-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold text-white">Add New Cinema Title</h2>
            <form onSubmit={handleCreateMovie} className="space-y-3 text-xs">
              <div>
                <label className="text-gray-400 block mb-1">Title</label>
                <input
                  type="text"
                  required
                  value={movieForm.title}
                  onChange={(e) => setMovieForm({ ...movieForm, title: e.target.value })}
                  className="w-full bg-gray-950 border border-gray-700 rounded-lg p-2.5 text-white"
                />
              </div>
              <div>
                <label className="text-gray-400 block mb-1">Description</label>
                <textarea
                  required
                  rows="2"
                  value={movieForm.description}
                  onChange={(e) => setMovieForm({ ...movieForm, description: e.target.value })}
                  className="w-full bg-gray-950 border border-gray-700 rounded-lg p-2.5 text-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-gray-400 block mb-1">Genre (comma-separated)</label>
                  <input
                    type="text"
                    required
                    value={movieForm.genre}
                    onChange={(e) => setMovieForm({ ...movieForm, genre: e.target.value })}
                    className="w-full bg-gray-950 border border-gray-700 rounded-lg p-2 text-white"
                  />
                </div>
                <div>
                  <label className="text-gray-400 block mb-1">Language</label>
                  <input
                    type="text"
                    required
                    value={movieForm.language}
                    onChange={(e) => setMovieForm({ ...movieForm, language: e.target.value })}
                    className="w-full bg-gray-950 border border-gray-700 rounded-lg p-2 text-white"
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-gray-400 block mb-1">Duration (min)</label>
                  <input
                    type="number"
                    required
                    value={movieForm.duration}
                    onChange={(e) => setMovieForm({ ...movieForm, duration: e.target.value })}
                    className="w-full bg-gray-950 border border-gray-700 rounded-lg p-2 text-white"
                  />
                </div>
                <div>
                  <label className="text-gray-400 block mb-1">Rating</label>
                  <input
                    type="number"
                    step="0.1"
                    value={movieForm.rating}
                    onChange={(e) => setMovieForm({ ...movieForm, rating: e.target.value })}
                    className="w-full bg-gray-950 border border-gray-700 rounded-lg p-2 text-white"
                  />
                </div>
                <div>
                  <label className="text-gray-400 block mb-1">Certification</label>
                  <select
                    value={movieForm.certification}
                    onChange={(e) => setMovieForm({ ...movieForm, certification: e.target.value })}
                    className="w-full bg-gray-950 border border-gray-700 rounded-lg p-2 text-white"
                  >
                    <option value="U">U</option>
                    <option value="UA">UA</option>
                    <option value="A">A</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-gray-400 block mb-1">Director</label>
                  <input
                    type="text"
                    required
                    value={movieForm.director}
                    onChange={(e) => setMovieForm({ ...movieForm, director: e.target.value })}
                    className="w-full bg-gray-950 border border-gray-700 rounded-lg p-2 text-white"
                  />
                </div>
                <div>
                  <label className="text-gray-400 block mb-1">Cast (comma-separated)</label>
                  <input
                    type="text"
                    required
                    value={movieForm.cast}
                    onChange={(e) => setMovieForm({ ...movieForm, cast: e.target.value })}
                    className="w-full bg-gray-950 border border-gray-700 rounded-lg p-2 text-white"
                  />
                </div>
              </div>
              <div>
                <label className="text-gray-400 block mb-1">Poster Image URL</label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={movieForm.posterUrl}
                  onChange={(e) => setMovieForm({ ...movieForm, posterUrl: e.target.value })}
                  className="w-full bg-gray-950 border border-gray-700 rounded-lg p-2 text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsAddMovieModal(false)}
                  className="px-4 py-2 bg-gray-800 text-gray-300 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl"
                >
                  Create Movie
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Schedule Show Modal */}
      {isAddShowModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="glass-panel p-6 rounded-2xl border border-gray-700 max-w-lg w-full space-y-4">
            <h2 className="text-lg font-bold text-white">Schedule New Showtime</h2>
            <p className="text-xs text-emerald-400">
              * Will automatically initialize all 64 auditorium seats (8x8 grid) in database.
            </p>
            <form onSubmit={handleCreateShow} className="space-y-3 text-xs">
              <div>
                <label className="text-gray-400 block mb-1">Movie</label>
                <select
                  required
                  value={showForm.movie}
                  onChange={(e) => setShowForm({ ...showForm, movie: e.target.value })}
                  className="w-full bg-gray-950 border border-gray-700 rounded-lg p-2 text-white"
                >
                  {movies.map((m) => (
                    <option key={m._id} value={m._id}>{m.title}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-gray-400 block mb-1">Theatre</label>
                <select
                  required
                  value={showForm.theatre}
                  onChange={(e) => setShowForm({ ...showForm, theatre: e.target.value })}
                  className="w-full bg-gray-950 border border-gray-700 rounded-lg p-2 text-white"
                >
                  {theatres.map((t) => (
                    <option key={t._id} value={t._id}>{t.name} ({t.city})</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-gray-400 block mb-1">Screen / Audi Name</label>
                  <input
                    type="text"
                    required
                    value={showForm.screenName}
                    onChange={(e) => setShowForm({ ...showForm, screenName: e.target.value })}
                    className="w-full bg-gray-950 border border-gray-700 rounded-lg p-2 text-white"
                  />
                </div>
                <div>
                  <label className="text-gray-400 block mb-1">Format</label>
                  <select
                    value={showForm.format}
                    onChange={(e) => setShowForm({ ...showForm, format: e.target.value })}
                    className="w-full bg-gray-950 border border-gray-700 rounded-lg p-2 text-white"
                  >
                    <option value="2D">2D</option>
                    <option value="3D">3D</option>
                    <option value="IMAX 2D">IMAX 2D</option>
                    <option value="IMAX 3D">IMAX 3D</option>
                    <option value="4DX">4DX</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-gray-400 block mb-1">Date (YYYY-MM-DD)</label>
                  <input
                    type="date"
                    required
                    value={showForm.date}
                    onChange={(e) => setShowForm({ ...showForm, date: e.target.value })}
                    className="w-full bg-gray-950 border border-gray-700 rounded-lg p-2 text-white"
                  />
                </div>
                <div>
                  <label className="text-gray-400 block mb-1">Time (HH:MM e.g. 18:30)</label>
                  <input
                    type="text"
                    required
                    value={showForm.time}
                    onChange={(e) => setShowForm({ ...showForm, time: e.target.value })}
                    className="w-full bg-gray-950 border border-gray-700 rounded-lg p-2 text-white"
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-gray-400 block mb-1">Regular (₹)</label>
                  <input
                    type="number"
                    value={showForm.pricing.regular}
                    onChange={(e) =>
                      setShowForm({
                        ...showForm,
                        pricing: { ...showForm.pricing, regular: Number(e.target.value) },
                      })
                    }
                    className="w-full bg-gray-950 border border-gray-700 rounded-lg p-2 text-white"
                  />
                </div>
                <div>
                  <label className="text-gray-400 block mb-1">Executive (₹)</label>
                  <input
                    type="number"
                    value={showForm.pricing.executive}
                    onChange={(e) =>
                      setShowForm({
                        ...showForm,
                        pricing: { ...showForm.pricing, executive: Number(e.target.value) },
                      })
                    }
                    className="w-full bg-gray-950 border border-gray-700 rounded-lg p-2 text-white"
                  />
                </div>
                <div>
                  <label className="text-gray-400 block mb-1">VIP (₹)</label>
                  <input
                    type="number"
                    value={showForm.pricing.vip}
                    onChange={(e) =>
                      setShowForm({
                        ...showForm,
                        pricing: { ...showForm.pricing, vip: Number(e.target.value) },
                      })
                    }
                    className="w-full bg-gray-950 border border-gray-700 rounded-lg p-2 text-white"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsAddShowModal(false)}
                  className="px-4 py-2 bg-gray-800 text-gray-300 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl"
                >
                  Schedule Show
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Theatre Modal */}
      {isAddTheatreModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="glass-panel p-6 rounded-2xl border border-gray-700 max-w-lg w-full space-y-4">
            <h2 className="text-lg font-bold text-white">Add New Cinema Complex</h2>
            <form onSubmit={handleCreateTheatre} className="space-y-3 text-xs">
              <div>
                <label className="text-gray-400 block mb-1">Theatre Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. PVR Gold Cinemas"
                  value={theatreForm.name}
                  onChange={(e) => setTheatreForm({ ...theatreForm, name: e.target.value })}
                  className="w-full bg-gray-950 border border-gray-700 rounded-lg p-2 text-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-gray-400 block mb-1">Location / Mall</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Phoenix Mall"
                    value={theatreForm.location}
                    onChange={(e) => setTheatreForm({ ...theatreForm, location: e.target.value })}
                    className="w-full bg-gray-950 border border-gray-700 rounded-lg p-2 text-white"
                  />
                </div>
                <div>
                  <label className="text-gray-400 block mb-1">City</label>
                  <input
                    type="text"
                    required
                    value={theatreForm.city}
                    onChange={(e) => setTheatreForm({ ...theatreForm, city: e.target.value })}
                    className="w-full bg-gray-950 border border-gray-700 rounded-lg p-2 text-white"
                  />
                </div>
              </div>
              <div>
                <label className="text-gray-400 block mb-1">Full Address</label>
                <input
                  type="text"
                  required
                  value={theatreForm.address}
                  onChange={(e) => setTheatreForm({ ...theatreForm, address: e.target.value })}
                  className="w-full bg-gray-950 border border-gray-700 rounded-lg p-2 text-white"
                />
              </div>
              <div>
                <label className="text-gray-400 block mb-1">Facilities (comma-separated)</label>
                <input
                  type="text"
                  value={theatreForm.facilities}
                  onChange={(e) => setTheatreForm({ ...theatreForm, facilities: e.target.value })}
                  className="w-full bg-gray-950 border border-gray-700 rounded-lg p-2 text-white"
                />
              </div>
              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsAddTheatreModal(false)}
                  className="px-4 py-2 bg-gray-800 text-gray-300 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl"
                >
                  Save Theatre
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboardPage;
