module.exports = {getScrapedJSONData, getCheerioObject, getMatchupDataFromCheerio, getOddsFromCheerio}

// This is run once per page and returns the needed data in JSON.
async function getScrapedJSONData(sport) {
    const Matchup = require('./scraper-classes.js')

    let matchupData = []
    const ch_obj = await getCheerioObject(sport=sport);
    const matchups = await getMatchupDataFromCheerio($=ch_obj);
    const odds = await getOddsFromCheerio($=ch_obj);

    for(let i=0; i<matchups.length; i++) {
        let match = new Matchup(
            sport=sport,
            team_1=matchups[i][2],
            team_2=matchups[i][3],
            match_datetime=matchups[i][0] + " " + matchups[i][1],
            match_odds=odds[i]
            )
        //res.push(JSON.stringify(match));
        //console.log(`Match # ${i+1}: ${match.team_1} vs. ${match.team_2}`);
        //console.log(`Match object is of type: ${match.constructor.name}`)
        matchupData.push(match);
    }
    return matchupData;
}


// Return Cheerio object loaded with page's html.
// This function is meant to be assigned to a variable upon call.
async function getCheerioObject(sport) {
    const axios = require("axios");
    const cheerio = require("cheerio");
    const urlToScrape = "https://www.oddsshark.com/" + sport + "/odds";
    
    // Fetch the HTML using axios, load into Cheerio object, and return that.
    const response = await axios.get(urlToScrape);

    return cheerio.load(response.data);
}


// Return the date given the cheerio object and the matchup.
// Does this have to be async if I don't use await in here, but I await this
// function in a different function.
async function getMatchupDataFromCheerio($) {
    var matchupData = []

    $('div.op-matchup-time.op-matchup-text').each((i,matchup) => {
        const team1 = matchup.nextSibling.nextSibling.childNodes[0]
                    .childNodes[0].firstChild.data.trim();

        const team2 = matchup.nextSibling.nextSibling.childNodes[1]
                        .childNodes[0].firstChild.data.trim();

        const time = matchup.childNodes[0].data.trim();
        
        // This date variable assignment only uses the first date on the page,
        // and does not account for scenario where there are multiple dates.
        const date = matchup.parentNode.parentNode.firstChild.firstChild
                    .firstChild.data.trim();
        
        matchupData.push([date, time, team1, team2])}
    )

    return matchupData;
}


// Returns an array of JSON objects (1 for each matchup on the page).
// Keys are the sportsbook names, and values are arrays for the odds
// at the respective sportsbook.
async function getOddsFromCheerio($) {
    var bookNames = ['Opening', 'Bovada', 'BetOnline', 'Intertops', 
    'SportsBetting', 'BetNow', 'GTBets', '5Dimes', 'SportBet']
    var dictList = []
    
    // For each matchup row
    $('div.op-item-row-wrapper.not-futures').each((i,matchupRow) => {
       let temp = [];
       let dict = {};
        // For the children divs in that matchup.
        $(matchupRow).children().each((j, bookOdds) => {
            const res = bookOdds.firstChild.firstChild;
            
            // This statement could use improvement. Some of the values of
            // 'res' can be null if the site did not input certain info.
            // I do not want to call a method on a null object.
            if(res != null) {
                const oddsT1 = JSON.parse(res.attribs['data-op-moneyline']).fullgame;
                const oddsT2 = JSON.parse(bookOdds.childNodes[1].firstChild.attribs['data-op-moneyline']).fullgame;
                dict[bookNames[j]] = [oddsT1, oddsT2];
            }
        });
        temp.push(dict);
        dictList.push(temp)
    });
    
    return dictList;
}


// class method on Matchup to check it for arbitrages.
//  Anything found by that method, will create a new Arbitrage object and append it to 