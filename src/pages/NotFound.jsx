import { Link } from 'react-router-dom';

function NotFound() {
  return (
    <section className="flex h-[70vh] flex-col items-center justify-center gap-6 bg-card/40 text-center">
      <h1 className="text-5xl font-semibold text-white">404</h1>
      <p className="max-w-xl text-muted">
        The page you’re searching for drifted into the void. Launch back to LASTANIME and continue the
        journey.
      </p>
      <Link
        to="/"
        className="rounded-full bg-primary px-5 py-3 text-sm font-semibold text-white transition hover:bg-primary/90"
      >
        Back to home
      </Link>
    </section>
  );
}

export default NotFound;
