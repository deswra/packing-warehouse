const express = require('express');

const {
  addContainer,
  getContainer,
  getContainers,
  updateContainer,
  deleteContainer
} = require('../controllers/containers');

const router = express.Router();

router
  .get('/', async (request, response) => {
    try {
      const result = await getContainers(parseInt(request.user.id));
      return response.status(200).json(result);
    } catch (err) {
      return response.status(500).json({ message: 'Cannot get containers.' });
    }
  })
  .get('/:id', async (request, response) => {
    try {
      const result = await getContainer(parseInt(request.user.id), parseInt(request.params.id));
      return response.status(200).json(result);
    } catch (err) {
      return response.status(500).json({ message: 'Cannot get container.' });
    }
  });

router.post('/', async (request, response) => {
  try {
    const result = await addContainer(
      parseInt(request.user.id),
      request.body.name,
      parseInt(request.body.width),
      parseInt(request.body.height),
      parseInt(request.body.length),
      parseFloat(request.body.price)
    );
    return response.status(201).json(result);
  } catch (err) {
    return response.status(500).json({ message: 'Container has not been added.' });
  }
});

router.put('/:id', async (request, response) => {
  try {
    const result = await updateContainer(
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
    return response.status(500).json({ message: 'Container has not been updated.' });
  }
});

router.delete('/:id', async (request, response) => {
  try {
    const result = await deleteContainer(parseInt(request.user.id), parseInt(request.params.id));
    return response.status(410).json(result);
  } catch (err) {
    return response.status(500).json({ message: 'Container has not been deleted.' });
  }
});

module.exports = router;
