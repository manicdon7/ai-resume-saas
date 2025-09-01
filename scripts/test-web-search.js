// Test script for web search API directly
async function testWebSearchAPI() {
  try {
    console.log('Testing Web Search API directly...');
    
    const response = await fetch('https://web-deep-search.vercel.app/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: 'software developer jobs hiring remote'
      }),
    });

    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Web Search API successful!');
      console.log('Response structure:', {
        hasAnswer: !!data.answer,
        answerLength: data.answer?.length || 0,
        sourcesCount: data.sources_used?.length || 0,
        sources: data.sources_used?.slice(0, 5) || []
      });
      
      if (data.answer) {
        console.log('Answer preview:', data.answer.substring(0, 200) + '...');
      }
      
      return data;
    } else {
      const errorText = await response.text();
      console.log('❌ Web Search API failed:', response.status, errorText);
      return null;
    }

  } catch (error) {
    console.error('❌ Web Search API error:', error.message);
    return null;
  }
}

// Run the test
testWebSearchAPI();