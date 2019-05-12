const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.POSTGRE_URL
});

module.exports = {
  async addContainer(userId, name, width, height, length, price = 0) {
    const result = await pool.query(
      `INSERT INTO "Container" ("userId", name, price, width, height, length) VALUES (${userId}, '${name}', ${price}, ${width}, ${height}, ${length}) RETURNING id, name, price, width, height, length;`
    );
    return result.rows[0];
  },
  async getContainer(userId, contId) {
    const result = await pool.query(
      `SELECT id, name, price, width, height, length FROM "Container" WHERE id = ${contId} AND "userId" = ${userId};`
    );
    return result.rows[0];
  },
  async getContainers(userId) {
    const result = await pool.query(
      `SELECT id, name, price, width, height, length FROM "Container" WHERE "userId" = ${userId};`
    );
    return result.rows;
  },
  async updateContainer(userId, contId, name, width, height, length, price = 0) {
    const result = await pool.query(
      `UPDATE "Container" SET (name, price, width, height, length) = ('${name}', ${price}, ${width}, ${height}, ${length}) WHERE id = ${contId} AND "userId" = ${userId} RETURNING id, name, price, width, height, length;`
    );
    return result.rows[0];
  },
  async deleteContainer(userId, contId) {
    const result = await pool.query(
      `DELETE FROM "Container" WHERE "userId" = ${userId} AND id = ${contId} RETURNING id, name, price, width, height, length;`
    );
    return result.rows[0];
  }
};
