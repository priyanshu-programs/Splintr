"use client";

import { useEffect, useRef, useCallback } from "react";

interface HudData {
  text: string;
  /** Offset direction for the label relative to the projected 3D point (in px) */
  offsetX: number;
  offsetY: number;
  /** 3D seed position (matches WebGL flow field) */
  px: number;
  py: number;
  pz: number;
}

const hudData: HudData[] = [
  { text: "VOICE-MATCH: 94.2%", offsetX: -240, offsetY: -120, px: -0.3, py: 0.3, pz: 0.3 },
  { text: "SYNDICATION ACTIVE", offsetX: 210, offsetY: -110, px: 0.3, py: 0.3, pz: -0.3 },
  { text: "8 PLATFORMS LINKED", offsetX: 220, offsetY: 110, px: 0.3, py: -0.3, pz: 0.3 },
  { text: "QUEUE: 12 POSTS", offsetX: -250, offsetY: 120, px: -0.3, py: -0.3, pz: -0.3 },
];

interface WrapRef {
  targetWrap: HTMLDivElement;
  line: HTMLDivElement;
  labelEl: HTMLDivElement;
  offsetX: number;
  offsetY: number;
  px: number;
  py: number;
  pz: number;
}

export default function HudOverlay() {
  const containerRef = useRef<HTMLDivElement>(null);
  const wrapsRef = useRef<WrapRef[]>([]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.innerHTML = "";
    const wraps: WrapRef[] = [];

    hudData.forEach((d) => {
      const wrap = document.createElement("div");
      wrap.className = "hud-wrapper";
      wrap.innerHTML = `
        <div class="hud-target-wrap">
          <div class="hud-target"></div>
        </div>
        <div class="hud-line"></div>
        <div class="hud-item">
          <div class="hud-label brackets brackets-light frosted-dark font-mono">${d.text}</div>
        </div>
      `;
      container.appendChild(wrap);
      wraps.push({
        targetWrap: wrap.querySelector(".hud-target-wrap") as HTMLDivElement,
        line: wrap.querySelector(".hud-line") as HTMLDivElement,
        labelEl: wrap.querySelector(".hud-item") as HTMLDivElement,
        offsetX: d.offsetX,
        offsetY: d.offsetY,
        px: d.px,
        py: d.py,
        pz: d.pz,
      });
    });

    wrapsRef.current = wraps;
  }, []);

  const updateHUD = useCallback((time: number, mouseX: number, mouseY: number) => {
    const container = containerRef.current;
    const wraps = wrapsRef.current;
    if (!container || !container.clientWidth || wraps.length === 0) return;

    const w = container.clientWidth;
    const h = container.clientHeight;
    const aspect = w / h;

    const rotY = time * 0.08 + mouseX * 1.5;
    const rotX = mouseY * 1.5;

    const cy = Math.cos(rotY), sy = Math.sin(rotY);
    const cx = Math.cos(rotX), sx = Math.sin(rotX);

    wraps.forEach((d, i) => {
      let x = d.px, y = d.py, z = d.pz;

      x += Math.sin(time * 0.7 + i * 2.1) * 0.15;
      y += Math.cos(time * 0.6 + i * 1.5) * 0.15;
      z += Math.sin(time * 0.5 + i * 3.3) * 0.15;

      const pulse = 1.0 + Math.sin(time * 0.5 + d.px * 2.0) * 0.05;
      x *= pulse; y *= pulse; z *= pulse;

      let nx = x * cy - z * sy;
      let nz = x * sy + z * cy;
      x = nx; z = nz;

      const ny = y * cx - z * sx;
      nz = y * sx + z * cx;
      y = ny; z = nz;

      const zDist = z + 5.5;
      const scale = 2.4 / zDist;

      const projX = x * scale;
      const projY = y * scale * aspect;

      // Target dot position (projected 3D point)
      const tx = (projX + 1) * 0.5 * w;
      const ty = (1 - projY) * 0.5 * h;

      // Label position = target + offset (clamped within bounds)
      const labelX = Math.max(60, Math.min(w - 60, tx + d.offsetX));
      const labelY = Math.max(30, Math.min(h - 30, ty + d.offsetY));

      // Position the target dot
      d.targetWrap.style.left = tx + "px";
      d.targetWrap.style.top = ty + "px";

      // Position the label near the target with offset
      d.labelEl.style.left = labelX + "px";
      d.labelEl.style.top = labelY + "px";

      // Draw the connecting line from label to target
      const angle = Math.atan2(ty - labelY, tx - labelX) * 180 / Math.PI;
      const dist = Math.sqrt(Math.pow(tx - labelX, 2) + Math.pow(ty - labelY, 2));

      d.line.style.left = labelX + "px";
      d.line.style.top = labelY + "px";
      d.line.style.width = dist + "px";
      d.line.style.transform = `rotate(${angle}deg)`;
    });
  }, []);

  // Expose updateHUD on window for WebGL canvas to call
  useEffect(() => {
    (window as unknown as Record<string, unknown>).updateHUD = updateHUD;
    return () => {
      delete (window as unknown as Record<string, unknown>).updateHUD;
    };
  }, [updateHUD]);

  return <div ref={containerRef} id="hud-container" />;
}
