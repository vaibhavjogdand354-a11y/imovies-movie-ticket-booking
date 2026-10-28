import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Star, Clock, Ticket, Sparkles, ChevronRight, Play } from 'lucide-react';
import { formatDuration } from '../utils/formatters';

const HeroBanner = ({ movies = [] }) => {
  const navigate = useNavigate();
  const [currentIndex, setCurrentIndex] = useState(0);

  const featured = movies.length > 0 ? movies.slice(0, 3) : [
    {
      _id: 'sample',
      title: 'Oppenheimer',
      description: 'The story of American scientist J. Robert Oppenheimer and his role in the development of the atomic bomb.',
      rating: 8.9,
      duration: 180,
      language: 'English',
      genre: ['Biography', 'Drama', 'History'],
      bannerUrl: 'https://images.unsplash.com/photo-1478760329108-5c3ed9d495a0?auto=format&fit=crop&w=1600&q=80',
    }
  ];

  useEffect(() => {
    if (featured.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % featured.length);
    }, 8000);
    return () => clearInterval(interval);
  }, [featured.length]);

  const activeMovie = featured[currentIndex] || featured[0];

  return (
    <div className="relative w-full h-[460px] sm:h-[520px] rounded-2xl overflow-hidden shadow-2xl mb-10 border border-gray-800">
      {/* Background Image with Gradient Overlay */}
      <div
        className="absolute inset-0 bg-cover bg-center transition-all duration-1000 transform scale-105"
        style={{
          backgroundImage: `url(${activeMovie.bannerUrl || activeMovie.posterUrl})`,
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-[#0B0F19] via-[#0B0F19]/70 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0B0F19] via-[#0B0F19]/80 to-transparent" />
      </div>

      {/* Hero Content */}
      <div className="relative z-10 h-full max-w-7xl mx-auto px-6 sm:px-12 flex flex-col justify-end pb-12 sm:pb-16 max-w-2xl">
        <div className="flex items-center gap-2 mb-3">
          <span className="inline-flex items-center gap-1 bg-red-600/90 text-white text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-md shadow">
            <Sparkles className="w-3.5 h-3.5" /> Featured Spotlight
          </span>
          <span className="bg-gray-800/90 text-gray-300 text-xs font-semibold px-2.5 py-1 rounded-md border border-gray-700">
            {activeMovie.language}
          </span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight mb-3 drop-shadow-md">
          {activeMovie.title}
        </h1>

        <div className="flex flex-wrap items-center gap-4 text-xs sm:text-sm text-gray-300 mb-4">
          <div className="flex items-center gap-1.5 text-amber-400 font-bold bg-amber-400/10 px-2.5 py-1 rounded-md border border-amber-400/20">
            <Star className="w-4 h-4 fill-amber-400" />
            <span>{activeMovie.rating?.toFixed(1) || '8.8'} / 10</span>
          </div>
          <div className="flex items-center gap-1 text-gray-300">
            <Clock className="w-4 h-4 text-gray-400" />
            <span>{formatDuration(activeMovie.duration)}</span>
          </div>
          <div className="flex items-center gap-1 text-gray-400">
            {activeMovie.genre?.join(' • ')}
          </div>
        </div>

        <p className="text-xs sm:text-sm text-gray-300 line-clamp-2 sm:line-clamp-3 mb-6 max-w-xl leading-relaxed">
          {activeMovie.description}
        </p>

        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(`/movies/${activeMovie._id}`)}
            className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-red-600/40 transition transform hover:-translate-y-0.5"
          >
            <Ticket className="w-5 h-5" />
            Book Tickets Now
          </button>
          <button
            onClick={() => navigate(`/movies/${activeMovie._id}`)}
            className="flex items-center gap-2 bg-gray-900/80 hover:bg-gray-800 text-gray-200 border border-gray-700 px-5 py-3 rounded-xl font-semibold backdrop-blur-sm transition"
          >
            <span>Showtimes & Info</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Slide Indicators */}
      {featured.length > 1 && (
        <div className="absolute bottom-6 right-6 z-10 flex gap-2">
          {featured.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              className={`h-2 rounded-full transition-all duration-300 ${
                idx === currentIndex ? 'w-8 bg-red-600' : 'w-2 bg-gray-600 hover:bg-gray-400'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default HeroBanner;
