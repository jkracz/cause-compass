import { notFound } from "next/navigation";
import { Suspense } from "react";
import { BROWSE_CATEGORIES, getBrowseCategory } from "@/lib/browse-categories";
import { BrowseCategoryContent } from "./browse-category-content";

export function generateStaticParams() {
  return BROWSE_CATEGORIES.map((category) => ({ slug: category.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const category = getBrowseCategory(slug);
  if (!category) return { title: "Browse — Cause Compass" };
  return {
    title: `${category.label} — Browse · Cause Compass`,
    description: category.description,
  };
}

export default async function BrowseCategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const category = getBrowseCategory(slug);
  if (!category) {
    notFound();
  }

  return (
    <main className="min-h-screen">
      <Suspense fallback={null}>
        <BrowseCategoryContent category={category} />
      </Suspense>
    </main>
  );
}
