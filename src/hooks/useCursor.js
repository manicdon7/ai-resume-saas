'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

const CURSOR_VARIANTS = {
  default: 'default',
  pointer: 'pointer',
  text: 'text',
  loading: 'loading',
  disabled: 'disabled',
  drag: 'drag',
};

const INTERACTION_TYPES = {
  hover: 'hover',
  click: 'click',
  drag: 'drag',
  focus: 'focus',
};

export const useCursor = (initialVariant = 'default') => {
  const [cursorVariant, setCursorVariant] = useState(initialVariant);
  const [isVisible, setIsVisible] = useState(true);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isInteracting, setIsInteracting] = useState(false);
  const [targetElement, setTargetElement] = useState(null);
  const [mounted, setMounted] = useState(false);
  
  const lastUpdateTime = useRef(0);
  const animationFrame = useRef(null);
  const throttleDelay = 16; // ~60fps

  // Throttled position update for performance
  const updatePosition = useCallback((x, y) => {
    const now = Date.now();
    
    if (now - lastUpdateTime.current >= throttleDelay) {
      setPosition({ x, y });
      lastUpdateTime.current = now;
    } else {
      // Use requestAnimationFrame for smooth updates
      if (animationFrame.current) {
        cancelAnimationFrame(animationFrame.current);
      }
      
      animationFrame.current = requestAnimationFrame(() => {
        setPosition({ x, y });
        lastUpdateTime.current = Date.now();
      });
    }
  }, [throttleDelay]);

  // Set cursor variant
  const setCursor = useCallback((variant) => {
    if (CURSOR_VARIANTS[variant]) {
      setCursorVariant(variant);
    }
  }, []);

  // Show/hide cursor with smooth transitions
  const showCursor = useCallback(() => {
    setIsVisible(true);
  }, []);

  const hideCursor = useCallback(() => {
    setIsVisible(false);
  }, []);

  // Handle interaction states
  const setInteractionState = useCallback((interacting, element = null) => {
    setIsInteracting(interacting);
    setTargetElement(element);
  }, []);

  // Reset cursor to default state
  const resetCursor = useCallback(() => {
    setCursorVariant('default');
    setIsInteracting(false);
    setTargetElement(null);
  }, []);

  // Initialize cursor position on mount
  useEffect(() => {
    setMounted(true);
    
    if (typeof window !== 'undefined') {
      const handleMouseMove = (e) => {
        updatePosition(e.clientX, e.clientY);
      };

      document.addEventListener('mousemove', handleMouseMove);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        if (animationFrame.current) {
          cancelAnimationFrame(animationFrame.current);
        }
      };
    }
  }, [updatePosition]);

  return {
    cursorVariant,
    isVisible,
    position,
    isInteracting,
    targetElement,
    mounted,
    setCursor,
    showCursor,
    hideCursor,
    updatePosition,
    setInteractionState,
    resetCursor,
    variants: CURSOR_VARIANTS,
    interactionTypes: INTERACTION_TYPES,
  };
};

export default useCursor;