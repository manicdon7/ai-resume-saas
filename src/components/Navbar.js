import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, User, FileText, Briefcase, Settings, LogOut, Home, BarChart3, Mail } from 'lucide-react';

const Navbar = ({ user, onSignOut, onGetStarted }) => {
  const router = useRouter();
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleSignOut = async () => {
    try {
      await onSignOut();
      router.push('/');
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const navItems = [
    { name: 'Home', href: '/', icon: Home },
    { name: 'Dashboard', href: '/dashboard', icon: BarChart3 },
    // { name: 'Resume', href: '/resume-enhance', icon: FileText },
    { name: 'Cover Letter', href: '/cover-letter', icon: Mail },
    { name: 'Jobs', href: '/jobs', icon: Briefcase },
    { name: 'Analysis', href: '/analysis', icon: BarChart3 },
  ];

  return (
    <>
      <nav className="bg-black/90 backdrop-blur-md border-b border-gray-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg flex items-center justify-center shadow-lg">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">RoleFitAI</span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              {navItems.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="text-gray-300 hover:text-purple-400 transition-colors font-medium"
                >
                  {item.name}
                </Link>
              ))}
            </div>

            {/* User Menu & Auth */}
            <div className="hidden md:flex items-center space-x-4">
              {user ? (
                <div className="relative">
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center space-x-2 text-white hover:text-purple-400 transition-colors"
                  >
                    {user.photoURL ? (
                      <img src={user.photoURL} alt={user.displayName || 'User'} className="w-8 h-8 rounded-full border-2 border-purple-500/30" />
                    ) : (
                      <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center">
                        <User className="w-4 h-4 text-white" />
                      </div>
                    )}
                    <span className="hidden sm:block font-medium">{user.displayName || user.email}</span>
                  </button>

                  <AnimatePresence>
                    {showUserMenu && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute right-0 mt-2 w-48 bg-gray-800/95 backdrop-blur-sm border border-gray-700 rounded-xl shadow-2xl py-2"
                      >
                        {navItems.map((item) => (
                          <Link
                            key={item.name}
                            href={item.href}
                            className="flex items-center px-4 py-3 text-sm text-gray-300 hover:bg-gray-700/50 hover:text-white transition-colors rounded-lg mx-2"
                            onClick={() => setShowUserMenu(false)}
                          >
                            <item.icon className="w-4 h-4 mr-3 text-purple-400" />
                            <span className="text-gray-300 font-medium">{item.name}</span>
                          </Link>
                        ))}
                        <Link
                          href="/settings"
                          className="flex items-center px-4 py-3 text-sm text-gray-300 hover:bg-gray-700/50 hover:text-white transition-colors rounded-lg mx-2"
                          onClick={() => setShowUserMenu(false)}
                        >
                          <Settings className="w-4 h-4 mr-3 text-blue-400" />
                          Settings
                        </Link>
                        <hr className="my-2 border-gray-700" />
                        <button
                          onClick={() => {
                            setShowUserMenu(false);
                            handleSignOut();
                          }}
                          className="flex items-center w-full px-4 py-3 text-sm text-gray-300 hover:bg-red-600/20 hover:text-red-400 transition-colors rounded-lg mx-2"
                        >
                          <LogOut className="w-4 h-4 mr-3" />
                          Sign Out
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <div className="flex items-center space-x-4">
                  <button
                    onClick={onGetStarted}
                    className="px-6 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-200 font-medium shadow-lg hover:shadow-purple-500/25"
                  >
                    Get Started
                  </button>
                </div>
              )}
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden">
              <button
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                className="md:hidden p-2 text-gray-300 hover:text-purple-400 transition-colors"
              >
                {showMobileMenu ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {showMobileMenu && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-40 md:hidden"
              onClick={() => setShowMobileMenu(false)}
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed left-0 top-0 h-full w-80 bg-gray-900/95 backdrop-blur-md border-r border-gray-700 z-50 md:hidden"
            >
              <div className="p-6">
                <div className="flex justify-between items-center mb-8">
                  <Link href="/" className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg flex items-center justify-center shadow-lg">
                      <FileText className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">RoleFitAI</span>
                  </Link>
                  <button
                    onClick={() => setShowMobileMenu(false)}
                    className="text-gray-300 hover:text-purple-400 transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                {/* User Profile */}
                {user && (
                  <div className="mb-6 p-4 bg-gray-800/50 rounded-xl border border-gray-700">
                    <div className="flex items-center space-x-3">
                      {user.photoURL ? (
                        <img
                          src={user.photoURL}
                          alt={user.displayName || 'User'}
                          className="w-10 h-10 rounded-full"
                        />
                      ) : (
                        <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center">
                          <User className="w-5 h-5 text-white" />
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-white">
                          {user.displayName || 'User'}
                        </p>
                        <p className="text-sm text-gray-400">{user.email}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Navigation Links */}
                <nav className="space-y-2">
                  {navItems.map((item) => (
                    <Link
                      key={item.name}
                      href={item.href}
                      className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-700/50 transition-colors"
                      onClick={() => setShowMobileMenu(false)}
                    >
                      <item.icon className="w-5 h-5 text-purple-400" />
                      <span className="text-gray-300 font-medium">{item.name}</span>
                    </Link>
                  ))}
                </nav>

                {/* Auth Section */}
                {user ? (
                  <div className="mt-6 pt-6 border-t border-gray-700">
                    <button
                      onClick={() => {
                        setShowMobileMenu(false);
                        handleSignOut();
                      }}
                      className="flex items-center space-x-3 p-3 rounded-lg hover:bg-red-600/20 hover:text-red-400 transition-colors w-full"
                    >
                      <LogOut className="w-5 h-5 text-red-400" />
                      <span className="text-gray-300 font-medium">Sign Out</span>
                    </button>
                  </div>
                ) : (
                  <div className="mt-auto pt-6 border-t border-gray-700 space-y-2">
                    <button
                      onClick={() => {
                        setShowMobileMenu(false);
                        onGetStarted();
                      }}
                      className="block w-full px-4 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-200 font-medium text-center shadow-lg"
                    >
                      Get Started
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default Navbar;