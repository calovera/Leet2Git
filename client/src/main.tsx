import React from 'react'
import ReactDOM from 'react-dom/client'

function App() {
  return (
    <div style={{ padding: '2rem', fontFamily: 'Arial, sans-serif' }}>
      <h1>🔧 Leet2Git Chrome Extension Development</h1>
      <p>This is the development web interface for the Leet2Git Chrome extension.</p>
      
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
      <p>
        <a 
          href="/extension/src/popup/index.html" 
          style={{ 
            display: 'inline-block',
            background: '#007cba',
            color: 'white',
            padding: '12px 24px',
            textDecoration: 'none',
            borderRadius: '6px',
            margin: '10px 0'
          }}
        >
          View Popup
        </a>
      </p>
      <p>
        <a 
          href="/extension/src/options/index.html"
          style={{ 
            display: 'inline-block',
            background: '#007cba',
            color: 'white',
            padding: '12px 24px',
            textDecoration: 'none',
            borderRadius: '6px',
            margin: '10px 0'
          }}
        >
          View Options
        </a>
      </p>
    </div>
  )
}

ReactDOM.createRoot(document.getElementById('root')!).render(<App />)