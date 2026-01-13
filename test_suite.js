const { spawn } = require('child_process');
const http = require('http');

const log = (msg) => console.log(`[TEST] ${msg}`);
const error = (msg) => console.error(`[TEST ERROR] ${msg}`);

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function request(options, postData = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        resolve({ statusCode: res.statusCode, headers: res.headers, body: data });
      });
    });

    req.on('error', (e) => reject(e));

    if (postData) {
      req.write(postData);
    }
    req.end();
  });
}

async function runTest() {
  log('Starting Backend Server...');
  const server = spawn('npm', ['run', 'server'], { shell: true, stdio: 'pipe' });
  
  // Give server time to start
  let serverReady = false;
  for(let i=0; i<30; i++) {
    await sleep(1000);
    try {
      await request({ hostname: 'localhost', port: 5000, path: '/api/courses', method: 'GET' });
      serverReady = true;
      log('Backend is UP (Port 5000)');
      break;
    } catch(e) {
      process.stdout.write('.');
    }
  }

  if (!serverReady) {
    error('Backend failed to start.');
    server.kill();
    process.exit(1);
  }

  // TEST 1: Get Courses (Public)
  log('Test 1: Fetching Public Courses...');
  const coursesRes = await request({ hostname: 'localhost', port: 5000, path: '/api/courses', method: 'GET' });
  if (coursesRes.statusCode === 200 && coursesRes.body.includes('初學者全身燃脂')) {
    log('✅ PASS: Public API working');
  } else {
    error('❌ FAIL: Public API response invalid');
  }

  // TEST 2: Login
  log('Test 2: Logging in (Coach)...');
  const postData = JSON.stringify({ username: 'coach', password: 'password123' });
  const loginRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/login',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
  }, postData);

  let cookie = null;
  if (loginRes.statusCode === 200 && loginRes.body.includes('"success":true')) {
    log('✅ PASS: Login successful');
    // Extract Cookie
    const setCookie = loginRes.headers['set-cookie'];
    if (setCookie) {
      cookie = setCookie[0].split(';')[0];
      log(`   Cookie retrieved: ${cookie.substring(0, 15)}...`);
    }
  } else {
    error(`❌ FAIL: Login failed. Status: ${loginRes.statusCode} Body: ${loginRes.body}`);
  }

  // TEST 3: Protected Route
  if (cookie) {
    log('Test 3: Accessing Protected Route (/api/me)...');
    const meRes = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/me',
      method: 'GET',
      headers: { 'Cookie': cookie }
    });
    
    if (meRes.statusCode === 200 && meRes.body.includes('Coach John')) {
       log('✅ PASS: Protected route accessible');
    } else {
       error('❌ FAIL: Protected route denied');
    }
  }

  // Start Frontend
  log('Starting Frontend Server...');
  const client = spawn('npm', ['run', 'client'], { shell: true, stdio: 'pipe' });

  // Give client time to start
  let clientReady = false;
  for(let i=0; i<30; i++) {
    await sleep(1000);
    try {
      await request({ hostname: 'localhost', port: 5173, path: '/', method: 'GET' });
      clientReady = true;
      log('Frontend is UP (Port 5173)');
      break;
    } catch(e) {
        process.stdout.write('.');
    }
  }

  if (clientReady) {
    log('✅ PASS: Frontend is serving requests');
  } else {
    error('❌ FAIL: Frontend failed to start');
  }

  log('Cleaning up processes...');
  // On Windows, tree-kill is often needed, but we'll try standard kill first
  try {
      process.kill(server.pid);
      process.kill(client.pid);
      // Force kill windows tasks if possible (using shell command)
      // require('child_process').exec('taskkill /F /IM node.exe /T', (err) => {}); 
  } catch(e) {}
  
  log('Test Suite Completed.');
}

runTest();
