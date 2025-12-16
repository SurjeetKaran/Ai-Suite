

import React, { useRef, useEffect } from "react";

export default function CanvasParticles() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const mouse = { x: -9999, y: -9999 };

    const drawStar = (ctx, x, y, r, points = 5) => {
      const step = Math.PI / points;
      ctx.beginPath();
      for (let i = 0; i < 2 * points; i++) {
        const angle = i * step;
        const radius = i % 2 === 0 ? r : r / 2;
        ctx.lineTo(x + radius * Math.sin(angle), y - radius * Math.cos(angle));
      }
      ctx.closePath();
      ctx.fill();
    };

    // Increased speed
    const speedMultiplier = 2; // Change this to make it faster or slower

    const particles = Array.from({ length: 100 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.5 * speedMultiplier,
      vy: (Math.random() - 0.5) * 0.5 * speedMultiplier,
      radius: Math.random() * 2 + 1,
    }));

    const animate = () => {
      const gradient = ctx.createLinearGradient(0, 0, width, height);
      gradient.addColorStop(0, "#0b0f2b");
      gradient.addColorStop(1, "#05080f");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      for (let p of particles) {
        p.x += p.vx;
        p.y += p.vy;

        if (p.x <= 0 || p.x >= width) p.vx *= -1;
        if (p.y <= 0 || p.y >= height) p.vy *= -1;

        ctx.fillStyle = "rgba(59,130,246,0.8)";
        ctx.shadowBlur = 8;
        ctx.shadowColor = "#3b82f6";
        drawStar(ctx, p.x, p.y, p.radius, 5);

        const dx = mouse.x - p.x;
        const dy = mouse.y - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 150) {
          const force = dist < 50 ? -0.5 : 0.05;
          p.vx += (dx / dist) * force;
          p.vy += (dy / dist) * force;

          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(mouse.x, mouse.y);
          ctx.strokeStyle = `rgba(59,130,246,${1 - dist / 150})`;
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      }

      requestAnimationFrame(animate);
    };

    animate();

    const handleMouseMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
    };

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full pointer-events-none z-0"
    />
  );
}
