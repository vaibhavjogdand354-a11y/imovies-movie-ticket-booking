import React, { useState, useEffect } from 'react';
import api from '../services/api';
import HeroBanner from '../components/HeroBanner';
import FilterBar from '../components/FilterBar';
import MovieCard from '../components/MovieCard';
import { Film, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';

const HomePage = () => {
  const [movies, setMovies] = useState([]);
  const [theatres, setTheatres] = useState([]);
  const [filterMeta, setFilterMeta] = useState({ genres: [], languages: [], cities: [] });
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalMovies, setTotalMovies] = useState(0);

  // 5 Criteria Filters + Search
  const [filters, setFilters] = useState({
    genre: 'All',
    language: 'All',
    theatre: 'All',
    location: 'All',
    date: '',
    search: '',
  });

  // Fetch filter metadata & theatres once
  useEffect(() => {
    const fetchMeta = async () => {
      try {
        const [metaRes, theatreRes] = await Promise.all([
          api.get('/movies/filters/meta'),
          api.get('/theatres'),
        ]);
        if (metaRes.data.success) {
          setFilterMeta(metaRes.data.data);
        }
        if (theatreRes.data.success) {
          setTheatres(theatreRes.data.data);
        }
      } catch (err) {
        console.error('Failed to load filter metadata:', err);
      }
    };
    fetchMeta();
  }, []);

  // Fetch movies whenever filters or page changes
  useEffect(() => {
    const fetchMovies = async () => {
      try {
        setLoading(true);
        const params = {
          page,
          limit: 12,
        };
        if (filters.search) params.search = filters.search;
        if (filters.genre && filters.genre !== 'All') params.genre = filters.genre;
        if (filters.language && filters.language !== 'All') params.language = filters.language;
        if (filters.location && filters.location !== 'All') params.location = filters.location;
        if (filters.theatre && filters.theatre !== 'All') params.theatre = filters.theatre;
        if (filters.date) params.date = filters.date;

        const res = await api.get('/movies', { params });
        if (res.data.success) {
          setMovies(res.data.data);
          setTotalPages(res.data.totalPages || 1);
          setTotalMovies(res.data.total || 0);
        }
      } catch (err) {
        console.error('Error fetching movies:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchMovies();
  }, [filters, page]);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPage(1); // reset to page 1 on filter modification
  };

  const handleResetFilters = () => {
    setFilters({
      genre: 'All',
      language: 'All',
      theatre: 'All',
      location: 'All',
      date: '',
      search: '',
    });
    setPage(1);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Hero Spotlight Carousel */}
      <HeroBanner movies={movies} />

      {/* 5-Criteria Filter & Search Bar */}
      <FilterBar
        filters={filters}
        filterMeta={filterMeta}
        theatres={theatres}
        onFilterChange={handleFilterChange}
        onResetFilters={handleResetFilters}
      />

      {/* Catalog Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-black text-white flex items-center gap-2">
            <Film className="w-6 h-6 text-red-600" /> Now Showing
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Showing {movies.length} of {totalMovies} blockbuster titles
          </p>
        </div>
      </div>

      {/* Movie Grid */}
      {loading ? (
        <div className="py-24 text-center">
          <RefreshCw className="w-10 h-10 animate-spin mx-auto text-red-600 mb-3" />
          <p className="text-sm text-gray-400">Loading cinema catalog...</p>
        </div>
      ) : movies.length === 0 ? (
        <div className="text-center py-24 glass-panel rounded-2xl border border-gray-800">
          <Film className="w-12 h-12 text-gray-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-white mb-1">No movies match your selected criteria</h3>
          <p className="text-xs text-gray-400 max-w-sm mx-auto mb-4">
            Try adjusting your search terms, changing the theatre, or selecting any date.
          </p>
          <button
            onClick={handleResetFilters}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl transition"
          >
            Reset All Filters
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-5">
            {movies.map((movie) => (
              <MovieCard key={movie._id} movie={movie} />
            ))}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="mt-12 flex items-center justify-center gap-3">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="p-2.5 rounded-xl border border-gray-800 bg-gray-900/80 text-gray-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-800 transition"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs font-bold text-gray-300 font-mono px-3">
                Page {page} of {totalPages}
              </span>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="p-2.5 rounded-xl border border-gray-800 bg-gray-900/80 text-gray-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-800 transition"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default HomePage;
