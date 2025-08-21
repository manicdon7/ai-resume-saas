"use client";

import { useState, useEffect } from "react";
import ReactMarkdown from 'react-markdown';
import Image from 'next/image';
import Link from 'next/link';
import { auth, googleProvider } from '../../lib/firebase';
import { signInWithPopup, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { useAuthState } from 'react-firebase-hooks/auth';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import PricingModal from '@/components/PricingModal';
import { useRouter } from 'next/navigation';

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
  const [credits, setCredits] = useState(3);
  const [isPro, setIsPro] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [showPricingModal, setShowPricingModal] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [generatingResumePDF, setGeneratingResumePDF] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editedContent, setEditedContent] = useState('');
  const [coverLetterContent, setCoverLetterContent] = useState('');
  const [editingCoverLetter, setEditingCoverLetter] = useState(false);
  const router = useRouter();

  // Fetch user credits and pro status after login
  useEffect(() => {
    if (user) {
      // Assume JWT token is stored in localStorage after login
      const token = window.localStorage.getItem('token');
      if (token) {
        fetch('/api/user/credits', {
          headers: { Authorization: `Bearer ${token}` }
        })
          .then(res => res.json())
          .then(data => {
            setCredits(data.credits ?? 3);
            setIsPro(data.isPro ?? false);
          });
      }
    }
  }, [user]);
  
  // Event listener for opening pricing modal from other components
  useEffect(() => {
    const handleOpenPricingModal = () => setShowPricingModal(true);
    window.addEventListener('open-pricing-modal', handleOpenPricingModal);
    
    return () => {
      window.removeEventListener('open-pricing-modal', handleOpenPricingModal);
    };
  }, []);

  // Listen for Firebase auth state changes and get token
  useEffect(() => {
    if (user) {
      // Get Firebase ID token when user signs in
      user.getIdToken().then(firebaseToken => {
        // Call backend API to exchange Firebase token for JWT
        fetch('/api/auth/google', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            uid: user.uid,
            email: user.email,
            name: user.displayName,
            photoURL: user.photoURL
          })
        })
        .then(res => res.json())
        .then(data => {
          if (data.token) {
            // Store JWT token in localStorage
            window.localStorage.setItem('token', data.token);
          }
        })
        .catch(error => {
          console.error('Error exchanging token:', error);
        });
      });
    } else {
      // Remove token when user signs out
      window.localStorage.removeItem('token');
    }
  }, [user]);

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

  // Patch: handle enhancement with credit check
  const handleGenerate = async () => {
    if (!resumeText.trim()) {
      toast.error('Please provide resume content');
      return;
    }
    if (!jobDescription.trim()) {
      toast.error('Job description is required to enhance your resume with AI');
      return;
    }
    if (!isPro && credits <= 0) {
      setShowUpgradeModal(true);
      return;
    }
    setGenerating(true);
    try {
      const token = window.localStorage.getItem('token');
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ resume: resumeText, jobDescription }),
      });
      const data = await response.json();
      if (response.status === 429) {
        setShowUpgradeModal(true);
        setGenerating(false);
        return;
      }
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
        // Update credits if present in response
        if (typeof data.credits !== 'undefined') updateCreditsAfterEnhance(data.credits, data.isPro);
        else setCredits(c => (isPro ? c : c - 1));
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

  // Handle editing content
  const handleEditResume = () => {
    if (!isPro) {
      toast.error('Pro subscription required for edit functionality');
      return;
    }
    setEditMode(true);
    setEditedContent(output);
  };

  const handleSaveEdit = () => {
    setOutput(editedContent);
    setEditMode(false);
    toast.success('Resume content updated!');
  };

  const handleCancelEdit = () => {
    setEditMode(false);
    setEditedContent('');
  };

  // Generate cover letter content for editing
  const generateCoverLetterForEditing = async () => {
    if (!output) {
      toast.error('No enhanced resume content available');
      return;
    }

    if (!jobDescription.trim()) {
      toast.error('Job description is required');
      return;
    }

    const nameToUse = extractedName || user?.displayName || 'Professional Candidate';
    
    try {
      const response = await fetch('https://text.pollinations.ai/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{
            role: 'user',
            content: `Write a professional cover letter for ${nameToUse} applying for the position described below. Use the resume information to highlight relevant experience and skills.\n\nRESUME CONTENT:\n${output}\n\nJOB DESCRIPTION:\n${jobDescription}\n\nRequirements:\n1. Write in first person as ${nameToUse}\n2. Keep it professional but engaging\n3. Write 3-4 paragraphs\n4. Do NOT include placeholders\n5. Make each paragraph flow naturally\n\nWrite only the body paragraphs of the cover letter.`
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
          .replace(/^\s*-\s*/gm, '')
          .replace(/Dear\s+.*?,?\s*/i, '')
          .replace(/(Sincerely|Best regards|Thank you).*$/i, '')
          .trim();
        setCoverLetterContent(cleanContent);
        setEditingCoverLetter(true);
      } else {
        throw new Error('Failed to generate content');
      }
    } catch (error) {
      console.error('Error generating cover letter:', error);
      const fallbackContent = `I am writing to express my strong interest in this position. After reviewing the requirements, I believe my background and experience make me an excellent candidate for this role.\n\nMy professional experience has provided me with the skills and knowledge necessary to excel in this position. I am particularly drawn to this opportunity because it aligns perfectly with my career goals and passion for contributing to innovative projects.\n\nI am excited about the possibility of bringing my expertise to your team and would welcome the opportunity to discuss how my background can contribute to your organization's continued success.`;
      setCoverLetterContent(fallbackContent);
      setEditingCoverLetter(true);
    }
  };

  const handleEditCoverLetter = () => {
    if (!isPro) {
      toast.error('Pro subscription required for edit functionality');
      return;
    }
    generateCoverLetterForEditing();
  };

  const handleSaveCoverLetter = () => {
    setEditingCoverLetter(false);
    toast.success('Cover letter ready for download!');
  };

  const handleCancelCoverLetterEdit = () => {
    setEditingCoverLetter(false);
    setCoverLetterContent('');
  };

  const handleGeneratePDF = async () => {
    if (!output) {
      toast.error('No enhanced resume content to generate cover letter');
      return;
    }

    if (!jobDescription.trim()) {
      toast.error('Job description is required to generate a tailored cover letter');
      return;
    }

    if (!extractedName) {
      toast.warning('Extracting name first...');
      await extractNameFromContent(output);
    }

    const nameToUse = extractedName || user?.displayName || 'Professional Candidate';

    setGeneratingPDF(true);

    // Show progress toast
    const progressToast = toast.info('Generating your cover letter PDF...', {
      autoClose: false,
      closeButton: false
    });

    try {
      // Add timeout for the request
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        controller.abort();
        toast.dismiss(progressToast);
        toast.error('PDF generation timed out. Please try again.');
      }, 30000); // 30 second timeout

      const response = await fetch('/api/generate-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: coverLetterContent || output,
          jobDescription: jobDescription,
          name: nameToUse,
          useCustomContent: !!coverLetterContent
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      toast.dismiss(progressToast);

      if (response.ok) {
        const contentType = response.headers.get('content-type');
        const blob = await response.blob();

        if (blob.size === 0) {
          throw new Error('Generated file is empty');
        }

        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;

        // Set filename based on content type
        const fileExtension = contentType?.includes('pdf') ? 'pdf' : 'html';
        const fileName = `${nameToUse.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_')}_Cover_Letter.${fileExtension}`;
        a.download = fileName;

        document.body.appendChild(a);
        a.click();

        // Cleanup
        setTimeout(() => {
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);
        }, 100);

        if (fileExtension === 'pdf') {
          toast.success(`Cover letter PDF downloaded for ${nameToUse}!`);
        } else {
          toast.warning(`Cover letter generated as HTML for ${nameToUse}. You can print it as PDF from your browser.`);
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Server error: ${response.status}`);
      }
    } catch (error) {
      toast.dismiss(progressToast);

      if (error.name === 'AbortError') {
        console.log('Request was aborted');
        return;
      }

      console.error('PDF generation error:', error);

      // Provide specific error messages
      let errorMessage = 'Error generating cover letter';
      if (error.message.includes('timeout') || error.message.includes('timed out')) {
        errorMessage = 'Generation timed out. Please try again with a shorter resume.';
      } else if (error.message.includes('network') || error.message.includes('fetch')) {
        errorMessage = 'Network error. Please check your connection and try again.';
      } else if (error.message.includes('empty')) {
        errorMessage = 'Generated file was empty. Please try again.';
      }

      toast.error(errorMessage);
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
      let errorMessage = error.code === 'auth/invalid-credential'
        ? 'Invalid email or password'
        : error.message;

      // Handle Firebase "operation-not-allowed" error
      if (error.code === 'auth/operation-not-allowed') {
        errorMessage = 'Email/password sign-in is not enabled in your Firebase project. Please enable it in Firebase Console > Authentication > Sign-in method > Email/Password.';
      }
      // Handle Firebase API key or quota errors
      if (error.code === 'auth/invalid-api-key' || error.message.includes('API key')) {
        errorMessage = 'Invalid Firebase API key. Please check your Firebase configuration.';
      }
      if (error.code === 'auth/network-request-failed') {
        errorMessage = 'Network error. Please check your internet connection.';
      }

      toast.error(errorMessage);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      // Remove token from localStorage
      window.localStorage.removeItem('token');
      toast.success('Signed out successfully!');
    } catch (error) {
      console.error('Sign out error:', error);
      toast.error('Failed to sign out');
    }
  };

  // Handle upgrade to Pro with Stripe payment
  const handleUpgradeToPro = async () => {
    setProcessingPayment(true);
    try {
      const token = window.localStorage.getItem('token');
      const response = await fetch('/api/payment/create-checkout', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        }
      });
      
      const data = await response.json();
      
      if (data.url) {
        // Redirect to Stripe checkout
        window.location.href = data.url;
      } else {
        toast.error('Failed to initialize payment');
        setProcessingPayment(false);
      }
    } catch (error) {
      console.error('Payment error:', error);
      toast.error('Payment processing failed');
      setProcessingPayment(false);
    }
  };

  // Function to extract only resume content (exclude cover letter)
  const extractResumeOnly = (content) => {
    if (!content) return '';
    
    // Split content by common separators
    const lines = content.split('\n');
    const resumeLines = [];
    let foundCoverLetterStart = false;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim().toLowerCase();
      
      // Check for cover letter indicators
      if (line.includes('cover letter') || 
          line.includes('dear hiring manager') ||
          line.includes('dear sir/madam') ||
          line.includes('to whom it may concern') ||
          (line.includes('dear') && line.includes('manager')) ||
          line.includes('sincerely') ||
          line.includes('best regards') ||
          line.includes('yours faithfully') ||
          (line.startsWith('i am') && line.includes('position')) ||
          (line.includes('i am') && line.includes('enthusiastic')) ||
          (line.includes('excited') && line.includes('opportunity'))) {
        foundCoverLetterStart = true;
        break;
      }
      
      resumeLines.push(lines[i]);
    }
    
    return resumeLines.join('\n').trim();
  };

  // Handle resume PDF download
  const handleGenerateResumePDF = async () => {
    if (!output) {
      toast.error('No enhanced resume content to download');
      return;
    }

    if (!extractedName) {
      toast.warning('Extracting name first...');
      await extractNameFromContent(output);
    }

    const nameToUse = extractedName || user?.displayName || 'Professional Candidate';

    // Extract only resume content, excluding cover letter
    const resumeOnlyContent = editedContent ? 
      extractResumeOnly(editedContent) : 
      extractResumeOnly(output);
    
    if (!resumeOnlyContent.trim()) {
      toast.error('No resume content found to generate PDF');
      return;
    }

    setGeneratingResumePDF(true);

    const progressToast = toast.info('Generating your resume PDF...', {
      autoClose: false,
      closeButton: false
    });

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        controller.abort();
        toast.dismiss(progressToast);
        toast.error('PDF generation timed out. Please try again.');
      }, 30000);

      const response = await fetch('/api/generate-resume-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: resumeOnlyContent,
          name: nameToUse
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      toast.dismiss(progressToast);

      if (response.ok) {
        const blob = await response.blob();

        if (blob.size === 0) {
          throw new Error('Generated file is empty');
        }

        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${nameToUse.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_')}_Enhanced_Resume.pdf`;

        document.body.appendChild(a);
        a.click();

        setTimeout(() => {
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);
        }, 100);

        toast.success(`Resume PDF downloaded for ${nameToUse}!`);
      } else {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Server error: ${response.status}`);
      }
    } catch (error) {
      toast.dismiss(progressToast);

      if (error.name === 'AbortError') {
        return;
      }

      console.error('Resume PDF generation error:', error);
      let errorMessage = 'Error generating resume PDF';
      if (error.message.includes('timeout')) {
        errorMessage = 'Generation timed out. Please try again.';
      } else if (error.message.includes('network')) {
        errorMessage = 'Network error. Please check your connection.';
      }

      toast.error(errorMessage);
    } finally {
      setGeneratingResumePDF(false);
    }
  };

  // Navigate to ATS analysis page
  const handleShowATSAnalysis = () => {
    if (!output || !jobDescription) {
      toast.error('Resume and job description are required for ATS analysis');
      return;
    }

    // Store data in localStorage as backup
    localStorage.setItem('ats-resume-content', output);
    localStorage.setItem('ats-job-description', jobDescription);

    // Navigate to analysis page with URL parameters
    const params = new URLSearchParams({
      resume: encodeURIComponent(output),
      job: encodeURIComponent(jobDescription)
    });
    
    router.push(`/analysis?${params.toString()}`);
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
      {/* Modern Mobile-Responsive Navigation */}
      <nav className="sticky top-0 z-50 backdrop-blur-md bg-background/80 shadow-lg border-b border-border/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <span className="text-xl font-bold gradient-text animate-gradient">
                <Image src="/logo.png" alt="RoleFitAI" width={150} height={100} sizes="2xl" className="h-8 w-auto" />
              </span>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-4">
              {user ? (
                <div className="flex items-center space-x-3">
                  <Link
                    href="/pricing"
                    className="px-4 py-2 text-sm font-medium text-foreground hover:text-primary border border-border rounded-lg hover:bg-muted/50 transition-all duration-200"
                  >
                    Pricing
                  </Link>
                  <Link
                    href="/dashboard"
                    className="px-4 py-2 text-sm font-medium text-foreground hover:text-primary border border-border rounded-lg hover:bg-muted/50 transition-all duration-200"
                  >
                    Dashboard
                  </Link>
                  <div className="relative">
                    <button 
                      onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                      className="flex items-center space-x-2 px-2 py-1 rounded-lg hover:bg-muted/50 transition-all duration-200"
                    >
                      {user.photoURL && (
                        <Image
                          src={user.photoURL}
                          alt="Profile"
                          width={32}
                          height={32}
                          className="w-8 h-8 rounded-full border-2 border-primary/30"
                        />
                      )}
                      <span className="text-sm font-medium text-foreground hidden lg:block">
                        {user.displayName || user.email?.split('@')[0]}
                      </span>
                      <svg className="w-4 h-4 text-foreground transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ transform: showProfileDropdown ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    
                    {showProfileDropdown && (
                      <div className="absolute right-0 mt-2 w-48 bg-background/95 backdrop-blur-md border border-border/50 rounded-lg shadow-lg py-1 z-50">
                        <button
                          onClick={handleSignOut}
                          className="w-full text-left px-4 py-2 text-sm text-foreground hover:bg-muted/50 transition-all duration-200"
                        >
                          Sign Out
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setShowAuthModal(true)}
                  className="px-4 py-2 border border-white-light text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all duration-200"
                >
                  Sign In
                </button>
              )}
            </div>

            {/* Mobile Menu Button - Hamburger */}
            <div className="md:hidden">
              <button
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                className="p-2 rounded-lg hover:bg-muted/50 transition-all duration-200"
                aria-label="Toggle menu"
              >
                <div className="w-6 h-6 flex flex-col justify-center items-center space-y-1">
                  <span className={`bg-white block transition-all duration-300 ease-out h-0.5 w-6 rounded-sm ${showMobileMenu ? 'rotate-45 translate-y-1.5' : ''}`}></span>
                  <span className={`bg-white block transition-all duration-300 ease-out h-0.5 w-6 rounded-sm ${showMobileMenu ? 'opacity-0' : 'opacity-100'}`}></span>
                  <span className={`bg-white block transition-all duration-300 ease-out h-0.5 w-6 rounded-sm ${showMobileMenu ? '-rotate-45 -translate-y-1.5' : ''}`}></span>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Sliding Menu - Left to Right */}
        <div className={`md:hidden fixed inset-0 z-40 transition-transform duration-300 ease-in-out ${showMobileMenu ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className="absolute inset-0 bg-gray-900" onClick={() => setShowMobileMenu(false)}></div>
          <div className="absolute left-0 top-0 h-full w-4/5 max-w-sm bg-gray-900 shadow-xl">
            <div className="p-6">
              <div className="flex justify-between items-center mb-8">
                <span className="text-lg font-bold text-white">Menu</span>
                <button
                  onClick={() => setShowMobileMenu(false)}
                  className="p-2 rounded-lg hover:bg-gray-800 transition-all duration-200"
                  aria-label="Close menu"
                >
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <nav className="space-y-4">
                {user ? (
                  <>
                    <div className="flex items-center space-x-3 mb-6 p-3 bg-gray-800 rounded-lg">
                      {user.photoURL && (
                        <Image
                          src={user.photoURL}
                          alt="Profile"
                          width={40}
                          height={40}
                          className="w-10 h-10 rounded-full border-2 border-primary/30"
                        />
                      )}
                      <div>
                        <div className="font-medium text-foreground">{user.displayName || user.email?.split('@')[0]}</div>
                        <div className="text-sm text-muted-foreground">{user.email}</div>
                      </div>
                    </div>
                    
                    <Link
                      href="/dashboard"
                      onClick={() => setShowMobileMenu(false)}
                      className="flex items-center space-x-3 px-4 py-3 text-white hover:bg-gray-800 rounded-lg transition-all duration-200"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                      <span>Dashboard</span>
                    </Link>
                    
                    <Link
                      href="/pricing"
                      onClick={() => setShowMobileMenu(false)}
                      className="flex items-center space-x-3 px-4 py-3 text-white hover:bg-gray-800 rounded-lg transition-all duration-200"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>Pricing</span>
                    </Link>
                    
                    <button
                      onClick={() => {
                        handleSignOut();
                        setShowMobileMenu(false);
                      }}
                      className="flex items-center space-x-3 px-4 py-3 text-white hover:bg-gray-800 rounded-lg transition-all duration-200 w-full text-left"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      <span>Sign Out</span>
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => {
                        setShowAuthModal(true);
                        setShowMobileMenu(false);
                      }}
                      className="w-full px-4 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-all duration-200"
                    >
                      Sign In
                    </button>
                    
                    <div className="text-center py-4">
                      <span className="text-gray-300">New to RoleFitAI?</span>
                      <button
                        onClick={() => {
                          setShowAuthModal(true);
                          setIsSignUp(true);
                          setShowMobileMenu(false);
                        }}
                        className="ml-2 text-primary hover:text-primary/80 transition-colors"
                      >
                        Create Account
                      </button>
                    </div>
                  </>
                )}
              </nav>
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
                <span className="text-sm font-medium text-primary">Name: {extractedName}</span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
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
                      {fileName ? (
                        <svg className="w-10 h-10 mx-auto text-primary" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                        </svg>
                      ) : (
                        <svg className="w-10 h-10 mx-auto text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                      )}
                    </div>
                    <div className="font-semibold text-foreground">{fileName || "Upload Resume"}</div>
                    <div className="text-sm text-muted-foreground">PDF, DOC, DOCX, TXT supported</div>
                  </>
                )}
              </label>

              {fileName && (
                <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                <span className="text-sm font-medium flex items-center gap-2">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                    </svg>
                    {fileName}
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
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              )}
            </div>

            {/* Resume Content */}
            <div className="space-y-4">
              <label className="block text-sm font-semibold text-foreground">Resume Content</label>
              <textarea
                className={`w-full h-40 p-4 rounded-xl border border-border bg-background text-foreground placeholder-muted-foreground focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all duration-300 resize-none ${isResumeFrozen ? 'bg-muted/30 cursor-not-allowed' : ''
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
              Job Description <span className="text-red-500">*</span> {/* Mark as required */}
            </label>
            <textarea
              className="w-full h-32 p-4 rounded-xl border border-border bg-background text-foreground placeholder-muted-foreground focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all duration-300 resize-none"
              placeholder="Paste job description for tailored enhancements..."
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              required
            />
          </div>

          {/* Generate Button */}
          <div className="mt-8 text-center">
            <button
              onClick={handleGenerate}
              disabled={!resumeText.trim() || generating}
              className="px-12 py-4 border border-white rounded-xl text-lg font-medium cursor-pointer bg-accent text-accent-foreground hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              {generating ? (
                <ButtonLoader text="Enhancing Resume..." />
              ) : (
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                  Enhance Resume with AI
                </div>
              )}
            </button>
          </div>
        </div>

        {/* Enhanced Output Section */}
        {output && (
          <div className="mt-12 bg-card border border-border rounded-2xl p-8 shadow-lg">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
              <h2 className="text-2xl font-bold text-foreground">Enhanced Resume</h2>
              <div className="flex flex-wrap gap-2 sm:gap-3">
                <button
                  onClick={handleCopy}
                  disabled={copied}
                  className="px-4 py-2 text-sm font-medium cursor-pointer bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-all duration-200"
                >
                  {copied ? (
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Copied!
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      Copy
                    </div>
                  )}
                </button>
                {isPro && (
                  <button
                    onClick={handleEditResume}
                    className="px-4 py-2 text-sm font-medium cursor-pointer bg-primary/20 text-primary border border-primary/30 rounded-lg hover:bg-primary/30 transition-all duration-200"
                  >
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Edit
                    </div>
                  </button>
                )}
                <button
                  onClick={handleGenerateResumePDF}
                  disabled={generatingResumePDF}
                  className="px-4 py-2 text-sm cursor-pointer font-medium bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/90 disabled:opacity-50 transition-all duration-200"
                >
                  {generatingResumePDF ? (
                    <ButtonLoader text="Generating..." />
                  ) : (
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Resume PDF
                    </div>
                  )}
                </button>
                <button
                  onClick={handleGeneratePDF}
                  disabled={generatingPDF}
                  className="px-4 py-2 text-sm cursor-pointer font-medium bg-accent text-accent-foreground rounded-lg hover:bg-accent/90 disabled:opacity-50 transition-all duration-200"
                >
                  {generatingPDF ? (
                    <PDFLoader />
                  ) : (
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Cover Letter PDF
                    </div>
                  )}
                </button>
                {isPro && (
                  <button
                    onClick={handleEditCoverLetter}
                    className="px-4 py-2 text-sm font-medium cursor-pointer bg-accent/20 text-accent border border-accent/30 rounded-lg hover:bg-accent/30 transition-all duration-200"
                  >
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Edit Cover Letter
                    </div>
                  </button>
                )}
              </div>
            </div>

            {/* Resume Output */}
            {editMode ? (
              <div className="space-y-4">
                <textarea
                  value={editedContent}
                  onChange={(e) => setEditedContent(e.target.value)}
                  className="w-full h-96 p-6 rounded-xl border border-border bg-background text-foreground placeholder-muted-foreground focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all duration-300 resize-none"
                  placeholder="Edit your enhanced resume content..."
                />
                <div className="flex gap-3">
                  <button
                    onClick={handleSaveEdit}
                    className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 font-medium transition-all duration-200"
                  >
                    <div className="flex items-center gap-2 cursor-pointer">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Save Changes
                    </div>
                  </button>
                  <button
                    onClick={handleCancelEdit}
                    className="px-6 py-2 bg-muted text-foreground rounded-lg hover:bg-muted/80 font-medium transition-all duration-200"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-muted/20 rounded-xl p-6 max-h-96 overflow-y-auto border border-border">
                <ReactMarkdown class="prose prose-sm max-w-none text-foreground prose-headings:text-foreground prose-p:text-muted-foreground prose-strong:text-foreground prose-code:text-accent">
                  {output}
                </ReactMarkdown>
              </div>
            )}

            {/* ATS Analysis Navigation */}
            {output && jobDescription && (
              <div className="mt-8 bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20 rounded-xl p-6">
                <div className="text-center space-y-4">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-primary to-accent rounded-full mb-4">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-foreground">ATS Optimization Analysis</h3>
                  <p className="text-muted-foreground max-w-md mx-auto">
                    Get detailed insights on how your resume performs with Applicant Tracking Systems
                  </p>
                  <button
                    onClick={handleShowATSAnalysis}
                    className="px-8 py-3 bg-gradient-to-r from-primary to-accent text-primary-foreground rounded-lg hover:opacity-90 transition-opacity font-medium"
                  >
                    <div className="flex items-center gap-2 cursor-pointer">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-7 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                      </svg>
                      Show ATS Analysis
                    </div>
                  </button>
                </div>
              </div>
            )}

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
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                      <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                      </svg>
                    </div>
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

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
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

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 lg:gap-8">
            <div className="bg-card border border-border rounded-2xl p-8 text-center hover:shadow-lg transition-all duration-300">
              <div className="w-16 h-16 bg-gradient-to-r from-primary to-accent rounded-2xl flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-4">AI Optimization</h3>
              <p className="text-muted-foreground">
                Advanced AI tailors your resume with industry-specific keywords and professional formatting.
              </p>
            </div>

            <div className="bg-card border border-border rounded-2xl p-8 text-center hover:shadow-lg transition-all duration-300">
              <div className="w-16 h-16 bg-gradient-to-r from-secondary to-accent rounded-2xl flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-4">ATS Compatible</h3>
              <p className="text-muted-foreground">
                Ensure your resume passes Applicant Tracking Systems with intelligent optimization.
              </p>
            </div>

            <div className="bg-card border border-border rounded-2xl p-8 text-center hover:shadow-lg transition-all duration-300">
              <div className="w-16 h-16 bg-gradient-to-r from-accent to-primary rounded-2xl flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
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

      {/* Upgrade Modal */}
      {showUpgradeModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center">
          <div className="bg-card border border-border rounded-2xl p-8 max-w-sm w-full shadow-2xl text-center">
            <h2 className="text-2xl font-bold text-foreground mb-4">Daily Limit Reached</h2>
            <p className="text-muted-foreground mb-6">
              You have used all your free credits for today.<br />
              Upgrade to <span className="text-accent font-semibold">Pro Mode</span> for unlimited usage!
            </p>
            
            {processingPayment ? (
              <div className="py-4">
                <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto mb-3"></div>
                <p className="text-muted-foreground">Initializing payment...</p>
              </div>
            ) : (
              <>
                <div className="bg-white/5 rounded-lg p-4 mb-6 border border-border">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-foreground font-medium">RoleFitAI Pro</span>
                    <span className="text-accent font-bold">$9.99</span>
                  </div>
                  <ul className="text-left text-sm text-muted-foreground space-y-2">
                    <li className="flex items-center">
                      <svg className="w-4 h-4 text-green-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Unlimited resume enhancements
                    </li>
                    <li className="flex items-center">
                      <svg className="w-4 h-4 text-green-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Priority processing
                    </li>
                    <li className="flex items-center">
                      <svg className="w-4 h-4 text-green-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Advanced ATS optimization
                    </li>
                  </ul>
                </div>
                
                <button
                  onClick={handleUpgradeToPro}
                  className="w-full px-4 py-3 bg-accent text-accent-foreground rounded-lg hover:bg-accent/90 font-semibold transition-all duration-200 mb-3"
                >
                  ↗ Upgrade to Pro
                </button>
                <button
                  onClick={() => setShowUpgradeModal(false)}
                  className="w-full px-4 py-2 mt-2 bg-muted text-foreground rounded-lg hover:bg-muted/80 font-medium transition-all duration-200"
                >
                  Cancel
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Cover Letter Edit Modal */}
      {editingCoverLetter && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl p-8 max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-foreground">Edit Cover Letter</h2>
              <button
                onClick={handleCancelCoverLetterEdit}
                className="text-muted-foreground hover:text-foreground transition-colors p-1"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-4">
              <textarea
                value={coverLetterContent}
                onChange={(e) => setCoverLetterContent(e.target.value)}
                className="w-full h-96 p-6 rounded-xl border border-border bg-background text-foreground placeholder-muted-foreground focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all duration-300 resize-none"
                placeholder="Edit your cover letter content..."
              />
              <div className="flex gap-3">
                <button
                  onClick={handleSaveCoverLetter}
                  className="px-6 py-2 bg-accent text-accent-foreground rounded-lg hover:bg-accent/90 font-medium transition-all duration-200"
                >
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Save & Close
                  </div>
                </button>
                <button
                  onClick={handleCancelCoverLetterEdit}
                  className="px-6 py-2 bg-muted text-foreground rounded-lg hover:bg-muted/80 font-medium transition-all duration-200"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Pricing Modal */}
      <PricingModal 
        isOpen={showPricingModal} 
        onClose={() => setShowPricingModal(false)} 
        user={user} 
      />



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
