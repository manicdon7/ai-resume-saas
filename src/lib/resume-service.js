import { UserService } from '../../lib/user-service';
import { extractKeywords, matchResumeWithJob } from './resume-parser';

/**
 * Resume Management Service
 * Handles all resume-related operations including save, delete, parse, and sync
 */
export class ResumeService {
  
  /**
   * Save resume data to MongoDB and update Redux state
   * @param {string} userId - User ID
   * @param {Object} resumeData - Resume data to save
   * @param {Function} dispatch - Redux dispatch function
   * @returns {Promise<Object>} Saved resume data
   */
  static async saveResume(userId, resumeData, dispatch) {
    try {
      // Validate input data
      const validation = this.validateResumeData(resumeData);
      if (!validation.isValid) {
        throw new Error(`Invalid resume data: ${validation.errors.join(', ')}`);
      }

      // Update Redux state to show saving in progress
      if (dispatch) {
        const { setSyncStatus, setError, clearError } = await import('../store/slices/resumeSlice');
        dispatch(clearError());
        dispatch(setSyncStatus('pending'));
      }

      // Parse resume text if provided
      let parsedData = resumeData.parsedData || {};
      if (resumeData.resumeText && !resumeData.parsedData) {
        parsedData = await this.parseResumeText(resumeData.resumeText);
      }

      // Prepare resume data for MongoDB
      const resumeToSave = {
        resumeText: resumeData.resumeText || '',
        parsedData,
        fileName: resumeData.fileName || '',
        fileSize: resumeData.fileSize || 0,
        fileType: resumeData.fileType || '',
        version: (resumeData.version || 0) + 1,
        metadata: {
          wordCount: resumeData.resumeText ? 
            resumeData.resumeText.split(/\s+/).filter(word => word.length > 0).length : 0,
          pageCount: resumeData.metadata?.pageCount || 1,
          lastParsed: new Date().toISOString(),
          parseVersion: '1.0',
          ...resumeData.metadata
        }
      };

      // Save to MongoDB
      const savedResume = await UserService.saveResumeData(userId, resumeToSave);

      // Update Redux state with saved data
      if (dispatch) {
        const { 
          setResumeText, 
          setParsedData, 
          setFileMetadata, 
          updateMetadata,
          incrementVersion,
          setSyncStatus 
        } = await import('../store/slices/resumeSlice');
        
        dispatch(setResumeText(savedResume.resumeText));
        dispatch(setParsedData(savedResume.parsedData));
        dispatch(setFileMetadata({
          fileName: savedResume.fileName,
          fileSize: savedResume.fileSize,
          fileType: savedResume.fileType
        }));
        dispatch(updateMetadata(savedResume.metadata));
        dispatch(setSyncStatus('synced'));
      }

      // Log activity
      await UserService.addUserActivity(
        userId, 
        'resume_save', 
        'Resume saved successfully',
        {
          fileName: resumeToSave.fileName,
          version: resumeToSave.version,
          wordCount: resumeToSave.metadata.wordCount
        }
      );

      return savedResume;

    } catch (error) {
      console.error('Error saving resume:', error);
      
      // Update Redux state with error
      if (dispatch) {
        const { setError, setSyncStatus } = await import('../store/slices/resumeSlice');
        dispatch(setError(error.message));
        dispatch(setSyncStatus('error'));
      }
      
      throw error;
    }
  }

  /**
   * Delete resume data from MongoDB and clear Redux state
   * @param {string} userId - User ID
   * @param {Function} dispatch - Redux dispatch function
   * @returns {Promise<boolean>} Success status
   */
  static async deleteResume(userId, dispatch) {
    try {
      // Update Redux state to show deletion in progress
      if (dispatch) {
        const { setSyncStatus, setError, clearError } = await import('../store/slices/resumeSlice');
        dispatch(clearError());
        dispatch(setSyncStatus('pending'));
      }

      // Delete from MongoDB
      await UserService.deleteResumeData(userId);

      // Clear Redux state
      if (dispatch) {
        const { clearResume } = await import('../store/slices/resumeSlice');
        dispatch(clearResume());
      }

      // Log activity
      await UserService.addUserActivity(
        userId, 
        'resume_delete', 
        'Resume deleted successfully'
      );

      return true;

    } catch (error) {
      console.error('Error deleting resume:', error);
      
      // Update Redux state with error
      if (dispatch) {
        const { setError, setSyncStatus } = await import('../store/slices/resumeSlice');
        dispatch(setError(error.message));
        dispatch(setSyncStatus('error'));
      }
      
      throw error;
    }
  }

