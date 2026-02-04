export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 's-maxage=10, stale-while-revalidate=59'); // Cache at edge for 10s

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // --- SMART HEADERS ---
  const USER_AGENTS = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  ];

  const getRandomHeaders = () => ({
    'User-Agent': USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)],
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9',
    'Cache-Control': 'no-cache',
    'Pragma': 'no-cache',
    'Referer': 'https://growtopiagame.com/', // Spoof referer
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Site': 'same-origin',
    'Upgrade-Insecure-Requests': '1'
  });

  // Multiple proxy methods
  const fetchMethods = [
    // Method 1: AllOrigins (Raw) - Paling reliable tapi kadang lambat
    {
      name: 'AllOrigins',
      fetch: async () => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000); // Increased to 15s
        try {
          const url = 'https://api.allorigins.win/raw?url=' + encodeURIComponent('https://growtopiagame.com/detail') + '&t=' + Date.now();
          const response = await fetch(url, {
            signal: controller.signal,
            headers: getRandomHeaders()
          });
          clearTimeout(timeoutId);
          if (!response.ok) throw new Error(`HTTP ${response.status}`);
          return await response.json();
        } catch (e) {
          clearTimeout(timeoutId);
          throw e;
        }
      }
    },

    // Method 2: ThingProxy (Restore this!)
    {
      name: 'ThingProxy',
      fetch: async () => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000);
        try {
          const url = 'https://thingproxy.freeboard.io/fetch/' + encodeURIComponent('https://growtopiagame.com/detail');
          const response = await fetch(url, {
            signal: controller.signal,
            headers: getRandomHeaders()
          });
          clearTimeout(timeoutId);
          if (!response.ok) throw new Error(`HTTP ${response.status}`);
          const text = await response.text();
          return JSON.parse(text);
        } catch (e) {
          clearTimeout(timeoutId);
          throw e;
        }
      }
    },

    // Method 3: JSONProxy (Restore this!)
    {
      name: 'JSONProxy',
      fetch: async () => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000);
        try {
          const url = 'https://jsonp.afeld.me/?url=' + encodeURIComponent('https://growtopiagame.com/detail');
          const response = await fetch(url, { signal: controller.signal });
          clearTimeout(timeoutId);
          if (!response.ok) throw new Error(`HTTP ${response.status}`);
          return await response.json();
        } catch (error) {
          clearTimeout(timeoutId);
          throw error;
        }
      }
    },

    // Method 4: AllOrigins (Get) - Fallback
    {
      name: 'AllOriginsGet',
      fetch: async () => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000);
        try {
          const url = 'https://api.allorigins.win/get?url=' + encodeURIComponent('https://growtopiagame.com/detail') + '&t=' + Date.now();
          const response = await fetch(url, { signal: controller.signal });
          clearTimeout(timeoutId);
          if (!response.ok) throw new Error(`HTTP ${response.status}`);
          const json = await response.json();
          if (json.contents) return JSON.parse(json.contents);
          throw new Error('No contents');
        } catch (e) {
          clearTimeout(timeoutId);
          throw e;
        }
      }
    },

    // Method 5: CorsProxy.io
    {
      name: 'CorsProxyIO',
      fetch: async () => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);
        try {
          const url = 'https://corsproxy.io/?' + encodeURIComponent('https://growtopiagame.com/detail');
          const response = await fetch(url, {
            headers: getRandomHeaders(),
            signal: controller.signal
          });
          clearTimeout(timeoutId);
          if (!response.ok) throw new Error(`HTTP ${response.status}`);
          return await response.json();
        } catch (e) {
          clearTimeout(timeoutId);
          throw e;
        }
      }
    },

    // Method 6: Direct (Last Resort)
    {
      name: 'DirectSmart',
      fetch: async () => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        try {
          const response = await fetch('https://growtopiagame.com/detail', {
            headers: getRandomHeaders(),
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
    }
  ];

  const errors = [];
  const startTime = Date.now();

  // Try each method w/ small delay between failures
  for (const method of fetchMethods) {
    try {
      console.log(`[${new Date().toISOString()}] Trying ${method.name}...`);
      const data = await method.fetch();

      // Validate Data
      if (data && data.online_user !== undefined) {
        const elapsed = Date.now() - startTime;
        console.log(`[SUCC] ${method.name} in ${elapsed}ms`);

        return res.status(200).json({
          success: true,
          timestamp: new Date().toISOString(),
          data: data,
          source: method.name,
          elapsed_ms: elapsed
        });
      } else {
        throw new Error('Invalid data structure');
      }

    } catch (error) {
      const errorMsg = `${method.name}: ${error.message}`;
      console.error(`[FAIL] ${errorMsg}`);
      errors.push(errorMsg);
    }
  }

  // All failed
  const elapsed = Date.now() - startTime;
  return res.status(503).json({
    success: false,
    error: 'All fetch methods failed',
    attempts: errors,
    elapsed_ms: elapsed
  });
}
