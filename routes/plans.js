const express = require('express');
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.POSTGRE_URL
});

const router = express.Router();

function containerToWKT(width, height, length) {
  return `POLYHEDRALSURFACE Z (
    ((0 0 0, 0 ${height} 0, ${width} ${height} 0, ${width} 0 0, 0 0 0)),
    ((0 0 0, 0 ${height} 0, 0 ${height} ${length}, 0 0 ${length}, 0 0 0)),
    ((0 0 0, ${width} 0 0, ${width} 0 ${length}, 0 0 ${length}, 0 0 0)),
    ((${width} ${height} ${length}, ${width} 0 ${length}, 0 0 ${length}, 0 ${height} ${length}, ${width} ${height} ${length})),
    ((${width} ${height} ${length}, ${width} 0 ${length}, ${width} 0 0, ${width} ${height} 0, ${width} ${height} ${length})),
    ((${width} ${height} ${length}, ${width} ${height} 0, 0 ${height} 0, 0 ${height} ${length}, ${width} ${height} ${length}))
  )`;
}

function productToWKT(x, y, z, layoutWidth, layoutHeight, layoutLength) {
  return `POLYHEDRALSURFACE Z (
    ((${x} ${y} ${z}, ${x} ${y + layoutHeight} ${z}, ${x + layoutWidth} ${y + layoutHeight} ${z}, ${x +
    layoutWidth} ${y} ${z}, ${x} ${y} ${z})),
    ((${x} ${y} ${z}, ${x} ${y + layoutHeight} ${z}, ${x} ${y + layoutHeight} ${z + layoutLength}, ${x} ${y} ${z +
    layoutLength}, ${x} ${y} ${z})),
    ((${x} ${y} ${z}, ${x + layoutWidth} ${y} ${z}, ${x + layoutWidth} ${y} ${z + layoutLength}, ${x} ${y} ${z +
    layoutLength}, ${x} ${y} ${z})),
    ((${x + layoutWidth} ${y + layoutHeight} ${z + layoutLength}, ${x + layoutWidth} ${y} ${z +
    layoutLength}, ${x} ${y} ${z + layoutLength}, ${x} ${y + layoutHeight} ${z + layoutLength}, ${x + layoutWidth} ${y +
    layoutHeight} ${z + layoutLength})),
    ((${x + layoutWidth} ${y + layoutHeight} ${z + layoutLength}, ${x + layoutWidth} ${y} ${z + layoutLength}, ${x +
    layoutWidth} ${y} ${z}, ${x + layoutWidth} ${y + layoutHeight} ${z}, ${x + layoutWidth} ${y + layoutHeight} ${z +
    layoutLength})),
    ((${x + layoutWidth} ${y + layoutHeight} ${z + layoutLength}, ${x + layoutWidth} ${y +
    layoutHeight} ${z}, ${x} ${y + layoutHeight} ${z}, ${x} ${y + layoutHeight} ${z + layoutLength}, ${x +
    layoutWidth} ${y + layoutHeight} ${z + layoutLength}))
  )`;
}

// Test
const packingResult = require('../fap.json');
const planId = 1;

async function packing() {
  let usedContainer = [];
  await Promise.all(
    packingResult.wrapperArray.instance.map(async container => {
      let containerOrder = 0;
      const containerId = parseInt(container.$.name);
      usedContainer.push(containerId);
      usedContainer.forEach(cont => {
        if (cont === containerId) {
          containerOrder++;
        }
      });
      await pool.query(
        `INSERT INTO "Plan_Container_Product" VALUES (${planId}, ${containerId}, ${containerOrder}, 0, '${containerToWKT(
          parseInt(container.$.width),
          parseInt(container.$.height),
          parseInt(container.$.length)
        )}');`
      );
      Promise.all(
        container.wrap.map(async product => {
          const productId = parseInt(product.instance[0].$.name);
          pool.query(
            `INSERT INTO "Plan_Container_Product" VALUES (${planId}, ${containerId}, ${containerOrder}, ${productId}, '${productToWKT(
              parseInt(product.$.x),
              parseInt(product.$.y),
              parseInt(product.$.z),
              parseInt(product.$.layoutWidth),
              parseInt(product.$.layoutHeight),
              parseInt(product.$.layoutLength)
            )}');`
          );
        })
      );
    })
  );
}

async function getPlan(planId) {
  const { rows } = await pool.query(
    `SELECT "planId", "containerId", "containerOrder", "productId", ST_AsText(geom) FROM "Plan_Container_Product" WHERE "planId" = ${planId};`
  );
  return rows;
}

router.get('/', async (request, response) => {
  await packing();
  const yay = await getPlan(planId);
  return response.json(yay);
});

module.exports = router;
