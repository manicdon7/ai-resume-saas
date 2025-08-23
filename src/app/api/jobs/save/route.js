import { NextResponse } from 'next/server';
import { verifyIdToken } from '../../../../../src/lib/firebase-admin';
import { getFirestore, doc, setDoc, serverTimestamp } from 'firebase/firestore';

export async function POST(request) {
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

    const { jobId } = await request.json();

    if (!jobId) {
      return NextResponse.json({ error: 'Job ID required' }, { status: 400 });
    }

    const db = getFirestore();
    const saveId = `${decodedToken.uid}_${jobId}`;
    
    await setDoc(doc(db, 'savedJobs', saveId), {
      userId: decodedToken.uid,
      jobId,
      savedAt: serverTimestamp()
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Save job error:', error);
    return NextResponse.json(
      { error: 'Failed to save job' }, 
      { status: 500 }
    );
  }
}