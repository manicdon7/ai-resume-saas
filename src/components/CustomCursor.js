'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';

const CURSOR_VARIANTS = {
  default: {
    size: 20,
    scale: 1,
    opacity: 0.8,
    mixBlendMode: 'difference',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    border: '1px solid rgba(255, 255, 255, 0.3)',
  },
  pointer: {
    size: 32,
    scale: 1.2,
    opacity: 1,
    mixBlendMode: 'normal',
    backgroundColor: 'rgba(59, 130, 246, 0.8)',
    border: '2px solid rgba(59, 130, 246, 1)',
  },
  text: {
    size: 2,
    scale: 1,
    opacity: 1,
    mixBlendMode: 'difference',
    backgroundColor: 'rgba(255, 255, 255, 1)',
    border: 'none',
  },
  loading: {
    size: 24,
    scale: 1,
    opacity: 0.9,
    mixBlendMode: 'normal',
    backgroundColor: 'rgba(168, 85, 247, 0.8)',
    border: '2px solid rgba(168, 85, 247, 1)',
  },
  disabled: {
    size: 20,
    scale: 0.8,
    opacity: 0.4,
    mixBlendMode: 'normal',
    backgroundColor: 'rgba(156, 163, 175, 0.6)',
    border: '1px solid rgba(156, 163, 175, 0.8)',
  },
  drag: {
    size: 28,
    scale: 1.1,
    opacity: 0.9,
    mixBlendMode: 'normal',
    backgroundColor: 'rgba(34, 197, 94, 0.8)',
    border: '2px solid rgba(34, 197, 94, 1)',
  },
};

const CustomCursor = ({ 
  variant = 'default', 
  isVisible = true, 
  magnetism = false,
  magnetismStrength = 0.3,
  smoothness = 0.15 
}) => {
  const [mounted, setMounted] = useState(false);
  const [currentVariant, setCurrentVariant] = useState(variant);
  const [targetElement, setTargetElement] = useState(null);
  
  const cursorRef = useRef(null);
  const mousePosition = useRef({ x: 0, y: 0 });
  
  // Motion values for smooth cursor movement
  const cursorX = useMotionValue(0);
  const cursorY = useMotionValue(0);
  
  // Spring configuration for smooth movement
  const springConfig = { damping: 25, stiffness: 700, mass: 0.5 };
  const cursorXSpring = useSpring(cursorX, springConfig);
  const cursorYSpring = useSpring(cursorY, springConfig);

  // Update cursor position with smooth tracking
  const updateCursorPosition = useCallback((e) => {
    mousePosition.current = { x: e.clientX, y: e.clientY };
    
    let targetX = e.clientX;
    let targetY = e.clientY;
    
    // Apply magnetism effect if enabled and target element exists
    if (magnetism && targetElement) {
      const rect = targetElement.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      
      const distance = Math.sqrt(
        Math.pow(e.clientX - centerX, 2) + Math.pow(e.clientY - centerY, 2)
      );
      
      // Apply magnetism within a certain radius
      if (distance < 100) {
        const magnetForce = (100 - distance) / 100 * magnetismStrength;
        targetX += (centerX - e.clientX) * magnetForce;
        targetY += (centerY - e.clientY) * magnetForce;
      }
    }
    
    cursorX.set(targetX);
    cursorY.set(targetY);
  }, [magnetism, targetElement, magnetismStrength, cursorX, cursorY]);

  // Handle cursor variant changes based on element interactions
  const handleMouseEnter = useCallback((e) => {
    const element = e.target;
    const cursorVariant = element.getAttribute('data-cursor') || 'default';
    
    setCurrentVariant(cursorVariant);
    
    if (magnetism) {
      setTargetElement(element);
    }
  }, [magnetism]);

  const handleMouseLeave = useCallback(() => {
    setCurrentVariant('default');
    setTargetElement(null);
  }, []);

  // Set up event listeners
  useEffect(() => {
    setMounted(true);
    
    const handleMouseMove = (e) => updateCursorPosition(e);
    const handleMouseEnterGlobal = (e) => handleMouseEnter(e);
    const handleMouseLeaveGlobal = (e) => handleMouseLeave(e);
    
    // Add global mouse move listener
    document.addEventListener('mousemove', handleMouseMove);
    
    // Add listeners for interactive elements
    const interactiveElements = document.querySelectorAll(
      'button, a, input, textarea, select, [data-cursor], [role="button"]'
    );
    
    interactiveElements.forEach(element => {
      element.addEventListener('mouseenter', handleMouseEnterGlobal);
      element.addEventListener('mouseleave', handleMouseLeaveGlobal);
    });
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      interactiveElements.forEach(element => {
        element.removeEventListener('mouseenter', handleMouseEnterGlobal);
        element.removeEventListener('mouseleave', handleMouseLeaveGlobal);
      });
    };
  }, [updateCursorPosition, handleMouseEnter, handleMouseLeave]);

  // Update variant when prop changes
  useEffect(() => {
    setCurrentVariant(variant);
  }, [variant]);

  // Don't render on server or if not visible
  if (!mounted || !isVisible) {
    return null;
  }

  const variantConfig = CURSOR_VARIANTS[currentVariant] || CURSOR_VARIANTS.default;

  return (
    <motion.div
      ref={cursorRef}
      className="custom-cursor"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: variantConfig.size,
        height: variantConfig.size,
        borderRadius: '50%',
        backgroundColor: variantConfig.backgroundColor,
        border: variantConfig.border,
        mixBlendMode: variantConfig.mixBlendMode,
        pointerEvents: 'none',
        zIndex: 9999,
        x: cursorXSpring,
        y: cursorYSpring,
        translateX: '-50%',
        translateY: '-50%',
      }}
      animate={{
        scale: variantConfig.scale,
        opacity: variantConfig.opacity,
      }}
      transition={{
        type: 'spring',
        damping: 20,
        stiffness: 300,
        mass: 0.8,
      }}
    />
  );
};

export default CustomCursor;