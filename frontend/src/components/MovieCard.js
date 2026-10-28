import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Star, Clock, Ticket } from 'lucide-react';
import { formatDuration } from '../utils/formatters';

const MovieCard = ({ movie }) => {
  const navigate = useNavigate();

  return (
    <div className="group bg-gray-900/60 border border-gray-800/80 rounded-2xl overflow-hidden hover:border-gray-700 hover:shadow-2xl hover:shadow-red-950/20 transition-all duration-300 flex flex-col">
      {/* Poster Thumbnail */}
      <div className="relative aspect-[2/3] w-full overflow-hidden bg-gray-950">
        <img
          src={movie.posterUrl}
          alt={movie.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />

        {/* Top Badges */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
          <div className="flex items-center gap-1 bg-black/75 backdrop-blur-md px-2 py-1 rounded-md text-amber-400 text-xs font-bold border border-white/10 shadow">
            <Star className="w-3.5 h-3.5 fill-amber-400" />
            <span>{movie.rating ? movie.rating.toFixed(1) : '8.5'}</span>
          </div>
          <span className="bg-red-600/90 backdrop-blur-md text-white text-[11px] font-bold px-2 py-0.5 rounded shadow">
            {movie.certification || 'UA'}
          </span>
        </div>

        {/* Bottom Language & Duration Overlay */}
        <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-gray-950 via-gray-950/80 to-transparent p-3 pt-8 flex items-center justify-between text-[11px] text-gray-300">
          <span className="font-semibold text-white bg-gray-800/80 px-2 py-0.5 rounded border border-gray-700">
            {movie.language}
          </span>
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3 text-gray-400" />
            <span>{formatDuration(movie.duration)}</span>
          </div>
        </div>
      </div>

      {/* Card Body */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          <h3 className="font-bold text-base text-white group-hover:text-red-400 transition-colors line-clamp-1 mb-1">
            {movie.title}
          </h3>
          <p className="text-xs text-gray-400 line-clamp-1 mb-3">
            {movie.genre?.join(', ')}
          </p>
        </div>

        <button
          onClick={() => navigate(`/movies/${movie._id}`)}
          className="w-full mt-2 py-2.5 px-3 bg-red-600/10 hover:bg-red-600 border border-red-600/30 hover:border-red-600 text-red-400 hover:text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow group-hover:shadow-red-600/20"
        >
          <Ticket className="w-3.5 h-3.5" />
          Book Tickets
        </button>
      </div>
    </div>
  );
};

export default MovieCard;
