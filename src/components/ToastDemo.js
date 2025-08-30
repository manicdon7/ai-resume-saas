'use client';

import { motion } from 'framer-motion';
import { showToast, toastMessages } from '@/lib/toast-config';
import { 
  CheckCircle, 
  AlertCircle, 
  AlertTriangle, 
  Info, 
  Sparkles,
  Loader2
} from 'lucide-react';

export default function ToastDemo() {
  const handleSuccessToast = () => {
    showToast.success(toastMessages.resume.generateSuccess);
  };

  const handleErrorToast = () => {
    showToast.error(toastMessages.auth.loginError);
  };

  const handleWarningToast = () => {
    showToast.warning(toastMessages.credits.insufficient);
  };

  const handleInfoToast = () => {
    showToast.info("This is an informational message with app theming!");
  };

  const handleGradientToast = () => {
    showToast.gradient("🎉 Special gradient toast with premium styling!");
  };

  const handleLoadingToast = () => {
    const toastId = showToast.loading(toastMessages.resume.generateStart);
    
    // Simulate async operation
    setTimeout(() => {
      showToast.update(toastId, {
        render: toastMessages.resume.generateSuccess,
        type: "success",
        isLoading: false,
        autoClose: 4000,
        className: "custom-toast success-toast"
      });
    }, 3000);
  };

  const handlePromiseToast = () => {
    const myPromise = new Promise((resolve, reject) => {
      setTimeout(() => {
        Math.random() > 0.5 ? resolve("Success!") : reject("Failed!");
      }, 2000);
    });

    showToast.promise(myPromise, {
      pending: 'Processing your request...',
      success: 'Operation completed successfully! 🎉',
      error: 'Operation failed. Please try again.'
    });
  };

  const toastButtons = [
    {
      label: "Success Toast",
      onClick: handleSuccessToast,
      icon: CheckCircle,
      color: "from-green-500 to-emerald-600"
    },
    {
      label: "Error Toast", 
      onClick: handleErrorToast,
      icon: AlertCircle,
      color: "from-red-500 to-rose-600"
    },
    {
      label: "Warning Toast",
      onClick: handleWarningToast,
      icon: AlertTriangle,
      color: "from-yellow-500 to-amber-600"
    },
    {
      label: "Info Toast",
      onClick: handleInfoToast,
      icon: Info,
      color: "from-blue-500 to-cyan-600"
    },
    {
      label: "Gradient Toast",
      onClick: handleGradientToast,
      icon: Sparkles,
      color: "from-purple-500 via-pink-500 to-cyan-500"
    },
    {
      label: "Loading Toast",
      onClick: handleLoadingToast,
      icon: Loader2,
      color: "from-gray-500 to-slate-600"
    },
    {
      label: "Promise Toast",
      onClick: handlePromiseToast,
      icon: CheckCircle,
      color: "from-indigo-500 to-purple-600"
    }
  ];

  return (
    <div className="p-8 bg-gradient-to-br from-background via-muted/20 to-background min-h-screen">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent mb-4">
            Toast Notification Demo
          </h1>
          <p className="text-muted-foreground text-lg">
            Test all toast types with consistent RoleFitAI theming
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {toastButtons.map((button, index) => {
            const Icon = button.icon;
            return (
              <motion.button
                key={button.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={button.onClick}
                className={`
                  relative p-6 rounded-xl bg-gradient-to-br ${button.color}
                  text-white font-semibold shadow-lg hover:shadow-xl
                  transition-all duration-300 group overflow-hidden
                `}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                
                <div className="relative z-10 flex flex-col items-center space-y-3">
                  <Icon className="w-8 h-8" />
                  <span className="text-sm">{button.label}</span>
                </div>

                <div className="absolute -bottom-2 -right-2 w-16 h-16 bg-white/10 rounded-full blur-xl" />
              </motion.button>
            );
          })}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-12 p-6 bg-muted/50 rounded-xl border border-border"
        >
          <h3 className="text-xl font-semibold mb-4 text-foreground">Toast Features:</h3>
          <ul className="space-y-2 text-muted-foreground">
            <li>• Consistent purple/blue/cyan gradient theming</li>
            <li>• Smooth animations with hover effects</li>
            <li>• Professional glassmorphism design</li>
            <li>• Mobile responsive layout</li>
            <li>• Predefined message templates</li>
            <li>• Loading and promise toast support</li>
            <li>• Customizable duration and positioning</li>
          </ul>
        </motion.div>
      </div>
    </div>
  );
}