  /**
   * Parse resume text and extract structured data
   * @param {string} resumeText - Raw resume text
   * @returns {Promise<Object>} Parsed resume data
   */
  static async parseResumeText(resumeText) {
    try {
      if (!resumeText || typeof resumeText !== 'string') {
        throw new Error('Invalid resume text provided');
      }

      // Extract basic information using regex patterns
      const parsedData = {
        name: this.extractName(resumeText),
        email: this.extractEmail(resumeText),
        phone: this.extractPhone(resumeText),
        location: this.extractLocation(resumeText),
        summary: this.extractSummary(resumeText),
        experience: this.extractExperience(resumeText),
        education: this.extractEducation(resumeText),
        skills: extractKeywords(resumeText),
        certifications: this.extractCertifications(resumeText)
      };

      return parsedData;

    } catch (error) {
      console.error('Error parsing resume text:', error);
      throw new Error(`Failed to parse resume: ${error.message}`);
    }
  }

  /**
   * Sync resume data between MongoDB and Redux state
   * @param {string} userId - User ID
   * @param {Function} dispatch - Redux dispatch function
   * @returns {Promise<Object|null>} Synced resume data or null if no resume exists
   */
  static async syncResumeState(userId, dispatch) {
    try {
      // Update Redux state to show sync in progress
      if (dispatch) {
        const { setSyncStatus, setError, clearError } = await import('../store/slices/resumeSlice');
        dispatch(clearError());
        dispatch(setSyncStatus('pending'));
      }

      // Fetch resume data from MongoDB
      const resumeData = await UserService.getResumeData(userId);

      if (resumeData) {
        // Update Redux state with fetched data
        if (dispatch) {
          const { 
            setResumeText, 
            setParsedData, 
            setFileMetadata, 
            updateMetadata,
            setSyncStatus 
          } = await import('../store/slices/resumeSlice');
          
          dispatch(setResumeText(resumeData.resumeText || ''));
          dispatch(setParsedData(resumeData.parsedData || {}));
          dispatch(setFileMetadata({
            fileName: resumeData.fileName || '',
            fileSize: resumeData.fileSize || 0,
            fileType: resumeData.fileType || ''
          }));
          dispatch(updateMetadata(resumeData.metadata || {}));
          dispatch(setSyncStatus('synced'));
        }

        return resumeData;
      } else {
        // No resume data found, clear Redux state
        if (dispatch) {
          const { clearResume } = await import('../store/slices/resumeSlice');
          dispatch(clearResume());
        }
        
        return null;
      }

    } catch (error) {
      console.error('Error syncing resume state:', error);
      
      // Update Redux state with error
      if (dispatch) {
        const { setError, setSyncStatus } = await import('../store/slices/resumeSlice');
        dispatch(setError(error.message));
        dispatch(setSyncStatus('error'));
      }
      
      throw error;
    }
  }

  /**
   * Get resume data for a user
   * @param {string} userId - User ID
   * @returns {Promise<Object|null>} Resume data or null if not found
   */
  static async getResumeData(userId) {
    try {
      return await UserService.getResumeData(userId);
    } catch (error) {
      console.error('Error getting resume data:', error);
      throw error;
    }
  }

