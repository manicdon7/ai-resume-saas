// Mock Firestore implementation for development
let mockFirestore = null;

try {
  const { getFirestore, doc, setDoc, getDoc, collection, query, where, getDocs, serverTimestamp } = await import('firebase/firestore');
  mockFirestore = { getFirestore, doc, setDoc, getDoc, collection, query, where, getDocs, serverTimestamp };
} catch (error) {
  console.warn('Firebase Firestore not available, using mock implementations');
}

// Mock implementation for development
const mockApplications = new Map();

export async function saveApplication(applicationData) {
  try {
    // Generate unique application ID
    const applicationId = `${applicationData.userId}_${applicationData.jobId}_${Date.now()}`;
    
    const application = {
      ...applicationData,
      id: applicationId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'submitted'
    };
    
    // Mock save to storage
    mockApplications.set(applicationId, application);
    
    return applicationId;
    
  } catch (error) {
    console.error('Save application error:', error);
    throw new Error('Failed to save application');
  }
}

export async function getUserApplications(userId) {
  try {
    // Mock implementation - return applications for this user
    const userApplications = Array.from(mockApplications.values())
      .filter(app => app.userId === userId)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    return userApplications;
    
  } catch (error) {
    console.error('Get applications error:', error);
    throw new Error('Failed to get applications');
  }
}

export async function getApplication(applicationId) {
  try {
    const db = getFirestore();
    const docRef = doc(db, 'jobApplications', applicationId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data()
      };
    }
    
    return null;
    
  } catch (error) {
    console.error('Get application error:', error);
    throw new Error('Failed to get application');
  }
}

export async function updateApplicationStatus(applicationId, status, notes = '') {
  try {
    // Mock implementation - update status in mock storage
    const application = mockApplications.get(applicationId);
    if (application) {
      application.status = status;
      application.updatedAt = new Date().toISOString();
      if (notes) {
        application.notes = notes;
      }
    }
    
    return true;
    
  } catch (error) {
    console.error('Update application error:', error);
    throw new Error('Failed to update application');
  }
}

// Analytics functions
export async function getApplicationStats(userId) {
  try {
    const applications = await getUserApplications(userId);
    
    const stats = {
      total: applications.length,
      submitted: applications.filter(app => app.status === 'submitted').length,
      interviewing: applications.filter(app => app.status === 'interviewing').length,
      offer: applications.filter(app => app.status === 'offer').length,
      rejected: applications.filter(app => app.status === 'rejected').length,
      companies: [...new Set(applications.map(app => app.company))].length
    };
    
    return stats;
    
  } catch (error) {
    console.error('Get stats error:', error);
    throw new Error('Failed to get application stats');
  }
}