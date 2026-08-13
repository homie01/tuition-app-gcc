import React, { useEffect, useRef } from "react";
import Lenis from "lenis";
import gsap from "gsap";
import { useLocation } from "react-router-dom";

export function SmoothScroll({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const mainRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Initialize Lenis smooth scroll
    const lenis = new Lenis({
      duration: 1.1,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      touchMultiplier: 1.5,
    });

    function update(time: number) {
      lenis.raf(time * 1000);
    }

    gsap.ticker.add(update);
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(update);
      lenis.destroy();
    };
  }, []);

  // Trigger GSAP entrance animation on route change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });

    if (mainRef.current) {
      const elements = mainRef.current.querySelectorAll(
        ".card, .page-header, table, form, .gsap-animate"
      );

      if (elements.length > 0) {
        gsap.fromTo(
          elements,
          {
            opacity: 0,
            y: 16,
          },
          {
            opacity: 1,
            y: 0,
            duration: 0.45,
            stagger: 0.04,
            ease: "power2.out",
            clearProps: "all",
          }
        );
      } else {
        gsap.fromTo(
          mainRef.current,
          { opacity: 0, y: 12 },
          { opacity: 1, y: 0, duration: 0.4, ease: "power2.out", clearProps: "all" }
        );
      }
    }
  }, [location.pathname, location.search]);

  return <div ref={mainRef}>{children}</div>;
}
