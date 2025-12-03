"use client";

import { motion } from "framer-motion";

export default function AnimatedHeroImage() {
  return (
    <motion.div
      initial={{ scale: 1 }}
      whileInView={{ scale: 1.1 }}
      viewport={{ amount: 0.3, once: false }}
      transition={{
        duration: 5,
        ease: "easeInOut",
        repeatType: "reverse",
      }}
      className="h-full w-full overflow-hidden"
    >
      <img
        src="/images/home.png"
        srcSet="
          /images/home.png,
          /images/home.png,
          /images/home.png
        "
        sizes="100vw"
        alt="Visuel esthétique"
        className="h-full w-full object-cover"
      />
    </motion.div>
  );
}
