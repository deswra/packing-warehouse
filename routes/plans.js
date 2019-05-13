const express = require('express');
const { getPlan, addPlan } = require('../controllers/plans');

const router = express.Router();

router
  .get('/', async (request, response) => {
    await packing();
    const yay = await getPlan(planId);
    return response.json(yay);
  })
  .get('/:id', async (request, response) => {
    try {
      const result = await getPlan(parseInt(request.params.id), parseInt(request.user.id));
      return response.status(200).json(result);
    } catch (err) {
      console.log(err);
      return response.status(500).json({ message: 'Cannot get plan.' });
    }
  });

router.post('/', async (request, response) => {
  try {
    const planId = await addPlan(
      parseInt(request.user.id),
      request.body.name,
      request.body.description,
      parseInt(request.body.duration),
      parseFloat(request.body.monthCost),
      request.body.containers,
      request.body.products
    );
    const result = await getPlan(planId, parseInt(request.user.id));
    return response.status(201).json(result);
  } catch (err) {
    console.log(err);
    return response.status(500).json({ message: 'Plan has not been added.' });
  }
});

module.exports = router;
