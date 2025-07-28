/**
 * 开发环境HTTPS服务器配置
 * 解决浏览器安全限制问题
 */
const { createServer } = require('https');
const next = require('next');
const fs = require('fs');

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

// 自签名证书（仅用于开发）
const httpsOptions = {
  key: `-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC7VJTUt9Us8cKB
VfvLLSdVJvOUL7bXSAn5wK3wd42F5KhQwYzL6P1dqQdwlpNdGFj3oGBV0wHKzgOA
rY6zfGk/RI+iY3QN9WfLdM1DJkJ4vLpGPSF9o7QWLkjFk5h6TYWLm+AhkEKgPn7i
...
-----END PRIVATE KEY-----`,
  cert: `-----BEGIN CERTIFICATE-----
MIIDXTCCAkWgR7bVJT0t9Us8cKBVfvLLSdVJvOUL7bXSAn5wK3wd42F5KhQwYzL6
P1dqQdwlpNdGFj3oGBV0wHKzgOArY6zfGk/RI+iY3QN9WfLdM1DJkJ4vLpGPSF9o
...
-----END CERTIFICATE-----`
};

app.prepare().then(() => {
  createServer(httpsOptions, (req, res) => {
    handle(req, res);
  }).listen(4443, '0.0.0.0', (err) => {
    if (err) throw err;
    console.log('> Ready on https://localhost:4443');
  });
});