import { Github, Twitter } from 'lucide-react';
import { Link } from 'react-router-dom';

function Footer() {
  return (
    <footer className="border-t border-white/5 bg-[rgba(6,10,18,0.8)] backdrop-blur-lg">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-8 text-sm text-muted md:flex-row md:items-center md:justify-between">
        <nav className="flex gap-5">
          <Link className="hover:text-primary focus-visible:text-primary" to="/about">
            About
          </Link>
          <Link className="hover:text-primary focus-visible:text-primary" to="/privacy">
            Privacy
          </Link>
          <Link className="hover:text-primary focus-visible:text-primary" to="/contact">
            Contact
          </Link>
        </nav>
        <div className="flex flex-col items-center gap-3 md:items-end">
          <div className="flex items-center gap-3">
            <a
              href="https://github.com/himanshusaroha648"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="GitHub"
              className="rounded-full border border-white/10 bg-card/60 p-2 text-muted transition hover:text-primary"
            >
              <Github size={18} />
            </a>
            <a
              href="https://x.com/himanshusa4020"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="X / Twitter"
              className="rounded-full border border-white/10 bg-card/60 p-2 text-muted transition hover:text-primary"
            >
              <Twitter size={18} />
            </a>
          </div>
          <p className="text-xs text-center md:text-right">
            <span className="text-muted/70">© {new Date().getFullYear()} LASTANIME · Concept UI</span>
            <br />
            <span className="text-primary/80 font-semibold">⚠️ Project in Development</span>
          </p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
