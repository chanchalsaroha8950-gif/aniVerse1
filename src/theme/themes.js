export const themes = {
  neoDark: {
    name: 'NeoDark Minimal',
    colors: {
      bg: '#000000',
      card: '#0a0a0a',
      primary: '#0B78FF',
      secondary: '#8B5CF6',
      muted: '#6B7280',
      accent: '#06b6d4',
    },
    description: 'Pure dark with neon blue/purple highlights'
  },
  midnightPurple: {
    name: 'Midnight Purple',
    colors: {
      bg: '#0f0a1e',
      card: '#1a0f2e',
      primary: '#8B5CF6',
      secondary: '#A78BFA',
      muted: '#9CA3AF',
      accent: '#C084FC',
    },
    description: 'Deep purple with gradient overlays'
  },
  cyberpunk: {
    name: 'Cyberpunk Glow',
    colors: {
      bg: '#050505',
      card: '#0d0d0d',
      primary: '#FF0080',
      secondary: '#00FFFF',
      muted: '#808080',
      accent: '#FF6EC7',
    },
    description: 'Black with neon pink/cyan glow effects'
  },
  graphiteGray: {
    name: 'Graphite Gray Premium',
    colors: {
      bg: '#121212',
      card: '#1e1e1e',
      primary: '#E5E5E5',
      secondary: '#B3B3B3',
      muted: '#737373',
      accent: '#FFFFFF',
    },
    description: 'Dark gray with sharp white typography'
  },
  obsidianRed: {
    name: 'Obsidian Red',
    colors: {
      bg: '#0a0a0a',
      card: '#1a1010',
      primary: '#DC2626',
      secondary: '#EF4444',
      muted: '#9CA3AF',
      accent: '#F87171',
    },
    description: 'Dark background with red accents'
  },
  blueWave: {
    name: 'Blue Wave Dark',
    colors: {
      bg: '#0a0f1c',
      card: '#111827',
      primary: '#3B82F6',
      secondary: '#60A5FA',
      muted: '#9CA3AF',
      accent: '#93C5FD',
    },
    description: 'Black/Gray base with electric blue'
  },
  galaxy: {
    name: 'Galaxy Gradient',
    colors: {
      bg: '#0a0118',
      card: '#1a0f2e',
      primary: '#6366F1',
      secondary: '#8B5CF6',
      muted: '#9CA3AF',
      accent: '#A78BFA',
    },
    description: 'Space theme with deep blue/violet'
  },
  darkGlass: {
    name: 'Dark Glass UI',
    colors: {
      bg: '#0f0f0f',
      card: 'rgba(30, 30, 30, 0.7)',
      primary: '#3B82F6',
      secondary: '#8B5CF6',
      muted: '#9CA3AF',
      accent: '#60A5FA',
    },
    description: 'Blur + transparency with glassmorphism'
  },
  shadowMinimal: {
    name: 'Shadow Minimal',
    colors: {
      bg: '#000000',
      card: '#121212',
      primary: '#FFFFFF',
      secondary: '#E5E5E5',
      muted: '#737373',
      accent: '#D4D4D4',
    },
    description: 'Pure dark with soft shadows'
  },
  emberOrange: {
    name: 'Ember Dark Orange',
    colors: {
      bg: '#0a0604',
      card: '#1a0f0a',
      primary: '#F97316',
      secondary: '#FB923C',
      muted: '#9CA3AF',
      accent: '#FDBA74',
    },
    description: 'Black base with orange warm accent'
  },
};

export const applyTheme = (themeName) => {
  const theme = themes[themeName];
  if (!theme) return;

  const root = document.documentElement;
  root.style.setProperty('--color-bg', theme.colors.bg);
  root.style.setProperty('--color-card', theme.colors.card);
  root.style.setProperty('--color-primary', theme.colors.primary);
  root.style.setProperty('--color-secondary', theme.colors.secondary);
  root.style.setProperty('--color-muted', theme.colors.muted);
  root.style.setProperty('--color-accent', theme.colors.accent);
  
  localStorage.setItem('selectedTheme', themeName);
};

export const getInitialTheme = () => {
  return localStorage.getItem('selectedTheme') || 'neoDark';
};
