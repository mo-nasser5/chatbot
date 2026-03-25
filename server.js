const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

const PORT = 3000;
const GROQ_KEY = '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';

const SYS = `You are a smart professional veterinary assistant for a pet clinic.
Help the veterinarian with:
1. APPOINTMENT BOOKING: Collect pet name, species, age, weight, owner name, complaint, date/time. Confirm with summary.
2. CASE SUMMARIES: Format — Symptoms | Probable Diagnosis | Treatment Plan | Notes
3. DRUG DOSAGES: Ask species, weight, drug. Give dose + frequency + safety disclaimer.
4. CLIENT Q&A: Clear warm answers in simple language for pet owners.
5. REMINDERS: Show today's realistic reminders for vaccinations, follow-ups, refills.
CRITICAL: Detect user language (Arabic/English) and always reply in the SAME language. Be concise and practical.`;

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

  if (req.method === 'GET' && (req.url === '/' || req.url === '/index.html')) {
    const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
    res.writeHead(200, {'Content-Type': 'text/html; charset=utf-8'});
    res.end(html); return;
  }

  if (req.method === 'POST' && req.url === '/chat') {
    let body = '';
    req.on('data', d => body += d);
    req.on('end', () => {
      try {
        const { messages } = JSON.parse(body);
        const groqMessages = [{ role: 'system', content: SYS }, ...messages];
        const payload = JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: groqMessages,
          max_tokens: 1000,
          temperature: 0.7
        });

        const options = {
          hostname: 'api.groq.com',
          path: '/openai/v1/chat/completions',
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + GROQ_KEY,
            'Content-Length': Buffer.byteLength(payload)
          }
        };

        const apiReq = https.request(options, apiRes => {
          let data = '';
          apiRes.on('data', d => data += d);
          apiRes.on('end', () => {
            console.log('Groq status:', apiRes.statusCode);
            res.writeHead(apiRes.statusCode, {'Content-Type': 'application/json'});
            res.end(data);
          });
        });

        apiReq.on('error', e => {
          console.error('API error:', e.message);
          res.writeHead(500, {'Content-Type': 'application/json'});
          res.end(JSON.stringify({ error: e.message }));
        });

        apiReq.write(payload);
        apiReq.end();
      } catch(e) {
        console.error('Parse error:', e.message);
        res.writeHead(400, {'Content-Type': 'application/json'});
        res.end(JSON.stringify({ error: e.message }));
      }
    });
    return;
  }

  res.writeHead(404); res.end('Not found');
});

server.listen(PORT, () => {
  console.log('\n=================================');
  console.log('  المساعد البيطري شغال!');
  console.log('  افتح: http://localhost:' + PORT);
  console.log('=================================\n');
});
