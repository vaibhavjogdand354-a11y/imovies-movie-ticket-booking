import React from 'react';
import { Search, Filter, Calendar, MapPin, Film, SlidersHorizontal, RotateCcw } from 'lucide-react';

const FilterBar = ({
  filters,
  filterMeta,
  theatres = [],
  onFilterChange,
  onResetFilters,
}) => {
  const todayStr = new Date().toISOString().split('T')[0];
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];

  return (
    <div className="glass-panel rounded-2xl p-4 sm:p-5 mb-8 border border-gray-800 shadow-xl">
      <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
        {/* Search Input */}
        <div className="relative w-full lg:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={filters.search}
            onChange={(e) => onFilterChange('search', e.target.value)}
            placeholder="Search movies, directors..."
            className="w-full pl-10 pr-4 py-2.5 bg-gray-900/90 border border-gray-700/80 rounded-xl text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition"
          />
        </div>

        {/* 5-Criteria Select Dropdowns */}
        <div className="w-full flex-1 grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {/* 1. Genre */}
          <div className="relative">
            <select
              value={filters.genre}
              onChange={(e) => onFilterChange('genre', e.target.value)}
              className="w-full appearance-none bg-gray-900/90 border border-gray-700/80 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-gray-200 focus:outline-none focus:border-red-500 cursor-pointer"
            >
              <option value="All">All Genres</option>
              {filterMeta.genres?.map((g) => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
            <SlidersHorizontal className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
          </div>

          {/* 2. Language */}
          <div className="relative">
            <select
              value={filters.language}
              onChange={(e) => onFilterChange('language', e.target.value)}
              className="w-full appearance-none bg-gray-900/90 border border-gray-700/80 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-gray-200 focus:outline-none focus:border-red-500 cursor-pointer"
            >
              <option value="All">All Languages</option>
              {filterMeta.languages?.map((l) => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>
            <Film className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
          </div>

          {/* 3. Location / City */}
          <div className="relative">
            <select
              value={filters.location}
              onChange={(e) => onFilterChange('location', e.target.value)}
              className="w-full appearance-none bg-gray-900/90 border border-gray-700/80 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-gray-200 focus:outline-none focus:border-red-500 cursor-pointer"
            >
              <option value="All">All Cities</option>
              {filterMeta.cities?.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <MapPin className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
          </div>

          {/* 4. Theatre */}
          <div className="relative">
            <select
              value={filters.theatre}
              onChange={(e) => onFilterChange('theatre', e.target.value)}
              className="w-full appearance-none bg-gray-900/90 border border-gray-700/80 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-gray-200 focus:outline-none focus:border-red-500 cursor-pointer"
            >
              <option value="All">All Theatres</option>
              {theatres.map((t) => (
                <option key={t._id} value={t._id}>{t.name}</option>
              ))}
            </select>
            <Filter className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
          </div>
        </div>

        {/* 5. Date Selector & Reset */}
        <div className="w-full lg:w-auto flex items-center gap-2 justify-between lg:justify-end">
          <div className="flex items-center gap-1.5 bg-gray-900/90 p-1 rounded-xl border border-gray-700/80">
            <button
              onClick={() => onFilterChange('date', '')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                !filters.date ? 'bg-red-600 text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              Any Date
            </button>
            <button
              onClick={() => onFilterChange('date', todayStr)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                filters.date === todayStr ? 'bg-red-600 text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              Today
            </button>
            <button
              onClick={() => onFilterChange('date', tomorrowStr)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                filters.date === tomorrowStr ? 'bg-red-600 text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              Tomorrow
            </button>
          </div>

          <button
            onClick={onResetFilters}
            className="p-2.5 bg-gray-900/90 hover:bg-gray-800 text-gray-400 hover:text-white border border-gray-700/80 rounded-xl transition"
            title="Reset Filters"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default FilterBar;
