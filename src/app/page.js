"use client";

import { useState } from "react";
import ReactMarkdown from 'react-markdown';
import Image from 'next/image';
import { auth, googleProvider } from '../../lib/firebase';
import { signInWithPopup, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { useAuthState } from 'react-firebase-hooks/auth';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Enhanced Loading Components
const LoadingSpinner = ({ size = "default", color = "primary" }) => {
  const sizeClasses = {
    small: "w-6 h-6 border-4",
    default: "w-8 h-8 border-4",
    large: "w-12 h-12 border-6"
  };

  return (
    <div className={`${sizeClasses[size]} animate-spin rounded-full border-t-transparent border-${color}`}></div>
  );
};

const ButtonLoader = () => (
  <div className="flex items-center gap-2">
    <LoadingSpinner size="small" />
    <span className="text-sm font-medium">Processing...</span>
  </div>
);

const FileUploadLoader = () => (
  <div className="flex flex-col items-center gap-3">
    <div className="relative">
      <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
      <div className="absolute inset-2 w-12 h-12 bg-primary/10 rounded-full animate-pulse"></div>
    </div>
    <p className="text-sm font-medium text-muted-foreground">Uploading...</p>
  </div>
);

const PDFLoader = () => (
  <div className="flex flex-col items-center gap-3">
    <div className="relative">
      <div className="w-12 h-12 border-4 border-accent/20 border-t-accent rounded-full animate-spin"></div>
      <div className="absolute inset-1 w-8 h-8 bg-accent/10 rounded-full animate-pulse"></div>
    </div>
    <p className="text-sm font-medium text-muted-foreground">Generating PDF...</p>
  </div>
);

export default function Home() {
  const [resumeText, setResumeText] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [output, setOutput] = useState("");
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [fileName, setFileName] = useState("");
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [user, loadingAuth] = useAuthState(auth);
  const [authLoading, setAuthLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [jobResults, setJobResults] = useState([]);
  const [searchingJobs, setSearchingJobs] = useState(false);
  const [generatingPDF, setGeneratingPDF] = useState(false);
  const [isResumeFrozen, setIsResumeFrozen] = useState(false);
  const [activeTab, setActiveTab] = useState('resume');
  const [jobKpi, setJobKpi] = useState(null); // New state for job KPI
  const [validating, setValidating] = useState(false);

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setUploading(true);
    setFileName(file.name);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/extract-text', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (data.text) {
        setResumeText(data.text);
        setIsResumeFrozen(true);
        toast.success(`Successfully uploaded ${file.name}`);
      } else {
        toast.error('Failed to extract text');
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Error uploading file');
    } finally {
      setUploading(false);
    }
  };

  const unlockResumeSection = () => {
    setIsResumeFrozen(false);
    setResumeText("");
    setFileName("");
    setOutput("");
    toast.info("Resume section unlocked");
  };

  // Remove the jobs tab and trigger job search automatically after resume generation
  const handleGenerate = async () => {
    if (!resumeText.trim()) {
      toast.error('Please provide resume content');
      return;
    }

    setGenerating(true);
    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resume: resumeText, jobDescription }),
      });

      const data = await response.json();

      // Accept both { enhancedResume } and { text } as valid output
      if (data.enhancedResume || data.text) {
        const enhanced = data.enhancedResume || data.text;
        setOutput(enhanced);
        toast.success('Resume enhanced successfully!');
        // Trigger job search automatically
        handleSearchJobs(enhanced);
      } else {
        toast.error('Failed to enhance resume');
      }
    } catch (error) {
      console.error('Generate error:', error);
      toast.error('Error enhancing resume');
    } finally {
      setGenerating(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(output);
      setCopied(true);
      toast.success('Copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('Failed to copy');
    }
  };

  const handleGeneratePDF = async () => {
    if (!output) {
      toast.error('No content to generate PDF');
      return;
    }

    setGeneratingPDF(true);
    try {
      const response = await fetch('/api/generate-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: output, jobDescription }),
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'enhanced-resume.pdf';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        toast.success('PDF downloaded successfully!');
      } else {
        const errorData = await response.json().catch(() => ({}));
        toast.error(errorData.error || 'Failed to generate PDF');
      }
    } catch (error) {
      console.error('PDF generation error:', error);
      toast.error('Error generating PDF');
    } finally {
      setGeneratingPDF(false);
    }
  };

  // Update handleSearchJobs to accept resume text
  const handleSearchJobs = async (resumeForJobs) => {
    const resumeToUse = resumeForJobs || output;
    if (!resumeToUse) {
      setJobResults([]);
      setJobKpi(null); // Clear KPI if no resume
      return;
    }
    setSearchingJobs(true);
    try {
      const response = await fetch('/api/search-jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeText: resumeToUse }),
      });
      const data = await response.json();
      if (data.jobs) {
        setJobResults(data.jobs);
        setJobKpi({ answer: data.answer, totalSources: data.totalSources });
        toast.success(`Found ${data.jobs.length} matching jobs!`);
      } else {
        setJobResults([]);
        setJobKpi(null); // Clear KPI if no jobs
        toast.error('No jobs found');
      }
    } catch (error) {
      console.error('Job search error:', error);
      setJobResults([]);
      setJobKpi(null); // Clear KPI on error
      toast.error('Error searching for jobs');
    } finally {
      setSearchingJobs(false);
    }
  };

  const handleValidateContent = async () => {
    if (!output) {
      toast.error('No content to validate');
      return;
    }

    setValidating(true);
    try {
      const response = await fetch('/api/validate-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: output }),
      });

      const data = await response.json();

      if (data.isValid) {
        toast.success('Content validated successfully!');
      } else {
        toast.error('Content validation failed');
      }
    } catch (error) {
      console.error('Validation error:', error);
      toast.error('Error validating content');
    } finally {
      setValidating(false);
    }
  };

  const handleGoogleAuth = async () => {
    setAuthLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
      setShowAuthModal(false);
      toast.success('Signed in with Google!');
    } catch (error) {
      console.error('Google auth error:', error);
      toast.error(error.message.includes('reCAPTCHA') ? 'reCAPTCHA verification failed' : 'Failed to sign in with Google');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    setAuthLoading(true);

    try {
      if (isSignUp) {
        if (password !== confirmPassword) {
          toast.error('Passwords do not match');
          return;
        }
        await createUserWithEmailAndPassword(auth, email, password);
        toast.success('Account created successfully!');
      } else {
        await signInWithEmailAndPassword(auth, email, password);
        toast.success('Signed in successfully!');
      }
      setShowAuthModal(false);
    } catch (error) {
      console.error('Auth error:', error);
      toast.error(error.message.includes('reCAPTCHA') ? 'reCAPTCHA verification failed' : error.message);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      toast.success('Signed out successfully!');
    } catch (error) {
      console.error('Sign out error:', error);
      toast.error('Failed to sign out');
    }
  };

  if (loadingAuth) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="large" />
          <p className="mt-4 text-lg text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background font-inter">
      {/* Modern Dark Navigation */}
      <nav className="sticky top-0 z-50 glass-dark shadow-2xl border-b border-border/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 glass-primary rounded-2xl flex items-center justify-center shadow-lg hover:scale-110 transition-transform duration-300">
                <span className="text-primary-foreground font-bold text-2xl">R</span>
              </div>
              <span className="text-2xl font-bold gradient-text">RoleFitAI</span>
            </div>

            <div className="flex items-center space-x-6">
              {user ? (
                <div className="flex items-center space-x-4">
                  {user.photoURL && (
                    <Image
                      src={user.photoURL}
                      alt="Profile"
                      width={40}
                      height={40}
                      className="w-10 h-10 rounded-full border-2 border-primary/30 shadow-lg hover:scale-110 transition-transform duration-300"
                    />
                  )}
                  <span className="text-sm font-semibold text-foreground hidden sm:block">
                    {user.displayName || user.email?.split('@')[0]}
                  </span>
                  <button
                    onClick={handleSignOut}
                    className="btn-secondary px-4 py-2 text-sm"
                  >
                    Sign Out
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowAuthModal(true)}
                  className="btn-primary px-6 py-3 text-sm"
                >
                  Sign In
                </button>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section with Dark Theme */}
      <section className="relative py-32 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-secondary/5 to-accent/10"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(99,102,241,0.1),transparent_50%)]"></div>
        <div className="relative max-w-6xl mx-auto text-center">
          <h1 className="text-6xl md:text-8xl font-bold text-foreground mb-8 leading-tight">
            <span className="gradient-text animate-gradient">
              Transform Your Career
            </span>
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground mb-12 max-w-4xl mx-auto leading-relaxed">
            RoleFitAI uses cutting-edge AI to optimize your resume for ATS systems and tailor it to your dream job.
            <br className="hidden md:block" />
            Professional, optimized, and ready for success.
          </p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
            <button
              onClick={() => document.getElementById('main-content').scrollIntoView({ behavior: 'smooth' })}
              className="btn-primary px-12 py-5 text-xl"
            >
              🚀 Start Now
            </button>
            <button
              onClick={() => document.getElementById('features').scrollIntoView({ behavior: 'smooth' })}
              className="btn-secondary px-12 py-5 text-xl"
            >
              📚 Explore Features
            </button>
          </div>
        </div>
      </section>

      {/* Main Content with Improved Layout */}
      <main id="main-content" className="max-w-7xl mx-auto px-4 py-16">
        {/* Enhanced Tab Navigation */}
        <div className="flex justify-center mb-16">
          <div className="glass rounded-3xl p-2 shadow-2xl">
            <button
              onClick={() => setActiveTab('resume')}
              className={`px-8 py-4 rounded-2xl text-sm font-semibold transition-all duration-300 ${activeTab === 'resume'
                  ? 'bg-primary text-primary-foreground shadow-lg scale-105'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                }`}
            >
              ✨ Resume Enhancement
            </button>
            {/* Remove Job Search Tab */}
          </div>
        </div>

        {/* Resume Enhancement Tab */}
        {activeTab === 'resume' && (
          <div className="space-y-12">
            <div className="card p-12 card-hover">
              <div className="text-center mb-12">
                <h2 className="text-5xl font-bold gradient-text mb-4">Enhance Your Resume</h2>
                <p className="text-xl text-muted-foreground">Upload or paste your resume to get AI-optimized results</p>
              </div>

              <div className="grid lg:grid-cols-2 gap-12">
                <div className="space-y-6">
                  <input
                    type="file"
                    id="file-upload"
                    accept=".pdf,.doc,.docx,.txt"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <label
                    htmlFor="file-upload"
                    className="cursor-pointer flex flex-col items-center justify-center w-full h-48 glass-secondary rounded-2xl hover:shadow-2xl hover:scale-105 transition-all duration-500 group"
                  >
                    {uploading ? (
                      <FileUploadLoader />
                    ) : (
                      <>
                        <div className="text-6xl mb-4 group-hover:scale-110 transition-transform duration-300">
                          {fileName ? "📄" : "📁"}
                        </div>
                        <div className="font-semibold text-foreground text-xl">{fileName || "Upload Resume"}</div>
                        <div className="text-muted-foreground">Supports PDF, DOC, DOCX, TXT</div>
                      </>
                    )}
                  </label>
                  {fileName && (
                    <div className="text-center">
                      <div className="inline-flex items-center gap-3 px-6 py-3 glass-accent rounded-xl">
                        <span>📄 {fileName}</span>
                        <button
                          onClick={() => {
                            setFileName("");
                            setResumeText("");
                            setIsResumeFrozen(false);
                          }}
                          className="text-accent hover:text-accent/80 transition-colors"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-6">
                  <label className="block text-lg font-semibold text-foreground">Resume Content</label>
                  <textarea
                    className={`w-full h-48 p-6 rounded-2xl border border-border text-foreground placeholder-muted-foreground focus:ring-2 focus:ring-primary/50 transition-all duration-300 resize-none ${isResumeFrozen ? 'bg-muted/50 cursor-not-allowed' : 'bg-input'
                      }`}
                    placeholder={isResumeFrozen ? "Resume locked - Upload new file to edit" : "Paste your resume here..."}
                    value={resumeText}
                    onChange={(e) => !isResumeFrozen && setResumeText(e.target.value)}
                    disabled={isResumeFrozen}
                  />
                  {isResumeFrozen && (
                    <div className="text-center">
                      <button
                        onClick={unlockResumeSection}
                        className="btn-primary px-6 py-3 text-sm"
                      >
                        🔓 Unlock Resume
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-12">
                <label className="block text-lg font-semibold text-foreground mb-4">Job Description (Optional)</label>
                <textarea
                  className="input-field h-36 resize-none"
                  placeholder="Paste job description for tailored enhancements..."
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                />
              </div>

              <div className="mt-16 text-center">
                <button
                  onClick={handleGenerate}
                  disabled={!resumeText.trim() || generating}
                  className="btn-accent px-16 py-6 text-2xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {generating ? <ButtonLoader /> : '✨ Enhance Resume with AI'}
                </button>
              </div>
            </div>

            {/* Enhanced Output Section */}
            {output && (
              <div className="card p-12 card-hover">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-4xl font-bold gradient-text">Enhanced Resume</h2>
                  <div className="flex gap-4">
                    <button
                      onClick={handleCopy}
                      disabled={copied}
                      className="btn-primary px-6 py-3 text-sm"
                    >
                      {copied ? '✅ Copied!' : '📋 Copy'}
                    </button>
                    <button
                      onClick={handleGeneratePDF}
                      disabled={generatingPDF}
                      className="btn-accent px-6 py-3 text-sm"
                    >
                      {generatingPDF ? <PDFLoader /> : '📄 Download PDF'}
                    </button>
                  </div>
                </div>

                {/* Scrollable Enhanced Resume Output */}
                <div className="glass-secondary rounded-2xl p-8 max-h-96 overflow-y-auto">
                  <ReactMarkdown class="prose prose-lg text-foreground prose-headings:text-foreground prose-p:text-muted-foreground prose-strong:text-foreground prose-code:text-accent">
                    {output}
                  </ReactMarkdown>
                </div>

                {/* Job Results Section */}
                {jobResults.length > 0 && (
                  <div className="mt-12">
                    {/* KPI and summary */}
                    <div className="mb-8 p-6 rounded-2xl bg-gradient-to-r from-primary/10 to-accent/10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <span className="text-3xl">💼</span>
                        <div>
                          <div className="text-lg font-bold text-primary">{jobResults.length} Remote Software Engineer Jobs Found</div>
                          {jobKpi && jobKpi.totalSources && (
                            <div className="text-sm text-muted-foreground">Sourced from {jobKpi.totalSources} platforms</div>
                          )}
                        </div>
                      </div>
                      {jobKpi && jobKpi.answer && (
                        <div className="text-sm text-muted-foreground max-w-2xl">{jobKpi.answer}</div>
                      )}
                    </div>
                    <h3 className="text-3xl font-bold gradient-text mb-6">Matching Jobs</h3>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                      {jobResults.map((job, index) => (
                        <div key={index} className="glass rounded-2xl p-6 card-hover">
                          <div className="flex items-center gap-3 mb-4">
                            <span className="text-3xl">{job.siteIcon}</span>
                            <div>
                              <div className="font-semibold text-foreground">{job.siteName}</div>
                              <div className="text-sm text-muted-foreground">{job.type}</div>
                            </div>
                          </div>
                          <h3 className="font-semibold text-foreground mb-3 text-lg">{job.jobTitle}</h3>
                          <div className="text-sm text-muted-foreground mb-6">
                            <div className="font-medium">{job.company}</div>
                            <div>{job.location}</div>
                          </div>
                          <a
                            href={job.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn-primary px-6 py-3 text-sm text-center block"
                          >
                            Apply Now
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Features Section with Dark Theme */}
        <section id="features" className="py-24 px-4 bg-muted/20">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-20">
              <h2 className="text-6xl font-bold gradient-text mb-6">Why RoleFitAI?</h2>
              <p className="text-xl text-muted-foreground max-w-4xl mx-auto leading-relaxed">
                Our cutting-edge AI technology transforms your resume into a powerful tool that passes ATS systems and impresses recruiters.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-12">
              <div className="card p-10 text-center card-hover">
                <div className="w-24 h-24 glass-primary rounded-3xl flex items-center justify-center mx-auto mb-8 group-hover:scale-110 transition-transform duration-300">
                  <span className="text-4xl">🤖</span>
                </div>
                <h3 className="text-2xl font-semibold text-foreground mb-6">AI Optimization</h3>
                <p className="text-muted-foreground leading-relaxed text-lg">
                  Advanced AI tailors your resume with industry-specific keywords and professional formatting.
                </p>
              </div>

              <div className="card p-10 text-center card-hover">
                <div className="w-24 h-24 glass-secondary rounded-3xl flex items-center justify-center mx-auto mb-8 group-hover:scale-110 transition-transform duration-300">
                  <span className="text-4xl">📊</span>
                </div>
                <h3 className="text-2xl font-semibold text-foreground mb-6">ATS Compatibility</h3>
                <p className="text-muted-foreground leading-relaxed text-lg">
                  Ensure your resume passes Applicant Tracking Systems with intelligent keyword optimization.
                </p>
              </div>

              <div className="card p-10 text-center card-hover">
                <div className="w-24 h-24 glass-accent rounded-3xl flex items-center justify-center mx-auto mb-8 group-hover:scale-110 transition-transform duration-300">
                  <span className="text-4xl">⚡</span>
                </div>
                <h3 className="text-2xl font-semibold text-foreground mb-6">Instant Results</h3>
                <p className="text-muted-foreground leading-relaxed text-lg">
                  Get professional-grade resumes in seconds with our instant enhancement tools.
                </p>
              </div>
            </div>
          </div>
        </section>

        <footer className="glass-dark border-t border-border">
          <div className="max-w-7xl mx-auto px-4 py-12 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="text-center md:text-left">
              <p className="text-muted-foreground text-base md:text-lg">
                © {new Date().getFullYear()} RoleFitAI. All rights reserved.
              </p>
              <p className="text-muted-foreground text-sm mt-2">
                Last updated: August 17, 2025, 03:48 PM IST
              </p>
            </div>
            <div className="flex justify-center md:justify-end">
              <a
                href="https://www.buymeacoffee.com/manicdon7h"
                target="_blank"
                rel="noopener noreferrer"
                className="transition-transform hover:scale-105"
              >
                <img
                  src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png"
                  alt="Buy Me A Coffee"
                  style={{ height: '50px', width: '180px' }}
                />
              </a>
            </div>
          </div>
        </footer>

        {/* Authentication Modal with Dark Theme */}
        {showAuthModal && (
          <div className="fixed inset-0 glass-dark z-50 flex items-center justify-center p-4">
            <div className="card p-10 max-w-md w-full shadow-2xl">
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-3xl font-bold gradient-text">
                  {isSignUp ? 'Sign Up' : 'Sign In'}
                </h2>
                <button
                  onClick={() => setShowAuthModal(false)}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <button
                onClick={handleGoogleAuth}
                disabled={authLoading}
                className="btn-secondary w-full flex items-center justify-center px-4 py-4 text-sm mb-6"
              >
                <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                {authLoading ? 'Processing...' : 'Continue with Google'}
              </button>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-background text-muted-foreground">Or use email</span>
                </div>
              </div>

              <form onSubmit={handleEmailAuth} className="space-y-6">
                {isSignUp && (
                  <input
                    type="text"
                    placeholder="Full Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="input-field"
                  />
                )}
                <input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="input-field"
                />
                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="input-field"
                />
                {isSignUp && (
                  <input
                    type="password"
                    placeholder="Confirm Password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="input-field"
                  />
                )}
                <button
                  type="submit"
                  disabled={authLoading}
                  className="btn-primary w-full px-4 py-4 text-sm"
                >
                  {authLoading ? 'Processing...' : (isSignUp ? 'Sign Up' : 'Sign In')}
                </button>
              </form>

              <div className="mt-6 text-center">
                <button
                  onClick={() => setIsSignUp(!isSignUp)}
                  className="text-sm text-primary hover:text-primary/80 transition-colors"
                >
                  {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
                </button>
              </div>
            </div>
          </div>
        )}

        <ToastContainer
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="dark"
          toastStyle={{ backgroundColor: '#1F2937', color: '#F3F4F6', borderRadius: '12px', padding: '16px' }}
          progressStyle={{ backgroundColor: '#6366F1' }}
        />
      </main>
    </div>
  );
}