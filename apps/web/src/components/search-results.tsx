"use client";

import { motion } from "motion/react";
import { SearchX } from "lucide-react";
import { OrganizationCard } from "@/components/organization-card";
import { Doc } from "@cause/backend/convex/_generated/dataModel";

type Organization = Doc<"organizations">;

interface SearchResultsProps {
  organizations: Organization[];
  onCardClick: (org: Organization) => void;
  isLoading?: boolean;
  query: string;
}

export function SearchResults({
  organizations,
  onCardClick,
  isLoading,
  query,
}: SearchResultsProps) {
  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="grid grid-cols-1 gap-4 px-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
      >
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="h-[220px] animate-pulse rounded-xl border border-white/20 bg-white/10"
          />
        ))}
      </motion.div>
    );
  }

  if (organizations.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center py-16 text-center"
      >
        <SearchX className="text-muted-foreground mb-4 h-16 w-16" />
        <h3 className="mb-2 text-xl font-semibold">No results found</h3>
        <p className="text-muted-foreground max-w-md">
          We couldn&apos;t find any nonprofits matching &quot;{query}&quot;. Try
          a different search term.
        </p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="grid grid-cols-1 gap-4 px-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
    >
      {organizations.map((org) => (
        <motion.div
          key={org._id}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.2 }}
        >
          <OrganizationCard organization={org} onClick={() => onCardClick(org)} />
        </motion.div>
      ))}
    </motion.div>
  );
}
