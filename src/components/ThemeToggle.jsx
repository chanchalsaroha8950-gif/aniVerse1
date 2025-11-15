import { useTheme } from '../theme/ThemeContext.jsx';
import { Palette } from 'lucide-react';

function ThemeToggle() {
  const { cycleTheme, label } = useTheme();

  return (
    <button
      type="button"
      aria-label={`Switch theme (current: ${label})`}
      onClick={cycleTheme}
      className="flex items-center gap-2 rounded-full border border-white/10 bg-card/60 px-3 py-2 text-xs font-semibold text-muted transition hover:text-primary focus-visible:text-primary"
    >
      <Palette size={16} />
      <span className="hidden sm:inline">Theme: {label}</span>
    </button>
  );
}

export default ThemeToggle;
