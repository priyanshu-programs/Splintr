"use client";

import { useEffect, useRef } from "react";

export default function CustomCursor() {
  const cursorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const cursor = cursorRef.current;
    if (!cursor) return;

    let cx = -100, cy = -100;
    let tx = -100, ty = -100;

    const handleMouseMove = (e: MouseEvent) => {
      tx = e.clientX;
      ty = e.clientY;
    };

    const hoverSelectors = 'a, button, [role="button"], input, textarea, select, [data-cursor-hover]';

    const handleMouseOver = (e: MouseEvent) => {
      if ((e.target as HTMLElement).closest(hoverSelectors)) cursor.classList.add("hovering");
    };

    const handleMouseOut = (e: MouseEvent) => {
      if ((e.target as HTMLElement).closest(hoverSelectors)) cursor.classList.remove("hovering");
    };

    const handleMouseLeave = () => { cursor.style.opacity = "0"; };
    const handleMouseEnter = () => { cursor.style.opacity = "1"; };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseover", handleMouseOver);
    document.addEventListener("mouseout", handleMouseOut);
    document.addEventListener("mouseleave", handleMouseLeave);
    document.addEventListener("mouseenter", handleMouseEnter);

    let animId: number;
    function animateCursor() {
      cx += (tx - cx) * 0.15;
      cy += (ty - cy) * 0.15;
      cursor!.style.transform = `translate(${cx - 10}px, ${cy - 10}px)`;
      animId = requestAnimationFrame(animateCursor);
    }
    animId = requestAnimationFrame(animateCursor);

    return () => {
      cancelAnimationFrame(animId);
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseover", handleMouseOver);
      document.removeEventListener("mouseout", handleMouseOut);
      document.removeEventListener("mouseleave", handleMouseLeave);
      document.removeEventListener("mouseenter", handleMouseEnter);
    };
  }, []);

  return <div ref={cursorRef} className="custom-cursor" />;
}
