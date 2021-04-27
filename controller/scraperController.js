const Scraper = require('../models/scraper.js');

async function getMatchupData(arrayOfSports) {
    try {
        
        let matchupData = [];
        for(let i=0; i<arrayOfSports.length; i++) {
            // Returns an array of all the Matchup objects for a sport.
            let matchups = await Scraper.getScrapedJSONData(arrayOfSports[i]);
            matchupData = matchupData.concat(matchups);
        }
        
        
        return matchupData
        

    } catch(error) {
        return {"Error": 'Error scraping matchup data!'};
    }
}

module.exports = {
    getMatchupData
}