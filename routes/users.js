const express = require('express');
const { addUser, getToken, login } = require('../controllers/users');
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.POSTGRE_URL
});

const router = express.Router();

router
  .post('/register', async (request, response) => {
    const { username, password } = request.body;
    try {
      user = await addUser(username, password);
    } catch (err) {
      if (err.constraint === 'unique_username') return response.json({ message: 'Username already exists.' });
    }
    let id;
    try {
      const result = await pool.query('SELECT id::int FROM "User" WHERE username = $1;', [request.body.username]);
      id = result.rows[0].id;
    } catch (err) {
      return response.json({ message: err.detail });
    }
    const token = await getToken(id);
    return response.status(201).json({
      id,
      token
    });
  })
  .post('/login', async (request, response) => {
    const username = request.body.username;
    const password = request.body.password;
    try {
      const res = await login(username, password);
      return response.json(res);
    } catch (err) {
      console.log(err);
    }
  });

module.exports = router;
