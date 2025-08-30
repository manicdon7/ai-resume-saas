import { toast } from 'react-toastify';

// Custom toast configurations with app theming
const toastConfig = {
  position: "top-right",
  autoClose: 4000,
  hideProgressBar: false,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: true,
  progress: undefined,
  theme: "dark",
  className: "custom-toast",
  bodyClassName: "custom-toast-body",
  progressClassName: "custom-toast-progress",
};

// Custom toast functions with consistent theming
export const showToast = {
  success: (message, options = {}) => {
    return toast.success(message, {
      ...toastConfig,
      className: "custom-toast success-toast",
      progressClassName: "success-progress",
      ...options,
    });
  },

  error: (message, options = {}) => {
    return toast.error(message, {
      ...toastConfig,
      className: "custom-toast error-toast",
      progressClassName: "error-progress",
      autoClose: 6000, // Longer for errors
      ...options,
    });
  },

  warning: (message, options = {}) => {
    return toast.warning(message, {
      ...toastConfig,
      className: "custom-toast warning-toast",
      progressClassName: "warning-progress",
      ...options,
    });
  },

  info: (message, options = {}) => {
    return toast.info(message, {
      ...toastConfig,
      className: "custom-toast info-toast",
      progressClassName: "info-progress",
      ...options,
    });
  },

  // Custom gradient toast for special actions
  gradient: (message, options = {}) => {
    return toast(message, {
      ...toastConfig,
      className: "custom-toast gradient-toast",
      progressClassName: "gradient-progress",
      ...options,
    });
  },

  // Loading toast
  loading: (message, options = {}) => {
    return toast.loading(message, {
      ...toastConfig,
      className: "custom-toast loading-toast",
      autoClose: false,
      closeOnClick: false,
      draggable: false,
      ...options,
    });
  },

  // Promise toast for async operations
  promise: (promise, messages, options = {}) => {
    return toast.promise(promise, messages, {
      ...toastConfig,
      ...options,
    });
  },

  // Update existing toast
  update: (toastId, options) => {
    return toast.update(toastId, {
      ...toastConfig,
      ...options,
    });
  },

  // Dismiss toast
  dismiss: (toastId) => {
    return toast.dismiss(toastId);
  },

  // Dismiss all toasts
  dismissAll: () => {
    return toast.dismiss();
  },
};

// Predefined messages for common actions
export const toastMessages = {
  auth: {
    loginSuccess: "Welcome back! Successfully logged in.",
    loginError: "Login failed. Please check your credentials.",
    logoutSuccess: "Successfully logged out. See you soon!",
    signupSuccess: "Account created successfully! Welcome to RoleFitAI.",
    signupError: "Failed to create account. Please try again.",
    emailVerificationSent: "Verification email sent! Please check your inbox.",
    passwordResetSent: "Password reset link sent to your email.",
  },
  resume: {
    generateStart: "Generating your enhanced resume...",
    generateSuccess: "Resume enhanced successfully! 🎉",
    generateError: "Failed to generate resume. Please try again.",
    downloadSuccess: "Resume downloaded successfully!",
    downloadError: "Failed to download resume. Please try again.",
    uploadSuccess: "Resume uploaded successfully!",
    uploadError: "Failed to upload resume. Please check the file format.",
  },
  credits: {
    insufficient: "Insufficient credits. Please upgrade to continue.",
    refilled: "Daily credits refilled! You have 3 new credits.",
    used: "Credit used. Remaining credits: ",
  },
  general: {
    saveSuccess: "Changes saved successfully!",
    saveError: "Failed to save changes. Please try again.",
    copySuccess: "Copied to clipboard!",
    networkError: "Network error. Please check your connection.",
    unexpectedError: "Something went wrong. Please try again.",
  },
  email: {
    sent: "Email sent successfully!",
    failed: "Failed to send email. Please try again.",
    subscribed: "Successfully subscribed to notifications!",
    unsubscribed: "Successfully unsubscribed from notifications.",
  },
};

export default toastConfig;
