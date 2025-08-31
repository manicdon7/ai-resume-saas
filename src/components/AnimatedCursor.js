'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';

export default function AnimatedCursor() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  const updateMousePosition = useCallback((e) => {
    setMousePosition({ x: e.clientX, y: e.clientY });
    setIsVisible(true);
  }, []);

  const handleMouseOver = useCallback((e) => {
    const target = e.target;
    const isInteractive = target.matches('button, a, [role="button"], input, textarea, select, [data-cursor="pointer"]') ||
      target.closest('button, a, [role="button"], input, textarea, select, [data-cursor="pointer"]');
    setIsHovering(isInteractive);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsVisible(false);
  }, []);

  useEffect(() => {
    window.addEventListener('mousemove', updateMousePosition);
    document.addEventListener('mouseover', handleMouseOver);
    document.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      window.removeEventListener('mousemove', updateMousePosition);
      document.removeEventListener('mouseover', handleMouseOver);
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [updateMousePosition, handleMouseOver, handleMouseLeave]);

  if (!isVisible) return null;

  return (
    <>
      {/* Main cursor dot */}
      <motion.div
        className="fixed top-0 left-0 w-3 h-3 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full pointer-events-none z-[9999] mix-blend-screen"
        animate={{
          x: mousePosition.x - 6,
          y: mousePosition.y - 6,
          scale: isHovering ? 1.8 : 1,
        }}
        transition={{
          type: "spring",
          stiffness: 400,
          damping: 25,
          mass: 0.3,
        }}
      />

      {/* Trailing circle */}
      <motion.div
        className="fixed top-0 left-0 w-8 h-8 border border-purple-400/40 rounded-full pointer-events-none z-[9998]"
        animate={{
          x: mousePosition.x - 16,
          y: mousePosition.y - 16,
          scale: isHovering ? 1.5 : 1,
          opacity: isHovering ? 0.8 : 0.4,
        }}
        transition={{
          type: "spring",
          stiffness: 200,
          damping: 20,
          mass: 0.2,
        }}
      />

      {/* Glow effect for interactive elements */}
      {isHovering && (
        <motion.div
          className="fixed top-0 left-0 w-12 h-12 bg-gradient-to-r from-purple-500/20 to-blue-500/20 rounded-full pointer-events-none z-[9997] blur-md"
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{
            x: mousePosition.x - 24,
            y: mousePosition.y - 24,
            opacity: 1,
            scale: 1,
          }}
          exit={{ opacity: 0, scale: 0.5 }}
          transition={{
            type: "spring",
            stiffness: 100,
            damping: 15,
          }}
        />
      )}
    </>
  );
}