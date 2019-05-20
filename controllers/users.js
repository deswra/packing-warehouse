const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.POSTGRE_URL
});

async function getToken(id) {
  return jwt.sign({ id }, process.env.SECRET, { expiresIn: 129600 });
}

module.exports = {
  async addUser(username, password) {
    const salt = bcrypt.genSaltSync();
    const hash = bcrypt.hashSync(password, salt);
    return await pool.query('INSERT INTO "User" (username, password) VALUES ($1, $2);', [username, hash]);
  },
  getToken,
  async login(username, password) {
    const result = await pool.query('SELECT id::int, password FROM "User" WHERE username = $1;', [username]);
    user = result.rows[0];
    if (!bcrypt.compareSync(password, user.password)) {
      throw new Error('Wrong password!');
    }
    const token = await getToken(user.id);
    return {
      id: user.id,
      token
    };
  }
};
