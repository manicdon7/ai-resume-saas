import { getFirestore, doc, setDoc, getDoc, collection, query, where, getDocs, serverTimestamp } from 'firebase/firestore';

export async function saveApplication(applicationData) {
  try {
    const db = getFirestore();
    
    // Generate unique application ID
    const applicationId = `${applicationData.userId}_${applicationData.jobId}_${Date.now()}`;
    
    const application = {
      ...applicationData,
      id: applicationId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      status: 'submitted'
    };
    
    // Save to Firestore
    await setDoc(doc(db, 'jobApplications', applicationId), application);
    
    // Update user's application history
    const userRef = doc(db, 'users', applicationData.userId);
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists()) {
      const userData = userDoc.data();
      const applications = userData.jobApplications || [];
      applications.push(applicationId);
      
      await setDoc(userRef, {
        jobApplications: applications,
        updatedAt: serverTimestamp()
      }, { merge: true });
    }
    
    return applicationId;
    
  } catch (error) {
    console.error('Save application error:', error);
    throw new Error('Failed to save application');
  }
}

export async function getUserApplications(userId) {
  try {
    const db = getFirestore();
    const q = query(
      collection(db, 'jobApplications'),
      where('userId', '==', userId)
    );
    
    const querySnapshot = await getDocs(q);
    const applications = [];
    
    querySnapshot.forEach((doc) => {
      applications.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return applications.sort((a, b) => 
      new Date(b.createdAt?.toDate?.()) - new Date(a.createdAt?.toDate?.())
    );
    
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
    const db = getFirestore();
    
    const updateData = {
      status,
      updatedAt: serverTimestamp()
    };
    
    if (notes) {
      updateData.notes = notes;
    }
    
    await setDoc(doc(db, 'jobApplications', applicationId), updateData, { merge: true });
    
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