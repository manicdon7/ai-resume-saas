'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector, useDispatch } from 'react-redux';
import { motion } from 'framer-motion';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '../../../lib/firebase';
import { setUser, signOut as reduxSignOut } from '../../store/slices/authSlice';
import { setResumeText, setParsedData } from '../../store/slices/resumeSlice';
import Navbar from '@/components/Navbar';
import { toast } from 'react-hot-toast';
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
  Calendar,
  Upload,
  Edit3,
  Save,
  X,
  Zap,
  Target
} from 'lucide-react';

export default function CoverLetterPage() {
  const router = useRouter();
  const dispatch = useDispatch();
  const { user, isPro, credits } = useSelector(state => state.auth);
  const { resumeText, parsedData } = useSelector(state => state.resume);
  
  // Enhanced resume functionality states
  const [enhancedResume, setEnhancedResume] = useState('');
  const [enhancing, setEnhancing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [fileName, setFileName] = useState('');
  
  const [generating, setGenerating] = useState(false);
  const [coverLetter, setCoverLetter] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editedCoverLetter, setEditedCoverLetter] = useState('');
  
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
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        dispatch(setUser(currentUser));
      } else {
        dispatch(reduxSignOut());
        router.push('/');
      }
    });
    
    // Initialize contact info from parsed data
    if (parsedData) {
      setContactInfo({
        name: parsedData.name || '',
        email: parsedData.email || '',
        phone: parsedData.phone || '',
        address: parsedData.location || '',
        linkedin: parsedData.linkedin || '',
        date: new Date().toLocaleDateString()
      });
    }
    
    return () => unsubscribe();
  }, [dispatch, router, parsedData]);

  const handleSignOut = async () => {
    try {
      await auth.signOut();
      dispatch(reduxSignOut());
      router.push('/');
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

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
        dispatch(setResumeText(data.text));
        await parseResumeData(data.text);
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

  const parseResumeData = async (text) => {
    try {
      const response = await fetch('https://text.pollinations.ai/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{
            role: 'user',
            content: `Extract contact information from this resume and return as JSON: name, email, phone, location. Resume text: ${text.substring(0, 1000)}`
          }],
          model: 'openai',
        }),
      });

      if (response.ok) {
        const result = await response.text();
        try {
          const parsed = JSON.parse(result);
          dispatch(setParsedData(parsed));
        } catch (e) {
          // Fallback parsing
          const basicData = {
            name: extractName(text),
            email: extractEmail(text),
            phone: extractPhone(text),
            location: ''
          };
          dispatch(setParsedData(basicData));
        }
      }
    } catch (error) {
      console.error('Parse error:', error);
    }
  };

  const extractName = (text) => {
    const lines = text.split('\n');
    return lines[0]?.trim() || 'Professional Candidate';
  };

  const extractEmail = (text) => {
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
    const match = text.match(emailRegex);
    return match ? match[0] : '';
  };

  const extractPhone = (text) => {
    const phoneRegex = /\(?\d{3}\)?[-. ]?\d{3}[-. ]?\d{4}/;
    const match = text.match(phoneRegex);
    return match ? match[0] : '';
  };

  // Enhanced resume generation
  const handleEnhanceResume = async () => {
    if (!resumeText.trim()) {
      toast.error('Please upload a resume first');
      return;
    }
    if (!jobDescription.trim()) {
      toast.error('Job description is required to enhance your resume');
      return;
    }
    if (!isPro && credits <= 0) {
      toast.error('Insufficient credits. Please upgrade to Pro.');
      return;
    }

    setEnhancing(true);
    try {
      const token = await user.getIdToken();
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ resume: resumeText, jobDescription }),
      });
      
      const data = await response.json();
      if (data.enhancedResume || data.text) {
        const enhanced = data.enhancedResume || data.text;
        setEnhancedResume(enhanced);
        toast.success('Resume enhanced successfully!');
      } else {
        toast.error('Failed to enhance resume');
      }
    } catch (error) {
      console.error('Enhancement error:', error);
      toast.error('Error enhancing resume');
    } finally {
      setEnhancing(false);
    }
  };

  // Cover letter generation
  const handleGenerateCoverLetter = async () => {
    if (!resumeText && !enhancedResume) {
      toast.error('Please upload and enhance your resume first');
      return;
    }
    if (!companyName || !position) {
      toast.error('Company name and position are required');
      return;
    }

    setGenerating(true);
    try {
      const resumeToUse = enhancedResume || resumeText;
      const response = await fetch('https://text.pollinations.ai/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{
            role: 'user',
            content: `Write a professional cover letter for ${contactInfo.name || 'the candidate'} applying for the ${position} position at ${companyName}. Use this resume information: ${resumeToUse.substring(0, 2000)}. Job description: ${jobDescription}. Tone: ${tone}. Length: ${length}. ${hiringManager ? `Address it to ${hiringManager}.` : 'Use a generic greeting.'} Write only the body paragraphs.`
          }],
          model: 'openai',
        }),
      });

      if (response.ok) {
        const content = await response.text();
        const cleanContent = content
          .replace(/```/g, '')
          .replace(/\*\*/g, '')
          .replace(/#{1,6}\s*/g, '')
          .trim();
        setCoverLetter(cleanContent);
        setEditedCoverLetter(cleanContent);
        toast.success('Cover letter generated successfully!');
      } else {
        throw new Error('Failed to generate content');
      }
    } catch (error) {
      console.error('Error generating cover letter:', error);
      toast.error('Error generating cover letter');
    } finally {
      setGenerating(false);
    }
  };

  const handleEditCoverLetter = () => {
    if (!isPro) {
      toast.error('Pro subscription required for editing functionality');
      return;
    }
    setEditMode(true);
  };

  const handleSaveEdit = () => {
    setCoverLetter(editedCoverLetter);
    setEditMode(false);
    toast.success('Cover letter updated!');
  };

  const handleCancelEdit = () => {
    setEditedCoverLetter(coverLetter);
    setEditMode(false);
  };

  const handleCopy = async () => {
    try {
      const fullLetter = formatCoverLetter();
      await navigator.clipboard.writeText(fullLetter);
      setCopySuccess(true);
      toast.success('Cover letter copied to clipboard!');
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (error) {
      toast.error('Failed to copy to clipboard');
    }
  };

  const formatCoverLetter = () => {
    const header = includeAddress ? `${contactInfo.name}\n${contactInfo.email}\n${contactInfo.phone}\n${contactInfo.address}\n\n${contactInfo.date}\n\n${companyName}\n\n` : '';
    const greeting = hiringManager ? `Dear ${hiringManager},\n\n` : 'Dear Hiring Manager,\n\n';
    const closing = '\n\nSincerely,\n' + contactInfo.name;
    return header + greeting + (editMode ? editedCoverLetter : coverLetter) + closing;
  };

  const handleDownloadPDF = async () => {
    if (!coverLetter) {
      toast.error('Please generate a cover letter first');
      return;
    }

    try {
      const response = await fetch('/api/generate-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: formatCoverLetter(),
          name: contactInfo.name || 'cover_letter',
          useCustomContent: true
        }),
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${contactInfo.name || 'cover'}_letter.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        toast.success('Cover letter PDF downloaded!');
      } else {
        toast.error('Failed to generate PDF');
      }
    } catch (error) {
      console.error('PDF generation error:', error);
      toast.error('Error generating PDF');
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-foreground mb-4">Please sign in</h2>
          <button
            onClick={() => router.push('/')}
            className="text-primary hover:underline"
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-cyan-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>
      
      {/* Floating Orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute top-20 left-20 w-4 h-4 bg-purple-400 rounded-full opacity-60"
          animate={{
            y: [-20, 20, -20],
            x: [-10, 10, -10],
          }}
          transition={{
            duration: 6,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute top-40 right-32 w-6 h-6 bg-blue-400 rounded-full opacity-40"
          animate={{
            y: [20, -20, 20],
            x: [10, -10, 10],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute bottom-32 left-1/3 w-3 h-3 bg-cyan-400 rounded-full opacity-50"
          animate={{
            y: [-15, 15, -15],
            x: [-5, 5, -5],
          }}
          transition={{
            duration: 7,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </div>

      <div className="relative z-10">
        <Navbar user={user} onSignOut={handleSignOut} />
      
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <motion.div 
            className="mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex items-center gap-4 mb-4">
              <motion.button
                onClick={() => router.back()}
                className="p-2 hover:bg-gray-800/50 rounded-lg transition-colors backdrop-blur-sm border border-gray-700/50"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <ArrowLeft className="w-5 h-5 text-gray-300" />
              </motion.button>
              <div>
                <motion.h1 
                  className="text-4xl font-bold bg-gradient-to-r from-purple-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent animate-gradient-shine"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                >
                  Cover Letter Generator
                </motion.h1>
                <motion.p 
                  className="text-gray-300 text-lg mt-1"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: 0.4 }}
                >
                  Create professional cover letters with AI assistance
                </motion.p>
              </div>
            </div>
          </motion.div>

          <motion.div 
            className="grid grid-cols-1 lg:grid-cols-3 gap-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            {/* Left Column - Resume Upload & Enhancement */}
            <motion.div 
              className="lg:col-span-1 space-y-6"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.8 }}
            >
              {/* Resume Upload */}
              <motion.div 
                className="bg-gray-800/50 border border-gray-700 rounded-xl p-6 shadow-lg backdrop-blur-sm"
                whileHover={{ scale: 1.01, boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)" }}
                transition={{ duration: 0.2 }}
              >
                <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                  <motion.div
                    whileHover={{ rotate: 360 }}
                    transition={{ duration: 0.6 }}
                  >
                    <FileText className="w-5 h-5 text-purple-400" />
                  </motion.div>
                  Resume Upload
                </h2>
              
              {!resumeText ? (
                <div className="border-2 border-dashed border-gray-600 rounded-lg p-6 text-center hover:border-purple-400/50 transition-colors">
                  <input
                    type="file"
                    id="resume-upload"
                    accept=".pdf,.doc,.docx,.txt"
                    onChange={handleFileUpload}
                    className="hidden"
                    disabled={uploading}
                  />
                  <label htmlFor="resume-upload" className="cursor-pointer">
                    {uploading ? (
                      <div className="flex flex-col items-center gap-3">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
                        <p className="text-sm text-gray-400">Processing {fileName}...</p>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-3">
                        <Upload className="w-8 h-8 text-purple-400" />
                        <div>
                          <p className="font-medium text-white">Upload Resume</p>
                          <p className="text-sm text-gray-400">PDF, DOC, DOCX, TXT</p>
                        </div>
                      </div>
                    )}
                  </label>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-3 bg-green-900/20 border border-green-700/50 rounded-lg">
                    <CheckCircle className="w-5 h-5 text-green-400" />
                    <span className="text-sm font-medium text-green-300">Resume uploaded</span>
                  </div>
                  
                  {/* Resume Enhancement Section */}
                  <div className="border-t pt-4">
                    <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
                      <Sparkles className="w-4 h-4" />
                      Enhance Resume
                    </h3>
                    <textarea
                      placeholder="Paste job description here to enhance your resume..."
                      value={jobDescription}
                      onChange={(e) => setJobDescription(e.target.value)}
                      className="w-full h-32 px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 resize-none focus:ring-2 focus:ring-purple-500 focus:border-purple-400 transition-all"
                    />
                    <button
                      onClick={handleEnhanceResume}
                      disabled={enhancing || !jobDescription.trim()}
                      className="w-full mt-3 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg hover:shadow-purple-500/25"
                    >
                      {enhancing ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          Enhancing...
                        </>
                      ) : (
                        <>
                          <Zap className="w-4 h-4" />
                          Enhance Resume
                        </>
                      )}
                    </button>
                    
                    {enhancedResume && (
                      <div className="mt-3 p-3 bg-blue-900/20 border border-blue-700/50 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <Target className="w-4 h-4 text-blue-400" />
                          <span className="text-sm font-medium text-blue-300">Resume Enhanced</span>
                        </div>
                        <p className="text-xs text-blue-400">Your resume has been optimized for the job description</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
              </motion.div>
            </motion.div>

            {/* Middle Column - Form */}
            <motion.div 
              className="lg:col-span-1 space-y-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 1.0 }}
            >
              {/* Job Details */}
              <motion.div 
                className="bg-gray-800/50 border border-gray-700 rounded-xl p-6 shadow-lg backdrop-blur-sm"
                whileHover={{ scale: 1.01 }}
                transition={{ duration: 0.2 }}
              >
                <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                  <motion.div
                    whileHover={{ rotate: 360 }}
                    transition={{ duration: 0.6 }}
                  >
                    <Briefcase className="w-5 h-5 text-blue-400" />
                  </motion.div>
                  Job Details
                </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-white mb-1">
                    Company Name *
                  </label>
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-purple-400 transition-all"
                    placeholder="Enter company name"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-white mb-1">
                    Position *
                  </label>
                  <input
                    type="text"
                    value={position}
                    onChange={(e) => setPosition(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-purple-400 transition-all"
                    placeholder="Enter position title"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-white mb-1">
                    Hiring Manager (Optional)
                  </label>
                  <input
                    type="text"
                    value={hiringManager}
                    onChange={(e) => setHiringManager(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-purple-400 transition-all"
                    placeholder="Enter hiring manager name"
                  />
                </div>
              </div>
              </motion.div>

              {/* Contact Information */}
              <motion.div 
                className="bg-gray-800/50 border border-gray-700 rounded-xl p-6 shadow-lg backdrop-blur-sm"
                whileHover={{ scale: 1.01 }}
                transition={{ duration: 0.2 }}
              >
                <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                  <motion.div
                    whileHover={{ rotate: 360 }}
                    transition={{ duration: 0.6 }}
                  >
                    <User className="w-5 h-5 text-cyan-400" />
                  </motion.div>
                  Contact Information
                </h2>
              
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium text-white mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={contactInfo.name}
                    onChange={(e) => setContactInfo({...contactInfo, name: e.target.value})}
                    className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-400 transition-all"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-white mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={contactInfo.email}
                    onChange={(e) => setContactInfo({...contactInfo, email: e.target.value})}
                    className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-400 transition-all"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-white mb-1">
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={contactInfo.phone}
                    onChange={(e) => setContactInfo({...contactInfo, phone: e.target.value})}
                    className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-400 transition-all"
                  />
                </div>
              </div>
              </motion.div>

              {/* Generate Button */}
              <motion.button
                onClick={handleGenerateCoverLetter}
                disabled={generating || !companyName || !position || (!resumeText && !enhancedResume)}
                className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl hover:from-purple-700 hover:to-blue-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium shadow-lg hover:shadow-purple-500/25"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
              {generating ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  Generate Cover Letter
                </>
              )}
              </motion.button>
            </motion.div>

            {/* Right Column - Preview */}
            <motion.div 
              className="lg:col-span-1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 1.2 }}
            >
              <motion.div 
                className="bg-gray-800/50 border border-gray-700 rounded-xl p-6 shadow-lg backdrop-blur-sm sticky top-8"
                whileHover={{ scale: 1.01 }}
                transition={{ duration: 0.2 }}
              >
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                    <motion.div
                      whileHover={{ rotate: 360 }}
                      transition={{ duration: 0.6 }}
                    >
                      <Eye className="w-5 h-5 text-purple-400" />
                    </motion.div>
                    Preview
                  </h2>
                  {coverLetter && (
                    <div className="flex gap-2">
                      {isPro && (
                        <motion.button
                          onClick={handleEditCoverLetter}
                          className="p-2 text-gray-400 hover:text-white hover:bg-gray-700/50 rounded-lg transition-colors"
                          title="Edit cover letter"
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                        >
                          <Edit3 className="w-4 h-4" />
                        </motion.button>
                      )}
                      <motion.button
                        onClick={handleCopy}
                        className="p-2 text-gray-400 hover:text-white hover:bg-gray-700/50 rounded-lg transition-colors"
                        title="Copy to clipboard"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        {copySuccess ? <CheckCircle className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                      </motion.button>
                      <motion.button
                        onClick={handleDownloadPDF}
                        className="p-2 text-gray-400 hover:text-white hover:bg-gray-700/50 rounded-lg transition-colors"
                        title="Download PDF"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        <Download className="w-4 h-4" />
                      </motion.button>
                    </div>
                  )}
              </div>
              
              {coverLetter ? (
                <div className="space-y-4">
                  {editMode ? (
                    <div className="space-y-3">
                      <textarea
                        value={editedCoverLetter}
                        onChange={(e) => setEditedCoverLetter(e.target.value)}
                        className="w-full h-96 px-3 py-2 bg-muted border border-border rounded-lg text-foreground text-sm resize-none"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={handleSaveEdit}
                          className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                        >
                          <Save className="w-4 h-4" />
                          Save
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center justify-center gap-2"
                        >
                          <X className="w-4 h-4" />
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-gray-700/30 rounded-lg p-4 max-h-96 overflow-y-auto border border-gray-600/50">
                      <div className="text-sm text-white whitespace-pre-wrap">
                        {formatCoverLetter()}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-400">
                  <motion.div
                    animate={{ rotate: [0, 5, -5, 0] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  >
                    <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  </motion.div>
                  <p>Your cover letter will appear here</p>
                  <p className="text-sm">Fill in the details and click generate</p>
                </div>
              )}
              </motion.div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}