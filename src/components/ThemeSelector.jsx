import { useState, useRef, useEffect } from 'react';
import { Palette, Check } from 'lucide-react';
import { themes, applyTheme, getInitialTheme } from '../theme/themes.js';

function ThemeSelector() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState(getInitialTheme());
  const dropdownRef = useRef(null);

  useEffect(() => {
    applyTheme(selectedTheme);
  }, [selectedTheme]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleThemeChange = (themeName) => {
    setSelectedTheme(themeName);
    applyTheme(themeName);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Change theme"
        className="flex items-center gap-1 sm:gap-2 rounded-full border border-white/10 bg-card/60 p-2 sm:px-3 sm:py-2 text-muted transition hover:text-primary hover:border-primary/50"
      >
        <Palette size={18} />
        <span className="text-sm font-medium hidden sm:inline">Theme</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 max-w-[calc(100vw-2rem)] glass-surface rounded-2xl border border-white/10 p-4 shadow-xl z-50">
          <h3 className="text-sm font-bold text-white mb-3">Select Theme</h3>
          <div className="grid gap-2 max-h-96 overflow-y-auto">
            {Object.entries(themes).map(([key, theme]) => (
              <button
                key={key}
                type="button"
                onClick={() => handleThemeChange(key)}
                className={`group relative w-full text-left rounded-xl border transition-all ${
                  selectedTheme === key
                    ? 'border-primary bg-primary/10'
                    : 'border-white/10 bg-card/40 hover:border-primary/50'
                }`}
              >
                <div className="p-3">
                  <div className="flex items-start justify-between mb-1">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-semibold text-white">{theme.name}</h4>
                        {selectedTheme === key && (
                          <Check size={16} className="text-primary" />
                        )}
                      </div>
                      <p className="text-xs text-muted mt-0.5">{theme.description}</p>
                    </div>
                  </div>
                  <div className="flex gap-1.5 mt-2">
                    <div
                      className="w-6 h-6 rounded-md border border-white/20"
                      style={{ backgroundColor: theme.colors.bg }}
                    />
                    <div
                      className="w-6 h-6 rounded-md border border-white/20"
                      style={{ backgroundColor: theme.colors.card }}
                    />
                    <div
                      className="w-6 h-6 rounded-md border border-white/20"
                      style={{ backgroundColor: theme.colors.primary }}
                    />
                    <div
                      className="w-6 h-6 rounded-md border border-white/20"
                      style={{ backgroundColor: theme.colors.secondary }}
                    />
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default ThemeSelector;
