"use client";

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../../../lib/firebase';
import Navbar from '@/components/Navbar';

export default function TermsOfService() {
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
          <h1 className="text-4xl font-bold text-white mb-8 text-center">Terms of Service</h1>
          
          <div className="prose prose-invert max-w-none text-white/80">
            <p className="text-lg mb-6">
              <strong>Last updated:</strong> {new Date().toLocaleDateString()}
            </p>

            <h2 className="text-2xl font-bold text-white mt-8 mb-4">1. Acceptance of Terms</h2>
            <p className="mb-4">
              By accessing and using RoleFitAI (&ldquo;the Service&rdquo;), you accept and agree to be bound by the terms and provision of this agreement.
            </p>

            <h2 className="text-2xl font-bold text-white mt-8 mb-4">2. Description of Service</h2>
            <p className="mb-4">
              RoleFitAI is an AI-powered resume and cover letter enhancement service that helps users optimize their job application materials for better ATS compatibility and professional presentation.
            </p>

            <h2 className="text-2xl font-bold text-white mt-8 mb-4">3. User Responsibilities</h2>
            <ul className="list-disc pl-6 mb-4">
              <li>You are responsible for the accuracy of information you provide</li>
              <li>You must not use the service for any illegal or unauthorized purpose</li>
              <li>You must not violate any laws in your jurisdiction</li>
              <li>You are responsible for maintaining the confidentiality of your account</li>
            </ul>

            <h2 className="text-2xl font-bold text-white mt-8 mb-4">4. Content and Privacy</h2>
            <p className="mb-4">
              We respect your privacy and handle your resume data with care. Your uploaded content is processed to provide enhancement services and is not stored permanently on our servers.
            </p>

            <h2 className="text-2xl font-bold text-white mt-8 mb-4">5. AI-Generated Content</h2>
            <p className="mb-4">
              Our service uses artificial intelligence to enhance resumes and generate cover letters. While we strive for accuracy, users should review and verify all AI-generated content before use.
            </p>

            <h2 className="text-2xl font-bold text-white mt-8 mb-4">6. Limitation of Liability</h2>
            <p className="mb-4">
              RoleFitAI shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of the service.
            </p>

            <h2 className="text-2xl font-bold text-white mt-8 mb-4">7. Service Availability</h2>
            <p className="mb-4">
              We strive to maintain service availability but do not guarantee uninterrupted access. The service may be temporarily unavailable for maintenance or updates.
            </p>

            <h2 className="text-2xl font-bold text-white mt-8 mb-4">8. Modifications to Terms</h2>
            <p className="mb-4">
              We reserve the right to modify these terms at any time. Users will be notified of significant changes through the service.
            </p>

            <h2 className="text-2xl font-bold text-white mt-8 mb-4">9. Contact Information</h2>
            <p className="mb-4">
              If you have any questions about these Terms of Service, please contact us through our contact page.
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