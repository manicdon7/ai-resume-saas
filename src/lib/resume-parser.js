// Mock implementations for development
let mockStorage = null;
let mockFirestore = null;

try {
  const { getStorage, ref, uploadBytes, getDownloadURL } = await import('firebase/storage');
  const { getFirestore, doc, setDoc } = await import('firebase/firestore');
  mockStorage = { getStorage, ref, uploadBytes, getDownloadURL };
  mockFirestore = { getFirestore, doc, setDoc };
} catch (error) {
  console.warn('Firebase modules not available, using mock implementations');
}

// Mock resume parser for development
export async function uploadResume(file, userId) {
  try {
    // Mock file upload - return mock URL
    const mockDownloadURL = `https://mock-storage.example.com/resumes/${userId}/${Date.now()}_${file.name}`;
    
    // Mock resume parsing results
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
    
    // Return mock data for development
    return {
      skills: mockSkills,
      experience: mockExperience,
      education: mockEducation,
      fileUrl: mockDownloadURL
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