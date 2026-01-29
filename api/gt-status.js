export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Fetch methods dengan timeout
  const fetchMethods = [
    // Method 1: Direct
    {
      name: 'Direct',
      fetch: async () => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);
        
        try {
          const response = await fetch('https://growtopiagame.com/detail', {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
              'Accept': 'application/json',
              'Referer': 'https://growtopiagame.com/'
            },
            signal: controller.signal
          });
          clearTimeout(timeoutId);
          
          if (!response.ok) throw new Error(`HTTP ${response.status}`);
          
          const text = await response.text();
          // Return raw JSON exactly as received
          return JSON.parse(text);
        } catch (error) {
          clearTimeout(timeoutId);
          throw error;
        }
      }
    },
    
    // Method 2: AllOrigins Raw
    {
      name: 'AllOrigins',
      fetch: async () => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);
        
        try {
          const response = await fetch(
            'https://api.allorigins.win/raw?url=' + encodeURIComponent('https://growtopiagame.com/detail'),
            { signal: controller.signal }
          );
          clearTimeout(timeoutId);
          
          if (!response.ok) throw new Error(`HTTP ${response.status}`);
          
          const text = await response.text();
          return JSON.parse(text);
        } catch (error) {
          clearTimeout(timeoutId);
          throw error;
        }
      }
    },
    
    // Method 3: CORS Proxy
    {
      name: 'CORSProxy',
      fetch: async () => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);
        
        try {
          const response = await fetch(
            'https://corsproxy.io/?' + encodeURIComponent('https://growtopiagame.com/detail'),
            { signal: controller.signal }
          );
          clearTimeout(timeoutId);
          
          if (!response.ok) throw new Error(`HTTP ${response.status}`);
          
          const text = await response.text();
          return JSON.parse(text);
        } catch (error) {
          clearTimeout(timeoutId);
          throw error;
        }
      }
    }
  ];

  const errors = [];
  
  // Try each method
  for (const method of fetchMethods) {
    try {
      console.log(`Trying ${method.name}...`);
      
      const rawData = await method.fetch();
      
      // Validate that we have online_user field
      if (rawData && rawData.online_user !== undefined) {
        console.log(`✅ ${method.name} success: ${rawData.online_user} players`);
        
        // Return RAW data exactly as received, just wrap it
        return res.status(200).json({
          success: true,
          timestamp: new Date().toISOString(),
          data: rawData,  // EXACT data from Growtopia
          source: method.name
        });
      } else {
        throw new Error('Missing online_user field');
      }
      
    } catch (error) {
      const errorMsg = `${method.name}: ${error.message}`;
      console.error(`❌ ${errorMsg}`);
      errors.push(errorMsg);
    }
  }
  
  // All failed
  console.error('🚫 All methods failed');
  return res.status(503).json({ 
    success: false,
    error: 'All fetch methods failed',
    attempts: errors,
    timestamp: new Date().toISOString()
  });
}
