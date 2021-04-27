// Vars for setting up server.
const express = require('express');
const port = 5000;
const app = express();
const path = require('path');
const cors = require('cors');

// Config CORS
const corsOptions = {
  origin: '*'
}

// Pretty print JSON.
app.set('json spaces', 2)

// Vars for scraping the data.
const scraperController = require('./controller/scraperController.js');

// Ensures correct MIME type on non-html files ie images and stylesheets.
app.use(express.static(__dirname));
app.use(express.static(path.join(__dirname + '/templates/index.html')));


// Endpoint for API calls.
// api/odds/ will return all.
// api/odds/sport will return odds for that sport.
app.get('/api/odds/:sport?', cors(corsOptions), async (req, res) => {
  if(req.params.sport) {
    res.json(await scraperController.getMatchupData([req.params.sport]))
  } else{
    res.json(await scraperController.getMatchupData(['mlb', 'nba', 'nhl']))
  }
  
})


// Endpoint for index.
app.get('/', async (req, res) => {
  // If local storage is empty,
    // Call the API for all sports.
    // Stringify into local storage.
    // Parse out of local storage and instantiate into objects.
    // Display the Matchup objects in the UI.

  // If local storage is populated,
    // Parse out of local storage and instantiate into objects.
    // Display the Matchup objects in the UI.
  //console.log('hello')
  //console.log(path.join(__dirname, 'static/images/'))
  res.sendFile(path.join(__dirname + '/templates/index.html'));
  //res.sendFile(path.join(__dirname + '/index.html'));
  
})

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
})