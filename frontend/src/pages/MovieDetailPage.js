import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { Star, Clock, Calendar, MapPin, Film, ChevronLeft, RefreshCw, Sparkles } from 'lucide-react';
import { formatDuration, formatDate, formatTime } from '../utils/formatters';

const MovieDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [movie, setMovie] = useState(null);
  const [schedules, setSchedules] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState('');

  useEffect(() => {
    const fetchMovieData = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/movies/${id}`);
        if (res.data.success) {
          const { movie: fetchedMovie, schedules: fetchedSchedules } = res.data.data;
          setMovie(fetchedMovie);
          setSchedules(fetchedSchedules || {});

          const dates = Object.keys(fetchedSchedules || {});
          if (dates.length > 0) {
            setSelectedDate(dates[0]);
          } else {
            setSelectedDate(new Date().toISOString().split('T')[0]);
          }
        }
      } catch (err) {
        console.error('Failed to load movie details:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchMovieData();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <RefreshCw className="w-10 h-10 animate-spin text-red-600" />
      </div>
    );
  }

  if (!movie) {
    return (
      <div className="max-w-4xl mx-auto py-20 px-4 text-center">
        <h2 className="text-xl font-bold text-white mb-4">Movie not found</h2>
        <button
          onClick={() => navigate('/')}
          className="px-4 py-2 bg-red-600 text-white rounded-xl text-xs font-bold"
        >
          Return to Movies
        </button>
      </div>
    );
  }

  const availableDates = Object.keys(schedules).sort();
  const currentTheatresMap = schedules[selectedDate] || {};
  const theatreIds = Object.keys(currentTheatresMap);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Back button */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white mb-6 transition"
      >
        <ChevronLeft className="w-4 h-4" /> Back to Movies
      </button>

      {/* Hero Movie Overview */}
      <div className="relative rounded-3xl overflow-hidden glass-panel border border-gray-800 shadow-2xl p-6 sm:p-8 mb-10">
        <div className="flex flex-col md:flex-row gap-8 items-start">
          {/* Poster */}
          <div className="w-48 sm:w-56 shrink-0 aspect-[2/3] rounded-2xl overflow-hidden shadow-2xl border border-gray-700/80 mx-auto md:mx-0">
            <img src={movie.posterUrl} alt={movie.title} className="w-full h-full object-cover" />
          </div>

          {/* Details */}
          <div className="flex-1 space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="bg-red-600 text-white text-xs font-bold px-2.5 py-0.5 rounded shadow">
                {movie.certification || 'UA'}
              </span>
              <span className="bg-gray-800 text-gray-300 text-xs font-semibold px-2.5 py-0.5 rounded border border-gray-700">
                {movie.language}
              </span>
              <div className="flex items-center gap-1 bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold px-2.5 py-0.5 rounded">
                <Star className="w-3.5 h-3.5 fill-amber-400" />
                <span>{movie.rating?.toFixed(1) || '8.8'} / 10</span>
              </div>
            </div>

            <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              {movie.title}
            </h1>

            <div className="flex flex-wrap items-center gap-4 text-xs text-gray-400">
              <div className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-gray-400" />
                <span>{formatDuration(movie.duration)}</span>
              </div>
              <span>•</span>
              <div>{movie.genre?.join(', ')}</div>
              <span>•</span>
              <div>Released {new Date(movie.releaseDate).toLocaleDateString()}</div>
            </div>

            <p className="text-sm text-gray-300 leading-relaxed max-w-3xl">
              {movie.description}
            </p>

            <div className="pt-2 border-t border-gray-800/80 space-y-2 text-xs">
              <div>
                <span className="text-gray-500 uppercase tracking-wider font-semibold mr-2">Director:</span>
                <span className="text-gray-200 font-medium">{movie.director}</span>
              </div>
              <div>
                <span className="text-gray-500 uppercase tracking-wider font-semibold mr-2">Cast:</span>
                <span className="text-gray-200 font-medium">{movie.cast?.join(', ')}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Showtimes & Booking Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Calendar className="w-5 h-5 text-red-600" /> Select Showtime & Date
          </h2>
        </div>

        {/* Date Tabs */}
        {availableDates.length > 0 ? (
          <div className="flex items-center gap-3 overflow-x-auto pb-2">
            {availableDates.map((dateStr) => {
              const d = new Date(dateStr);
              const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
              const monthName = d.toLocaleDateString('en-US', { month: 'short' });
              const dayNum = d.getDate();
              const isSelected = selectedDate === dateStr;

              return (
                <button
                  key={dateStr}
                  onClick={() => setSelectedDate(dateStr)}
                  className={`flex flex-col items-center justify-center min-w-[76px] py-2.5 px-3 rounded-2xl border transition-all ${
                    isSelected
                      ? 'bg-red-600 border-red-500 text-white shadow-lg shadow-red-600/30 scale-105'
                      : 'bg-gray-900/80 border-gray-800 text-gray-400 hover:text-white hover:bg-gray-800'
                  }`}
                >
                  <span className="text-[10px] uppercase font-bold tracking-wider">{dayName}</span>
                  <span className="text-lg font-black font-mono leading-none my-0.5">{dayNum}</span>
                  <span className="text-[10px] uppercase">{monthName}</span>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="p-8 text-center glass-panel rounded-2xl border border-gray-800 text-gray-400 text-sm">
            No upcoming showtimes are scheduled for this title right now.
          </div>
        )}

        {/* Theatres & Showtimes List */}
        {theatreIds.length > 0 ? (
          <div className="space-y-4">
            {theatreIds.map((theatreId) => {
              const { theatre, shows } = currentTheatresMap[theatreId];

              return (
                <div
                  key={theatreId}
                  className="glass-panel p-5 sm:p-6 rounded-2xl border border-gray-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-6"
                >
                  {/* Theatre Info */}
                  <div className="space-y-1.5 max-w-sm">
                    <h3 className="font-bold text-base text-white">{theatre.name}</h3>
                    <p className="text-xs text-gray-400 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-gray-500" />
                      {theatre.location}, {theatre.city}
                    </p>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {theatre.facilities?.slice(0, 3).map((f) => (
                        <span key={f} className="text-[10px] bg-gray-800 px-2 py-0.5 rounded text-gray-300">
                          {f}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Showtimes Pills */}
                  <div className="flex flex-wrap items-center gap-3">
                    {shows.map((show) => (
                      <button
                        key={show._id}
                        onClick={() => navigate(`/booking/${show._id}`)}
                        className="group flex flex-col items-center px-4 py-2.5 rounded-xl border border-gray-700 bg-gray-900/90 hover:border-red-500 hover:bg-red-950/20 transition-all text-center"
                      >
                        <span className="text-xs font-bold text-white group-hover:text-red-400 font-mono">
                          {show.time}
                        </span>
                        <span className="text-[10px] text-gray-400 font-semibold uppercase mt-0.5">
                          {show.format}
                        </span>
                        <span className="text-[10px] text-emerald-400 font-mono mt-0.5">
                          from ₹{show.pricing?.regular || 180}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          availableDates.length > 0 && (
            <div className="p-8 text-center glass-panel rounded-2xl border border-gray-800 text-gray-400 text-sm">
              No shows available on this specific date. Please select another date above.
            </div>
          )
        )}
      </div>
    </div>
  );
};

export default MovieDetailPage;
