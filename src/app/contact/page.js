"use client";

import { useState } from 'react';
import { Mail, MessageCircle, Globe } from 'lucide-react';
import { toast } from 'react-hot-toast';
import Link from 'next/link';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../../../lib/firebase';
import Navbar from '@/components/Navbar';
import { ToastContainer } from 'react-toastify';

export default function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [sending, setSending] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
    });
    return () => unsubscribe();
  }, []);

  const handleSignOut = async () => {
    try {
      await auth.signOut();
      window.location.href = '/';
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSending(true);

    // Simulate form submission (you can integrate with your preferred email service)
    setTimeout(() => {
      toast.success('Message sent successfully! We\'ll get back to you soon.');
      setFormData({ name: '', email: '', subject: '', message: '' });
      setSending(false);
    }, 2000);
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="min-h-screen bg-black">
      <Navbar user={user} onSignOut={handleSignOut} />
      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="bg-white/5 backdrop-blur-md rounded-3xl border border-white/10 p-8">
          <h1 className="text-4xl font-bold text-white mb-8 text-center">Contact Us</h1>
          
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="text-center mb-16">
              <h1 className="text-5xl md:text-7xl font-bold mb-6">
                <span className="bg-gradient-to-r from-purple-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent">
                  Get in Touch
                </span>
              </h1>
              <p className="text-xl text-gray-300 max-w-3xl mx-auto">
                Have questions about RoleFitAI? We're here to help you succeed in your career journey.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              {/* Contact Information */}
              <div className="text-white/80">
                <h2 className="text-2xl font-bold text-white mb-6">Get in Touch</h2>
                <p className="mb-6">
                  Have questions about RoleFitAI? Need help with your resume enhancement? 
                  We're here to help you succeed in your job search journey.
                </p>

                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                      <Mail className="w-5 h-5 text-purple-400" />
                    </div>
                    <div>
                      <div className="font-semibold text-white">Email</div>
                      <div className="text-white/70">support@rolefitai.com</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                      <MessageCircle className="w-5 h-5 text-blue-400" />
                    </div>
                    <div>
                      <div className="font-semibold text-white">Response Time</div>
                      <div className="text-white/70">Within 24 hours</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                      <Globe className="w-5 h-5 text-green-400" />
                    </div>
                    <div>
                      <div className="font-semibold text-white">Availability</div>
                      <div className="text-white/70">24/7 Online Service</div>
                    </div>
                  </div>
                </div>

                <div className="mt-8">
                  <h3 className="text-xl font-bold text-white mb-4">Frequently Asked Questions</h3>
                  <div className="space-y-3 text-sm">
                    <div>
                      <div className="font-semibold text-white">How does RoleFitAI work?</div>
                      <div className="text-white/70">Upload your resume and job description, and our AI will enhance your content for better ATS compatibility.</div>
                    </div>
                    <div>
                      <div className="font-semibold text-white">Is my data secure?</div>
                      <div className="text-white/70">Yes, we use industry-standard encryption and don't store your resume content permanently.</div>
                    </div>
                    <div>
                      <div className="font-semibold text-white">Is RoleFitAI free?</div>
                      <div className="text-white/70">Yes, our core features are completely free to use with no signup required.</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Contact Form */}
              <div>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label htmlFor="name" className="block text-sm font-semibold text-white mb-2">
                      Full Name
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                      placeholder="Enter your full name"
                    />
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-sm font-semibold text-white mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                      placeholder="Enter your email address"
                    />
                  </div>

                  <div>
                    <label className="block text-white font-medium mb-2">Subject</label>
                    <select
                      name="subject"
                      value={formData.subject}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                      <option value="">Select a subject</option>
                      <option value="general">General Inquiry</option>
                      <option value="technical">Technical Support</option>
                      <option value="feature">Feature Request</option>
                      <option value="bug">Bug Report</option>
                      <option value="partnership">Partnership</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="message" className="block text-sm font-semibold text-white mb-2">
                      Message
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      rows={6}
                      value={formData.message}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none transition-all duration-200"
                      placeholder="Tell us how we can help you..."
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-4 px-6 rounded-xl font-semibold hover:from-purple-700 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-purple-500/25"
                  >
                    {isSubmitting ? 'Sending...' : 'Send Message'}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark"
      />
    </div>
  );
}