const http = require('http');


const restart = (token) => {
  const options = {
    hostname: '192.168.2.22',
    port: 80,
    path: '/api/server/restart',
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': '2',
      'Authorization': `Bearer ${token}`,
    },
  };
  const req = http.request(options);
  req.write('{}');
  req.end();

};

const login = () => {

  // eslint-disable-next-line no-undef
  const data = new TextEncoder().encode(
    JSON.stringify({
      username: 'admin',
      password: 'admin',
    }),
  );

  const options = {
    hostname: '192.168.2.22',
    port: 80,
    path: '/api/auth/login',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': data.length,
    },
  };

  const req = http.request(options, res => {
    res.on('data', d => {
      const token = JSON.parse(d.toString()).access_token;
      restart(token);
    });
  });

  req.write(data);
  req.end();
};


login();