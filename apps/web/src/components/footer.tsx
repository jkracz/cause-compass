import Link from "next/link";
import { Heart } from "lucide-react";

function GithubMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      className={className}
    >
      <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.38 7.86 10.9.58.11.79-.25.79-.56 0-.27-.01-1-.02-1.96-3.2.7-3.87-1.54-3.87-1.54-.52-1.33-1.28-1.69-1.28-1.69-1.05-.72.08-.71.08-.71 1.16.08 1.77 1.2 1.77 1.2 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.55-.29-5.24-1.28-5.24-5.7 0-1.26.45-2.29 1.19-3.1-.12-.29-.52-1.47.11-3.06 0 0 .97-.31 3.18 1.18a11 11 0 0 1 5.78 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.77.11 3.06.74.81 1.18 1.84 1.18 3.1 0 4.43-2.69 5.41-5.25 5.69.41.36.78 1.07.78 2.16 0 1.56-.01 2.81-.01 3.19 0 .31.21.68.8.56A11.51 11.51 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5Z" />
    </svg>
  );
}

export function Footer() {
  return (
    <footer className="relative z-20 mt-auto border-t border-[var(--rule)] bg-[color:rgba(240,230,245,0.6)] backdrop-blur-md">
      <div className="container mx-auto flex flex-col gap-6 px-4 py-6">
        <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-sm">
            <span className="text-xs text-[var(--ink-mute)]">
              © {new Date().getFullYear()} CauseCompass
            </span>
            <span className="hidden h-4 w-px bg-[var(--rule)] sm:block" />
            <nav
              aria-label="Footer"
              className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3"
            >
              <Link
                href="/about"
                className="text-[var(--ink-soft)] transition-colors hover:text-[var(--accent)]"
              >
                About
              </Link>
              <Link
                href="/methodology"
                className="text-[var(--ink-soft)] transition-colors hover:text-[var(--accent)]"
              >
                Methodology
              </Link>
              <Link
                href="/terms"
                className="text-[var(--ink-soft)] transition-colors hover:text-[var(--accent)]"
              >
                Terms & Conditions
              </Link>
              <Link
                href="/privacy"
                className="text-[var(--ink-soft)] transition-colors hover:text-[var(--accent)]"
              >
                Privacy Policy
              </Link>
            </nav>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-xs tracking-widest text-[var(--ink-soft)] uppercase">
            <a
              href="https://github.com/jkracz/cause-compass"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 transition-colors hover:text-[var(--accent)]"
            >
              <GithubMark className="h-4 w-4" />
              <span>Open Source</span>
            </a>
            <span className="inline-flex items-center gap-2">
              <span>Made with</span>
              <Heart className="h-4 w-4 fill-[var(--accent)] text-[var(--accent)]" />
              <span>by</span>
              <a
                href="https://joekracz.com"
                target="_blank"
                rel="noopener noreferrer"
                className="transition-colors hover:text-[var(--accent)]"
              >
                J.K. Labs
              </a>
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
