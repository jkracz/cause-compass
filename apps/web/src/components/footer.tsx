import Link from "next/link";
import { Heart } from "lucide-react";

export function Footer() {
  return (
    <footer className="relative z-20 mt-auto border-t border-[var(--rule)] bg-[color:rgba(240,230,245,0.6)] backdrop-blur-md">
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm">
            <Link
              href="/faq"
              className="text-[var(--ink-soft)] transition-colors hover:text-[var(--accent)]"
            >
              FAQ
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
          </div>

          <div className="flex items-center gap-2 text-sm text-[var(--ink-soft)]">
            <span>Made with</span>
            <Heart className="h-4 w-4 fill-[var(--accent)] text-[var(--accent)]" />
            <span>by CauseCompass</span>
          </div>
        </div>

        <div className="mt-4 border-t border-[var(--rule)] pt-4 text-center text-xs text-[var(--ink-mute)]">
          © {new Date().getFullYear()} CauseCompass. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
