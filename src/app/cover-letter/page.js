'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { auth } from '../../../lib/firebase';
import Navbar from '@/components/Navbar';
import { 
  FileText, 
  Sparkles, 
  Download, 
  Copy, 
  CheckCircle,
  ArrowLeft,
  Eye,
  EyeOff,
  Building,
  User,
  Briefcase,
  Mail,
  Phone,
  MapPin,
  Calendar
} from 'lucide-react';

export default function CoverLetterPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  
  // Local state for resume data
  const [resumeContent, setResumeContent] = useState('');
  const [resumeFileName, setResumeFileName] = useState('');
  const [isResumeUploaded, setIsResumeUploaded] = useState(false);
  
  const [generating, setGenerating] = useState(false);
  const [coverLetter, setCoverLetter] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  
  // Form states
  const [companyName, setCompanyName] = useState('');
  const [position, setPosition] = useState('');
  const [hiringManager, setHiringManager] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [tone, setTone] = useState('professional');
  const [length, setLength] = useState('medium');
  const [includeAddress, setIncludeAddress] = useState(true);
  
  const [contactInfo, setContactInfo] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    linkedin: '',
    date: new Date().toLocaleDateString()
  });

  const tones = [
    { id: 'professional', name: 'Professional', description: 'Formal and business-appropriate' },
    { id: 'enthusiastic', name: 'Enthusiastic', description: 'Energetic and passionate' },
    { id: 'confident', name: 'Confident', description: 'Assertive and self-assured' },
    { id: 'conversational', name: 'Conversational', description: 'Friendly and approachable' }
  ];

  const lengths = [
    { id: 'short', name: 'Short (3 paragraphs)', description: 'Concise and focused' },
    { id: 'medium', name: 'Medium (4-5 paragraphs)', description: 'Balanced and comprehensive' },
    { id: 'long', name: 'Long (6+ paragraphs)', description: 'Detailed and thorough' }
  ];

    useEffect(() => {
    // Check authentication
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);
    });
    
    // Load resume data from localStorage
    const loadResumeData = () => {
      const savedResume = localStorage.getItem('resume-content');
      const savedFileName = localStorage.getItem('resume-filename');
      
      if (savedResume) {
        setResumeContent(savedResume);
        setResumeFileName(savedFileName || 'resume.txt');
        setIsResumeUploaded(true);
        extractContactInfo(savedResume);
      } else {
        router.push('/dashboard');
      }
    };
    
    loadResumeData();
    return unsubscribe;
  }, [router]);

  const handleSignOut = async () => {
    try {
      await auth.signOut();
      router.push('/');
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const extractContactInfo = (content) => {
    if (!content) return;
    
    // Basic extraction - in a real app, this would be more sophisticated
    const lines = content.split('\n');
    const emailMatch = content.match(/[\w.-]+@[\w.-]+\.\w+/);
    const phoneMatch = content.match(/[\d\s-()]{10,}/);
    const nameMatch = lines[0]?.trim();
    
    setContactInfo(prev => ({
      ...prev,
      name: nameMatch || '',
      email: emailMatch?.[0] || '',
      phone: phoneMatch?.[0] || ''
    }));
  };

  const handleGenerateCoverLetter = async () => {
    if (!companyName.trim() || !position.trim()) return;
    setGenerating(true);
    
    try {
      const response = await fetch('/api/generate-cover-letter', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          resumeContent,
          companyName,
          position,
          hiringManager,
          jobDescription,
          tone,
          length,
          contactInfo,
          includeAddress
        }),
      });

      const data = await response.json();

      if (data.coverLetter) {
        setCoverLetter(data.coverLetter);
        setShowPreview(true);
      }
    } catch (error) {
      console.error('Generation error:', error);
    } finally {
      setGenerating(false);
    }
  };

  const handleCopyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleDownloadCoverLetter = () => {
    const element = document.createElement('a');
    const file = new Blob([coverLetter], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `${companyName}-cover-letter-${Date.now()}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const formatCoverLetterForDisplay = (text) => {
    return text.split('\n').map((line, index) => {
      if (line.trim() === '') return <br key={index} />;
      return <p key={index} className="mb-2">{line}</p>;
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30">
      <Navbar user={user} onSignOut={handleSignOut} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl font-bold text-foreground mb-4">Generate Your Cover Letter</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Create personalized, professional cover letters tailored to specific companies and positions using your resume.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Company & Position */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="bg-card border border-border rounded-2xl p-6"
            >
              <h2 className="text-xl font-semibold text-foreground mb-4">Job Details</h2>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    <Building className="w-4 h-4 inline mr-2" />
                    Company Name *
                  </label>
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground focus:ring-2 focus:ring-primary/50 focus:border-primary/50"
                    placeholder="Acme Corporation"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    <Briefcase className="w-4 h-4 inline mr-2" />
                    Position Title *
                  </label>
                  <input
                    type="text"
                    value={position}
                    onChange={(e) => setPosition(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground focus:ring-2 focus:ring-primary/50 focus:border-primary/50"
                    placeholder="Senior Software Engineer"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    <User className="w-4 h-4 inline mr-2" />
                    Hiring Manager
                  </label>
                  <input
                    type="text"
                    value={hiringManager}
                    onChange={(e) => setHiringManager(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground focus:ring-2 focus:ring-primary/50 focus:border-primary/50"
                    placeholder="John Smith (or leave blank for default)"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    <Calendar className="w-4 h-4 inline mr-2" />
                    Date
                  </label>
                  <input
                    type="date"
                    value={contactInfo.date}
                    onChange={(e) => setContactInfo(prev => ({ ...prev, date: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground focus:ring-2 focus:ring-primary/50 focus:border-primary/50"
                  />
                </div>
              </div>
            </motion.div>

            {/* Contact Information */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="bg-card border border-border rounded-2xl p-6"
            >
              <h2 className="text-xl font-semibold text-foreground mb-4">Your Contact Information</h2>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    <User className="w-4 h-4 inline mr-2" />
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={contactInfo.name}
                    onChange={(e) => setContactInfo(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground focus:ring-2 focus:ring-primary/50 focus:border-primary/50"
                    placeholder="Your full name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    <Mail className="w-4 h-4 inline mr-2" />
                    Email
                  </label>
                  <input
                    type="email"
                    value={contactInfo.email}
                    onChange={(e) => setContactInfo(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground focus:ring-2 focus:ring-primary/50 focus:border-primary/50"
                    placeholder="your.email@example.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    <Phone className="w-4 h-4 inline mr-2" />
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={contactInfo.phone}
                    onChange={(e) => setContactInfo(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground focus:ring-2 focus:ring-primary/50 focus:border-primary/50"
                    placeholder="(555) 123-4567"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    <MapPin className="w-4 h-4 inline mr-2" />
                    Address
                  </label>
                  <input
                    type="text"
                    value={contactInfo.address}
                    onChange={(e) => setContactInfo(prev => ({ ...prev, address: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground focus:ring-2 focus:ring-primary/50 focus:border-primary/50"
                    placeholder="City, State"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-foreground mb-2">
                    LinkedIn Profile
                  </label>
                  <input
                    type="url"
                    value={contactInfo.linkedin}
                    onChange={(e) => setContactInfo(prev => ({ ...prev, linkedin: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground focus:ring-2 focus:ring-primary/50 focus:border-primary/50"
                    placeholder="linkedin.com/in/yourprofile"
                  />
                </div>
              </div>
            </motion.div>

            {/* Job Description */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="bg-card border border-border rounded-2xl p-6"
            >
              <h2 className="text-xl font-semibold text-foreground mb-4">Job Description</h2>
              <textarea
                className="w-full h-32 p-4 rounded-lg border border-border bg-background text-foreground placeholder-muted-foreground focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all resize-none"
                placeholder="Paste the job description here to tailor your cover letter specifically for this position..."
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
              />
            </motion.div>

            {/* Tone and Length */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="bg-card border border-border rounded-2xl p-6"
            >
              <h2 className="text-xl font-semibold text-foreground mb-4">Style & Format</h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-medium text-foreground mb-3">Tone</h3>
                  <div className="space-y-2">
                    {tones.map((toneOption) => (
                      <label key={toneOption.id} className="flex items-start space-x-3 cursor-pointer">
                        <input
                          type="radio"
                          name="tone"
                          value={toneOption.id}
                          checked={tone === toneOption.id}
                          onChange={(e) => setTone(e.target.value)}
                          className="mt-1 text-primary focus:ring-primary"
                        />
                        <div>
                          <div className="font-medium text-foreground">{toneOption.name}</div>
                          <div className="text-sm text-muted-foreground">{toneOption.description}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-foreground mb-3">Length</h3>
                  <div className="space-y-2">
                    {lengths.map((lengthOption) => (
                      <label key={lengthOption.id} className="flex items-start space-x-3 cursor-pointer">
                        <input
                          type="radio"
                          name="length"
                          value={lengthOption.id}
                          checked={length === lengthOption.id}
                          onChange={(e) => setLength(e.target.value)}
                          className="mt-1 text-primary focus:ring-primary"
                        />
                        <div>
                          <div className="font-medium text-foreground">{lengthOption.name}</div>
                          <div className="text-sm text-muted-foreground">{lengthOption.description}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Right Column - Generated Cover Letter */}
          <div className="space-y-6">
            {/* Action Buttons */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="bg-card border border-border rounded-2xl p-6"
            >
              <h2 className="text-xl font-semibold text-foreground mb-4">Actions</h2>
              <div className="space-y-3">
                <button
                  onClick={handleGenerateCoverLetter}
                  disabled={generating || !companyName.trim() || !position.trim()}
                  className="w-full px-4 py-3 bg-gradient-to-r from-primary to-accent text-primary-foreground rounded-lg hover:from-primary/90 hover:to-accent/90 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {generating ? (
                    <>
                      <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin mr-2"></div>
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5 mr-2" />
                      Generate Cover Letter
                    </>
                  )}
                </button>
                
                {coverLetter && (
                  <>
                    <button
                      onClick={() => handleCopyToClipboard(coverLetter)}
                      className="w-full px-4 py-3 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/90 transition-colors flex items-center justify-center"
                    >
                      {copySuccess ? (
                        <>
                          <CheckCircle className="w-5 h-5 mr-2 text-green-500" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="w-5 h-5 mr-2" />
                          Copy to Clipboard
                        </>
                      )}
                    </button>
                    
                    <button
                      onClick={handleDownloadCoverLetter}
                      className="w-full px-4 py-3 bg-muted text-foreground rounded-lg hover:bg-muted/80 transition-colors flex items-center justify-center"
                    >
                      <Download className="w-5 h-5 mr-2" />
                      Download
                    </button>
                  </>
                )}
              </div>
            </motion.div>

            {/* Generated Cover Letter */}
            {coverLetter && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="bg-card border border-border rounded-2xl p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-foreground">Generated Cover Letter</h2>
                  <button
                    onClick={() => setShowPreview(!showPreview)}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPreview ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                
                {showPreview && (
                  <div className="bg-muted/20 rounded-lg p-4 max-h-96 overflow-y-auto">
                    <div className="whitespace-pre-wrap text-sm text-foreground leading-relaxed">
                      {formatCoverLetterForDisplay(coverLetter)}
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* Quick Tips */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="bg-card border border-border rounded-2xl p-6"
            >
              <h2 className="text-xl font-semibold text-foreground mb-4">Cover Letter Tips</h2>
              <div className="space-y-3 text-sm">
                <div className="flex items-start space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                  <span className="text-muted-foreground">Address it to a specific person when possible</span>
                </div>
                <div className="flex items-start space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                  <span className="text-muted-foreground">Show enthusiasm for the company and role</span>
                </div>
                <div className="flex items-start space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                  <span className="text-muted-foreground">Highlight relevant achievements from your resume</span>
                </div>
                <div className="flex items-start space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                  <span className="text-muted-foreground">End with a clear call to action</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}