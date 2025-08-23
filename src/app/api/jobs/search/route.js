import { NextResponse } from 'next/server';
import { verifyIdToken } from '../../../../lib/firebase-admin';

// Mock job search API - Replace with actual job search provider
const MOCK_JOBS = [
  {
    id: '1',
    title: 'Senior Frontend Developer',
    company: 'TechCorp Solutions',
    location: 'San Francisco, CA',
    type: 'full-time',
    remote: true,
    salary: { min: 120000, max: 180000 },
    description: 'We are seeking a Senior Frontend Developer to join our dynamic team. You will be responsible for building and maintaining our web applications using React and Next.js.',
    skills: ['React', 'TypeScript', 'Next.js', 'Node.js', 'AWS'],
    postedDate: '2024-01-15',
    url: 'https://example.com/jobs/1',
    applicants: 45
  },
  {
    id: '2',
    title: 'Full Stack Engineer',
    company: 'StartupXYZ',
    location: 'New York, NY',
    type: 'full-time',
    remote: false,
    salary: { min: 100000, max: 150000 },
    description: 'Join our growing startup as a Full Stack Engineer. Work with cutting-edge technologies and make a real impact on our product.',
    skills: ['JavaScript', 'Python', 'PostgreSQL', 'Docker', 'Kubernetes'],
    postedDate: '2024-01-14',
    url: 'https://example.com/jobs/2',
    applicants: 23
  },
  {
    id: '3',
    title: 'DevOps Engineer',
    company: 'CloudTech Inc',
    location: 'Remote',
    type: 'contract',
    remote: true,
    salary: { min: 110000, max: 160000 },
    description: 'Looking for a DevOps Engineer to help scale our infrastructure. Experience with AWS, Kubernetes, and CI/CD pipelines required.',
    skills: ['AWS', 'Kubernetes', 'Terraform', 'Jenkins', 'Docker'],
    postedDate: '2024-01-13',
    url: 'https://example.com/jobs/3',
    applicants: 67
  },
  {
    id: '4',
    title: 'Junior Software Developer',
    company: 'Innovation Labs',
    location: 'Austin, TX',
    type: 'full-time',
    remote: true,
    salary: { min: 70000, max: 90000 },
    description: 'Great opportunity for junior developers to grow their skills. We provide mentorship and training programs.',
    skills: ['JavaScript', 'React', 'Git', 'SQL', 'HTML/CSS'],
    postedDate: '2024-01-12',
    url: 'https://example.com/jobs/4',
    applicants: 89
  },
  {
    id: '5',
    title: 'Product Manager',
    company: 'TechGiant Corp',
    location: 'Seattle, WA',
    type: 'full-time',
    remote: false,
    salary: { min: 130000, max: 200000 },
    description: 'Lead product development for our flagship SaaS platform. Experience with agile methodologies and user research required.',
    skills: ['Product Management', 'Agile', 'User Research', 'Data Analysis', 'Leadership'],
    postedDate: '2024-01-11',
    url: 'https://example.com/jobs/5',
    applicants: 34
  }
];

function filterJobs(jobs, params) {
  let filtered = [...jobs];

  // Filter by query
  if (params.query) {
    const query = params.query.toLowerCase();
    filtered = filtered.filter(job => 
      job.title.toLowerCase().includes(query) ||
      job.description.toLowerCase().includes(query) ||
      job.company.toLowerCase().includes(query) ||
      job.skills.some(skill => skill.toLowerCase().includes(query))
    );
  }

  // Filter by location
  if (params.location) {
    const location = params.location.toLowerCase();
    filtered = filtered.filter(job => 
      job.location.toLowerCase().includes(location) ||
      (params.location.toLowerCase().includes('remote') && job.remote)
    );
  }

  // Filter by experience level
  if (params.experience) {
    const experienceMap = {
      'entry': [0, 2],
      'mid': [3, 5],
      'senior': [6, 10],
      'executive': [11, 50]
    };
    
    // This is a simplified mapping - in real implementation, this would be more sophisticated
    filtered = filtered.filter(job => {
      if (params.experience === 'entry') return true; // Simplified for demo
      if (params.experience === 'mid') return true;
      if (params.experience === 'senior') return true;
      if (params.experience === 'executive') return true;
      return true;
    });
  }

  // Filter by salary
  if (params.salary) {
    const [min, max] = params.salary.split('-').map(s => s.replace(/[^\d]/g, ''));
    if (min) {
      filtered = filtered.filter(job => job.salary.min >= parseInt(min) * 1000);
    }
    if (max && max !== '+') {
      filtered = filtered.filter(job => job.salary.max <= parseInt(max) * 1000);
    }
  }

  // Filter by remote
  if (params.remote === 'true') {
    filtered = filtered.filter(job => job.remote);
  }

  return filtered;
}

export async function GET(request) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await verifyIdToken(token);
    
    if (!decodedToken) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const params = {
      query: searchParams.get('query') || '',
      location: searchParams.get('location') || '',
      experience: searchParams.get('experience') || '',
      salary: searchParams.get('salary') || '',
      remote: searchParams.get('remote') || ''
    };

    // In production, integrate with actual job search APIs like:
    // - LinkedIn Jobs API
    // - Indeed API
    // - Glassdoor API
    // - GitHub Jobs API
    // - Remote OK API
    // - We Work Remotely API

    // For now, use mock data with filtering
    const filteredJobs = filterJobs(MOCK_JOBS, params);

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    return NextResponse.json({
      success: true,
      jobs: filteredJobs,
      total: filteredJobs.length,
      query: params
    });

  } catch (error) {
    console.error('Job search error:', error);
    return NextResponse.json(
      { error: 'Failed to search jobs' }, 
      { status: 500 }
    );
  }
}