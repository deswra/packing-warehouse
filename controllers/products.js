const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.POSTGRE_URL
});

module.exports = {
  async addProduct(userId, name, width, height, length, price = 0) {
    const result = await pool.query(
      `INSERT INTO "Product" ("userId", name, price, width, height, length) VALUES (${userId}, '${name}', ${price}, ${width}, ${height}, ${length}) RETURNING id, name, price, width, height, length;`
    );
    return result.rows[0];
  },
  async getProduct(userId, prodId) {
    const result = await pool.query(
      `SELECT id, name, price, width, height, length FROM "Product" WHERE id = ${prodId} AND "userId" = ${userId};`
    );
    return result.rows[0];
  },
  async getProducts(userId) {
    const result = await pool.query(
      `SELECT id, name, price, width, height, length FROM "Product" WHERE "userId" = ${userId};`
    );
    return result.rows;
  },
  async updateProduct(userId, prodId, name, width, height, length, price = 0) {
    const result = await pool.query(
      `UPDATE "Product" SET (name, price, width, height, length) = ('${name}', ${price}, ${width}, ${height}, ${length}) WHERE id = ${prodId} AND "userId" = ${userId} RETURNING id, name, price, width, height, length;`
    );
    return result.rows[0];
  },
  async deleteProduct(userId, prodId) {
    const result = await pool.query(
      `DELETE FROM "Product" WHERE "userId" = ${userId} AND id = ${prodId} RETURNING id, name, price, width, height, length;`
    );
    return result.rows[0];
  }
};
