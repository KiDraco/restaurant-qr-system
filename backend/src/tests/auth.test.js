const request = require('supertest');
const jwt = require('jsonwebtoken');
const { initializeDatabase } = require('../config/database');
const User = require('../models/User');
const app = require('../app');

let testUser = null;

beforeAll(async () => {
  await initializeDatabase();
  testUser = await User.create('Test Admin', 'admin@test.com', 'password123', 'admin');
});

function getToken(overrides = {}) {
  return jwt.sign(
    { id: testUser?.id || 1, role: 'admin', name: 'Test Admin', email: 'admin@test.com', ...overrides },
    process.env.JWT_SECRET
  );
}

describe('POST /api/auth/login', () => {
  it('returns 400 with invalid email (Zod validation)', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'not-an-email', password: 'password123' });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Datos inválidos');
  });

  it('returns 400 with empty password (Zod validation)', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@test.com', password: '' });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Datos inválidos');
  });

  it('returns 400 with missing password (Zod validation)', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@test.com' });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Datos inválidos');
  });

  it('returns 401 with wrong credentials (user not found)', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'wrong@test.com', password: 'wrongpass' });

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Credenciales inválidas');
  });

  it('returns 401 with wrong password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@test.com', password: 'wrongpass' });

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Credenciales inválidas');
  });

  it('returns 200 with token and httpOnly cookie on success', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@test.com', password: 'password123' });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
    expect(res.body.user).toBeDefined();
    expect(res.body.user.email).toBe('admin@test.com');

    const cookies = res.headers['set-cookie'];
    expect(cookies).toBeDefined();
    expect(cookies.some(c => c.includes('token='))).toBe(true);
    expect(cookies.some(c => c.includes('HttpOnly'))).toBe(true);
  });
});

describe('POST /api/auth/logout', () => {
  it('returns 401 without token', async () => {
    const res = await request(app).post('/api/auth/logout');
    expect(res.status).toBe(401);
  });

  it('returns 200 and clears cookie with valid token', async () => {
    const token = getToken();

    const res = await request(app)
      .post('/api/auth/logout')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Sesión cerrada exitosamente');

    const cookies = res.headers['set-cookie'];
    expect(cookies).toBeDefined();
    expect(cookies.some(c => c.startsWith('token=;'))).toBe(true);
  });
});

describe('GET /api/auth/me', () => {
  it('returns 401 without token', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });

  it('returns 401 with invalid token', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', 'Bearer invalid-token-here');
    expect(res.status).toBe(401);
  });

  it('returns 200 with user data from Bearer token', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${getToken()}`);

    expect(res.status).toBe(200);
    expect(res.body.user).toBeDefined();
    expect(res.body.user.email).toBe('admin@test.com');
  });

  it('accepts token from httpOnly cookie', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Cookie', `token=${getToken()}`);

    expect(res.status).toBe(200);
    expect(res.body.user).toBeDefined();
    expect(res.body.user.email).toBe('admin@test.com');
  });

  it('returns 404 when user id does not exist', async () => {
    const token = jwt.sign(
      { id: 99999, role: 'admin' },
      process.env.JWT_SECRET
    );

    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(404);
    expect(res.body.error).toBe('Usuario no encontrado');
  });
});

describe('POST /api/auth/register', () => {
  it('returns 403 without admin secret header', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Test', email: 'test@test.com', password: 'password123' });

    expect(res.status).toBe(403);
  });

  it('returns 400 with invalid email (Zod validation)', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .set('x-admin-secret', 'test-setup-secret')
      .send({ name: 'Test', email: 'not-an-email', password: 'password123' });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Datos inválidos');
  });

  it('returns 400 with short password (Zod validation)', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .set('x-admin-secret', 'test-setup-secret')
      .send({ name: 'Test', email: 'test@test.com', password: '123' });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Datos inválidos');
  });

  it('returns 409 when email already exists', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .set('x-admin-secret', 'test-setup-secret')
      .send({ name: 'Admin', email: 'admin@test.com', password: 'password123' });

    expect(res.status).toBe(409);
    expect(res.body.error).toBe('El email ya está registrado');
  });
});

describe('Rate Limiting', () => {
  it('returns 429 after too many auth requests', async () => {
    const promises = [];
    for (let i = 0; i < 30; i++) {
      promises.push(
        request(app)
          .post('/api/auth/login')
          .send({ email: 'ratelimit@test.com', password: 'test123' })
      );
    }
    const responses = await Promise.all(promises);
    const tooMany = responses.find(r => r.status === 429);
    expect(tooMany).toBeDefined();
    if (tooMany) {
      expect(tooMany.body.error).toBe('Demasiados intentos de inicio de sesión, intente de nuevo más tarde');
    }
  }, 15000);
});
