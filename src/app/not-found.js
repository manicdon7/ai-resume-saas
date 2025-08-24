'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Home, Search, FileText, ArrowLeft, Sparkles } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black flex items-center justify-center p-4">
      <div className="max-w-2xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="space-y-8"
        >
          {/* 404 Animation */}
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.8, type: "spring", bounce: 0.4 }}
            className="relative"
          >
            <div className="text-8xl md:text-9xl font-bold bg-gradient-to-r from-purple-600/30 via-blue-600/30 to-cyan-600/30 bg-clip-text text-transparent select-none">
              404
            </div>
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
            >
              <FileText className="w-16 h-16 text-purple-400" />
            </motion.div>
          </motion.div>

          {/* Catchy Two-Liner */}
          <div className="space-y-4">
            <motion.h1
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-purple-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent"
            >
              Oops! This Page Took a Career Break
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.6 }}
              className="text-lg md:text-xl text-gray-300 max-w-lg mx-auto"
            >
              Don't worry, even the best resumes have gaps. Let's get you back on track!
            </motion.p>
          </div>

          {/* Decorative Elements */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7, duration: 0.6 }}
            className="flex justify-center space-x-4"
          >
            <Sparkles className="w-6 h-6 text-cyan-400 animate-pulse" />
            <Sparkles className="w-4 h-4 text-purple-400 animate-pulse delay-300" />
            <Sparkles className="w-5 h-5 text-blue-400 animate-pulse delay-700" />
          </motion.div>

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9, duration: 0.6 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          >
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-200 font-semibold shadow-lg hover:shadow-purple-500/25 transform hover:-translate-y-0.5"
            >
              <Home className="w-5 h-5" />
              Back to Home
            </Link>
            
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 px-6 py-3 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-800/50 hover:border-purple-400/50 transition-all duration-200 font-semibold"
            >
              <FileText className="w-5 h-5" />
              Go to Dashboard
            </Link>
          </motion.div>

          {/* Helpful Links */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.1, duration: 0.6 }}
            className="pt-8 border-t border-gray-700"
          >
            <p className="text-sm text-gray-400 mb-4">
              Looking for something specific?
            </p>
            <div className="flex flex-wrap justify-center gap-4 text-sm">
              <Link
                href="/jobs"
                className="text-purple-400 hover:text-purple-300 hover:underline flex items-center gap-1 transition-colors"
              >
                <Search className="w-4 h-4" />
                Job Search
              </Link>
              <Link
                href="/cover-letter"
                className="text-blue-400 hover:text-blue-300 hover:underline flex items-center gap-1 transition-colors"
              >
                <FileText className="w-4 h-4" />
                Cover Letters
              </Link>
              <Link
                href="/analysis"
                className="text-cyan-400 hover:text-cyan-300 hover:underline flex items-center gap-1 transition-colors"
              >
                <FileText className="w-4 h-4" />
                Resume Analysis
              </Link>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
