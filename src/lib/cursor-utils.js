'use client';

// Cursor interaction detection utilities
export class CursorInteractionDetector {
  constructor() {
    this.interactions = new Map();
    this.observers = new Set();
    this.isInitialized = false;
  }

  // Initialize the interaction detection system
  initialize() {
    if (this.isInitialized) return;
    
    this.setupGlobalListeners();
    this.observeDOM();
    this.isInitialized = true;
  }

  // Clean up all listeners and observers
  cleanup() {
    this.removeGlobalListeners();
    this.observers.forEach(observer => observer.disconnect());
    this.observers.clear();
    this.interactions.clear();
    this.isInitialized = false;
  }

  // Register an element for cursor interactions
  registerElement(element, config = {}) {
    if (!element) return;

    const elementId = this.getElementId(element);
    const interactionConfig = {
      variant: config.variant || 'pointer',
      magnetism: config.magnetism || false,
      magnetismStrength: config.magnetismStrength || 0.3,
      effects: config.effects || [],
      onHover: config.onHover || null,
      onClick: config.onClick || null,
      onFocus: config.onFocus || null,
      ...config
    };

    this.interactions.set(elementId, {
      element,
      config: interactionConfig,
      isHovered: false,
      isFocused: false,
      isPressed: false,
    });

    // Add data attribute for CSS targeting
    element.setAttribute('data-cursor', interactionConfig.variant);
    element.setAttribute('data-cursor-id', elementId);

    // Add event listeners
    this.addElementListeners(element, elementId);
  }

  // Unregister an element
  unregisterElement(element) {
    if (!element) return;

    const elementId = this.getElementId(element);
    const interaction = this.interactions.get(elementId);

    if (interaction) {
      this.removeElementListeners(element, elementId);
      element.removeAttribute('data-cursor');
      element.removeAttribute('data-cursor-id');
      this.interactions.delete(elementId);
    }
  }

  // Get interaction state for an element
  getInteractionState(element) {
    const elementId = this.getElementId(element);
    return this.interactions.get(elementId) || null;
  }

  // Update interaction configuration
  updateElementConfig(element, newConfig) {
    const elementId = this.getElementId(element);
    const interaction = this.interactions.get(elementId);

    if (interaction) {
      interaction.config = { ...interaction.config, ...newConfig };
      element.setAttribute('data-cursor', interaction.config.variant);
    }
  }

