import Link from "next/link";
import { Heart } from "lucide-react";

export function Footer() {
  return (
    <footer className="relative z-20 mt-auto border-t border-white/10 bg-black/20 backdrop-blur-md">
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
          {/* Links */}
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm">
            <Link
              href="/faq"
              className="text-white/70 transition-colors hover:text-white"
            >
              FAQ
            </Link>
            <Link
              href="/terms"
              className="text-white/70 transition-colors hover:text-white"
            >
              Terms & Conditions
            </Link>
            <Link
              href="/privacy"
              className="text-white/70 transition-colors hover:text-white"
            >
              Privacy Policy
            </Link>
          </div>

          {/* Made with love */}
          <div className="flex items-center gap-2 text-sm text-white/70">
            <span>Made with</span>
            <Heart className="h-4 w-4 fill-pink-500 text-pink-500" />
            <span>by CauseCompass</span>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-4 border-t border-white/10 pt-4 text-center text-xs text-white/50">
          © {new Date().getFullYear()} CauseCompass. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
