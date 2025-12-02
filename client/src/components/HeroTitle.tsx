import { useEffect, useRef } from "react";

export default function HeroTitle() {
  const ref = useRef<HTMLHeadingElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!el) return;

        if (entry.isIntersecting) {
          // Reset animation (permet de relancer proprement)
          el.classList.remove("animate-fadeIn");
          void el.offsetWidth; // force le reflow (hack nécessaire)
          el.classList.add("animate-fadeIn");
        } else {
          // Quand l’élément sort du viewport → on enlève la classe
          el.classList.remove("animate-fadeIn");
        }
      },
      { threshold: 0.4 } // déclenche quand ~40% du titre est visible
    );

    observer.observe(el);

    return () => observer.disconnect();
  }, []);

  return (
    <h1
      ref={ref}
      className="opacity-0 text-4xl font-semibold leading-tight text-white md:text-5xl lg:text-6xl"
    >
      Un nouvel éclat
      <br /> qui sublime
      <br /> votre naturel
    </h1>
  );
}
