'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Copy,
  Download,
  Edit3,
  Eye,
  EyeOff,
  FileText,
  Hash,
  Maximize2,
  Minimize2,
  RefreshCw,
  Save,
  X
} from 'lucide-react';
import { showToast } from '@/lib/toast-config';

const ExtractedTextDisplay = ({
  content = '',
  parsedData = {},
  isEditable = false,
  onEdit,
  onReparse,
  className = ''
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showLineNumbers, setShowLineNumbers] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(content);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setEditedContent(content);
  }, [content]);

  // Handle copy to clipboard
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      showToast.success('Text copied to clipboard');
    } catch (error) {
      showToast.error('Failed to copy text');
    }
  };

  // Handle download as text file
  const handleDownload = (format = 'txt') => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `resume.${format}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast.success(`Resume downloaded as ${format.toUpperCase()}`);
  };

  // Handle save edited content
  const handleSave = async () => {
    if (!onEdit) return;
    
    setIsSaving(true);
    try {
      await onEdit(editedContent);
      setIsEditing(false);
      showToast.success('Resume updated successfully');
    } catch (error) {
      showToast.error('Failed to save changes');
    } finally {
      setIsSaving(false);
    }
  };

  // Handle cancel editing
  const handleCancel = () => {
    setEditedContent(content);
    setIsEditing(false);
  };

  // Format text with basic syntax highlighting for resume sections
  const formatTextWithHighlighting = (text) => {
    if (!text) return '';
    
    const lines = text.split('\n');
    return lines.map((line, index) => {
      let className = 'text-gray-300';
      let content = line;
      
      // Highlight section headers (all caps or title case with colons)
      if (line.match(/^[A-Z\s]+:?$/) || line.match(/^[A-Z][a-z\s]+:$/)) {
        className = 'text-purple-400 font-semibold';
      }
      // Highlight email addresses
      else if (line.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/)) {
        className = 'text-blue-400';
      }
      // Highlight phone numbers
      else if (line.match(/(\+?1?[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})/)) {
        className = 'text-green-400';
      }
      // Highlight dates
      else if (line.match(/\b(19|20)\d{2}\b|\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\b/i)) {
        className = 'text-yellow-400';
      }
      // Highlight bullet points
      else if (line.match(/^\s*[•·▪▫-]\s/)) {
        className = 'text-cyan-400';
      }
      
      return (
        <div key={index} className="flex">
          {showLineNumbers && (
            <span className="text-gray-500 text-xs w-8 flex-shrink-0 text-right mr-3 select-none">
              {index + 1}
            </span>
          )}
          <span className={className}>{content || '\u00A0'}</span>
        </div>
      );
    });
  };

  if (!content) {
    return (
      <div className="text-center py-12">
        <FileText className="w-16 h-16 text-gray-500 mx-auto mb-4" />
        <p className="text-gray-400 text-lg">No resume text available</p>
        <p className="text-gray-500 text-sm">Upload a resume to see extracted text here</p>
      </div>
    );
  }

  return (
    <div className={`bg-gray-800/50 border border-gray-700 rounded-2xl overflow-hidden ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-700">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
            <FileText className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Extracted Resume Text</h3>
            <p className="text-sm text-gray-400">
              {content.length} characters • {content.split('\n').length} lines
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Line numbers toggle */}
          <button
            onClick={() => setShowLineNumbers(!showLineNumbers)}
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
            title={showLineNumbers ? 'Hide line numbers' : 'Show line numbers'}
          >
            <Hash className="w-4 h-4" />
          </button>

          {/* Expand/collapse */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
            title={isExpanded ? 'Collapse' : 'Expand'}
          >
            {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          {/* Copy button */}
          <button
            onClick={handleCopy}
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
            title="Copy to clipboard"
          >
            <Copy className="w-4 h-4" />
          </button>

          {/* Download button */}
          <button
            onClick={() => handleDownload('txt')}
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
            title="Download as TXT"
          >
            <Download className="w-4 h-4" />
          </button>

          {/* Edit button */}
          {isEditable && (
            <button
              onClick={() => setIsEditing(!isEditing)}
              className={`p-2 rounded-lg transition-colors ${
                isEditing 
                  ? 'text-purple-400 bg-purple-500/20' 
                  : 'text-gray-400 hover:text-white hover:bg-gray-700'
              }`}
              title={isEditing ? 'Cancel editing' : 'Edit text'}
            >
              {isEditing ? <X className="w-4 h-4" /> : <Edit3 className="w-4 h-4" />}
            </button>
          )}

          {/* Reparse button */}
          {onReparse && (
            <button
              onClick={onReparse}
              className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
              title="Reparse resume data"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className={`relative ${isExpanded ? 'max-h-none' : 'max-h-96'} overflow-hidden`}>
        <AnimatePresence mode="wait">
          {isEditing ? (
            <motion.div
              key="editor"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="p-4"
            >
              <textarea
                value={editedContent}
                onChange={(e) => setEditedContent(e.target.value)}
                className="w-full h-96 bg-gray-900/50 border border-gray-600 rounded-lg p-4 text-gray-300 font-mono text-sm resize-none focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                placeholder="Enter your resume text here..."
              />
              
              <div className="flex items-center justify-end gap-3 mt-4">
                <button
                  onClick={handleCancel}
                  className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                  disabled={isSaving}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSaving || editedContent === content}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center gap-2"
                >
                  {isSaving ? (
                    <>
                      <motion.div
                        className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="display"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="p-4"
            >
              <div className="font-mono text-sm leading-relaxed whitespace-pre-wrap">
                {formatTextWithHighlighting(content)}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Fade overlay for collapsed state */}
        {!isExpanded && !isEditing && (
          <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-gray-800/50 to-transparent pointer-events-none" />
        )}
      </div>

      {/* Expand button for collapsed state */}
      {!isExpanded && !isEditing && (
        <div className="p-4 border-t border-gray-700 text-center">
          <button
            onClick={() => setIsExpanded(true)}
            className="text-purple-400 hover:text-purple-300 text-sm font-medium transition-colors"
          >
            Show full text ({content.split('\n').length - 10}+ more lines)
          </button>
        </div>
      )}
    </div>
  );
};

export default ExtractedTextDisplay;