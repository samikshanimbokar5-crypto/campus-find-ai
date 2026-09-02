import test from 'node:test';
import assert from 'node:assert/strict';
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret';
const { default: app } = await import('../src/index.js');

test('health endpoint reports API status', async () => {
  const server = app.listen(0);
  try {
    const response = await fetch(`http://127.0.0.1:${server.address().port}/api/health`);
    assert.equal(response.status, 200);
    assert.equal((await response.json()).data.status, 'ok');
  } finally { server.close(); }
});

test('protected notifications require authentication', async () => {
  const server = app.listen(0);
  try {
    const response = await fetch(`http://127.0.0.1:${server.address().port}/api/notifications`);
    assert.equal(response.status, 401);
  } finally { server.close(); }
});
