"use client";

import { motion, type HTMLMotionProps } from "framer-motion";

/* Standard entrance for feed items and page sections. Honors reduced motion
   via the app-level MotionConfig. Cap stagger delays at ~0.3s. */
export function FadeUp({ delay = 0, ...props }: HTMLMotionProps<"div"> & { delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1], delay }}
      {...props}
    />
  );
}
