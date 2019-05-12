const express = require('express');

const { addProduct, getProduct, getProducts, updateProduct, deleteProduct } = require('../controllers/products');

const router = express.Router();

router
  .get('/', async (request, response) => {
    try {
      const result = await getProducts(parseInt(request.user.id));
      return response.status(200).json(result);
    } catch (err) {
      return response.status(500).json({ message: 'Cannot get products.' });
    }
  })
  .get('/:id', async (request, response) => {
    try {
      const result = await getProduct(parseInt(request.user.id), parseInt(request.params.id));
      return response.status(200).json(result);
    } catch (err) {
      return response.status(500).json({ message: 'Cannot get product.' });
    }
  });

router.post('/', async (request, response) => {
  try {
    const result = await addProduct(
      parseInt(request.user.id),
      request.body.name,
      parseInt(request.body.width),
      parseInt(request.body.height),
      parseInt(request.body.length),
      parseFloat(request.body.price)
    );
    return response.status(201).json(result);
  } catch (err) {
    return response.status(500).json({ message: 'Product has not been added.' });
  }
});

router.put('/:id', async (request, response) => {
  try {
    const result = await updateProduct(
      parseInt(request.user.id),
      parseInt(request.params.id),
      request.body.name,
      parseInt(request.body.width),
      parseInt(request.body.height),
      parseInt(request.body.length),
      parseFloat(request.body.price)
    );
    return response.status(200).json(result);
  } catch (err) {
    return response.status(500).json({ message: 'Product has not been updated.' });
  }
});

router.delete('/:id', async (request, response) => {
  try {
    const result = await deleteProduct(parseInt(request.user.id), parseInt(request.params.id));
    return response.status(410).json(result);
  } catch (err) {
    return response.status(500).json({ message: 'Product has not been deleted.' });
  }
});

module.exports = router;
