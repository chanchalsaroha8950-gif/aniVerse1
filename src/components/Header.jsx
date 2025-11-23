import { Menu, Search, SunMedium, ChevronDown, Shuffle } from 'lucide-react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';
import ThemeSelector from './ThemeSelector.jsx';
import { fetchLibrary } from '../api/client.js';

function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState('All');
  const searchRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setSearchOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setSearchOpen(false);
    if (location.pathname !== '/') {
      navigate('/', { state: { searchQuery, searchType } });
    } else {
      window.dispatchEvent(new CustomEvent('header-search', { 
        detail: { query: searchQuery, type: searchType } 
      }));
    }
  };

  const handleRandomAnime = async () => {
    try {
      const library = await fetchLibrary();
      if (!Array.isArray(library) || library.length === 0) {
        console.warn('Library is empty or not an array');
        return;
      }
      const animeList = library.filter(item => item && item.type === 'series' && item.slug);
      if (animeList.length > 0) {
        const randomAnime = animeList[Math.floor(Math.random() * animeList.length)];
        navigate(`/series/${randomAnime.slug}`);
      } else {
        console.warn('No anime found in library');
      }
    } catch (error) {
      console.error('Failed to fetch random anime:', error);
    }
  };

  const handleHomeClick = () => {
    setSearchQuery('');
    window.dispatchEvent(new CustomEvent('header-search', { 
      detail: { query: '', type: 'All' } 
    }));
  };

  return (
    <header className="sticky top-0 z-50 bg-[rgba(6,10,18,0.8)] backdrop-blur-lg border-b border-white/5">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-2 px-3 py-2.5 sm:gap-4 sm:px-4 sm:py-4">
        <div className="flex items-center gap-2 sm:gap-3">
          <Link to="/" aria-label="LASTANIME home" className="flex items-center gap-1.5 sm:gap-2" onClick={handleHomeClick}>
            <img
              src="/logo-symbol.svg"
              alt="LASTANIME symbol"
              className="h-6 w-6 sm:h-8 sm:w-8 drop-shadow-lg"
              draggable="false"
            />
            <span className="text-sm sm:text-xl font-bold bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
              LASTANIME
            </span>
          </Link>

          <nav className="hidden items-center gap-5 text-sm md:flex">
            <NavLink
              to="/"
              onClick={handleHomeClick}
              className={({ isActive }) =>
                `transition-colors ${
                  isActive ? 'text-primary' : 'text-muted hover:text-primary'
                }`
              }
            >
              Home
            </NavLink>
            <NavLink
              to="/collection"
              className={({ isActive }) =>
                `transition-colors ${
                  isActive ? 'text-primary' : 'text-muted hover:text-primary'
                }`
              }
            >
              Collections
            </NavLink>
          </nav>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-3">
          <div className="relative" ref={searchRef}>
            <button
              type="button"
              onClick={() => setSearchOpen(!searchOpen)}
              aria-label="Open search"
              className="flex items-center gap-1 sm:gap-2 rounded-full border border-white/10 bg-card/60 p-2 sm:px-3 sm:py-2 text-muted transition hover:text-primary hover:border-primary/50"
            >
              <Search size={18} />
              <span className="text-sm font-medium hidden sm:inline">Search</span>
            </button>
            
            {searchOpen && (
              <div className="absolute left-0 top-full mt-2 w-80 max-w-[calc(100vw-2rem)] glass-surface rounded-2xl border border-white/10 p-4 shadow-xl z-50">
                <form onSubmit={handleSearchSubmit} className="flex flex-col gap-3">
                  <div className="flex items-center gap-2 rounded-full bg-card/60 px-3 py-2">
                    <Search className="text-muted" size={16} />
                    <input
                      type="search"
                      className="flex-1 bg-transparent text-sm text-white placeholder:text-muted focus:outline-none"
                      placeholder="Search anime, movies..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      autoFocus
                    />
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted font-semibold">Type:</span>
                    <div className="flex gap-2">
                      {['All', 'Anime', 'Movies'].map((type) => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => setSearchType(type)}
                          className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                            searchType === type
                              ? 'bg-primary/20 text-primary'
                              : 'bg-card text-muted hover:text-primary'
                          }`}
                        >
                          {type}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <button
                    type="submit"
                    className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary/90"
                  >
                    Search
                  </button>
                </form>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={handleRandomAnime}
            aria-label="Random Anime"
            className="flex items-center gap-1 sm:gap-2 rounded-full border border-white/10 bg-card/60 p-2 sm:px-3 sm:py-2 text-muted transition hover:text-primary hover:border-primary/50"
          >
            <Shuffle size={18} />
            <span className="text-sm font-medium hidden sm:inline">Random</span>
          </button>
          <ThemeSelector />
          <button
            type="button"
            aria-label="Open menu"
            className="rounded-full border border-white/10 bg-card/60 p-2 text-muted transition hover:text-primary md:hidden"
          >
            <Menu size={18} />
          </button>
        </div>
      </div>
    </header>
  );
}

export default Header;
