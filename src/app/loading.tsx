"use client";

import { useEffect, useState } from "react";
import { MosaicPiece } from "@/components/mosaic-piece";

export default function Loading() {
  const [animatingPieces, setAnimatingPieces] = useState<number[]>([]);
  const totalPieces = 6;

  useEffect(() => {
    const interval = setInterval(() => {
      setAnimatingPieces((prev) => {
        const nextPiece = prev.length % totalPieces;
        if (prev.includes(nextPiece)) {
          // Reset and start over
          return [0];
        }
        return [...prev, nextPiece];
      });
    }, 300);

    return () => clearInterval(interval);
  }, []);

  return (
    <main className="relative min-h-screen w-full">
      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-4 py-12">
        <div className="mb-8 flex justify-center">
          <div className="relative h-40 w-40">
            {Array.from({ length: totalPieces }).map((_, index) => (
              <MosaicPiece
                key={index}
                index={index}
                total={totalPieces}
                isCompleted={animatingPieces.includes(index)}
              />
            ))}
          </div>
        </div>
        <p className="text-center text-lg">Loading...</p>
      </div>
    </main>
  );
}
