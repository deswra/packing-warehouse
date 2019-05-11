if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

const express = require('express');
const exjwt = require('express-jwt');
// const bodyParser = require('body-parser');

const users = require('./routes/users');
const plans = require('./routes/plans');

const app = express();

app.use(express.json());

const jwtMiddleware = exjwt({
  secret: process.env.SECRET
});

app.get('/', jwtMiddleware, (req, res) => {
  console.log(req);
  res.send('You are authenticated.');
});

app.use(function(err, req, res, next) {
  if (err.name === 'UnauthorizedError') {
    res.status(401).send(err.inner);
  } else {
    next(err);
  }
});

app.use('/users', users);
app.use('/plans', plans);

app.listen(process.env.PORT, () => {
  console.log(`Server running on port ${process.env.PORT}`);
});
