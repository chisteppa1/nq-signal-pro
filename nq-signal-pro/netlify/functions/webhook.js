const https = require('https');

// Store last signal in memory (resets on redeploy)
let lastSignal = null;

exports.handler = async (event, context) => {
  // Allow CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
  };

  // Handle preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  // POST - receive signal from TradingView
  if (event.httpMethod === 'POST') {
    try {
      const message = event.body || '';
      const timestamp = Date.now();

      // Parse the message
      let type = 'LONG';
      let grade = 'B';
      let price = null;

      if (message.includes('SHORT')) type = 'SHORT';
      if (message.includes('LONG')) type = 'LONG';
      if (message.includes('A+')) grade = 'A+';
      else if (message.includes(' A') || message.includes('Confirmed')) grade = 'A';
      else grade = 'B';

      // Extract price if present
      const priceMatch = message.match(/Price:\s*([\d.]+)/);
      if (priceMatch) price = priceMatch[1];

      lastSignal = { type, grade, price, message, timestamp };

      console.log('Signal received:', lastSignal);

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true, signal: lastSignal })
      };
    } catch(e) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: e.message })
      };
    }
  }

  // GET - dashboard polls for latest signal
  if (event.httpMethod === 'GET') {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ signal: lastSignal })
    };
  }

  return { statusCode: 405, headers, body: 'Method not allowed' };
};
