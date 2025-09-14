import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = parseInt(process.env.PORT || '5000', 10);

// Add JSON body parser middleware
app.use(express.json());

// Add CORS headers for extension communication
app.use((req, res, next) => {
  // Allow requests from Chrome extensions
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Serve static files from the extension build
app.use('/extension', express.static(path.join(__dirname, '../dist-extension')));

// Serve the main popup for development/testing
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Leet2Git Extension Development</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; }
        .container { max-width: 800px; margin: 0 auto; }
        .extension-link { 
          display: inline-block; 
          background: #007cba; 
          color: white; 
          padding: 12px 24px; 
          text-decoration: none; 
          border-radius: 6px; 
          margin: 10px 0;
        }
        .extension-link:hover { background: #005a87; }
        .code-block { 
          background: #f5f5f5; 
          padding: 15px; 
          border-radius: 4px; 
          font-family: monospace; 
          margin: 15px 0;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>🔧 Leet2Git Chrome Extension Development</h1>
        
        <h2>Extension Status</h2>
        <p>The extension is being built and served for development. You can:</p>
        
        <h3>Load Extension in Chrome:</h3>
        <ol>
          <li>Open Chrome and go to <code>chrome://extensions/</code></li>
          <li>Enable "Developer mode" (toggle in top right)</li>
          <li>Click "Load unpacked"</li>
          <li>Select the <code>dist-extension</code> folder from this project</li>
        </ol>
        
        <h3>Test Extension Components:</h3>
        <p><a href="/extension/src/popup/index.html" class="extension-link">View Popup</a></p>
        <p><a href="/extension/src/options/index.html" class="extension-link">View Options</a></p>
        
        <h3>Development Files:</h3>
        <div class="code-block">
          Extension build output: /dist-extension/<br>
          Background script: /dist-extension/assets/background.*.js<br>
          Content script: /dist-extension/assets/content.*.js
        </div>
        
        <h3>Building the Extension:</h3>
        <p>The extension is automatically built when this server starts. To rebuild manually:</p>
        <div class="code-block">npm run build:extension</div>
        
        <p><strong>Note:</strong> This development server helps you test the extension locally. 
        The actual extension runs in Chrome as a browser extension.</p>
      </div>
    </body>
    </html>
  `);
});

// GitHub OAuth token exchange endpoint
app.post('/api/github/oauth/token', async (req, res) => {
  try {
    const { code } = req.body;
    
    if (!code) {
      return res.status(400).json({ error: 'Authorization code is required' });
    }

    // GitHub OAuth app credentials
    const CLIENT_ID = process.env.GITHUB_CLIENT_ID || 'Ov23liPVnJxvGsF4Y9qm';
    const CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET;
    
    if (!CLIENT_SECRET) {
      console.error('GITHUB_CLIENT_SECRET is not configured');
      return res.status(500).json({ error: 'OAuth is not properly configured. Please set GITHUB_CLIENT_SECRET.' });
    }
    
    // Exchange authorization code for access token
    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        code: code,
      }),
    });

    const tokenData = await tokenResponse.json();
    
    if (tokenData.error) {
      console.error('GitHub OAuth error:', tokenData);
      return res.status(400).json({ 
        error: tokenData.error_description || 'Failed to exchange code for token' 
      });
    }

    // Validate the token by fetching user info
    const userResponse = await fetch('https://api.github.com/user', {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
        'Accept': 'application/vnd.github.v3+json',
      },
    });

    if (!userResponse.ok) {
      return res.status(400).json({ error: 'Invalid access token' });
    }

    const userData = await userResponse.json();

    // Return the access token and user info
    res.json({
      access_token: tokenData.access_token,
      user: {
        login: userData.login,
        name: userData.name,
        avatar_url: userData.avatar_url,
        html_url: userData.html_url,
      },
    });
  } catch (error) {
    console.error('OAuth token exchange error:', error);
    res.status(500).json({ error: 'Internal server error during OAuth flow' });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    service: 'Leet2Git Extension Development Server',
    timestamp: new Date().toISOString()
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Leet2Git Extension Development Server running at http://localhost:${PORT}`);
  console.log(`📦 Extension files served from: /dist-extension`);
  console.log(`🔧 Load extension from: dist-extension folder`);
});