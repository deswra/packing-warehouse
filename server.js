if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

const express = require('express');
// const bodyParser = require('body-parser');

const plans = require('./routes/plans');

const app = express();
const router = express.Router();

app.use(express.json());

app.use('/plans', plans);

app.listen(process.env.PORT, () => {
  console.log(`Server running on port ${process.env.PORT}`);
});
