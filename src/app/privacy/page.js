"use client";

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../../../lib/firebase';
import Navbar from '@/components/Navbar';

export default function PrivacyPolicy() {
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <Navbar user={user} onSignOut={handleSignOut} />
      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="bg-white/5 backdrop-blur-md rounded-3xl border border-white/10 p-8">
          <h1 className="text-4xl font-bold text-white mb-8 text-center">Privacy Policy</h1>
          
          <div className="prose prose-invert max-w-none text-white/80">
            <p className="text-lg mb-6">
              <strong>Last updated:</strong> {new Date().toLocaleDateString()}
            </p>

            <h2 className="text-2xl font-bold text-white mt-8 mb-4">1. Information We Collect</h2>
            <p className="mb-4">
              We collect information you provide directly to us, such as:
            </p>
            <ul className="list-disc pl-6 mb-4">
              <li>Resume content and job descriptions you upload or input</li>
              <li>Account information when you sign up (email, name)</li>
              <li>Usage data and analytics to improve our service</li>
            </ul>

            <h2 className="text-2xl font-bold text-white mt-8 mb-4">2. How We Use Your Information</h2>
            <p className="mb-4">
              We use the information we collect to:
            </p>
            <ul className="list-disc pl-6 mb-4">
              <li>Provide and improve our AI-powered resume enhancement services</li>
              <li>Generate personalized cover letters and job recommendations</li>
              <li>Communicate with you about your account and our services</li>
              <li>Analyze usage patterns to enhance user experience</li>
            </ul>

            <h2 className="text-2xl font-bold text-white mt-8 mb-4">3. Data Processing and AI</h2>
            <p className="mb-4">
              Your resume content is processed by our AI systems to provide enhancement services. We use third-party AI services (Pollinations AI) to generate improved content. Your data is transmitted securely and is not permanently stored by these services.
            </p>

            <h2 className="text-2xl font-bold text-white mt-8 mb-4">4. Data Storage and Security</h2>
            <p className="mb-4">
              We implement appropriate security measures to protect your personal information:
            </p>
            <ul className="list-disc pl-6 mb-4">
              <li>Resume content is processed temporarily and not stored long-term</li>
              <li>Account data is stored securely using industry-standard encryption</li>
              <li>We use Firebase Authentication for secure user management</li>
              <li>All data transmission is encrypted using HTTPS</li>
            </ul>

            <h2 className="text-2xl font-bold text-white mt-8 mb-4">5. Third-Party Services</h2>
            <p className="mb-4">
              We use the following third-party services:
            </p>
            <ul className="list-disc pl-6 mb-4">
              <li><strong>Firebase:</strong> For authentication and user management</li>
              <li><strong>Pollinations AI:</strong> For AI-powered content generation</li>
              <li><strong>Web Search API:</strong> For job opportunity discovery</li>
              <li><strong>MongoDB:</strong> For secure data storage</li>
            </ul>

            <h2 className="text-2xl font-bold text-white mt-8 mb-4">6. Data Retention</h2>
            <p className="mb-4">
              We retain your information only as long as necessary to provide our services. Resume content uploaded for processing is not permanently stored and is deleted after processing.
            </p>

            <h2 className="text-2xl font-bold text-white mt-8 mb-4">7. Your Rights</h2>
            <p className="mb-4">
              You have the right to:
            </p>
            <ul className="list-disc pl-6 mb-4">
              <li>Access your personal information</li>
              <li>Correct inaccurate information</li>
              <li>Delete your account and associated data</li>
              <li>Opt-out of communications</li>
            </ul>

            <h2 className="text-2xl font-bold text-white mt-8 mb-4">8. Cookies and Analytics</h2>
            <p className="mb-4">
              We use cookies and similar technologies to improve your experience and analyze usage patterns. You can control cookie settings through your browser.
            </p>

            <h2 className="text-2xl font-bold text-white mt-8 mb-4">9. Changes to Privacy Policy</h2>
            <p className="mb-4">
              We may update this privacy policy from time to time. We will notify users of any material changes through the service or via email.
            </p>

            <h2 className="text-2xl font-bold text-white mt-8 mb-4">10. Contact Us</h2>
            <p className="mb-4">
              If you have any questions about this Privacy Policy, please contact us through our contact page or email us directly.
            </p>
          </div>

          <div className="mt-8 text-center">
            <Link
              href="/"
              className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl hover:from-purple-600 hover:to-pink-600 transition-all duration-300 font-semibold"
            >
              Back to RoleFitAI
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}