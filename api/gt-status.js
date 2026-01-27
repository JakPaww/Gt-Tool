// Vercel Serverless Function
// File ini harus diletakkan di folder /api di root project Anda

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Fetch data dari Growtopia
    const response = await fetch('https://growtopiagame.com/detail', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    // Return data dengan tambahan timestamp
    return res.status(200).json({
      success: true,
      timestamp: new Date().toISOString(),
      data: data
    });
    
  } catch (error) {
    console.error('Error fetching GT data:', error);
    return res.status(500).json({ 
      success: false,
      error: 'Failed to fetch Growtopia data',
      message: error.message 
    });
  }
}