  /**
   * Validate resume data structure
   * @param {Object} resumeData - Resume data to validate
   * @returns {Object} Validation result with isValid and errors
   */
  static validateResumeData(resumeData) {
    const errors = [];

    if (!resumeData || typeof resumeData !== 'object') {
      errors.push('Resume data must be an object');
      return { isValid: false, errors };
    }

    // Check for required fields
    if (resumeData.resumeText !== undefined && typeof resumeData.resumeText !== 'string') {
      errors.push('Resume text must be a string');
    }

    if (resumeData.fileName !== undefined && typeof resumeData.fileName !== 'string') {
      errors.push('File name must be a string');
    }

    if (resumeData.fileSize !== undefined && typeof resumeData.fileSize !== 'number') {
      errors.push('File size must be a number');
    }

    if (resumeData.parsedData !== undefined && typeof resumeData.parsedData !== 'object') {
      errors.push('Parsed data must be an object');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Helper methods for parsing resume text

  static extractName(text) {
    // Look for name patterns at the beginning of the resume
    const lines = text.split('\n').filter(line => line.trim());
    if (lines.length > 0) {
      const firstLine = lines[0].trim();
      // Simple heuristic: if first line doesn't contain common resume keywords, it's likely a name
      const keywords = ['resume', 'cv', 'curriculum', 'vitae', 'email', 'phone', 'address'];
      if (!keywords.some(keyword => firstLine.toLowerCase().includes(keyword))) {
        return firstLine;
      }
    }
    return '';
  }

  static extractEmail(text) {
    const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
    const matches = text.match(emailRegex);
    return matches ? matches[0] : '';
  }

  static extractPhone(text) {
    const phoneRegex = /(\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})/g;
    const matches = text.match(phoneRegex);
    return matches ? matches[0] : '';
  }

  static extractLocation(text) {
    // Look for city, state patterns
    const locationRegex = /([A-Za-z\s]+),\s*([A-Z]{2})\s*(\d{5})?/g;
    const matches = text.match(locationRegex);
    return matches ? matches[0] : '';
  }

  static extractSummary(text) {
    // Look for summary/objective sections
    const summaryRegex = /(summary|objective|profile)[\s\S]*?(?=\n\s*\n|\n[A-Z])/gi;
    const matches = text.match(summaryRegex);
    if (matches && matches[0]) {
      return matches[0].replace(/(summary|objective|profile)/gi, '').trim();
    }
    return '';
  }

  static extractExperience(text) {
    // Simple experience extraction - look for job titles and companies
    const experienceSection = this.extractSection(text, ['experience', 'work history', 'employment']);
    const experiences = [];
    
    if (experienceSection) {
      const lines = experienceSection.split('\n').filter(line => line.trim());
      let currentExp = null;
      
      for (const line of lines) {
        const trimmedLine = line.trim();
        if (trimmedLine && !trimmedLine.toLowerCase().includes('experience')) {
          if (currentExp && (trimmedLine.includes('•') || trimmedLine.includes('-'))) {
            // This is likely a bullet point for the current experience
            if (!currentExp.description) currentExp.description = '';
            currentExp.description += trimmedLine + ' ';
          } else {
            // This might be a new job title/company
            if (currentExp) {
              experiences.push(currentExp);
            }
            currentExp = {
              title: trimmedLine,
              company: '',
              duration: '',
              description: ''
            };
          }
        }
      }
      
      if (currentExp) {
        experiences.push(currentExp);
      }
    }
    
    return experiences;
  }

  static extractEducation(text) {
    const educationSection = this.extractSection(text, ['education', 'academic background']);
    const education = [];
    
    if (educationSection) {
      const lines = educationSection.split('\n').filter(line => line.trim());
      
      for (const line of lines) {
        const trimmedLine = line.trim();
        if (trimmedLine && !trimmedLine.toLowerCase().includes('education')) {
          education.push({
            degree: trimmedLine,
            institution: '',
            year: ''
          });
        }
      }
    }
    
    return education;
  }

  static extractCertifications(text) {
    const certSection = this.extractSection(text, ['certifications', 'certificates', 'licenses']);
    const certifications = [];
    
    if (certSection) {
      const lines = certSection.split('\n').filter(line => line.trim());
      
      for (const line of lines) {
        const trimmedLine = line.trim();
        if (trimmedLine && !trimmedLine.toLowerCase().includes('certification')) {
          certifications.push(trimmedLine);
        }
      }
    }
    
    return certifications;
  }

  static extractSection(text, sectionNames) {
    for (const sectionName of sectionNames) {
      const regex = new RegExp(`(${sectionName})([\\s\\S]*?)(?=\\n\\s*[A-Z][A-Z\\s]*\\n|$)`, 'gi');
      const matches = text.match(regex);
      if (matches && matches[0]) {
        return matches[0];
      }
    }
    return null;
  }

  /**
   * Match resume skills with job requirements
   * @param {Array} resumeSkills - Skills from resume
   * @param {Array} jobSkills - Required skills from job
   * @returns {Object} Match analysis
   */
  static matchWithJob(resumeSkills, jobSkills) {
    return matchResumeWithJob(resumeSkills, jobSkills);
  }

  /**
   * Clear resume state on user signout
   * @param {Function} dispatch - Redux dispatch function
   */
  static clearResumeOnSignout(dispatch) {
    if (dispatch) {
      const { clearResume } = require('../store/slices/resumeSlice');
      dispatch(clearResume());
    }
  }
}