'use strict';

const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const jwt = require('jsonwebtoken');
const db = require('../services/db');

module.exports = async function (app) {
  // 注册
  app.post('/register', async (req, reply) => {
    const { username, email, password, display_name } = req.body || {};
    if (!username || !email || !password) {
      return reply.code(400).send({ error: 'username, email and password are required' });
    }
    const existing = await db.query(
      'SELECT id FROM users WHERE email=$1 OR username=$2',
      [email, username]
    );
    if (existing.rows.length) {
      return reply.code(409).send({ error: 'email or username already taken' });
    }
    const hash = await bcrypt.hash(password, 10);
    const id = uuidv4();
    await db.query(
      'INSERT INTO users (id, username, email, password_hash, display_name) VALUES ($1,$2,$3,$4,$5)',
      [id, username, email, hash, display_name || username]
    );
    const token = jwt.sign({ id, username }, process.env.JWT_SECRET, { expiresIn: '30d' });
    return reply.code(201).send({ data: { token, user: { id, username, display_name: display_name || username } } });
  });

  // 登录
  app.post('/login', async (req, reply) => {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return reply.code(400).send({ error: 'email and password are required' });
    }
    const res = await db.query('SELECT * FROM users WHERE email=$1', [email]);
    const user = res.rows[0];
    if (!user) return reply.code(401).send({ error: 'invalid credentials' });
    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return reply.code(401).send({ error: 'invalid credentials' });
    const token = jwt.sign({ id: user.id, username: user.username }, process.env.JWT_SECRET, { expiresIn: '30d' });
    return { data: { token, user: { id: user.id, username: user.username, display_name: user.display_name } } };
  });

  // 获取当前用户信息
  app.get('/me', async (req, reply) => {
    const auth = req.headers.authorization;
    if (!auth || !auth.startsWith('Bearer ')) return reply.code(401).send({ error: 'unauthorized' });
    try {
      const payload = jwt.verify(auth.slice(7), process.env.JWT_SECRET);
      const res = await db.query('SELECT id, username, display_name, email, created_at FROM users WHERE id=$1', [payload.id]);
      if (!res.rows[0]) return reply.code(404).send({ error: 'user not found' });
      return { data: res.rows[0] };
    } catch (e) {
      return reply.code(401).send({ error: 'invalid token' });
    }
  });
};
