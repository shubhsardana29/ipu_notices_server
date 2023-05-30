const express = require('express');
const app = express();
const axios = require('axios');

// Get the database connection
const db = require('./database');

// Set up the routes
app.get('/', (req, res) => {
  // Get the latest notice from the database
  const notice = db.getLatestNotice();

  // Render the view with the notice
  res.render('index', { notice });
});

// Start the server
app.listen(3000);
