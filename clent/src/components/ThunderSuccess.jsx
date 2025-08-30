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




// // components/ThunderSuccess.jsx
// import { motion } from "framer-motion";
// import React,{ useState, useEffect } from "react";

// export default function ThunderSuccess({ trigger }) {
//   const [active, setActive] = useState(false);

//   useEffect(() => {
//     if (trigger) {
//       setActive(true);
//       setTimeout(() => setActive(false), 1000); 
//     }
//   }, [trigger]);

//   const Particle = ({ delay }) => (
//     <motion.div
//       initial={{ y: 0, opacity: 1 }}
//       animate={{ y: 20, opacity: 0 }}
//       transition={{
//         delay,
//         duration: 0.8,
//         ease: "easeOut"
//       }}
//       className="absolute h-1 w-1 bg-cyan-400 rounded-full"
//       style={{
//         left: `${Math.random() * 100}%`
//       }}
//     />
//   );

//   if (!active) return null; // don't render unless triggered

//   return (
//     <motion.div
//       className="fixed inset-0 flex items-center justify-center pointer-events-none z-50"
//       initial={{ opacity: 0 }}
//       animate={{ opacity: 1 }}
//       exit={{ opacity: 0 }}
//     >
//       <motion.div
//         className="relative flex items-center justify-center h-24 w-24 rounded-full bg-gradient-to-br from-blue-500 via-cyan-400 to-indigo-700"
//         animate={{
//           boxShadow: [
//             "0 0 25px rgba(0,255,255,1)",
//             "0 0 40px rgba(0,255,255,0.8)",
//             "0 0 25px rgba(0,255,255,1)"
//           ]
//         }}
//         transition={{
//           duration: 0.3,
//           repeat: 2,
//           ease: "easeInOut"
//         }}
//       >
//         {/* House Logo */}
//         <svg
//           xmlns="http://www.w3.org/2000/svg"
//           viewBox="0 0 64 64"
//           className="h-14 w-14 text-white z-10"
//           fill="currentColor"
//         >
//           <path d="M2 30 L32 6 L62 30 V58 H38 V40 H26 V58 H2 Z" />
//           <rect x="10" y="34" width="8" height="8" fill="white" />
//           <rect x="46" y="34" width="8" height="8" fill="white" />
//         </svg>

//         {/* Particles */}
//         {[...Array(8)].map((_, i) => (
//           <Particle key={i} delay={i * 0.05} />
//         ))}
//       </motion.div>
//     </motion.div>
//   );
// }
