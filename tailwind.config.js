/** @type {import('tailwindcss').Config} */
export default {
    darkMode: ['class'],
    content: ['./index.html', './src/**/*.{js,jsx}'],
    theme: {
      extend: {
        colors: {
          primary: 'var(--color-primary)',
          secondary: 'var(--color-secondary)',
          accent: 'var(--color-accent)',
          muted: 'var(--color-muted)'
        },
        backgroundColor: {
          skin: 'var(--color-bg)',
          card: 'var(--color-card)'
        },
        textColor: {
          skin: '#e6eef3'
        },
        boxShadow: {
          floating: '0 20px 45px rgba(11, 120, 255, 0.18)'
        },
        transitionDuration: {
          theme: '300ms'
        }
      }
    },
    plugins: []
  };