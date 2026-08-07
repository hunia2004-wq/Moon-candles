"use client";

import { useEffect, useRef, useState } from "react";

export default function RevealOnScroll({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
        }
      },
      { threshold: 0.2 }
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      style={{
        width: "100%",
        transition: "all 1s ease-out",
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(48px)",
      }}
    >
      {children}
    </div>
  );
}