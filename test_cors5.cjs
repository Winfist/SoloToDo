const https = require("https");

const options = {
    hostname: 'europe-west1-solo-todo.cloudfunctions.net',
    path: '/dummyTestAbc',
    method: 'OPTIONS',
    headers: {
        'Origin': 'http://localhost:5173',
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'content-type'
    }
};

const req = https.request(options, (res) => {
    console.log('STATUS:', res.statusCode);
    console.log('HEADERS:', JSON.stringify(res.headers, null, 2));
});

req.on('error', (e) => {
    console.error('ERROR:', e.message);
});

req.end();
