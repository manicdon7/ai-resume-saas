// Test script for jobs API
async function testJobsAPI() {
  try {
    console.log('Testing Jobs API...');

    const response = await fetch('http://localhost:3000/api/jobs/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: 'software developer',
        page: 1,
        limit: 5,
        location: 'Remote',
        jobType: 'full-time',
        experience: 'mid'
      }),
    });

    const data = await response.json();
    console.log('Response status:', response.status);
    console.log('Response data:', JSON.stringify(data, null, 2));

    if (data.success) {
      console.log('✅ API test successful!');
      console.log(`Found ${data.jobs.length} jobs`);
      console.log(`Total jobs: ${data.pagination.totalJobs}`);
    } else {
      console.log('❌ API test failed:', data.error);
    }

  } catch (error) {
    console.error('❌ Test error:', error);
  }
}

// Run the test
testJobsAPI();