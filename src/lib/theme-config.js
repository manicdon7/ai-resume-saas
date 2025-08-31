// Consistent theme configuration for the entire app
export const theme = {
  colors: {
    primary: {
      50: '#f0f9ff',
      100: '#e0f2fe',
      200: '#bae6fd',
      300: '#7dd3fc',
      400: '#38bdf8',
      500: '#0ea5e9',
      600: '#0284c7',
      700: '#0369a1',
      800: '#075985',
      900: '#0c4a6e',
    },
    purple: {
      50: '#faf5ff',
      100: '#f3e8ff',
      200: '#e9d5ff',
      300: '#d8b4fe',
      400: '#c084fc',
      500: '#a855f7',
      600: '#9333ea',
      700: '#7c3aed',
      800: '#6b21a8',
      900: '#581c87',
    },
    gray: {
      50: '#f9fafb',
      100: '#f3f4f6',
      200: '#e5e7eb',
      300: '#d1d5db',
      400: '#9ca3af',
      500: '#6b7280',
      600: '#4b5563',
      700: '#374151',
      800: '#1f2937',
      900: '#111827',
    },
    success: {
      50: '#f0fdf4',
      100: '#dcfce7',
      200: '#bbf7d0',
      300: '#86efac',
      400: '#4ade80',
      500: '#22c55e',
      600: '#16a34a',
      700: '#15803d',
      800: '#166534',
      900: '#14532d',
    },
    warning: {
      50: '#fffbeb',
      100: '#fef3c7',
      200: '#fde68a',
      300: '#fcd34d',
      400: '#fbbf24',
      500: '#f59e0b',
      600: '#d97706',
      700: '#b45309',
      800: '#92400e',
      900: '#78350f',
    },
    error: {
      50: '#fef2f2',
      100: '#fee2e2',
      200: '#fecaca',
      300: '#fca5a5',
      400: '#f87171',
      500: '#ef4444',
      600: '#dc2626',
      700: '#b91c1c',
      800: '#991b1b',
      900: '#7f1d1d',
    }
  },
  
  // Enhanced animation system
  animations: {
    durations: {
      fast: 150,
      normal: 300,
      slow: 500,
      slower: 750,
      slowest: 1000
    },
    easings: {
      easeOut: 'cubic-bezier(0.16, 1, 0.3, 1)',
      easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
      easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
      spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
      elastic: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)'
    },
    variants: {
      fadeIn: {
        initial: { opacity: 0, y: 20 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: -20 }
      },
      slideUp: {
        initial: { opacity: 0, y: 30 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: -30 }
      },
      scaleIn: {
        initial: { opacity: 0, scale: 0.8 },
        animate: { opacity: 1, scale: 1 },
        exit: { opacity: 0, scale: 0.8 }
      },
      staggerContainer: {
        animate: {
          transition: {
            staggerChildren: 0.1,
            delayChildren: 0.2
          }
        }
      },
      cardHover: {
        rest: { scale: 1, y: 0 },
        hover: { scale: 1.02, y: -4 },
        tap: { scale: 0.98 }
      },
      buttonPress: {
        rest: { scale: 1 },
        hover: { scale: 1.05 },
        tap: { scale: 0.95 }
      }
    }
  },

  // Custom cursor system
  cursors: {
    default: {
      size: 20,
      color: 'rgba(168, 85, 247, 0.6)',
      blendMode: 'multiply',
      animation: 'ease-out',
      trail: false
    },
    interactive: {
      size: 32,
      color: 'rgba(168, 85, 247, 0.8)',
      blendMode: 'screen',
      animation: 'spring',
      trail: true,
      glow: true,
      magnetism: 8
    },
    text: {
      size: 2,
      color: 'rgba(255, 255, 255, 0.8)',
      blendMode: 'normal',
      animation: 'ease-in-out',
      trail: false
    },
    loading: {
      size: 24,
      color: 'rgba(59, 130, 246, 0.7)',
      blendMode: 'multiply',
      animation: 'pulse',
      trail: false,
      spin: true
    },
    disabled: {
      size: 16,
      color: 'rgba(156, 163, 175, 0.5)',
      blendMode: 'normal',
      animation: 'ease-out',
      trail: false
    },
    drag: {
      size: 28,
      color: 'rgba(34, 197, 94, 0.7)',
      blendMode: 'multiply',
      animation: 'spring',
      trail: true,
      scale: 1.2
    }
  },

  // Glassmorphism and advanced effects
  effects: {
    glassmorphism: {
      light: {
        background: 'rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)'
      },
      medium: {
        background: 'rgba(255, 255, 255, 0.15)',
        backdropFilter: 'blur(15px)',
        border: '1px solid rgba(255, 255, 255, 0.25)',
        boxShadow: '0 12px 40px 0 rgba(31, 38, 135, 0.4)'
      },
      heavy: {
        background: 'rgba(255, 255, 255, 0.2)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.3)',
        boxShadow: '0 16px 48px 0 rgba(31, 38, 135, 0.45)'
      },
      dark: {
        background: 'rgba(0, 0, 0, 0.2)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: '0 10px 36px 0 rgba(0, 0, 0, 0.3)'
      }
    },
    shadows: {
      soft: '0 2px 8px rgba(0, 0, 0, 0.1)',
      medium: '0 4px 16px rgba(0, 0, 0, 0.15)',
      hard: '0 8px 32px rgba(0, 0, 0, 0.2)',
      colored: {
        purple: '0 8px 32px rgba(168, 85, 247, 0.3)',
        blue: '0 8px 32px rgba(59, 130, 246, 0.3)',
        green: '0 8px 32px rgba(34, 197, 94, 0.3)',
        red: '0 8px 32px rgba(239, 68, 68, 0.3)',
        yellow: '0 8px 32px rgba(245, 158, 11, 0.3)'
      },
      glow: {
        small: '0 0 20px rgba(168, 85, 247, 0.4)',
        medium: '0 0 40px rgba(168, 85, 247, 0.5)',
        large: '0 0 60px rgba(168, 85, 247, 0.6)'
      }
    }
  },

  // Responsive breakpoints
  breakpoints: {
    xs: '320px',
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
    '3xl': '1920px'
  },
  gradients: {
    primary: 'bg-gradient-to-r from-purple-600 to-blue-600',
    secondary: 'bg-gradient-to-r from-purple-400 via-blue-400 to-cyan-400',
    success: 'bg-gradient-to-r from-green-400 to-emerald-400',
    warning: 'bg-gradient-to-r from-yellow-400 to-orange-400',
    error: 'bg-gradient-to-r from-red-400 to-pink-400',
    dark: 'bg-gradient-to-br from-purple-900/10 via-blue-900/10 to-black',
    card: 'bg-gray-800/50 backdrop-blur-sm border border-gray-700',
    glass: 'bg-white/5 backdrop-blur-md border border-white/10'
  },
  shadows: {
    sm: 'shadow-sm',
    md: 'shadow-md',
    lg: 'shadow-lg',
    xl: 'shadow-xl',
    purple: 'shadow-lg hover:shadow-purple-500/25',
    blue: 'shadow-lg hover:shadow-blue-500/25',
    green: 'shadow-lg hover:shadow-green-500/25'
  },
  animations: {
    fadeIn: 'animate-fade-in',
    slideUp: 'animate-slide-up',
    bounce: 'animate-bounce',
    pulse: 'animate-pulse',
    spin: 'animate-spin',
    float: 'animate-float',
    gradient: 'animate-gradient-shine'
  },
  spacing: {
    xs: '0.5rem',
    sm: '1rem',
    md: '1.5rem',
    lg: '2rem',
    xl: '3rem',
    '2xl': '4rem'
  },
  borderRadius: {
    sm: 'rounded-lg',
    md: 'rounded-xl',
    lg: 'rounded-2xl',
    full: 'rounded-full'
  }
};

