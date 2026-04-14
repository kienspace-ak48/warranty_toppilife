const { envPath } = require('./configs/myPath');
require('dotenv').config({ path: envPath });

const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const app = express();
if (process.env.TRUST_PROXY === '1' || process.env.TRUST_PROXY === 'true') {
  app.set('trust proxy', 1);
}
const database = require('./configs/dbConnection');
const registerRoutes = require('./routes/index');
const { publicPath, viewsPath, layoutsPath } = require('./configs/myPath');
const expressEjsLayouts = require('express-ejs-layouts');

if (process.env.CORS_ORIGINS) {
  app.use(
    cors({
      origin: process.env.CORS_ORIGINS.split(',').map((s) => s.trim()).filter(Boolean),
      credentials: true,
    }),
  );
}

//middleware
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(publicPath));
app.set('view engine', 'ejs');
app.set('views', viewsPath);
app.use(expressEjsLayouts);
app.set('layout', 'layouts/main');

registerRoutes(app);

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('SIGINT received, closing connections...');
    await database.disconnect();
    process.exit(0);
  });
  
  process.on('SIGTERM', async () => {
    console.log('SIGTERM received, closing connections...');
    await database.disconnect();
    process.exit(0);
  });


module.exports = app;