const packer = require('3d-bin-packing');
const { getContainerList } = require('./containers');
const { getProductList } = require('./products');
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.POSTGRE_URL
});

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

function packing(containers, products) {
  let wrapperArray = new packer.WrapperArray();
  let instanceArray = new packer.InstanceArray();
  containers.forEach(container => {
    wrapperArray.push(
      new packer.Wrapper(container.id, container.price, container.width, container.height, container.length, 0)
    );
  });
  products.forEach(product => {
    instanceArray.insert(
      instanceArray.end(),
      product.amounts,
      new packer.Product(product.id, product.width, product.height, product.length)
    );
  });
  let my_packer = new packer.Packer(wrapperArray, instanceArray);
  let result = my_packer.optimize();
  return result.data_;
}

function dimensionToLayout(width, height, length, orientation) {
  let layoutWidth, layoutHeight, layoutLength;
  switch (orientation) {
    case 1:
      layoutWidth = width;
      layoutHeight = height;
      layoutLength = length;
      break;
    case 2:
      layoutWidth = length;
      layoutHeight = height;
      layoutLength = width;
      break;
    case 3:
      layoutWidth = length;
      layoutHeight = width;
      layoutLength = height;
      break;
    case 4:
      layoutWidth = height;
      layoutHeight = width;
      layoutLength = length;
      break;
    case 5:
      layoutWidth = width;
      layoutHeight = length;
      layoutLength = height;
      break;
    case 6:
      layoutWidth = height;
      layoutHeight = length;
      layoutLength = width;
      break;
  }
  return { layoutWidth, layoutHeight, layoutLength };
}

function createPlanDetailQuery(planId, packingResult) {
  let usedContainer = [];
  let cost = 0;
  let query = '';
  packingResult.forEach(container => {
    cost += container.price;
    let containerOrder = 0;
    const containerId = parseInt(container.name);
    usedContainer.push(containerId);
    usedContainer.forEach(cont => {
      if (cont === containerId) {
        containerOrder++;
      }
    });
    query += `INSERT INTO "Plan_Container_Product" VALUES (${planId}, ${containerId}, ${containerOrder}, NULL, '${containerToWKT(
      parseInt(container.width),
      parseInt(container.height),
      parseInt(container.length)
    )}');`;
    for (let i = 0; i < container.matrix_.length; i++) {
      const row = container.matrix_[i];
      for (let j = 0; j < row.length; j++) {
        const productId = parseInt(row[j].instance.name);
        const { layoutWidth, layoutHeight, layoutLength } = dimensionToLayout(
          row[j].instance.width,
          row[j].instance.height,
          row[j].instance.length,
          row[j].orientation
        );
        query += `INSERT INTO "Plan_Container_Product" VALUES (${planId}, ${containerId}, ${containerOrder}, ${productId}, '${productToWKT(
          parseInt(row[j].x),
          parseInt(row[j].y),
          parseInt(row[j].z),
          parseInt(layoutWidth),
          parseInt(layoutHeight),
          parseInt(layoutLength)
        )}', ${row[j].orientation});`;
      }
    }
    // for (const product in container.matrix_) {
    //   const productId = parseInt(product.instance.name);
    //   const { layoutWidth, layoutHeight, layoutLength } = dimensionToLayout(
    //     product.instance.width,
    //     product.instance.height,
    //     product.instance.length,
    //     product.orientation
    //   );
    //   query += `INSERT INTO "Plan_Container_Product" VALUES (${planId}, ${containerId}, ${containerOrder}, ${productId}, '${productToWKT(
    //     parseInt(product.x),
    //     parseInt(product.y),
    //     parseInt(product.z),
    //     parseInt(layoutWidth),
    //     parseInt(layoutHeight),
    //     parseInt(layoutLength)
    //   )}', ${product.orientation});`;
    // }
  });
  return { query, cost };
}

async function getSimplePlan(planId, userId) {
  const result = await pool.query(
    'SELECT id::int, name, description, "createdDate", "totalPrice"::float, "productsPrice"::float, "containersPrice"::float, duration::int, "monthCost"::float FROM "Plan" WHERE id = $1 AND "userId" = $2;',
    [planId, userId]
  );
  return result.rows[0];
}

async function addSimplePlan(
  userId,
  name,
  description,
  createdDate,
  totalPrice,
  productsPrice,
  containersPrice,
  duration,
  monthCost
) {
  const result = await pool.query(
    'INSERT INTO "Plan" ("userId", name, description, "createdDate", "totalPrice", "productsPrice", "containersPrice", duration, "monthCost") VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id::int, name, description, "createdDate", "totalPrice"::float, "productsPrice"::float, "containersPrice"::float, duration::int, "monthCost"::float;',
    [userId, name, description, createdDate, totalPrice, productsPrice, containersPrice, duration, monthCost]
  );
  return result.rows[0];
}