// Enhanced component style presets
export const componentStyles = {
  button: {
    // Primary variants with gradient animations
    primary: `
      relative px-6 py-3 font-medium text-white rounded-xl
      bg-gradient-to-r from-purple-600 to-blue-600
      hover:from-purple-500 hover:to-blue-500
      active:from-purple-700 active:to-blue-700
      shadow-lg hover:shadow-purple-500/25
      transform hover:scale-105 active:scale-95
      transition-all duration-300 ease-out
      before:absolute before:inset-0 before:rounded-xl
      before:bg-gradient-to-r before:from-purple-400 before:to-blue-400
      before:opacity-0 hover:before:opacity-20
      before:transition-opacity before:duration-300
    `,
    
    // Secondary with subtle animations
    secondary: `
      px-6 py-3 font-medium text-white rounded-xl
      bg-gray-600 hover:bg-gray-500 active:bg-gray-700
      shadow-md hover:shadow-lg
      transform hover:scale-105 active:scale-95
      transition-all duration-200 ease-out
    `,
    
    // Outline with glow effects
    outline: `
      relative px-6 py-3 font-medium rounded-xl
      border-2 border-purple-600 text-purple-600
      hover:border-purple-500 hover:text-purple-500
      hover:bg-purple-600/10 hover:shadow-lg hover:shadow-purple-500/25
      active:border-purple-700 active:text-purple-700
      transform hover:scale-105 active:scale-95
      transition-all duration-300 ease-out
      before:absolute before:inset-0 before:rounded-xl
      before:bg-purple-600/5 before:opacity-0 hover:before:opacity-100
      before:transition-opacity before:duration-300
    `,
    
    // Ghost with smooth transitions
    ghost: `
      px-6 py-3 font-medium rounded-xl
      text-gray-400 hover:text-white hover:bg-gray-700/50
      active:bg-gray-700/70
      transform hover:scale-105 active:scale-95
      transition-all duration-200 ease-out
    `,
    
    // Success variant
    success: `
      px-6 py-3 font-medium text-white rounded-xl
      bg-gradient-to-r from-green-600 to-emerald-600
      hover:from-green-500 hover:to-emerald-500
      shadow-lg hover:shadow-green-500/25
      transform hover:scale-105 active:scale-95
      transition-all duration-300 ease-out
    `,
    
    // Danger variant
    danger: `
      px-6 py-3 font-medium text-white rounded-xl
      bg-gradient-to-r from-red-600 to-pink-600
      hover:from-red-500 hover:to-pink-500
      shadow-lg hover:shadow-red-500/25
      transform hover:scale-105 active:scale-95
      transition-all duration-300 ease-out
    `
  },

  card: {
    // Default glassmorphism card
    default: `
      backdrop-blur-md bg-white/5 border border-white/10
      rounded-2xl p-6 shadow-xl
      hover:bg-white/10 hover:border-white/20
      transition-all duration-300 ease-out
    `,
    
    // Enhanced glass effect
    glass: `
      backdrop-blur-lg bg-white/10 border border-white/20
      rounded-2xl p-6 shadow-2xl
      hover:bg-white/15 hover:border-white/30 hover:shadow-3xl
      transform hover:scale-[1.02] hover:-translate-y-1
      transition-all duration-300 ease-out
    `,
    
    // Interactive hover card
    hover: `
      backdrop-blur-md bg-gray-800/50 border border-gray-700
      rounded-2xl p-6 shadow-lg
      hover:bg-gray-800/70 hover:border-gray-600
      hover:shadow-2xl hover:shadow-purple-500/10
      transform hover:scale-[1.02] hover:-translate-y-2
      transition-all duration-300 ease-out
      cursor-pointer
    `,
    
    // Elevated card with depth
    elevated: `
      backdrop-blur-lg bg-gradient-to-br from-white/10 to-white/5
      border border-white/20 rounded-2xl p-6
      shadow-2xl shadow-black/20
      hover:shadow-3xl hover:shadow-purple-500/20
      transform hover:scale-[1.01] hover:-translate-y-1
      transition-all duration-400 ease-out
    `,
    
    // Gradient border card
    gradient: `
      relative backdrop-blur-md bg-gray-900/50 rounded-2xl p-6
      before:absolute before:inset-0 before:rounded-2xl before:p-[1px]
      before:bg-gradient-to-r before:from-purple-500 before:to-blue-500
      before:mask-composite before:[mask:linear-gradient(#fff_0_0)_content-box,linear-gradient(#fff_0_0)]
      before:[mask-composite:xor]
      hover:before:from-purple-400 hover:before:to-blue-400
      shadow-xl hover:shadow-2xl hover:shadow-purple-500/20
      transform hover:scale-[1.01]
      transition-all duration-300 ease-out
    `
  },

  input: {
    // Default with focus animations
    default: `
      w-full px-4 py-3 rounded-xl
      bg-gray-700/50 border border-gray-600
      text-white placeholder-gray-400
      focus:bg-gray-700/70 focus:border-purple-500
      focus:ring-2 focus:ring-purple-500/20
      focus:shadow-lg focus:shadow-purple-500/10
      transition-all duration-300 ease-out
      backdrop-blur-sm
    `,
    
    // Error state with validation
    error: `
      w-full px-4 py-3 rounded-xl
      bg-red-900/20 border border-red-500
      text-white placeholder-red-300
      focus:bg-red-900/30 focus:border-red-400
      focus:ring-2 focus:ring-red-500/20
      focus:shadow-lg focus:shadow-red-500/20
      transition-all duration-300 ease-out
      backdrop-blur-sm
    `,
    
    // Success state
    success: `
      w-full px-4 py-3 rounded-xl
      bg-green-900/20 border border-green-500
      text-white placeholder-green-300
      focus:bg-green-900/30 focus:border-green-400
      focus:ring-2 focus:ring-green-500/20
      focus:shadow-lg focus:shadow-green-500/20
      transition-all duration-300 ease-out
      backdrop-blur-sm
    `,
    
    // Glassmorphism input
    glass: `
      w-full px-4 py-3 rounded-xl
      backdrop-blur-md bg-white/5 border border-white/10
      text-white placeholder-white/50
      focus:bg-white/10 focus:border-white/20
      focus:ring-2 focus:ring-purple-500/30
      focus:shadow-xl focus:shadow-purple-500/20
      transition-all duration-300 ease-out
    `
  },

  text: {
    // Enhanced heading with gradient
    heading: `
      text-4xl font-bold
      bg-gradient-to-r from-purple-400 via-blue-400 to-cyan-400
      bg-clip-text text-transparent
      animate-gradient-shine
    `,
    
    // Subheading variants
    subheading: `
      text-2xl font-bold text-white
      hover:bg-gradient-to-r hover:from-purple-400 hover:to-blue-400
      hover:bg-clip-text hover:text-transparent
      transition-all duration-300 ease-out
    `,
    
    // Body text with improved readability
    body: `
      text-gray-300 leading-relaxed
      hover:text-gray-200
      transition-colors duration-200 ease-out
    `,
    
    // Muted text
    muted: `
      text-gray-400
      hover:text-gray-300
      transition-colors duration-200 ease-out
    `,
    
    // Small text
    small: `
      text-sm text-gray-400
      hover:text-gray-300
      transition-colors duration-200 ease-out
    `,
    
    // Gradient text variants
    gradientPurple: `
      bg-gradient-to-r from-purple-400 to-purple-600
      bg-clip-text text-transparent font-semibold
    `,
    
    gradientBlue: `
      bg-gradient-to-r from-blue-400 to-blue-600
      bg-clip-text text-transparent font-semibold
    `,
    
    gradientGreen: `
      bg-gradient-to-r from-green-400 to-green-600
      bg-clip-text text-transparent font-semibold
    `,
    
    // Animated text
    shimmer: `
      bg-gradient-to-r from-gray-400 via-white to-gray-400
      bg-clip-text text-transparent
      bg-size-200 animate-gradient-shine
      font-semibold
    `
  }
};

// Animation keyframes for custom animations
export const animations = `
  @keyframes float {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-20px); }
  }
  
  @keyframes float-delayed {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-15px); }
  }
  
  @keyframes gradient-shine {
    0% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
  }
  
  @keyframes fade-in {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }
  
  @keyframes slide-up {
    from { opacity: 0; transform: translateY(30px); }
    to { opacity: 1; transform: translateY(0); }
  }
  
  .animate-float {
    animation: float 6s ease-in-out infinite;
  }
  
  .animate-float-delayed {
    animation: float-delayed 8s ease-in-out infinite;
  }
  
  .animate-gradient-shine {
    background-size: 200% 200%;
    animation: gradient-shine 3s ease infinite;
  }
  
  .animate-fade-in {
    animation: fade-in 0.6s ease-out;
  }
  
  .animate-slide-up {
    animation: slide-up 0.8s ease-out;
  }
`;

export default theme;