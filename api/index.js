const express = require('express');
const serverless = require('serverless-http');
const app = express();

// ...middleware & route...

module.exports = serverless(app);