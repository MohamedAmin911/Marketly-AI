"use client";

import { motion, useReducedMotion, type MotionProps } from "framer-motion";
import type { ReactNode } from "react";

type MotionWrapperProps = MotionProps & {
  children: ReactNode;
  className?: string;
};

export function FadeIn({ children, className, ...props }: MotionWrapperProps) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      animate={{ opacity: 1, y: 0 }}
      className={className}
      initial={reduceMotion ? false : { opacity: 0, y: 12 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      {...props}
    >
      {children}
    </motion.div>
  );
}

export function StaggeredList({ children, className }: { children: ReactNode; className?: string }) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      animate="show"
      className={className}
      initial={reduceMotion ? false : "hidden"}
      variants={{
        hidden: { opacity: 1 },
        show: {
          opacity: 1,
          transition: { staggerChildren: 0.04 },
        },
      }}
    >
      {children}
    </motion.div>
  );
}

export function StaggeredItem({ children, className }: { children: ReactNode; className?: string }) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      className={className}
      variants={reduceMotion ? undefined : { hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }}
    >
      {children}
    </motion.div>
  );
}

