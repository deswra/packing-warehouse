const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.POSTGRE_URL
});

const router = express.Router();

async function newUser(username, password) {
  const salt = bcrypt.genSaltSync();
  const hash = bcrypt.hashSync(password, salt);
  return await pool.query(`INSERT INTO "User" (username, password) VALUES ('${username}', '${hash}');`);
}

async function getToken(id) {
  return jwt.sign({ id }, process.env.SECRET, { expiresIn: 129600 });
}

async function login(username, password) {
  const result = await pool.query(`SELECT id, password FROM "User" WHERE username = '${username}';`);
  user = result.rows[0];
  if (!bcrypt.compareSync(password, user.password)) {
    throw new Error('Wrong password!');
  }
  const token = await getToken(user.id);
  return {
    id: user.id,
    username,
    token
  };
}

router
  .post('/register', async (request, response) => {
    const username = request.body.username;
    const password = request.body.password;
    try {
      user = await newUser(username, password);
    } catch (err) {
      if (err.constraint === 'unique_username') return response.json({ message: 'Username already exists.' });
    }
    let id;
    try {
      const result = await pool.query(`SELECT id FROM "User" WHERE username = '${request.body.username}';`);
      id = result.rows[0].id;
    } catch (err) {
      return response.json({ message: err.detail });
    }
    const token = await getToken(id);
    return response.status(201).json({
      id,
      username,
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
