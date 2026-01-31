"use client";

import { Search, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  isLoading?: boolean;
  placeholder?: string;
  className?: string;
}

export function SearchInput({
  value,
  onChange,
  isLoading = false,
  placeholder = "Search for nonprofits...",
  className,
}: SearchInputProps) {
  return (
    <div className={cn("relative w-full max-w-xl", className)}>
      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
        {isLoading ? (
          <Loader2 className="text-muted-foreground h-5 w-5 animate-spin" />
        ) : (
          <Search className="text-muted-foreground h-5 w-5" />
        )}
      </div>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-12 w-full rounded-full border border-white/20 bg-white/10 pl-12 pr-12 text-base backdrop-blur-md transition-all placeholder:text-white/50 focus:border-white/40 focus:bg-white/15 focus:outline-none focus:ring-2 focus:ring-white/20"
        aria-label="Search nonprofits"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          className="absolute inset-y-0 right-0 flex items-center pr-4 transition-opacity hover:opacity-70"
          aria-label="Clear search"
        >
          <X className="text-muted-foreground h-5 w-5" />
        </button>
      )}
    </div>
  );
}
