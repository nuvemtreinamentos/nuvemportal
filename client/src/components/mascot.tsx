import { motion } from "framer-motion";

export function Mascot() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-48 h-48 mx-auto"
    >
      <motion.svg
        viewBox="0 0 200 200"
        animate={{
          y: [0, -10, 0],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        {/* Body */}
        <motion.circle
          cx="100"
          cy="110"
          r="50"
          fill="#7C3AED"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        />
        
        {/* Eyes */}
        <g>
          <motion.circle
            cx="80"
            cy="100"
            r="15"
            fill="white"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.4, duration: 0.3 }}
          />
          <motion.circle
            cx="120"
            cy="100"
            r="15"
            fill="white"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.4, duration: 0.3 }}
          />
          <motion.circle
            cx="80"
            cy="100"
            r="7"
            fill="#1F2937"
            animate={{
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
          <motion.circle
            cx="120"
            cy="100"
            r="7"
            fill="#1F2937"
            animate={{
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        </g>

        {/* Beak */}
        <motion.path
          d="M95 115 L105 115 L100 125 Z"
          fill="#FCD34D"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.6, duration: 0.3 }}
        />

        {/* Wings */}
        <motion.path
          d="M60 110 Q100 140 140 110"
          stroke="#5B21B6"
          strokeWidth="8"
          fill="none"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ delay: 0.8, duration: 0.5 }}
        />

        {/* Right Wing (Waving) */}
        <motion.path
          d="M130 110 Q150 90 160 70"
          stroke="#5B21B6"
          strokeWidth="8"
          fill="none"
          animate={{
            rotate: [-10, 10, -10],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          style={{ transformOrigin: "130px 110px" }}
        />
      </motion.svg>
    </motion.div>
  );
}
