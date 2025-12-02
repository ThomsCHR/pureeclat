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
      className="pointer-events-none absolute inset-y-0 right-[0] w-[100%] hidden md:block overflow-hidden"
    >
      <img
        src="/images/acc1-1920.jpg"
        srcSet="
          /images/acc1.jpg 1920w,
          /images/acc1-2560.jpg 2560w,
          /images/acc1-3840.jpg 3840w
        "
        sizes="100vw"
        alt="Visuel esthétique"
        className="h-full w-full object-cover object-center"
      />
    </motion.div>
  );
}