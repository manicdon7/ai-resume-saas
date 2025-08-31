'use client';

import { useEffect, useRef, useCallback } from 'react';
import { 
  registerCursorElement, 
  unregisterCursorElement,
  throttle 
} from '../lib/cursor-utils';

export const useCursorInteraction = (config = {}) => {
  const elementRef = useRef(null);
  const configRef = useRef(config);

  // Update config ref when config changes
  useEffect(() => {
    configRef.current = config;
  }, [config]);

  // Register element with cursor system
  const registerElement = useCallback((element) => {
    if (element && element !== elementRef.current) {
      // Unregister previous element if exists
      if (elementRef.current) {
        unregisterCursorElement(elementRef.current);
      }

      elementRef.current = element;
      registerCursorElement(element, configRef.current);
    }
  }, []);

  // Ref callback for easy integration
  const cursorRef = useCallback((element) => {
    registerElement(element);
  }, [registerElement]);

  // Update cursor configuration
  const updateConfig = useCallback((newConfig) => {
    configRef.current = { ...configRef.current, ...newConfig };
    if (elementRef.current) {
      // Re-register with new config
      unregisterCursorElement(elementRef.current);
      registerCursorElement(elementRef.current, configRef.current);
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (elementRef.current) {
        unregisterCursorElement(elementRef.current);
      }
    };
  }, []);

  return {
    cursorRef,
    registerElement,
    updateConfig,
  };
};

// Hook for cursor hover effects
export const useCursorHover = (variant = 'pointer', effects = []) => {
  return useCursorInteraction({
    variant,
    effects,
    onHover: (e) => {
      // Custom hover logic can be added here
      if (e.type === 'mouseenter') {
        e.target.style.transform = 'scale(1.02)';
      } else if (e.type === 'mouseleave') {
        e.target.style.transform = 'scale(1)';
      }
    }
  });
};

// Hook for cursor click effects
export const useCursorClick = (onClick, variant = 'pointer') => {
  const throttledClick = useCallback(
    throttle(onClick || (() => {}), 100),
    [onClick]
  );

  return useCursorInteraction({
    variant,
    onClick: throttledClick,
  });
};

// Hook for cursor magnetism
export const useCursorMagnetism = (strength = 0.3, variant = 'pointer') => {
  return useCursorInteraction({
    variant,
    magnetism: true,
    magnetismStrength: strength,
  });
};

// Hook for cursor drag effects
export const useCursorDrag = (onDrag, variant = 'drag') => {
  const handleDrag = useCallback((e) => {
    if (onDrag) {
      onDrag(e);
    }
  }, [onDrag]);

  return useCursorInteraction({
    variant,
    onDrag: handleDrag,
  });
};

// Hook for text input cursor
export const useCursorText = () => {
  return useCursorInteraction({
    variant: 'text',
  });
};

// Hook for disabled state cursor
export const useCursorDisabled = () => {
  return useCursorInteraction({
    variant: 'disabled',
  });
};

// Hook for loading state cursor
export const useCursorLoading = () => {
  return useCursorInteraction({
    variant: 'loading',
  });
};

export default useCursorInteraction;