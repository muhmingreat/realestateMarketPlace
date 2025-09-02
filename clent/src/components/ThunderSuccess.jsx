// components/ThunderSuccess.jsx
import { motion } from "framer-motion";
import React, { useState, useEffect } from "react";

export default function ThunderSuccess({ trigger }) {
  const [active, setActive] = useState(false);

  useEffect(() => {
    if (trigger) {
      setActive(true);
      setTimeout(() => setActive(false), 5000); // show for 5s
    }
  }, [trigger]);

  // Single rain drop particle
  const RainDrop = ({ delay, left }) => (
    <motion.div
      initial={{ y: -20, opacity: 1 }}
      animate={{ y: "100vh", opacity: 0 }}
      transition={{
        delay,
        duration: 2,
        ease: "easeIn"
      }}
      className="absolute h-2 w-0.5 bg-cyan-400 rounded-full"
      style={{
        left: `${left}%`
      }}
    />
  );

  if (!active) return null; // don't render unless triggered

  return (
    <motion.div
      className="fixed inset-0 pointer-events-none z-50 overflow-hidden bg-transparent"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Generate multiple raindrops */}
      {[...Array(500)].map((_, i) => (
        <RainDrop
          key={i}
          delay={Math.random() * 10} // spread over 5s
          left={Math.random() * 1000} // random x position
        />
      ))}
    </motion.div>
  );
}




