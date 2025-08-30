import { Inter, Poppins, JetBrains_Mono } from "next/font/google";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import "./globals.css"
import "../styles/toast-styles.css"
import Script from "next/script";
import ReduxProvider from '../components/ReduxProvider';

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  display: "swap",
});

export const viewport = 'width=device-width, initial-scale=1, maximum-scale=5';

export const metadata = {
  title: "RoleFitAI - Free AI Resume & Cover Letter Builder | ATS Optimized",
  description:
    "RoleFitAI helps job seekers create ATS-optimized resumes and professional cover letters instantly using AI. Free, fast, and no signup required.",
  keywords:
    "AI resume builder, resume optimizer, ATS resume, free resume maker, cover letter generator, job applications, AI job tools, RoleFitAI",
  authors: [{ name: "RoleFitAI" }],
  robots: "index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1",
  alternates: {
    canonical: "https://rolefitai.vercel.app/",
  },
  openGraph: {
    title: "RoleFitAI - Free AI Resume & Cover Letter Builder",
    description:
      "Transform your resume with AI-powered enhancements. Get ATS-optimized resumes and tailored cover letters in seconds.",
    url: "https://rolefitai.vercel.app/",
    siteName: "RoleFitAI",
    images: [
      {
        url: "https://rolefitai.vercel.app/logo.png", // replace with actual OG image
        width: 1200,
        height: 630,
        alt: "RoleFitAI - AI Resume and Cover Letter Builder",
      },
    ],
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    site: "@rolefitai", // replace with your Twitter handle if available
    creator: "@rolefitai",
    title: "RoleFitAI - Free AI Resume & Cover Letter Builder",
    description:
      "Create ATS-optimized resumes & professional cover letters instantly using AI. Free to use, no signup required.",
    images: ["https://rolefitai.vercel.app/logo.png"],
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        {/* Security Headers */}
        <meta httpEquiv="X-Content-Type-Options" content="nosniff" />
        <meta httpEquiv="X-XSS-Protection" content="1; mode=block" />
        <meta httpEquiv="Referrer-Policy" content="strict-origin-when-cross-origin" />
        <meta httpEquiv="Permissions-Policy" content="camera=(), microphone=(), geolocation=()" />

        {/* Preconnect for performance */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://text.pollinations.ai" />

        {/* Favicons */}
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />

        {/* Google AdSense Script */}
        <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-7877602362549451"
          crossOrigin="anonymous"></script>
      </head>
      <body className={`${inter.variable} ${poppins.variable} ${jetbrainsMono.variable} antialiased`}>
        <ReduxProvider>
          {children}
          <ToastContainer
            position="top-right"
            autoClose={4000}
            hideProgressBar={false}
            newestOnTop={false}
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
            theme="dark"
            className="toast-container"
            toastClassName="custom-toast"
            bodyClassName="custom-toast-body"
            progressClassName="custom-toast-progress"
          />
        </ReduxProvider>
      </body>
    </html>
  );
}
