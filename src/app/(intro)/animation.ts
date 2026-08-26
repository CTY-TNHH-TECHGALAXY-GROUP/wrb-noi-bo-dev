"use client";

import { useEffect, useRef, useState } from "react";

// --- HOOK VẼ SAO ---
interface Star { x: number; y: number; size: number; opacity: number; speed: number; }
export const useStarfield = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let stars: Star[] = [];
    let animationId: number;
    const initStars = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      stars = [];
      for (let i = 0; i < 60; i++) {
        stars.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          size: Math.random() * 2,
          opacity: Math.random(),
          speed: Math.random() * 0.2 + 0.05,
        });
      }
    };
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      stars.forEach((star) => {
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${star.opacity})`;
        ctx.fill();
        if (Math.random() > 0.95) star.opacity = Math.random();
        star.y -= star.speed;
        if (star.y < 0) { star.y = canvas.height; star.x = Math.random() * canvas.width; }
      });
      animationId = requestAnimationFrame(draw);
    };
    initStars(); draw();
    window.addEventListener("resize", initStars);
    return () => { cancelAnimationFrame(animationId); window.removeEventListener("resize", initStars); };
  }, []);
  return canvasRef;
};

export const useOrbitRotation = () => {
  const [rotation, setRotation] = useState(0);
  useEffect(() => {
    let frameId: number;
    const animate = () => { setRotation(prev => prev + 0.002); frameId = requestAnimationFrame(animate); };
    animate();
    return () => cancelAnimationFrame(frameId);
  }, []);
  return rotation;
};

// --- CLASS TAILWIND ---
export const animClasses = {
  wrapper: "relative w-full h-[100dvh] bg-[#050B14] overflow-hidden flex flex-col items-center justify-center font-sans",
  bgImage: "absolute inset-0 z-0 pointer-events-none w-full h-full object-cover object-center opacity-60 mix-blend-screen",
  logoTopContainer: "absolute top-[calc(40px+env(safe-area-inset-top))] md:top-[50px] w-full text-center z-20 px-4 animate-float",
  logoTop: "mx-auto object-contain drop-shadow-[0_0_15px_rgba(234,179,8,0.5)] w-[140px] md:w-[200px]",
  orbitContainer: "relative z-10 w-full h-full flex items-center justify-center perspective-1000",
  centerLogoWrapper: (show: boolean) =>
    `absolute z-20 w-[100px] h-[100px] rounded-full flex items-center justify-center shadow-[0_0_40px_rgba(234,179,8,0.4)] transition-all duration-700 overflow-hidden ${show ? 'scale-0 opacity-0' : 'scale-100'}`,

  // 🔥 LỜI CHÀO: Áp dụng gold-text-shiny
  greeting: (show: boolean) =>
    `absolute z-[50] font bold tracking-widest whitespace-nowrap transition-all duration-1000 text-center px-4 gold-text-shiny ${show ? "opacity-100 scale-100 text-[26px] md:text-[40px]" : "opacity-0 scale-50 pointer-events-none"}`,

  flagItem: "absolute top-1/2 left-1/2 z-30 cursor-pointer w-[60px] h-[60px] -ml-[30px] -mt-[30px] shrink-0",
  flagInner: "w-full h-full rounded-full overflow-hidden hover:shadow-[0_0_20px_rgba(250,204,21,0.9)] hover:scale-125 transition-all duration-300 group shadow-[0_0_10px_rgba(234,179,8,0.3)]",
  marqueeWrapper: "absolute bottom-[calc(150px+env(safe-area-inset-bottom))] w-full z-40 h-[100px] flex items-center overflow-hidden pointer-events-none select-none [mask-image:linear-gradient(to_right,transparent,white_10%,white_100%,transparent)]",
  marqueeTrack: "flex whitespace-nowrap w-max",
  marqueeText: "font bold -luxury text-[17px] md:text-[17px] tracking-[0.1em] uppercase mx-10 flex items-center gap-4 gold-text-soft",

  // 🔥 FOOTER: Áp dụng gold-text-soft
  footer: "absolute bottom-[calc(50px+env(safe-area-inset-bottom))] w-full text-center z-[50] px-4 font-sans text-[14px] md:text-[14px] tracking-[0.1em] uppercase gold-text-soft"
};