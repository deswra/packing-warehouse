const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.POSTGRE_URL
});

module.exports = {
  async addProduct(userId, name, width, height, length, price = 0) {
    const result = await pool.query(
      'INSERT INTO "Product" ("userId", name, price, width, height, length) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id::int, name, price::float, width::int, height::int, length::int;',
      [userId, name, price, width, height, length]
    );
    return result.rows[0];
  },
  async getProduct(userId, prodId) {
    const result = await pool.query(
      'SELECT id::int, name, price::float, width::int, height::int, length::int FROM "Product" WHERE id = $1 AND "userId" = $2;',
      [prodId, userId]
    );
    return result.rows[0];
  },
  async getProducts(userId) {
    const result = await pool.query(
      'SELECT id::int, name, price::float, width::int, height::int, length::int FROM "Product" WHERE "userId" = $1;',
      [userId]
    );
    return result.rows;
  },
  async updateProduct(userId, prodId, name, width, height, length, price = 0) {
    const result = await pool.query(
      'UPDATE "Product" SET (name, price, width, height, length) = ($1, $2, $3, $4, $5) WHERE id = $6 AND "userId" = $7 RETURNING id::int, name, price::float, width::int, height::int, length::int;',
      [name, price, width, height, length, prodId, userId]
    );
    return result.rows[0];
  },
  async deleteProduct(userId, prodId) {
    const result = await pool.query(
      'DELETE FROM "Product" WHERE "userId" = $1 AND id = $2 RETURNING id::int, name, price::float, width::int, height::int, length::int;',
      [userId, prodId]
    );
    return result.rows[0];
  }
};
