export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Array of fetch methods with fallback priority
  const fetchMethods = [
    // Method 1: Direct fetch with complete headers
    {
      name: 'Direct',
      fetch: async () => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);
        
        try {
          const response = await fetch('https://growtopiagame.com/detail', {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
              'Accept': 'application/json, text/plain, */*',
              'Accept-Language': 'en-US,en;q=0.9',
              'Referer': 'https://growtopiagame.com/',
              'Cache-Control': 'no-cache'
            },
            signal: controller.signal
          });
          clearTimeout(timeoutId);
          
          if (!response.ok) throw new Error(`HTTP ${response.status}`);
          return await response.json();
        } catch (error) {
          clearTimeout(timeoutId);
          throw error;
        }
      }
    },
    
    // Method 2: AllOrigins proxy
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
          return await response.json();
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
          return await response.json();
        } catch (error) {
          clearTimeout(timeoutId);
          throw error;
        }
      }
    },
    
    // Method 4: Proxy via allorigins with get endpoint
    {
      name: 'AllOriginsGet',
      fetch: async () => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);
        
        try {
          const response = await fetch(
            'https://api.allorigins.win/get?url=' + encodeURIComponent('https://growtopiagame.com/detail'),
            { signal: controller.signal }
          );
          clearTimeout(timeoutId);
          
          if (!response.ok) throw new Error(`HTTP ${response.status}`);
          const result = await response.json();
          
          // AllOrigins wraps response in { contents: "..." }
          if (result.contents) {
            return JSON.parse(result.contents);
          }
          throw new Error('Invalid AllOrigins response');
        } catch (error) {
          clearTimeout(timeoutId);
          throw error;
        }
      }
    }
  ];

  const errors = [];
  const startTime = Date.now();
  
  // Try each method sequentially
  for (const method of fetchMethods) {
    try {
      console.log(`[${new Date().toISOString()}] Trying ${method.name}...`);
      
      const data = await method.fetch();
      
      // Validate data structure
      if (data && data.online_user !== undefined) {
        const elapsed = Date.now() - startTime;
        console.log(`[${new Date().toISOString()}] ✅ ${method.name} succeeded in ${elapsed}ms: ${data.online_user} players`);
        
        return res.status(200).json({
          success: true,
          timestamp: new Date().toISOString(),
          data: data,
          source: method.name,
          elapsed_ms: elapsed
        });
      } else {
        throw new Error('Invalid data structure - missing online_user');
      }
      
    } catch (error) {
      const errorMsg = `${method.name}: ${error.message}`;
      console.error(`[${new Date().toISOString()}] ❌ ${errorMsg}`);
      errors.push(errorMsg);
      // Continue to next method
    }
  }
  
  // All methods failed
  const elapsed = Date.now() - startTime;
  console.error(`[${new Date().toISOString()}] 🚫 All methods failed after ${elapsed}ms`);
  
  return res.status(503).json({ 
    success: false,
    error: 'All fetch methods failed',
    attempts: errors,
    timestamp: new Date().toISOString(),
    elapsed_ms: elapsed,
    hint: 'Growtopia API may be temporarily unavailable or blocking requests'
  });
}