async function updateCost(planId, containersPrice, totalPrice) {
  await pool.query('UPDATE "Plan" SET ("containersPrice", "totalPrice") = ($1, $2) WHERE id = $3;', [
    containersPrice,
    totalPrice,
    planId
  ]);
}

async function getDetailedPlan(planId, userId) {
  const { rows } = await pool.query(
    'SELECT "containerId"::int, "containerOrder"::int, "productId"::int, orientation::int, ST_X(ST_StartPoint(ST_ExteriorRing(ST_PatchN(geom, 1)))) AS x, ST_Y(ST_StartPoint(ST_ExteriorRing(ST_PatchN(geom, 1)))) AS y, ST_Z(ST_StartPoint(ST_ExteriorRing(ST_PatchN(geom, 1)))) AS z, "Container".name AS "containerName", "Container".price::float AS "containerPrice", "Container".width::int AS "containerWidth", "Container".height::int AS "containerHeight", "Container".length::int AS "containerLength", "Product".name AS "productName", "Product".price::float AS "productPrice", "Product".width::int AS "productWidth", "Product".height::int AS "productHeight", "Product".length::int AS "productLength" FROM "Plan_Container_Product" INNER JOIN "Container" ON "Plan_Container_Product"."containerId" = "Container".id LEFT JOIN "Product" ON "Plan_Container_Product"."productId" = "Product".id WHERE "planId" = $1;',
    [planId]
  );
  // let containerIds = [];
  // let productIds = [];
  // rows.forEach(row => {
  //   if (row.productId !== null) {
  //     if (productIds.indexOf(row.productId) == -1) {
  //       productIds.push(row.productId);
  //     }
  //   } else {
  //     if (containerIds.indexOf(row.containerId) == -1) {
  //       containerIds.push(row.containerId);
  //     }
  //   }
  // });
  // const [containers, products] = await Promise.all([
  //   getContainerList(userId, containerIds),
  //   getProductList(userId, productIds)
  // ]);
  let response = [];
  rows.forEach(row => {
    if (row.productId == null) {
      // const container = containers.find(cont => cont.id == row.containerId);
      const container = {
        id: row.containerId,
        name: row.containerName,
        price: row.containerPrice,
        width: row.containerWidth,
        height: row.containerHeight,
        length: row.containerLength
      };
      container.products = [];
      rows.forEach(row2 => {
        if (row2.productId !== null) {
          if (row2.containerOrder === row.containerOrder) {
            // const product = products.find(prod => prod.id == row2.productId);
            const product = {
              id: row2.productId,
              name: row2.productName,
              price: row2.productPrice,
              width: row2.productWidth,
              height: row2.productHeight,
              length: row2.productLength,
              x: row2.x,
              y: row2.y,
              z: row2.z
            };
            // product.x = row2.x;
            // product.y = row2.y;
            // product.z = row2.z;
            const { layoutWidth, layoutHeight, layoutLength } = dimensionToLayout(
              product.width,
              product.height,
              product.length,
              row2.orientation
            );
            product.layoutWidth = layoutWidth;
            product.layoutHeight = layoutHeight;
            product.layoutLength = layoutLength;
            container.products.push(product);
          }
        }
      });
      response.push(container);
    }
  });
  return response;
}

module.exports = {
  async getPlan(planId, userId) {
    const [simplePlan, detailedPlan] = await Promise.all([
      getSimplePlan(planId, userId),
      getDetailedPlan(planId, userId)
    ]);
    simplePlan.containers = detailedPlan;
    return simplePlan;
  },
  async addPlan(userId, name, description, duration, monthCost, containers, products) {
    const createdDate = new Date();
    const [containerList, productList] = await Promise.all([
      getContainerList(userId, containers),
      getProductList(userId, products)
    ]);
    // Calculate products cost
    let productsPrice = 0;
    productList.forEach(product => {
      productsPrice += product.price;
    });
    // Add simple plan 1st time
    const plan = await addSimplePlan(userId, name, description, createdDate, 0, productsPrice, 0, duration, monthCost);
    const { query, cost } = createPlanDetailQuery(plan.id, packing(containerList, productList));
    const containersPrice = cost;
    const totalPrice = productsPrice + containersPrice + monthCost * duration;
    // Insert geometries and update plan's prices
    await Promise.all([() => pool.query(query), updateCost(plan.id, containersPrice, totalPrice)]);
    await pool.query(query);
    return plan.id;
  }
};
