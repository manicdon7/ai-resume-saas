import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { getFirestore, doc, setDoc } from 'firebase/firestore';

// Mock resume parser - Replace with actual resume parsing service
export async function uploadResume(file, userId) {
  try {
    const storage = getStorage();
    const db = getFirestore();
    
    // Create unique filename
    const timestamp = Date.now();
    const filename = `resumes/${userId}/${timestamp}_${file.name}`;
    const storageRef = ref(storage, filename);
    
    // Upload file
    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);
    
    // Mock resume parsing - In production, use services like:
    // - OpenAI GPT for resume parsing
    // - Google Cloud Document AI
    // - AWS Textract
    // - Resume parsing APIs like Sovren or RChilli
    
    const mockSkills = [
      'JavaScript', 'React', 'Node.js', 'TypeScript', 'Python', 'SQL', 'Git', 'Docker'
    ];
    
    const mockExperience = [
      {
        title: 'Senior Software Engineer',
        company: 'Previous Company',
        duration: '2020-2023',
        description: 'Led development of web applications'
      }
    ];
    
    const mockEducation = [
      {
        degree: 'Bachelor of Computer Science',
        institution: 'University Name',
        year: '2019'
      }
    ];
    
    // Save resume metadata to Firestore
    const resumeData = {
      userId,
      filename: file.name,
      fileUrl: downloadURL,
      fileSize: file.size,
      fileType: file.type,
      uploadedAt: new Date().toISOString(),
      skills: mockSkills,
      experience: mockExperience,
      education: mockEducation,
      parsed: true
    };
    
    await setDoc(doc(db, 'resumes', `${userId}_${timestamp}`), resumeData);
    
    return {
      skills: mockSkills,
      experience: mockExperience,
      education: mockEducation,
      fileUrl: downloadURL
    };
    
  } catch (error) {
    console.error('Resume upload error:', error);
    throw new Error('Failed to process resume');
  }
}

// Function to extract keywords from resume text
export function extractKeywords(resumeText) {
  const technicalSkills = [
    'JavaScript', 'TypeScript', 'Python', 'Java', 'C++', 'C#', 'Go', 'Rust',
    'React', 'Angular', 'Vue.js', 'Next.js', 'Node.js', 'Express.js',
    'MongoDB', 'PostgreSQL', 'MySQL', 'Redis', 'Elasticsearch',
    'AWS', 'Azure', 'Google Cloud', 'Docker', 'Kubernetes', 'Terraform',
    'Git', 'CI/CD', 'Agile', 'Scrum', 'Machine Learning', 'AI', 'Data Science'
  ];
  
  const foundSkills = technicalSkills.filter(skill => 
    resumeText.toLowerCase().includes(skill.toLowerCase())
  );
  
  return foundSkills;
}

// Function to match resume with job requirements
export function matchResumeWithJob(resumeSkills, jobSkills) {
  const resumeLower = resumeSkills.map(skill => skill.toLowerCase());
  const jobLower = jobSkills.map(skill => skill.toLowerCase());
  
  const matches = jobLower.filter(skill => resumeLower.includes(skill));
  const matchPercentage = (matches.length / jobSkills.length) * 100;
  
  return {
    matches,
    matchPercentage: Math.round(matchPercentage),
    missing: jobSkills.filter(skill => !matches.includes(skill.toLowerCase()))
  };
}