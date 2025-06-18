"use client";

import { useEffect, useRef } from "react";

export function MosaicBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrame: number;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      drawMosaic();
    };

    const drawMosaic = () => {
      if (!ctx) return;

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const colorPalettes = [
        [
          "rgba(255, 20, 147, 0.2)",
          "rgba(138, 43, 226, 0.15)",
          "rgba(75, 0, 130, 0.25)",
        ], // Pink to Purple
        [
          "rgba(0, 191, 255, 0.18)",
          "rgba(30, 144, 255, 0.2)",
          "rgba(65, 105, 225, 0.16)",
        ], // Blue spectrum
        [
          "rgba(0, 255, 127, 0.2)",
          "rgba(46, 204, 113, 0.15)",
          "rgba(26, 188, 156, 0.22)",
        ], // Green/Teal
        [
          "rgba(255, 165, 0, 0.18)",
          "rgba(255, 69, 0, 0.2)",
          "rgba(255, 20, 147, 0.16)",
        ], // Orange to Pink
        [
          "rgba(186, 85, 211, 0.2)",
          "rgba(147, 112, 219, 0.15)",
          "rgba(123, 104, 238, 0.18)",
        ], // Purple spectrum
        [
          "rgba(255, 105, 180, 0.16)",
          "rgba(255, 20, 147, 0.2)",
          "rgba(199, 21, 133, 0.15)",
        ], // Hot pink spectrum
      ];

      // Create triangular compositions
      const numCompositions =
        Math.floor((canvas.width * canvas.height) / 60000) + 12;

      for (let i = 0; i < numCompositions; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        const palette =
          colorPalettes[Math.floor(Math.random() * colorPalettes.length)];

        // Create clustered triangular compositions
        drawTriangularCluster(ctx, x, y, palette);
      }

      // Add individual accent triangles
      const numAccents =
        Math.floor((canvas.width * canvas.height) / 40000) + 20;

      for (let i = 0; i < numAccents; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        const palette =
          colorPalettes[Math.floor(Math.random() * colorPalettes.length)];
        const color = palette[Math.floor(Math.random() * palette.length)];

        drawSingleTriangle(ctx, x, y, color);
      }
    };

    const drawTriangularCluster = (
      ctx: CanvasRenderingContext2D,
      centerX: number,
      centerY: number,
      palette: string[],
    ) => {
      const clusterSize = Math.random() * 100 + 50;
      const numTriangles = Math.floor(Math.random() * 8) + 4;

      for (let i = 0; i < numTriangles; i++) {
        const angle = (i / numTriangles) * Math.PI * 2 + Math.random() * 0.8;
        const distance = Math.random() * clusterSize;
        const x = centerX + Math.cos(angle) * distance;
        const y = centerY + Math.sin(angle) * distance;

        const color = palette[Math.floor(Math.random() * palette.length)];
        const size = Math.random() * 80 + 30;
        const rotation = Math.random() * Math.PI * 2;

        drawTriangle(ctx, x, y, size, color, rotation);
      }
    };

    const drawSingleTriangle = (
      ctx: CanvasRenderingContext2D,
      x: number,
      y: number,
      color: string,
    ) => {
      const size = Math.random() * 60 + 20;
      const rotation = Math.random() * Math.PI * 2;
      drawTriangle(ctx, x, y, size, color, rotation);
    };

    const drawTriangle = (
      ctx: CanvasRenderingContext2D,
      x: number,
      y: number,
      size: number,
      color: string,
      rotation = 0,
    ) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rotation);

      // Create gradient for sophisticated look
      const gradient = ctx.createLinearGradient(
        -size / 2,
        -size / 2,
        size / 2,
        size / 2,
      );
      const baseOpacity =
        Number.parseFloat(color.match(/[\d.]+(?=\))/)?.[0] || "0.2") * 0.6;
      const accentOpacity =
        Number.parseFloat(color.match(/[\d.]+(?=\))/)?.[0] || "0.2") * 1.2;

      const baseColor = color.replace(/[\d.]+\)$/, `${baseOpacity})`);
      const accentColor = color.replace(/[\d.]+\)$/, `${accentOpacity})`);

      gradient.addColorStop(0, baseColor);
      gradient.addColorStop(1, accentColor);

      ctx.fillStyle = gradient;

      // Draw triangle (random type for variety)
      const triangleType = Math.floor(Math.random() * 4);
      ctx.beginPath();

      switch (triangleType) {
        case 0: // Equilateral triangle
          ctx.moveTo(0, -size * 0.6);
          ctx.lineTo(-size * 0.5, size * 0.3);
          ctx.lineTo(size * 0.5, size * 0.3);
          break;
        case 1: // Right triangle
          ctx.moveTo(-size * 0.4, -size * 0.4);
          ctx.lineTo(-size * 0.4, size * 0.4);
          ctx.lineTo(size * 0.4, size * 0.4);
          break;
        case 2: // Isosceles triangle (tall)
          ctx.moveTo(0, -size * 0.7);
          ctx.lineTo(-size * 0.3, size * 0.4);
          ctx.lineTo(size * 0.3, size * 0.4);
          break;
        case 3: // Isosceles triangle (wide)
          ctx.moveTo(0, -size * 0.3);
          ctx.lineTo(-size * 0.6, size * 0.5);
          ctx.lineTo(size * 0.6, size * 0.5);
          break;
      }

      ctx.closePath();
      ctx.fill();

      // Add subtle stroke for definition
      ctx.strokeStyle = color.replace(/[\d.]+\)$/, `${baseOpacity * 0.8})`);
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.restore();
    };

    // Initialize
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    // Simple animation loop that doesn't interfere with the main drawing
    let time = 0;
    const animate = () => {
      time += 0.01;

      // Only occasionally add subtle movement (every 5 seconds)
      if (Math.floor(time) % 5 === 0 && time % 1 < 0.02) {
        // Add a few new triangles for subtle animation
        const palette = [
          [
            "rgba(255, 20, 147, 0.1)",
            "rgba(138, 43, 226, 0.08)",
            "rgba(75, 0, 130, 0.12)",
          ],
          [
            "rgba(0, 191, 255, 0.1)",
            "rgba(30, 144, 255, 0.12)",
            "rgba(65, 105, 225, 0.08)",
          ],
        ][Math.floor(Math.random() * 2)];

        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        const color = palette[Math.floor(Math.random() * palette.length)];

        drawSingleTriangle(ctx, x, y, color);
      }

      animationFrame = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, []);

  return (
    <div className="pointer-events-none fixed inset-0 z-0">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 h-full w-full opacity-70"
        style={{ mixBlendMode: "normal" }}
      />
    </div>
  );
}
