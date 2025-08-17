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
    small: "w-6 h-6 border-2",
    default: "w-8 h-8 border-4",
    large: "w-12 h-12 border-4"
  };

  const colorClasses = {
    primary: "border-primary border-t-transparent",
    accent: "border-accent border-t-transparent",
    secondary: "border-secondary border-t-transparent"
  };

  return (
    <div className={`${sizeClasses[size]} ${colorClasses[color]} animate-spin rounded-full`}></div>
  );
};

const ButtonLoader = ({ text = "Processing..." }) => (
  <div className="flex items-center gap-3">
    <LoadingSpinner size="small" />
    <span className="text-sm font-medium">{text}</span>
  </div>
);

const FileUploadLoader = () => (
  <div className="flex flex-col items-center gap-4">
    <div className="relative">
      <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
      <div className="absolute inset-2 w-12 h-12 bg-primary/10 rounded-full animate-pulse"></div>
    </div>
    <p className="text-sm font-medium text-muted-foreground animate-pulse">Uploading and processing...</p>
  </div>
);

const PDFLoader = () => (
  <div className="flex flex-col items-center gap-3">
    <div className="relative">
      <div className="w-12 h-12 border-4 border-accent/20 border-t-accent rounded-full animate-spin"></div>
      <div className="absolute inset-1 w-8 h-8 bg-accent/10 rounded-full animate-pulse"></div>
    </div>
    <p className="text-sm font-medium text-muted-foreground">Generating cover letter PDF...</p>
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
  const [extractedName, setExtractedName] = useState(''); // Store extracted name separately
  const [jobResults, setJobResults] = useState([]);
  const [searchingJobs, setSearchingJobs] = useState(false);
  const [generatingPDF, setGeneratingPDF] = useState(false);
  const [isResumeFrozen, setIsResumeFrozen] = useState(false);
  const [activeTab, setActiveTab] = useState('resume');
  const [jobKpi, setJobKpi] = useState(null);
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
        // Extract name immediately after successful upload
        await extractNameFromContent(data.text);
        toast.success(`Successfully uploaded ${file.name}`);
      } else {
        toast.error('Failed to extract text from file');
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
    setExtractedName("");
    setJobResults([]);
    setJobKpi(null);
    toast.info("Resume section unlocked");
  };

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

      if (data.enhancedResume || data.text) {
        const enhanced = data.enhancedResume || data.text;
        setOutput(enhanced);
        toast.success('Resume enhanced successfully!');
        
        // Extract name from enhanced resume if not already extracted
        if (!extractedName) {
          await extractNameFromContent(enhanced);
        }
        
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

  const extractNameFromContent = async (content) => {
    try {
      const response = await fetch('https://text.pollinations.ai/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{
            role: 'user',
            content: `Extract only the full name of the person from this resume content. Return just the name as a clean string without any additional text or formatting: ${content.substring(0, 1000)}`
          }],
          model: 'openai',
        }),
      });

      if (response.ok) {
        const nameResponse = await response.text();
        const cleanName = nameResponse.trim()
          .replace(/^(Name:|Full Name:)/i, '')
          .replace(/['"]/g, '')
          .trim();
        
        if (cleanName && cleanName.toLowerCase() !== 'unknown' && cleanName.length > 1) {
          setExtractedName(cleanName);
          // toast.success(`Name extracted: ${cleanName}`);
        } else {
          setExtractedName('Professional Candidate');
          toast.info('Using default name');
        }
      } else {
        setExtractedName('Professional Candidate');
        console.error('Name extraction API failed');
      }
    } catch (error) {
      console.error('Name extraction error:', error);
      setExtractedName('Professional Candidate');
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(output);
      setCopied(true);
      toast.success('Content copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('Failed to copy to clipboard');
    }
  };

  const handleGeneratePDF = async () => {
    if (!output) {
      toast.error('No enhanced resume content to generate cover letter');
      return;
    }

    if (!extractedName) {
      toast.warning('Extracting name first...');
      await extractNameFromContent(output);
    }

    const nameToUse = extractedName || user?.displayName || 'Professional Candidate';

    setGeneratingPDF(true);
    try {
      const response = await fetch('/api/generate-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          content: output, 
          jobDescription: jobDescription || 'General position application',
          name: nameToUse
        }),
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${nameToUse.replace(/\s+/g, '_')}_Cover_Letter.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        toast.success(`Cover letter PDF downloaded for ${nameToUse}!`);
      } else {
        const errorData = await response.json().catch(() => ({}));
        toast.error(errorData.error || 'Failed to generate PDF');
      }
    } catch (error) {
      console.error('PDF generation error:', error);
      toast.error('Error generating cover letter PDF');
    } finally {
      setGeneratingPDF(false);
    }
  };

  const handleSearchJobs = async (resumeForJobs) => {
    const resumeToUse = resumeForJobs || output;
    if (!resumeToUse) {
      setJobResults([]);
      setJobKpi(null);
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
        setJobKpi(null);
        toast.error('No matching jobs found');
      }
    } catch (error) {
      console.error('Job search error:', error);
      setJobResults([]);
      setJobKpi(null);
      toast.error('Error searching for jobs');
    } finally {
      setSearchingJobs(false);
    }
  };

  const handleGoogleAuth = async () => {
    setAuthLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
      setShowAuthModal(false);
      toast.success('Successfully signed in with Google!');
    } catch (error) {
      console.error('Google auth error:', error);
      toast.error('Failed to sign in with Google');
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
          setAuthLoading(false);
          return;
        }
        await createUserWithEmailAndPassword(auth, email, password);
        toast.success('Account created successfully!');
      } else {
        await signInWithEmailAndPassword(auth, email, password);
        toast.success('Signed in successfully!');
      }
      setShowAuthModal(false);
      setEmail('');
      setPassword('');
      setConfirmPassword('');
    } catch (error) {
      console.error('Auth error:', error);
      const errorMessage = error.code === 'auth/invalid-credential' 
        ? 'Invalid email or password' 
        : error.message;
      toast.error(errorMessage);
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
        <div className="text-center space-y-4">
          <LoadingSpinner size="large" />
          <p className="text-lg text-muted-foreground">Loading RoleFitAI...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background font-inter">
      {/* Modern Navigation */}
      <nav className="sticky top-0 z-50 backdrop-blur-md bg-background/80 shadow-lg border-b border-border/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              {/* <div className="w-10 h-10 bg-gradient-to-r from-primary to-accent rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-primary-foreground font-bold text-xl">R</span>
              </div> */}
              <span className="text-xl font-bold gradient-text animate-gradient">
                <Image src="/logo.png" alt="RoleFitAI" width={150} height={200} />
              </span>
            </div>

            <div className="flex items-center space-x-4">
              {user ? (
                <div className="flex items-center space-x-3">
                  {user.photoURL && (
                    <Image
                      src={user.photoURL}
                      alt="Profile"
                      width={32}
                      height={32}
                      className="w-8 h-8 rounded-full border-2 border-primary/30"
                    />
                  )}
                  <span className="text-sm font-medium text-foreground hidden sm:block">
                    {user.displayName || user.email?.split('@')[0]}
                  </span>
                  <button
                    onClick={handleSignOut}
                    className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground border border-border rounded-lg hover:bg-muted/50 transition-all duration-200"
                  >
                    Sign Out
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowAuthModal(true)}
                  className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all duration-200"
                >
                  Sign In
                </button>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative py-20 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5"></div>
        <div className="relative max-w-4xl mx-auto text-center">
        <h1 className="text-6xl md:text-8xl font-bold text-foreground mb-8 leading-tight">
            <span className="gradient-text animate-gradient">
              Transform Your Career
            </span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-3xl mx-auto leading-relaxed">
            RoleFitAI uses cutting-edge AI to optimize your resume for ATS systems and tailor it to your dream job.
            Get professional results in seconds.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button
              onClick={() => document.getElementById('main-content')?.scrollIntoView({ behavior: 'smooth' })}
              className="px-8 py-3 border hover:border-white border-primary text-primary-foreground rounded-lg transition-all duration-200 font-medium"
            >
              Start Now
            </button>
            <button
              onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
              className="px-8 py-3 border hover:border-white rounded-lg hover:bg-muted/50 transition-all duration-200 font-medium"
            >
            Learn More
            </button>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main id="main-content" className="max-w-6xl mx-auto px-4 py-12">
        {/* Resume Enhancement Section */}
        <div className="bg-card border border-border rounded-2xl p-8 shadow-lg">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-foreground mb-3">Enhance Your Resume</h2>
            <p className="text-lg text-muted-foreground">Upload or paste your resume to get AI-optimized results</p>
            {extractedName && (
              <div className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/20 rounded-lg">
                <span className="text-sm font-medium text-primary">👤 Extracted Name: {extractedName}</span>
              </div>
            )}
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* File Upload */}
            <div className="space-y-4">
              <input
                type="file"
                id="file-upload"
                accept=".pdf,.doc,.docx,.txt"
                onChange={handleFileUpload}
                className="hidden"
                disabled={uploading}
              />
              <label
                htmlFor="file-upload"
                className="cursor-pointer flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-border rounded-xl hover:border-primary/50 hover:bg-muted/20 transition-all duration-300 group"
              >
                {uploading ? (
                  <FileUploadLoader />
                ) : (
                  <>
                    <div className="text-4xl mb-3 group-hover:scale-110 transition-transform duration-300">
                      {fileName ? "📄" : "📁"}
                    </div>
                    <div className="font-semibold text-foreground">{fileName || "Upload Resume"}</div>
                    <div className="text-sm text-muted-foreground">PDF, DOC, DOCX, TXT supported</div>
                  </>
                )}
              </label>
              
              {fileName && (
                <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                  <span className="text-sm font-medium flex items-center gap-2">
                    📄 {fileName}
                  </span>
                  <button
                    onClick={() => {
                      setFileName("");
                      setResumeText("");
                      setIsResumeFrozen(false);
                      setExtractedName("");
                    }}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    ✕
                  </button>
                </div>
              )}
            </div>

            {/* Resume Content */}
            <div className="space-y-4">
              <label className="block text-sm font-semibold text-foreground">Resume Content</label>
              <textarea
                className={`w-full h-40 p-4 rounded-xl border border-border bg-background text-foreground placeholder-muted-foreground focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all duration-300 resize-none ${
                  isResumeFrozen ? 'bg-muted/30 cursor-not-allowed' : ''
                }`}
                placeholder={isResumeFrozen ? "Resume locked - Upload new file to edit" : "Paste your resume here..."}
                value={resumeText}
                onChange={(e) => !isResumeFrozen && setResumeText(e.target.value)}
                disabled={isResumeFrozen}
              />
              {/* {isResumeFrozen && (
                <button
                  onClick={unlockResumeSection}
                  className="px-4 py-2 text-sm font-medium bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/90 transition-all duration-200"
                >
                  🔓 Unlock Resume
                </button>
              )} */}
            </div>
          </div>

          {/* Job Description */}
          <div className="mt-8">
            <label className="block text-sm font-semibold text-foreground mb-3">
              Job Description (Optional)
            </label>
            <textarea
              className="w-full h-32 p-4 rounded-xl border border-border bg-background text-foreground placeholder-muted-foreground focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all duration-300 resize-none"
              placeholder="Paste job description for tailored enhancements..."
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
            />
          </div>

          {/* Generate Button */}
          <div className="mt-8 text-center">
            <button
              onClick={handleGenerate}
              disabled={!resumeText.trim() || generating}
              className="px-12 py-4 border border-white rounded-xl text-lg font-medium cursor-pointer bg-accent text-accent-foreground hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              {generating ? <ButtonLoader text="Enhancing Resume..." /> : '✨ Enhance Resume with AI'}
            </button>
          </div>
        </div>

        {/* Enhanced Output Section */}
        {output && (
          <div className="mt-12 bg-card border border-border rounded-2xl p-8 shadow-lg">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
              <h2 className="text-2xl font-bold text-foreground">Enhanced Resume</h2>
              <div className="flex gap-3">
                <button
                  onClick={handleCopy}
                  disabled={copied}
                  className="px-4 py-2 text-sm font-medium cursor-pointer bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-all duration-200"
                >
                  {copied ? '✅ Copied!' : '📋 Copy'}
                </button>
                <button
                  onClick={handleGeneratePDF}
                  disabled={generatingPDF}
                  className="px-4 py-2 text-sm cursor-pointer font-medium bg-accent text-accent-foreground rounded-lg hover:bg-accent/90 disabled:opacity-50 transition-all duration-200"
                >
                  {generatingPDF ? <PDFLoader /> : '📄 Cover Letter PDF'}
                </button>
              </div>
            </div>

            {/* Resume Output */}
            <div className="bg-muted/20 rounded-xl p-6 max-h-96 overflow-y-auto border border-border">
              <ReactMarkdown class="prose prose-sm max-w-none text-foreground prose-headings:text-foreground prose-p:text-muted-foreground prose-strong:text-foreground prose-code:text-accent">
                {output}
              </ReactMarkdown>
            </div>

            {/* Job Search Results */}
            {searchingJobs && (
              <div className="mt-8 text-center">
                <ButtonLoader text="Searching for matching jobs..." />
              </div>
            )}

            {jobResults.length > 0 && (
              <div className="mt-8">
                <div className="mb-6 p-4 rounded-xl bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-2xl">💼</span>
                    <div>
                      <div className="text-lg font-bold text-primary">
                        {jobResults.length} Matching Jobs Found
                      </div>
                      {jobKpi && jobKpi.totalSources && (
                        <div className="text-sm text-muted-foreground">
                          Sourced from {jobKpi.totalSources} platforms
                        </div>
                      )}
                    </div>
                  </div>
                  {jobKpi && jobKpi.answer && (
                    <p className="text-sm text-muted-foreground">{jobKpi.answer}</p>
                  )}
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {jobResults.map((job, index) => (
                    <div key={index} className="bg-card border border-border rounded-xl p-6 hover:shadow-lg transition-all duration-300">
                      <div className="flex items-center gap-3 mb-4">
                        <span className="text-2xl">{job.siteIcon}</span>
                        <div>
                          <div className="font-semibold text-foreground text-sm">{job.siteName}</div>
                          <div className="text-xs text-muted-foreground">{job.type}</div>
                        </div>
                      </div>
                      <h3 className="font-semibold text-foreground mb-3 line-clamp-2">{job.jobTitle}</h3>
                      <div className="text-sm text-muted-foreground mb-4 space-y-1">
                        <div className="font-medium">{job.company}</div>
                        <div>{job.location}</div>
                      </div>
                      <a
                        href={job.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block w-full text-center px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all duration-200 text-sm font-medium"
                      >
                        Apply Now →
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Features Section */}
        <section id="features" className="mt-20 py-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">Why Choose RoleFitAI?</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Transform your resume with cutting-edge AI technology designed for modern job markets.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-card border border-border rounded-2xl p-8 text-center hover:shadow-lg transition-all duration-300">
              <div className="w-16 h-16 bg-gradient-to-r from-primary to-accent rounded-2xl flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl">🤖</span>
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-4">AI Optimization</h3>
              <p className="text-muted-foreground">
                Advanced AI tailors your resume with industry-specific keywords and professional formatting.
              </p>
            </div>

            <div className="bg-card border border-border rounded-2xl p-8 text-center hover:shadow-lg transition-all duration-300">
              <div className="w-16 h-16 bg-gradient-to-r from-secondary to-accent rounded-2xl flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl">📊</span>
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-4">ATS Compatible</h3>
              <p className="text-muted-foreground">
                Ensure your resume passes Applicant Tracking Systems with intelligent optimization.
              </p>
            </div>

            <div className="bg-card border border-border rounded-2xl p-8 text-center hover:shadow-lg transition-all duration-300">
              <div className="w-16 h-16 bg-gradient-to-r from-accent to-primary rounded-2xl flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl">⚡</span>
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-4">Instant Results</h3>
              <p className="text-muted-foreground">
                Get professional-grade resumes and cover letters in seconds with instant AI processing.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-muted/30">
        <div className="max-w-6xl mx-auto px-4 py-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="text-center md:text-left">
            <p className="text-muted-foreground">
              © {new Date().getFullYear()} RoleFitAI. All rights reserved.
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Empowering careers with AI technology
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
                className="h-10 w-auto"
              />
            </a>
          </div>
        </div>
      </footer>

      {/* Authentication Modal */}
      {showAuthModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl p-8 max-w-md w-full shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-foreground">
                {isSignUp ? 'Create Account' : 'Welcome Back'}
              </h2>
              <button
                onClick={() => setShowAuthModal(false)}
                className="text-muted-foreground hover:text-foreground transition-colors p-1"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <button
              onClick={handleGoogleAuth}
              disabled={authLoading}
              className="w-full flex items-center justify-center px-4 py-3 border border-border rounded-lg hover:bg-muted/30 transition-all duration-200 mb-4 disabled:opacity-50"
            >
              <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              {authLoading ? 'Signing in...' : 'Continue with Google'}
            </button>

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-3 bg-card text-muted-foreground">Or continue with email</span>
              </div>
            </div>

            <form onSubmit={handleEmailAuth} className="space-y-4">
              <input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all duration-200"
              />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all duration-200"
              />
              {isSignUp && (
                <input
                  type="password"
                  placeholder="Confirm password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all duration-200"
                />
              )}
              <button
                type="submit"
                disabled={authLoading}
                className="w-full px-4 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-all duration-200 font-medium"
              >
                {authLoading ? (
                  <ButtonLoader text={isSignUp ? 'Creating account...' : 'Signing in...'} />
                ) : (
                  isSignUp ? 'Create Account' : 'Sign In'
                )}
              </button>
            </form>

            <div className="mt-6 text-center">
              <button
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setEmail('');
                  setPassword('');
                  setConfirmPassword('');
                }}
                className="text-sm text-primary hover:text-primary/80 transition-colors"
              >
                {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
              </button>
            </div>
          </div>
        </div>
      )}

      <ToastContainer
        position="top-right"
        autoClose={4000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark"
        toastClassName="!bg-card !border !border-border !text-foreground !rounded-xl"
        progressClassName="!bg-primary"
      />
    </div>
  );
}