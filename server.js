if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

const express = require('express');
const exjwt = require('express-jwt');
// const bodyParser = require('body-parser');

const users = require('./routes/users');
const plans = require('./routes/plans');
const products = require('./routes/products');
const containers = require('./routes/containers');

const app = express();

app.use(express.json());

const jwtMiddleware = exjwt({
  secret: process.env.SECRET
});

app.use('/users', users);

app.use(jwtMiddleware);
app.use('/plans', plans);
app.use('/products', products);
app.use('/containers', containers);

app.use((err, req, res, next) => {
  if (err.name === 'UnauthorizedError') {
    res.status(401).send(err.inner);
  } else {
    next(err);
  }
});

app.listen(process.env.PORT, () => {
  console.log(`Server running on port ${process.env.PORT}`);
});
