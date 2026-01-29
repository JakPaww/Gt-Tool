export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Multiple proxy methods
  const fetchMethods = [
    // Method 1: AllOrigins (paling reliable untuk Growtopia)
    {
      name: 'AllOrigins',
      fetch: async () => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);
        
        try {
          const response = await fetch(
            'https://api.allorigins.win/raw?url=' + encodeURIComponent('https://growtopiagame.com/detail'),
            { 
              signal: controller.signal,
              headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
              }
            }
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
    
    // Method 2: CORS Anywhere alternative
    {
      name: 'ThingProxy',
      fetch: async () => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);
        
        try {
          const response = await fetch(
            'https://thingproxy.freeboard.io/fetch/' + encodeURIComponent('https://growtopiagame.com/detail'),
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
    
    // Method 3: AllOrigins dengan get endpoint
    {
      name: 'AllOriginsGet',
      fetch: async () => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);
        
        try {
          const response = await fetch(
            'https://api.allorigins.win/get?url=' + encodeURIComponent('https://growtopiagame.com/detail'),
            { signal: controller.signal }
          );
          clearTimeout(timeoutId);
          
          if (!response.ok) throw new Error(`HTTP ${response.status}`);
          const result = await response.json();
          
          if (result.contents) {
            return JSON.parse(result.contents);
          }
          throw new Error('No contents');
        } catch (error) {
          clearTimeout(timeoutId);
          throw error;
        }
      }
    },
    
    // Method 4: CORS.io
    {
      name: 'CORSAnywhere',
      fetch: async () => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);
        
        try {
          const response = await fetch(
            'https://cors-anywhere.herokuapp.com/https://growtopiagame.com/detail',
            { 
              signal: controller.signal,
              headers: {
                'X-Requested-With': 'XMLHttpRequest'
              }
            }
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
    
    // Method 5: JSONProxy
    {
      name: 'JSONProxy',
      fetch: async () => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);
        
        try {
          const response = await fetch(
            'https://jsonp.afeld.me/?url=' + encodeURIComponent('https://growtopiagame.com/detail'),
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
    
    // Method 6: Direct (last resort)
    {
      name: 'Direct',
      fetch: async () => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);
        
        try {
          const response = await fetch('https://growtopiagame.com/detail', {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
              'Accept': 'application/json, text/plain, */*',
              'Accept-Language': 'en-US,en;q=0.9',
              'Referer': 'https://growtopiagame.com/',
              'Origin': 'https://growtopiagame.com',
              'Cache-Control': 'no-cache',
              'Pragma': 'no-cache'
            },
            signal: controller.signal
          });
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
  const startTime = Date.now();
  
  // Try each method
  for (const method of fetchMethods) {
    try {
      console.log(`[${new Date().toISOString()}] Trying ${method.name}...`);
      
      const data = await method.fetch();
      
      // Validate
      if (data && data.online_user !== undefined) {
        const elapsed = Date.now() - startTime;
        console.log(`[${new Date().toISOString()}] ✅ ${method.name} SUCCESS in ${elapsed}ms`);
        
        return res.status(200).json({
          success: true,
          timestamp: new Date().toISOString(),
          data: data,
          source: method.name,
          elapsed_ms: elapsed
        });
      } else {
        throw new Error('Missing online_user field');
      }
      
    } catch (error) {
      const errorMsg = `${method.name}: ${error.message}`;
      console.error(`[${new Date().toISOString()}] ❌ ${errorMsg}`);
      errors.push(errorMsg);
    }
  }
  
  // All failed
  const elapsed = Date.now() - startTime;
  console.error(`[${new Date().toISOString()}] 🚫 All ${fetchMethods.length} methods failed in ${elapsed}ms`);
  
  return res.status(503).json({ 
    success: false,
    error: 'All fetch methods failed',
    attempts: errors,
    total_methods: fetchMethods.length,
    elapsed_ms: elapsed,
    timestamp: new Date().toISOString(),
    hint: 'Try again in a few seconds. Growtopia API may be rate limiting.'
  });
}
