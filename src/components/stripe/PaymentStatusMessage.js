'use client';

/**
 * A component to display payment status messages
 */
export default function PaymentStatusMessage({
  status = 'processing',
  message,
  onAction,
  actionText = 'Return to Dashboard',
}) {
  // Define status-specific content
  const statusConfig = {
    success: {
      icon: (
        <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-r from-green-400 to-green-600 rounded-full flex items-center justify-center">
          <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        </div>
      ),
      title: 'Payment Successful!',
      defaultMessage: 'Your subscription has been activated. You now have access to all Pro features.',
      titleColor: 'text-green-400',
      buttonClass: 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700',
    },
    processing: {
      icon: (
        <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-r from-primary to-accent rounded-full flex items-center justify-center">
          <svg className="w-10 h-10 text-primary-foreground animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
      ),
      title: 'Processing Payment...',
      defaultMessage: 'Please wait while we confirm your payment. This may take a moment.',
      titleColor: 'text-primary',
      buttonClass: 'bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90',
    },
    error: {
      icon: (
        <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-r from-red-400 to-red-600 rounded-full flex items-center justify-center">
          <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
      ),
      title: 'Payment Failed',
      defaultMessage: 'There was an error processing your payment. Please try again or contact support.',
      titleColor: 'text-red-400',
      buttonClass: 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700',
    },
    cancelled: {
      icon: (
        <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-r from-muted-foreground to-muted-foreground/80 rounded-full flex items-center justify-center">
          <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </div>
      ),
      title: 'Payment Cancelled',
      defaultMessage: 'Your payment was cancelled. No charges were made.',
      titleColor: 'text-muted-foreground',
      buttonClass: 'bg-gradient-to-r from-muted to-muted-foreground hover:from-muted/90 hover:to-muted-foreground/90',
    },
  };

  const config = statusConfig[status] || statusConfig.processing;

  return (
    <div className="bg-card border border-border rounded-2xl p-8 shadow-lg max-w-md mx-auto">
      <div className="text-center">
        {config.icon}
        
        <h2 className={`text-3xl font-bold mb-4 ${config.titleColor}`}>
          {config.title}
        </h2>
        
        <p className="text-muted-foreground mb-8 text-lg leading-relaxed">
          {message || config.defaultMessage}
        </p>
        
        {onAction && (
          <button
            onClick={onAction}
            className={`w-full py-3 px-6 text-white font-semibold rounded-xl transition-all duration-200 ${config.buttonClass} hover:shadow-lg hover:scale-[1.02]`}
          >
            {actionText}
          </button>
        )}
      </div>
    </div>
  );
}