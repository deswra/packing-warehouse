const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.POSTGRE_URL
});

module.exports = {
  async addContainer(userId, name, width, height, length, price = 0) {
    const result = await pool.query(
      'INSERT INTO "Container" ("userId", name, price, width, height, length) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, name, price, width, height, length;',
      [userId, name, price, width, height, length]
    );
    return result.rows[0];
  },
  async getContainer(userId, contId) {
    const result = await pool.query(
      'SELECT id, name, price, width, height, length FROM "Container" WHERE id = $1 AND "userId" = $2;',
      [contId, userId]
    );
    return result.rows[0];
  },
  async getContainers(userId) {
    const result = await pool.query(
      'SELECT id, name, price, width, height, length FROM "Container" WHERE "userId" = $1;',
      [userId]
    );
    return result.rows;
  },
  async updateContainer(userId, contId, name, width, height, length, price = 0) {
    const result = await pool.query(
      'UPDATE "Container" SET (name, price, width, height, length) = ($1, $2, $3, $4, $5) WHERE id = $6 AND "userId" = $7 RETURNING id, name, price, width, height, length;',
      [name, price, width, height, length, contId, userId]
    );
    return result.rows[0];
  },
  async deleteContainer(userId, contId) {
    const result = await pool.query(
      'DELETE FROM "Container" WHERE "userId" = $1 AND id = $2 RETURNING id, name, price, width, height, length;',
      [userId, contId]
    );
    return result.rows[0];
  }
};
