"use client";

import { useEffect, useRef } from "react";

export default function BlueprintCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    function drawBlueprint() {
      if (!canvas || !ctx) return;
      const dpr = window.devicePixelRatio || 1;
      const w = (canvas.width = canvas.clientWidth * dpr);
      const h = (canvas.height = canvas.clientHeight * dpr);

      ctx.clearRect(0, 0, w, h);
      ctx.lineCap = "square";
      ctx.lineJoin = "miter";

      ctx.save();
      ctx.translate(w * 0.5, h * 0.8);
      ctx.scale(1, 0.5);
      ctx.rotate(-Math.PI / 4);

      ctx.strokeStyle = "#0A0A0C";
      ctx.fillStyle = "#0A0A0C";

      const grid = 30;

      for (let i = 0; i < 100; i++) {
        let rx = (Math.floor(Math.random() * 40) - 20) * grid;
        let ry = (Math.floor(Math.random() * 40) - 30) * grid;
        const segments = 2 + Math.floor(Math.random() * 5);

        ctx.beginPath();
        ctx.moveTo(rx, ry);
        ctx.lineWidth = Math.random() > 0.8 ? 2 : 1;

        for (let j = 0; j < segments; j++) {
          const step = (1 + Math.floor(Math.random() * 3)) * grid;
          if (Math.random() > 0.5) rx += Math.random() > 0.5 ? step : -step;
          else ry += Math.random() > 0.5 ? step : -step;
          ctx.lineTo(rx, ry);
        }
        ctx.stroke();

        if (Math.random() > 0.3) {
          ctx.beginPath();
          ctx.arc(rx, ry, 3.5, 0, Math.PI * 2);
          Math.random() > 0.5 ? ctx.fill() : ctx.stroke();
        }

        if (Math.random() > 0.85) {
          ctx.save();
          ctx.translate(rx, ry);
          ctx.rotate(Math.PI / 4);
          ctx.font = 'bold 10px "JetBrains Mono"';
          ctx.fillText("Q-" + Math.floor(Math.random() * 999), 6, -6);
          ctx.restore();
        }
      }

      ctx.lineWidth = 2;
      for (let i = 0; i < 6; i++) {
        const rx = (Math.floor(Math.random() * 20) - 10) * grid;
        const ry = (Math.floor(Math.random() * 20) - 20) * grid;
        ctx.strokeRect(rx, ry, grid * 3, grid * 3);
      }

      ctx.restore();
    }

    const handleResize = () => drawBlueprint();
    window.addEventListener("resize", handleResize);
    setTimeout(drawBlueprint, 50);

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return <canvas ref={canvasRef} className="blueprint-canvas" />;
}