  // Private methods
  getElementId(element) {
    if (!element.dataset.cursorId) {
      element.dataset.cursorId = `cursor-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
    return element.dataset.cursorId;
  }

  setupGlobalListeners() {
    this.handleMouseMove = this.handleMouseMove.bind(this);
    this.handleMouseEnter = this.handleMouseEnter.bind(this);
    this.handleMouseLeave = this.handleMouseLeave.bind(this);
    this.handleMouseDown = this.handleMouseDown.bind(this);
    this.handleMouseUp = this.handleMouseUp.bind(this);
    this.handleFocus = this.handleFocus.bind(this);
    this.handleBlur = this.handleBlur.bind(this);

    document.addEventListener('mousemove', this.handleMouseMove, { passive: true });
    document.addEventListener('mouseenter', this.handleMouseEnter, true);
    document.addEventListener('mouseleave', this.handleMouseLeave, true);
    document.addEventListener('mousedown', this.handleMouseDown, true);
    document.addEventListener('mouseup', this.handleMouseUp, true);
    document.addEventListener('focus', this.handleFocus, true);
    document.addEventListener('blur', this.handleBlur, true);
  }

  removeGlobalListeners() {
    document.removeEventListener('mousemove', this.handleMouseMove);
    document.removeEventListener('mouseenter', this.handleMouseEnter, true);
    document.removeEventListener('mouseleave', this.handleMouseLeave, true);
    document.removeEventListener('mousedown', this.handleMouseDown, true);
    document.removeEventListener('mouseup', this.handleMouseUp, true);
    document.removeEventListener('focus', this.handleFocus, true);
    document.removeEventListener('blur', this.handleBlur, true);
  }

  addElementListeners(element, elementId) {
    // Individual element listeners for specific interactions
    const interaction = this.interactions.get(elementId);
    if (!interaction) return;

    const { config } = interaction;

    if (config.onHover) {
      element.addEventListener('mouseenter', config.onHover);
      element.addEventListener('mouseleave', config.onHover);
    }

    if (config.onClick) {
      element.addEventListener('click', config.onClick);
    }

    if (config.onFocus) {
      element.addEventListener('focus', config.onFocus);
      element.addEventListener('blur', config.onFocus);
    }
  }

  removeElementListeners(element, elementId) {
    const interaction = this.interactions.get(elementId);
    if (!interaction) return;

    const { config } = interaction;

    if (config.onHover) {
      element.removeEventListener('mouseenter', config.onHover);
      element.removeEventListener('mouseleave', config.onHover);
    }

    if (config.onClick) {
      element.removeEventListener('click', config.onClick);
    }

    if (config.onFocus) {
      element.removeEventListener('focus', config.onFocus);
      element.removeEventListener('blur', config.onFocus);
    }
  }

  observeDOM() {
    // Observe DOM changes to automatically register new interactive elements
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            this.autoRegisterInteractiveElements(node);
          }
        });
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    this.observers.add(observer);
  }

  autoRegisterInteractiveElements(container) {
    // Auto-register common interactive elements
    const selectors = [
      'button',
      'a[href]',
      'input',
      'textarea',
      'select',
      '[role="button"]',
      '[tabindex]',
      '.cursor-pointer',
      '[data-cursor]'
    ];

    const elements = container.querySelectorAll ? 
      container.querySelectorAll(selectors.join(', ')) : 
      [];

    elements.forEach(element => {
      if (!element.dataset.cursorId) {
        const variant = this.getElementCursorVariant(element);
        this.registerElement(element, { variant });
      }
    });
  }

  getElementCursorVariant(element) {
    // Determine appropriate cursor variant based on element type
    if (element.disabled || element.hasAttribute('disabled')) {
      return 'disabled';
    }

    if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
      return 'text';
    }

    if (element.tagName === 'BUTTON' || element.role === 'button') {
      return 'pointer';
    }

    if (element.tagName === 'A' && element.href) {
      return 'pointer';
    }

    if (element.draggable) {
      return 'drag';
    }

    return 'pointer';
  }

  // Event handlers
  handleMouseMove(e) {
    // Dispatch custom cursor move event
    const event = new CustomEvent('cursorMove', {
      detail: { x: e.clientX, y: e.clientY, originalEvent: e }
    });
    document.dispatchEvent(event);
  }

  handleMouseEnter(e) {
    const elementId = e.target.dataset.cursorId;
    if (!elementId) return;

    const interaction = this.interactions.get(elementId);
    if (interaction) {
      interaction.isHovered = true;
      this.dispatchInteractionEvent('cursorEnter', e.target, interaction);
    }
  }

  handleMouseLeave(e) {
    const elementId = e.target.dataset.cursorId;
    if (!elementId) return;

    const interaction = this.interactions.get(elementId);
    if (interaction) {
      interaction.isHovered = false;
      this.dispatchInteractionEvent('cursorLeave', e.target, interaction);
    }
  }

  handleMouseDown(e) {
    const elementId = e.target.dataset.cursorId;
    if (!elementId) return;

    const interaction = this.interactions.get(elementId);
    if (interaction) {
      interaction.isPressed = true;
      this.dispatchInteractionEvent('cursorPress', e.target, interaction);
    }
  }

  handleMouseUp(e) {
    const elementId = e.target.dataset.cursorId;
    if (!elementId) return;

    const interaction = this.interactions.get(elementId);
    if (interaction) {
      interaction.isPressed = false;
      this.dispatchInteractionEvent('cursorRelease', e.target, interaction);
    }
  }

  handleFocus(e) {
    const elementId = e.target.dataset.cursorId;
    if (!elementId) return;

    const interaction = this.interactions.get(elementId);
    if (interaction) {
      interaction.isFocused = true;
      this.dispatchInteractionEvent('cursorFocus', e.target, interaction);
    }
  }

  handleBlur(e) {
    const elementId = e.target.dataset.cursorId;
    if (!elementId) return;

    const interaction = this.interactions.get(elementId);
    if (interaction) {
      interaction.isFocused = false;
      this.dispatchInteractionEvent('cursorBlur', e.target, interaction);
    }
  }

  dispatchInteractionEvent(type, element, interaction) {
    const event = new CustomEvent(type, {
      detail: { element, interaction, config: interaction.config }
    });
    document.dispatchEvent(event);
  }
}

// Singleton instance
export const cursorInteractionDetector = new CursorInteractionDetector();

// Utility functions
export const registerCursorElement = (element, config) => {
  cursorInteractionDetector.registerElement(element, config);
};

export const unregisterCursorElement = (element) => {
  cursorInteractionDetector.unregisterElement(element);
};

export const initializeCursorSystem = () => {
  cursorInteractionDetector.initialize();
};

export const cleanupCursorSystem = () => {
  cursorInteractionDetector.cleanup();
};

// Performance optimization utilities
export const throttle = (func, delay) => {
  let timeoutId;
  let lastExecTime = 0;
  
  return function (...args) {
    const currentTime = Date.now();
    
    if (currentTime - lastExecTime > delay) {
      func.apply(this, args);
      lastExecTime = currentTime;
    } else {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        func.apply(this, args);
        lastExecTime = Date.now();
      }, delay - (currentTime - lastExecTime));
    }
  };
};

export const debounce = (func, delay) => {
  let timeoutId;
  
  return function (...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(this, args), delay);
  };
};