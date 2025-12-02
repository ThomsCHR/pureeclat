import { motion } from "framer-motion";

type AnimatedCardProps = {
  title: string;
  text: string;
  delay?: number;
};

export default function AnimatedCard({ title, text, delay = 0 }: AnimatedCardProps) {
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ amount: 0.3, once: false }} // 👈 rejoue à chaque fois
      transition={{ duration: 0.6, delay }}
      whileHover={{ scale: 1.04 }}
      variants={{
        hidden: { opacity: 0, y: 30 },
        visible: { opacity: 1, y: 0 },
      }}
      className="rounded-2xl bg-slate-50 p-5 shadow-sm shadow-slate-200"
    >
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="mt-2 text-sm text-slate-600">{text}</p>
    </motion.div>
  );
}
