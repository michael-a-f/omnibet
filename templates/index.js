window.addEventListener('load', function() {
    // Object to hold various filters for displaying matchups.
    let filters = {
        highestGuaranteed: true,
        selectedSports: [],
        showOnlyArbitrageMatchups: false
    }
    
    // Variable for all the matchups in local storage
    let allMatchups = Store.getMatchupObjects();

    // If no data in local storage, fetch and display resolved response.
    // If data already in local storage, display it.
    if(allMatchups.length === 0) {
        UI.showSpinner() // gets cleared from DOM in UI.updateMatchup helper
        Store.refreshOddsData()
            .then(res => {
                allMatchups = Store.getMatchupObjects();
                UI.updateMatchups(allMatchups, filters)})
    } else {
        UI.updateMatchups(allMatchups, filters)        
    }

    // Clicking a radio sets its checked value to true and the others to false.
    // Toggles the variable for displaying arbitrages only and updates the DOM.
    let topRadios = document.querySelectorAll('.form-check-input');
    for(let i=0; i<topRadios.length; i++) {
        topRadios[i].addEventListener('click', function() {
            topRadios[i].checked = true;
            topRadios[1-i].checked = !topRadios[i].checked;
            if(i===0){
                filters.showOnlyArbitrageMatchups = false;
            } else {
                filters.showOnlyArbitrageMatchups = true;
            }
            UI.updateMatchups(allMatchups, filters)        
        })
    }
    
    // When clicking the 3 sports cards at the top of page, add/remove its ID 
    // to the variable for selectedSports and update its classlist for CSS 
    // change. Update the DOM with the new selections on each click.
    document.querySelectorAll('.sport-search-card').forEach((sport) =>{
        sport.addEventListener('click', function() {
            if(!filters.selectedSports.includes(sport.id)) {
                sport.classList.add('sport-selected') // For CSS styling.
                filters.selectedSports.push(sport.id);
            } else{
                let sportToRemove = filters.selectedSports.indexOf(sport.id);
                sport.classList.remove('sport-selected') // For CSS styling.
                filters.selectedSports.splice(sportToRemove, 1)
            }
            UI.updateMatchups(allMatchups, filters)
        })
    })

    // Add event listener to refresh the data in local storage via API call.
    document.querySelector('#refresh-odds').addEventListener('click', function() {
        UI.showSpinner()
        Store.refreshOddsData()
        .then(res => {
            allMatchups = Store.getMatchupObjects();
            UI.updateMatchups(allMatchups, filters)})
    })

    // Search the matchups as input is typed into the search bar.
    document.querySelector('#search-matchups').addEventListener('keyup', function() {
        let searchValue = document.querySelector('#search-matchups').value.toLowerCase();
        UI.getSearchedMatchups(searchValue)
    });

    // Clear search on click into the search bar.
    document.querySelector('#search-matchups').addEventListener('click', function() {
        this.value = ''
        UI.getSearchedMatchups(this.value)
    })

    // Prevent the form from submitting and unfocus if user presses enter on search.
    document.querySelector('#matchup-search').addEventListener('submit', (e) => {
        e.preventDefault();
        document.querySelector('#search-matchups').blur();
    })
})


// Argument is an array of strings with the sport names.  Always called
// on all sports except for the navbar API links.
// Returns a promise.all on an array of promises since each fetch is to
// a single URL.
function fetchDataFromAPI(arrayOfSports) {
    let promiseArray = []; // One element in this array for each sport.
    arrayOfSports.forEach(sport => {
        var promise = fetch(`http://127.0.0.1:5000/api/odds/${sport}`)
                        .then(res => res.json());
        promiseArray.push(promise);
    })
    return Promise.all(promiseArray);
}


class UI {
    static minArbModal(matchup) {
        // Clear the modal
        let title = document.querySelector('.modal-title');
        let body = document.querySelector('.modal-body');
        let footerTotal = document.querySelector('#total-bet-amount');
        let footerButtons = document.querySelector('#modal-footer-buttons');
        
        // Populate modal with matchup and time as header
        title.innerText = `${matchup.team_1} vs. ${matchup.team_2}: ${matchup.match_datetime}` 
        
        // Bet amount and button as footer.
        
        footerButtons.innerHTML = `<button type="button" class="btn btn-primary" id="checkout">Place Bets</button>`;
       
        // Vertical table with the teams as the columns and sportsbooks as the rows.
        body.innerHTML = `
        <div class='modal-section' id='table-section'>
            <table class="table" id="modal-table">
            
                <thead class="thead-dark">
                    <tr id='modal-table-head'>
                        <th></th>
                        <th>${matchup.team_1}</th>
                        <th>${matchup.team_2}</th>
                    </tr>
                </thead>
                <tbody id="modal-table-body">
                    
                </tbody>
            </table>
        </div>
        <div class='modal-section' id='info-section'>
            <div class='bet-summary'>
                <h3>Bet Preview</h3>
        
            </div>

            <div class='scenarios'>
                <div class='scenario-box' id='team-1-win'>
                    <h3 id='team-1-title'></h3>
                    <div id='team-1-body'>
                        
                    </div>
                    <hr>
                    <h3 class='profit' id='team-1-net-profit'></h3>
                </div>
                <div class='scenario-box' id='team-2-win'>
                    <h3 id='team-2-title'></h3>
                    <div id='team-2-body'>
                        
                        
                    </div>
                    <hr>
                    <h3 class='profit' id='team-2-net-profit'></h3>
                </div>
            </div>
        </div>`;
        // Loop through the match odds and append to table accordingly.
        // For each prop of match_odds, create a row with the first cell as the prop, the next as the odds 0 and the next as the odds 1.
        let bookCounter = 1;
        let books = matchup.match_odds[0];
        let tableBody = document.querySelector('#modal-table-body');
        for(const name in books) {
            let newRow = document.createElement('tr');
            newRow.className = 'book-row';
            newRow.id = `book-row-${bookCounter}`;

            let newName = document.createElement('td');
            newName.className = 'book-name';
            newName.id = `book-${bookCounter}-name`;
            newName.innerText = `${name}`
            
            let team1Odds = document.createElement('td');
            team1Odds.className = 'odds';
            team1Odds.id = 'team-1-odds';
            team1Odds.innerText = `${books[name][0]}`
            

            let team2Odds = document.createElement('td');
            team2Odds.className = 'odds';
            team2Odds.id = 'team-2-odds';
            team2Odds.innerText = `${books[name][1]}`
            
            newRow.append(newName);
            newRow.append(team1Odds);
            newRow.append(team2Odds);

            tableBody.append(newRow);

            bookCounter++;
        }

        let bet1Amount = matchup.arbitrageBets[0].largestMinimumProfit.betOnTeam1.betAmount;
        let bet1Profit = matchup.arbitrageBets[0].largestMinimumProfit.getProfitOnTeam1Win().toFixed(2);
        let bet1Winnings = matchup.arbitrageBets[0].largestMinimumProfit.getWinningsOnTeam1Win().toFixed(2)

        let bet2Amount = matchup.arbitrageBets[0].largestMinimumProfit.betOnTeam2.betAmount;
        let bet2Profit = matchup.arbitrageBets[0].largestMinimumProfit.getProfitOnTeam2Win().toFixed(2);
        let bet2Winnings = matchup.arbitrageBets[0].largestMinimumProfit.getWinningsOnTeam2Win().toFixed(2)
        
        // Get the Arbitrage Bet info of this matchup.
        let modalBody = document.querySelector('.modal-body');
        let betContainer = document.querySelector('.bet-summary');

        let bet1 = document.createElement('p');
        bet1.id = 'bet-1';
        bet1.innerText = `Bet 1: ${matchup.arbitrageBets[0].largestMinimumProfit.betOnTeam1.betSummary()}`
        
        let bet2 = document.createElement('p');
        bet2.id = 'bet-2';
        bet2.innerText = `Bet 2: ${matchup.arbitrageBets[0].largestMinimumProfit.betOnTeam2.betSummary()}`

        betContainer.append(bet1);
        betContainer.append(bet2);

        document.querySelector('#team-1-title').innerText = `On ${matchup.team_1} win...`
        document.querySelector('#team-1-body').innerHTML = `
        <p class='profit'>(+) $${bet1Winnings} payout</p>
        <p class='loss'>(-) $${bet1Amount} bet on ${matchup.team_1}</p>
        <p class='loss'>(-) $${bet2Amount} bet on ${matchup.team_2}</p>
        `
        document.querySelector('#team-1-net-profit').innerText = `Net Profit: $${bet1Profit}`

        document.querySelector('#team-2-title').innerText = `On ${matchup.team_2} win...`
        document.querySelector('#team-2-body').innerHTML = `
        <p class='profit'>(+) $${bet2Winnings} payout</p>
        <p class='loss'>(-) $${bet2Amount} bet on ${matchup.team_2}</p>
        <p class='loss'>(-) $${bet1Amount} bet on ${matchup.team_1}</p>
        `
        document.querySelector('#team-2-net-profit').innerText = `Net Profit: $${bet2Profit}`

        footerTotal.innerText = `Bet $${bet1Amount+bet2Amount}, To Profit $${Math.min(bet1Profit, bet2Profit).toFixed(2)} or $${Math.max(bet1Profit, bet2Profit).toFixed(2)}`

        tableBody.addEventListener('click', (e) =>{
            if(e.target.classList.contains('odds')) {
                if(e.target.classList.contains('preview-selected')) {
                    e.target.classList.remove('preview-selected');
                } else {
                    e.target.classList.add('preview-selected');
                }
            }
        })

        // Add preview-selected to the classlist of the two arbitrage bets in the table.
        // Need the book of bet 1 and the book of bet 2
        let bet1Book = matchup.arbitrageBets[0].largestMinimumProfit.betOnTeam1.sportsbook;
        let bet2Book = matchup.arbitrageBets[0].largestMinimumProfit.betOnTeam2.sportsbook;

        // Search the table body for the row which contains book 1, and get its text.
        let tableRows = document.querySelectorAll('.book-name');
        for(let i=0; i<tableRows.length; i++) {
            if(tableRows[i].innerText === bet1Book) {
                tableRows[i].nextElementSibling.classList.add('preview-selected');
            }
            if(tableRows[i].innerText === bet2Book) {
                tableRows[i].nextElementSibling.nextElementSibling.classList.add('preview-selected');
            }
        }
    }

    static maxArbModal(matchup) {
        // Clear the modal
        let title = document.querySelector('.modal-title');
        let body = document.querySelector('.modal-body');
        let footerTotal = document.querySelector('#total-bet-amount');
        let footerButtons = document.querySelector('#modal-footer-buttons');
        
        // Populate modal with matchup and time as header
        title.innerText = `${matchup.team_1} vs. ${matchup.team_2}: ${matchup.match_datetime}` 
        
        // Bet amount and button as footer.
        
        footerButtons.innerHTML = `<button type="button" class="btn btn-primary" id="checkout">Place Bets</button>`;
       
        // Vertical table with the teams as the columns and sportsbooks as the rows.
        body.innerHTML = `
        <div class='modal-section' id='table-section'>
            <table class="table" id="modal-table">
            
                <thead class="thead-dark">
                    <tr id='modal-table-head'>
                        <th></th>
                        <th>${matchup.team_1}</th>
                        <th>${matchup.team_2}</th>
                    </tr>
                </thead>
                <tbody id="modal-table-body">
                    
                </tbody>
            </table>
        </div>
        <div class='modal-section' id='info-section'>
            <div class='bet-summary'>
                <h3>Bet Preview</h3>
        
            </div>

            <div class='scenarios'>
                <div class='scenario-box' id='team-1-win'>
                    <h3 id='team-1-title'></h3>
                    <div id='team-1-body'>
                        
                    </div>
                    <hr>
                    <h3 class='profit' id='team-1-net-profit'></h3>
                </div>
                <div class='scenario-box' id='team-2-win'>
                    <h3 id='team-2-title'></h3>
                    <div id='team-2-body'>
                        
                        
                    </div>
                    <hr>
                    <h3 class='profit' id='team-2-net-profit'></h3>
                </div>
            </div>
        </div>`;
        // Loop through the match odds and append to table accordingly.
        // For each prop of match_odds, create a row with the first cell as the prop, the next as the odds 0 and the next as the odds 1.
        let bookCounter = 1;
        let books = matchup.match_odds[0];
        let tableBody = document.querySelector('#modal-table-body');
        for(const name in books) {
            let newRow = document.createElement('tr');
            newRow.className = 'book-row';
            newRow.id = `book-row-${bookCounter}`;

            let newName = document.createElement('td');
            newName.className = 'book-name';
            newName.id = `book-${bookCounter}-name`;
            newName.innerText = `${name}`
            
            let team1Odds = document.createElement('td');
            team1Odds.className = 'odds';
            team1Odds.id = 'team-1-odds';
            team1Odds.innerText = `${books[name][0]}`
            

            let team2Odds = document.createElement('td');
            team2Odds.className = 'odds';
            team2Odds.id = 'team-2-odds';
            team2Odds.innerText = `${books[name][1]}`
            
            newRow.append(newName);
            newRow.append(team1Odds);
            newRow.append(team2Odds);

            tableBody.append(newRow);

            bookCounter++;
        }

        let bet1Amount = matchup.arbitrageBets[1].largestMaximumProfit.betOnTeam1.betAmount;
        let bet1Profit = matchup.arbitrageBets[1].largestMaximumProfit.getProfitOnTeam1Win().toFixed(2);
        let bet1Winnings = matchup.arbitrageBets[1].largestMaximumProfit.getWinningsOnTeam1Win().toFixed(2)

        let bet2Amount = matchup.arbitrageBets[1].largestMaximumProfit.betOnTeam2.betAmount;
        let bet2Profit = matchup.arbitrageBets[1].largestMaximumProfit.getProfitOnTeam2Win().toFixed(2);
        let bet2Winnings = matchup.arbitrageBets[1].largestMaximumProfit.getWinningsOnTeam2Win().toFixed(2)
        
        // Get the Arbitrage Bet info of this matchup.
        let modalBody = document.querySelector('.modal-body');
        let betContainer = document.querySelector('.bet-summary');

        let bet1 = document.createElement('p');
        bet1.id = 'bet-1';
        bet1.innerText = `Bet 1: ${matchup.arbitrageBets[1].largestMaximumProfit.betOnTeam1.betSummary()}`
        
        let bet2 = document.createElement('p');
        bet2.id = 'bet-2';
        bet2.innerText = `Bet 2: ${matchup.arbitrageBets[1].largestMaximumProfit.betOnTeam2.betSummary()}`

        betContainer.append(bet1);
        betContainer.append(bet2);

        document.querySelector('#team-1-title').innerText = `On ${matchup.team_1} win...`
        document.querySelector('#team-1-body').innerHTML = `
        <p class='profit'>(+) $${bet1Winnings} payout</p>
        <p class='loss'>(-) $${bet1Amount} bet on ${matchup.team_1}</p>
        <p class='loss'>(-) $${bet2Amount} bet on ${matchup.team_2}</p>
        `
        document.querySelector('#team-1-net-profit').innerText = `Net Profit: $${bet1Profit}`

        document.querySelector('#team-2-title').innerText = `On ${matchup.team_2} win...`
        document.querySelector('#team-2-body').innerHTML = `
        <p class='profit'>(+) $${bet2Winnings} payout</p>
        <p class='loss'>(-) $${bet2Amount} bet on ${matchup.team_2}</p>
        <p class='loss'>(-) $${bet1Amount} bet on ${matchup.team_1}</p>
        `
        document.querySelector('#team-2-net-profit').innerText = `Net Profit: $${bet2Profit}`

        footerTotal.innerText = `Bet $${bet1Amount+bet2Amount}, To Profit $${Math.min(bet1Profit, bet2Profit).toFixed(2)} or $${Math.max(bet1Profit, bet2Profit).toFixed(2)}`

        tableBody.addEventListener('click', (e) =>{
            if(e.target.classList.contains('odds')) {
                if(e.target.classList.contains('preview-selected')) {
                    e.target.classList.remove('preview-selected');
                } else {
                    e.target.classList.add('preview-selected');
                }
            }
        })

        // Add preview-selected to the classlist of the two arbitrage bets in the table.
        // Need the book of bet 1 and the book of bet 2
        let bet1Book = matchup.arbitrageBets[1].largestMaximumProfit.betOnTeam1.sportsbook;
        let bet2Book = matchup.arbitrageBets[1].largestMaximumProfit.betOnTeam2.sportsbook;

        // Search the table body for the row which contains book 1, and get its text.
        let tableRows = document.querySelectorAll('.book-name');
        for(let i=0; i<tableRows.length; i++) {
            if(tableRows[i].innerText === bet1Book) {
                tableRows[i].nextElementSibling.classList.add('preview-selected');
            }
            if(tableRows[i].innerText === bet2Book) {
                tableRows[i].nextElementSibling.nextElementSibling.classList.add('preview-selected');
            }
        }
    }

    // Iterate through matchup cards in DOM and display or not based on if
    // either of the teams contain the searched value in them.
    static getSearchedMatchups(searchValue) {
        let matchupCards = document.querySelectorAll('.matchup-card');
        for(let cardIndex=0; cardIndex<matchupCards.length; cardIndex++) {
            let card = matchupCards[cardIndex];
            let team1 = card.querySelector('#team-1-name').innerText.toLowerCase();
            let team2 = card.querySelector('#team-2-name').innerText.toLowerCase();

            if(team1.indexOf(searchValue) > -1 || team2.indexOf(searchValue) > -1 ) {
                card.style.display = '';
            } else {
                card.style.display = 'none';
            }
        }
    }

    

    static showSpinner() {
        let spinnerDiv = document.createElement('div');
        spinnerDiv.id = 'loader';
        document.querySelector('#matchup-cards-container').append(spinnerDiv);
    }

    // Update which matchup cards are displayed in the DOM when a filter is 
    // changed.
    static updateMatchups(currentMatchups, filterOptions) {
        let currentSelections = filterOptions.selectedSports
        if(currentSelections.length===0) {
            currentSelections = ['mlb', 'nba', 'nhl'];
        }
        document.querySelector('#matchup-cards-container').innerHTML = '';

        let toDisplay = currentMatchups.filter(matchup => 
            (currentSelections.includes(matchup.sport)) && 
            ((matchup.hasArbitrage()) || 
            (matchup.hasArbitrage() === filterOptions.showOnlyArbitrageMatchups))
        ).sort((a, b) => {
            if (filterOptions.highestGuaranteed) {
                return b.minimumGuaranteedProfit() - a.minimumGuaranteedProfit()
            } else {
                return b.maximumPotentialProfit() - b.maximumPotentialProfit()
            }
            
        })
        toDisplay.forEach(matchup => {
            UI.createMatchupCard(matchup)
        })
    }

    static createMatchupCard(matchup) {
        // Images for each team returned using file name conventions of
        // {sport}-team-logos/{team}.png

        let matchupCard = document.createElement('div');
        matchupCard.className = 'matchup-card';
        matchupCard.innerHTML = `
        <div class='matchup-card-header'>
            <p>${matchup.match_datetime}</p>
        </div>
        <div class='matchup-teams'>
            <div class="team">
                <img src="${utils.getTeamIcons(matchup)[0]}" alt="Team 1">
                <p id='team-1-name'>${matchup.team_1}</p>
            </div>
            <div class='team-divider'>
                <p>@</p>
            </div>

            <div class="team">
                <img src="${utils.getTeamIcons(matchup)[1]}" alt="Team 2">
                <p id='team-2-name'>${matchup.team_2}</p>
            </div>
        </div>

        <div class='arb-ops'>
            
            <div class="arb-container">
                <div class='arb-option'>
                    <button class='arb-btn'>
                        <p>$${matchup.minimumGuaranteedProfit()}</p>
                    </button>
                    <div class="arb-type">
                        <p>Highest Guaranteed</p>
                    </div>
                </div>
                <div class='arb-option'>
                    <button class='arb-btn'>
                        <p>$${matchup.maximumPotentialProfit()}</p>
                    </button>
                    <div class="arb-type">
                        <p>Highest Possible</p>
                    </div>
                    
                </div>
            </div>
        </div>
        `

        if(matchup.hasArbitrage()) {
            matchupCard.classList.add('arbitrage-opportunity')
            let arbCircles = matchupCard.querySelectorAll('.arb-btn');
            for(let i=0; i<arbCircles.length; i++) {
                arbCircles[i].classList.add('arb-btn-true');
                arbCircles[i].setAttribute('data-toggle', 'modal');
                arbCircles[i].setAttribute('data-target', '.bd-example-modal-lg');
                if(i===0) {
                    arbCircles[i].addEventListener('click', function() {
                        //console.log(`min`);
                        //console.log(matchup.arbitrageWithMinimumGuaranteedProfit())
                        // ADD MODAL FNS HERE
                        UI.minArbModal(matchup);
                        
                    })
                } else {
                    arbCircles[i].addEventListener('click', function() {
                        console.log(`max`);
                        //console.log(matchup.arbitrageWithMaximumPotentialProfit())
                        // ADD MODAL FNS HERE
                        UI.maxArbModal(matchup);
                        
                    })
                }
            }
        } else {
            matchupCard.querySelector('.arb-container').innerHTML = `
            <div>
                <p>No Arbitrage Opportunities for this match</p>
            </div>`
        }
        let betButtonContainer = document.createElement('div');
        betButtonContainer.className = 'button-container';

        
        
        let betButton = document.createElement('button');
        betButton.className = 'place-bet';
        betButton.innerText = 'View Odds';
        betButton.setAttribute('data-toggle', 'modal');
        betButton.setAttribute('data-target', '.bd-example-modal-lg');
        betButton.addEventListener('click', function() {
            UI.resetModal()
            UI.populateModalTable(matchup)
            matchup.arbitragePayoutSummary()
        })
        betButtonContainer.append(betButton)
        matchupCard.append(betButtonContainer);
        document.querySelector('#matchup-cards-container').append(matchupCard);
    }

                
    static createMatchupTable() {
        // Create Table for that sport's matchups data.
        const tableToAdd = document.createElement('div');
        tableToAdd.className = "jumbotron mb-5"
        tableToAdd.innerHTML = `
            <h3 class="display-4">Upcoming Games</h3>
            
            <table class="table" id="odds-results-table">
                <thead class="thead-dark">
                <tr>
                    <th scope="col">Sport</th>
                    <th scope="col">Matchup</th>
                    <th scope="col">Match Date</th>
                    <th scope="col"></th>
                    <th scope="col"></th>
                </tr>
                </thead>
                <tbody id="add-row-here">
                
                </tbody>
            </table>
            `
        return tableToAdd;
    }


    // Resets the Modal HTML back to a blank template.
    static resetModal() {
        // Reset the table head.
        let modalTable = document.querySelector('#body-of-modal');
        modalTable.innerText='';
        modalTable.innerHTML = `
        
        <table class="table" id="modal-table">
        <p id='modal-directions'>Select the odds you would like to bet on.</p>
            <thead class="thead-dark">
                <tr id='modal-table-head'>
                    <th></th>
                </tr>
            </thead>
            <tbody id="modal-table-body">
                <tr id='team-1-row'>
                    <td id="team1"></th>
                </tr>
                <tr id='team-2-row'>
                    <td id="team2"></th>
                </tr>
            </tbody>
        </table>

        <hr>

        <div id='bet-preview'>
            <h4>Bet Preview:</h4>
            <p id='placeholder-text'>You have not selected any bets.  Select a cell in the odds table above to preview its bet.</p>
        </div>

        <hr>

        <div class="scenario-container">
            <div class="scenario" id="scenario-1">
                <h4 id='team-1-win'>If Team 1 wins...</h4>
                <div id='team-1-profit'>
                    <h6 class='profit'>Profit:</h6>
                </div>

                <div id='team-1-loss'>
                    <h6 class='loss'>Loss:</h6>
                </div>
                <hr>
                <div class='scenario-total' id='team-1-total'>
                <h4>You Profit: $100.00</h4>
                </div>
            </div>
            
            <div class="scenario" id="scenario-2">
                <h4 id='team-2-win'>If Team 2 wins...</h4>
                <div id='team-2-profit'>
                    <h6 class='profit'>Profit:</h6>
                </div>

                <div id='team-2-loss'>
                    <h6 class='loss'>Loss:</h6>
                </div>
                <hr>
                <div class='scenario-total' id='team-2-total'>
                <h4>You Lose: $100.00</h4>
                </div>
            </div>
            
        </div>
        
        `
        
    }

    static populateArbitrageModal(matchup) {
        // Clear it
        UI.resetModal()

        

        // Populate it
        UI.populateModalTable(matchup)
        let best = matchup.getBestProfitingArbitrage();
        let bet1of2 = new SingleBet(best.betOnTeam1, best.team_1, best.oddsForTeam1AtBook1, best.book1, 1)
        let bet2of2 = new SingleBet(best.betOnTeam2, best.team_2, best.oddsForTeam2AtBook2, best.book2, 2)
        let bets = [bet1of2, bet2of2];

        document.querySelector('#placeholder-text').remove();

        bets.forEach(bet => {
            let scenario1Profit = document.querySelector('#team-1-profit');
            let scenario1Loss = document.querySelector('#team-1-loss');
            let scenario2Profit = document.querySelector('#team-2-profit');
            let scenario2Loss = document.querySelector('#team-2-loss');

            if(bet.team === matchup.team_1) {
                let winningScenario = document.createElement('p');
                winningScenario.innerText = `$${bet.getProfit().toFixed(2)} from Bet #${bet.betNumber} on ${bet.team}`
                scenario1Profit.appendChild(winningScenario);

                let losingScenario = document.createElement('p');
                losingScenario.innerText = `$${bet.wager} from Bet #${bet.betNumber} on ${bet.team}`
                scenario2Loss.appendChild(losingScenario)
            } else {
                let winningScenario = document.createElement('p');
                winningScenario.innerText = `$${bet.getProfit().toFixed(2)} from Bet #${bet.betNumber} on ${bet.team}`
                scenario2Profit.appendChild(winningScenario);

                let losingScenario = document.createElement('p');
                losingScenario.innerText = `$${bet.wager} from Bet #${bet.betNumber} on ${bet.team}`
                scenario1Loss.appendChild(losingScenario);

            }

            // Add a line in the bet preview with the bet data.
            let previewSpot = document.querySelector('#bet-preview');
            let newPreview = document.createElement('p');
            newPreview.className = 'preview-sentence';
            newPreview.innerText = `Bet #${bet.betNumber}: ` + bet.betSummary();
            previewSpot.append(newPreview);
            })

            //document.querySelector('#arb-btn').remove()

    }

    // Given a Matchup object, populate the modal with its data.
    static populateModalTable(matchup) {
        // Grab the DOM needed.
        let tableHead = document.querySelector('#modal-table-head');
        let team1Row = document.querySelector('#team-1-row');
        let team2Row = document.querySelector('#team-2-row');

        // Set the title of the modal ie the top-most text.
        let modalTitle = document.querySelector('.modal-title');
        modalTitle.innerText = `${matchup.sport.toUpperCase()}: ${matchup.team_1} vs. ${matchup.team_2}: ${matchup.match_datetime}`;

        // Set the Team Names in the modal table ie the left-most entries.
        document.querySelector('#team1').innerText = `${matchup.team_1}`;
        document.querySelector('#team2').innerText = `${matchup.team_2}`;

        // Loop through the match_odds attribute to set the sportsbooks
        // as the column names and the values as the odds at those sportsbooks.
        for (const book in matchup.match_odds[0]) {
            // Create and append column header for each sportsbook.
            let bookName = document.createElement('th');
            bookName.setAttribute('scope', 'col');
            bookName.innerText = `${book}`;
            tableHead.append(bookName);

            // Insert the odds into the column.
            let team1Odds = document.createElement('td');
            let team2Odds = document.createElement('td');
            team1Odds.innerText = `${matchup.match_odds[0][book][0]}`
            team2Odds.innerText = `${matchup.match_odds[0][book][1]}`
            // Class name of preview allows the 'td' to be clickable.
            team1Odds.className = 'preview';
            team2Odds.className = 'preview';
            team1Row.append(team1Odds);
            team2Row.append(team2Odds);
        }

        // Populate the two scenario divs.
        let scenario1 = document.querySelector('#team-1-win');
        scenario1.innerText = `If ${matchup.team_1} wins...`
        let scenario2 = document.querySelector('#team-2-win');
        scenario2.innerText = `If ${matchup.team_2} wins...`

        // Add an event listener on the entire table element using
        // event propogation in order to traverse the DOM relative to
        // the clicked 'td' element.
        let wholeTable = document.querySelector('#modal-table');
        let betNumber = 1;
        wholeTable.addEventListener('click', (e) => {
            //console.log(e.target)

            // Only run on click of element with class 'preview'.
            // If already selected, remove the bet.
            // If not already selected, add the bet.
            if(e.target.classList.contains('preview')) {
                if(e.target.classList.contains('preview-selected')) {
                    let betNumberToRemove = e.target.id;
                    UI.removeBet(e.target, betNumberToRemove)
                    betNumber--;
                }
                else{
                    UI.addBet(e.target, matchup, betNumber)
                    e.target.id = betNumber;
                    betNumber++;
                }
                //UI.createBetPreview(e.target, matchup, betNumber)
                //betNumber++;
            }

        })

        document.querySelector('#arb-btn').addEventListener('click', function() {
            UI.populateArbitrageModal(matchup);
        })
    }

    static removeBet(el, betNumber) {
        // Unhighlight the table cell by reverting class name change.
        el.classList.remove('preview-selected');

        // Select all the DOM elements from that bet and remove them.
        document.querySelectorAll(`#bet-${betNumber}`).forEach((bet) => {
            bet.remove();
    })
}


    static addBet(el, matchup, betNumber) {
        // remove the placeholder since there is now a bet there.
        if(document.querySelector('#placeholder-text')) {
            document.querySelector('#placeholder-text').remove();
        }
        

        // Get the data from the clicked element.
        let oddsForBet = el.innerText;
        let onTeam = el.parentNode.firstElementChild.innerText;
        //console.log(`The team is showing as ${onTeam}`)

        // Add a class name for CSS hook for highlighting.
        el.classList.add('preview-selected');

        // Add a bet number so that if need for removal, can find that way.
        //el.classList.add(`bet-${betNumber}`);

        // This is to keep track of the index of the clicked on element within its Node siblings
        // in order to find its corresponding column name ie the sportsbook of the clicked on odd.
        let childIndex = 0;
        while( (el.previousSibling) != null ){
            el = el.previousSibling;
            childIndex++;
        }
        let atBook = el.parentNode.parentNode.parentNode.firstElementChild.firstElementChild.children[childIndex-1].innerText;
        //console.log(`The child index is ${childIndex}.  The Book is showing as ${atBook}.`)
        
        // Create a new Bet object with odds, onTeam, atBook, and the bet number.
        let newBet = new SingleBet(10, onTeam, oddsForBet, atBook, betNumber)

        // Add an entry into the scenario divs.
        let scenario1Profit = document.querySelector('#team-1-profit');
        let scenario1Loss = document.querySelector('#team-1-loss');
        let scenario2Profit = document.querySelector('#team-2-profit');
        let scenario2Loss = document.querySelector('#team-2-loss');
        
        if(newBet.team === matchup.team_1) {
            let winningScenario = document.createElement('p');
            winningScenario.innerText = `$${newBet.getProfit().toFixed(2)} from Bet #${newBet.betNumber} on ${newBet.team}`
            winningScenario.id = `bet-${betNumber}`;
            scenario1Profit.appendChild(winningScenario);

            let losingScenario = document.createElement('p');
            losingScenario.innerText = `$${newBet.wager} from Bet #${newBet.betNumber} on ${newBet.team}`
            losingScenario.id = `bet-${betNumber}`;
            scenario2Loss.appendChild(losingScenario)
        } else {
            let winningScenario = document.createElement('p');
            winningScenario.innerText = `$${newBet.getProfit().toFixed(2)} from Bet #${newBet.betNumber} on ${newBet.team}`
            winningScenario.id = `bet-${betNumber}`;
            scenario2Profit.appendChild(winningScenario);

            let losingScenario = document.createElement('p');
            losingScenario.innerText = `$${newBet.wager} from Bet #${newBet.betNumber} on ${newBet.team}`
            losingScenario.id = `bet-${betNumber}`;
            scenario1Loss.appendChild(losingScenario);
        }

        // Add a line in the bet preview with the bet data.
        let previewSpot = document.querySelector('#bet-preview');
        let newPreview = document.createElement('p');
        newPreview.className = 'preview-sentence';
        newPreview.id = (`bet-${betNumber}`)
        newPreview.innerText = `Bet #${betNumber}: ` + newBet.betSummary();
        previewSpot.append(newPreview);

    }

    static createBetPreview(el, matchup, betNumber) {
        if(el.classList.contains('preview-selected')) {
            el.classList='preview';
        } else {
            el.classList.add('preview-selected');
        }
        
        // remove the placeholder since there is now a bet there.
        document.querySelector('#placeholder-text').innerHTML = '';

        // Get the data from the clicked element.
        let oddsForBet = el.innerText;
        let onTeam = el.parentNode.firstElementChild.innerText;
        //console.log(`The team is showing as ${onTeam}`)

        // This is to keep track of the index of the clicked on element within its Node siblings
        // in order to find its corresponding column name ie the sportsbook of the clicked on odd.
        let childIndex = 0;
        while( (el.previousSibling) != null ){
            el = el.previousSibling;
            childIndex++;
        }
        let atBook = el.parentNode.parentNode.parentNode.firstElementChild.firstElementChild.children[childIndex-1].innerText;
        //console.log(`The child index is ${childIndex}.  The Book is showing as ${atBook}.`)
        
        // Create a new Bet object with odds, onTeam, atBook, and the bet number.
        let newBet = new SingleBet(10, onTeam, oddsForBet, atBook, betNumber)

        // Add an entry into the scenario divs.
        let scenario1Profit = document.querySelector('#team-1-profit');
        let scenario1Loss = document.querySelector('#team-1-loss');
        let scenario2Profit = document.querySelector('#team-2-profit');
        let scenario2Loss = document.querySelector('#team-2-loss');
        
        if(newBet.team === matchup.team_1) {
            let winningScenario = document.createElement('p');
            winningScenario.innerText = `$${newBet.getProfit().toFixed(2)} from Bet #${newBet.betNumber} on ${newBet.team}`
            scenario1Profit.appendChild(winningScenario);

            let losingScenario = document.createElement('p');
            losingScenario.innerText = `$${newBet.wager} from Bet #${newBet.betNumber} on ${newBet.team}`
            scenario2Loss.appendChild(losingScenario)
        } else {
            let winningScenario = document.createElement('p');
            winningScenario.innerText = `$${newBet.getProfit().toFixed(2)} from Bet #${newBet.betNumber} on ${newBet.team}`
            scenario2Profit.appendChild(winningScenario);

            let losingScenario = document.createElement('p');
            losingScenario.innerText = `$${newBet.wager} from Bet #${newBet.betNumber} on ${newBet.team}`
            scenario1Loss.appendChild(losingScenario);
        }

        // Add a line in the bet preview with the bet data.
        let previewSpot = document.querySelector('#bet-preview');
        let newPreview = document.createElement('p');
        newPreview.className = 'preview-sentence';
        newPreview.innerText = `Bet #${betNumber}: ` + newBet.betSummary();
        previewSpot.append(newPreview);
    }


}


class Store {
    static refreshOddsData() {
        let sports = ['mlb', 'nba', 'nhl'];
        let odds = [];
        return fetchDataFromAPI(sports)
            .then((res) => {
                res.forEach((arrayOfMatchups) => {
                    arrayOfMatchups.forEach(matchup => {
                        odds.push(matchup);
                    })
                })
                localStorage.setItem('odds', JSON.stringify(odds));
            });
    }


    // For each matchup
                // For each Arbitrage opportunity in that matchup,
                    // Declare a new Arbitrage object
                        // For each of the two bets in that Arbitrage
                            // Instantiate two new SingleBet objects.
                            // Instantiate ArbitrageBet object with these two bets.
                // Instantiate a new Matchup object.
            
            // Return an array of all instantiated Matchups, with instantiated ArbitrageBets and Single Bets within them.
    static getMatchupObjects() {
        let storedData = localStorage.getItem('odds');
        let odds;
        let instantiatedMatchupObjects = [];
        
        if(storedData) {
            odds = JSON.parse(storedData);
            odds.forEach(matchup => {
                if(matchup.arbitrageBets.length) {
                    //console.log(arbitrageInMatchup);
                    let profitMaxBet1 = matchup.arbitrageBets[1].largestMaximumProfit[0].betOnTeam1;
                    let profitMaxBet2 = matchup.arbitrageBets[1].largestMaximumProfit[0].betOnTeam2;
                    let profitArbBet1 = new SingleBet(
                            profitMaxBet1.betAmount,
                            profitMaxBet1.team,
                            profitMaxBet1.sportsbook,
                            profitMaxBet1.oddsString,
                            profitMaxBet1.integerOdds
                        )
                    let profitArbBet2 = new SingleBet(
                            profitMaxBet2.betAmount,
                            profitMaxBet2.team,
                            profitMaxBet2.sportsbook,
                            profitMaxBet2.oddsString,
                            profitMaxBet2.integerOdds
                        )

                    let minVarBet1 = matchup.arbitrageBets[0].largestMinimumProfit[0].betOnTeam1;
                    let minVarBet2 = matchup.arbitrageBets[0].largestMinimumProfit[0].betOnTeam2;
                    let minVarArbBet1 = new SingleBet(
                            minVarBet1.betAmount,
                            minVarBet1.team,
                            minVarBet1.sportsbook,
                            minVarBet1.oddsString,
                            minVarBet1.integerOdds
                        )
                    let minVarArbBet2 = new SingleBet(
                            minVarBet2.betAmount,
                            minVarBet2.team,
                            minVarBet2.sportsbook,
                            minVarBet2.oddsString,
                            minVarBet2.integerOdds
                        )

                    let profitMaxArb = new ArbitrageBet(profitArbBet1, profitArbBet2);
                    let minVarArb = new ArbitrageBet(minVarArbBet1, minVarArbBet2)


                    let matchupWithArb = new Matchup(
                            matchup.sport,
                            matchup.team_1,
                            matchup.team_2,
                            matchup.match_datetime,
                            matchup.match_odds,
                            [
                                {
                                    largestMinimumProfit: minVarArb
                                },
                                {
                                    largestMaximumProfit:profitMaxArb
                                }
                            ]
                    )
                   
                    instantiatedMatchupObjects.push(matchupWithArb)
                } else {
                    let matchupWithoutArb = new Matchup(
                        matchup.sport,
                        matchup.team_1,
                        matchup.team_2,
                        matchup.match_datetime,
                        matchup.match_odds,
                        []
                        )
                    instantiatedMatchupObjects.push(matchupWithoutArb)
                }
                
            })
            
        } 
        return instantiatedMatchupObjects
    }
}


class utils {
    static getSportSelections() {
        let cards = document.querySelectorAll('.sport-search-card');
        let selections = [];
        for (let i=0; i<cards.length; i++) {
            if (cards[i].classList.contains('sport-selected')) {
                selections.push(cards[i].id);
            }
        }
        return selections;
    }


    static getTeamIcons(matchup) {
        // Return [team1 image url, team2 image url]
        let prefix = `./static/images/${matchup.sport}-team-logos/`;
        let fileName1 = `${matchup.team_1}.png`
        let fileName2 = `${matchup.team_2}.png`
        let teamIconFilenames = [prefix+fileName1, prefix+fileName2]
        return teamIconFilenames;
    }


    static oddsStringToInteger(oddString) {
        // Remove the first character.  If it is -, 
        // return the rest of the string to num * -1,
        // else, return the rest of the string to num
        if (/^[-+]?(\d+|Infinity)$/.test(oddString)) {
            return Number(oddString)
          } else {
            return NaN
          }
    }
}


class Matchup {
    constructor(sport, team_1, team_2, match_datetime, match_odds, arbitrageBets) {
        this.sport = sport;
        this.team_1 = team_1;
        this.team_2 = team_2;
        this.match_datetime = match_datetime;
        this.match_odds = match_odds;
        this.arbitrageBets = arbitrageBets; //array of Arbitrage objects
    }

    hasArbitrage() {
        if(this.arbitrageBets.length > 0){
            return true
        } else {
            return false
        }
    }

    minimumGuaranteedProfit() {
        if(this.hasArbitrage()) {
            return this.arbitrageBets[0].largestMinimumProfit.getMinimumProfit().toFixed(0)
        } else {
            return -1
        }
    }

    arbitrageWithMinimumGuaranteedProfit() {
        if(this.hasArbitrage()) {
            return this.arbitrageBets[0].largestMinimumProfit
        } else {
            return 'N/A'
        }
    }

    maximumPotentialProfit() {
        if(this.hasArbitrage()) {
            return this.arbitrageBets[1].largestMaximumProfit.getMaximumProfit().toFixed(0)
        } else {
            return -1
        }
    }

    arbitrageWithMaximumPotentialProfit() {
        if(this.hasArbitrage()) {
            return this.arbitrageBets[1].largestMaximumProfit
        } else {
            return 'N/A'
        }
    }

    arbitragePayoutSummary() {
        if(this.hasArbitrage()) {
            console.log(`For minimum guaranteed profit of $${this.minimumGuaranteedProfit()}`);
            console.log(`Bet $${this.arbitrageWithMinimumGuaranteedProfit().betOnTeam1.betAmount} on ${this.team_1} at ${this.arbitrageWithMinimumGuaranteedProfit().betOnTeam1.oddsString} from ${this.arbitrageWithMinimumGuaranteedProfit().betOnTeam1.sportsbook}`)
            console.log(`Bet $${this.arbitrageWithMinimumGuaranteedProfit().betOnTeam2.betAmount} on ${this.team_2} at ${this.arbitrageWithMinimumGuaranteedProfit().betOnTeam2.oddsString} from ${this.arbitrageWithMinimumGuaranteedProfit().betOnTeam2.sportsbook}`)

            console.log(`On ${this.team_1} win, net profit of $${this.arbitrageWithMinimumGuaranteedProfit().getProfitOnTeam1Win()} = $${this.arbitrageWithMinimumGuaranteedProfit().betOnTeam1.getWinnings()} - $${this.arbitrageWithMinimumGuaranteedProfit().betOnTeam1.betAmount} - $${this.arbitrageWithMinimumGuaranteedProfit().betOnTeam2.betAmount}`)
            console.log(`On ${this.team_2} win, net profit of $${this.arbitrageWithMinimumGuaranteedProfit().getProfitOnTeam2Win()} = $${this.arbitrageWithMinimumGuaranteedProfit().betOnTeam2.getWinnings()} - $${this.arbitrageWithMinimumGuaranteedProfit().betOnTeam2.betAmount} - $${this.arbitrageWithMinimumGuaranteedProfit().betOnTeam1.betAmount}`)        

            console.log('')
            console.log(`For maximum potential profit of $${this.maximumPotentialProfit()}`);
            console.log(`Bet $${this.arbitrageWithMaximumPotentialProfit().betOnTeam1.betAmount} on ${this.team_1} at ${this.arbitrageWithMaximumPotentialProfit().betOnTeam1.oddsString} from ${this.arbitrageWithMaximumPotentialProfit().betOnTeam1.sportsbook}`)
            console.log(`Bet $${this.arbitrageWithMaximumPotentialProfit().betOnTeam2.betAmount} on ${this.team_2} at ${this.arbitrageWithMaximumPotentialProfit().betOnTeam2.oddsString} from ${this.arbitrageWithMaximumPotentialProfit().betOnTeam2.sportsbook}`)
            console.log(`On ${this.team_1} win, net profit of $${this.arbitrageWithMaximumPotentialProfit().getProfitOnTeam1Win()} = $${this.arbitrageWithMaximumPotentialProfit().betOnTeam1.getWinnings()} - $${this.arbitrageWithMaximumPotentialProfit().betOnTeam1.betAmount} - $${this.arbitrageWithMaximumPotentialProfit().betOnTeam2.betAmount}`)
            console.log(`On ${this.team_2} win, net profit of $${this.arbitrageWithMaximumPotentialProfit().getProfitOnTeam2Win()} = $${this.arbitrageWithMaximumPotentialProfit().betOnTeam2.getWinnings()} - $${this.arbitrageWithMaximumPotentialProfit().betOnTeam2.betAmount} - $${this.arbitrageWithMaximumPotentialProfit().betOnTeam1.betAmount}`)        
        
        }
    }
}


class ArbitrageBet {
    // An ArbitrageBet is comprised of two SingleBet objects.
    // One bet on each team winning.
    constructor(betOnTeam1, betOnTeam2) {
        this.betOnTeam1=betOnTeam1;
        this.betOnTeam2=betOnTeam2;
    }

    getMM1() {
        // The factor by which your original bet is multiplied if it wins.
        return this.betOnTeam1.getMM()

    }

    getMM2() {
        // The factor by which your original bet is multiplied if it wins.
        return this.betOnTeam2.getMM()
    }

    getWinningsOnTeam1Win() {
        // The total amount paid out - the original bet amount.
        return this.betOnTeam1.getWinnings()
    }

    getProfitOnTeam1Win() {
        // The profit on the winning bet - the lost $$ from the bet that loses.
        return this.betOnTeam1.getProfit() - this.betOnTeam2.betAmount
    }

    getWinningsOnTeam2Win() {
        // The total amount paid out - the original bet amount.
        return this.betOnTeam2.getWinnings()
    }

    getProfitOnTeam2Win() {
        // The profit on the winning bet - the lost $$ from the bet that loses.
        return this.betOnTeam2.getProfit() - this.betOnTeam1.betAmount
    }

    getExpectedProfit() {
        // The average profit from an arbitrage opportunity.  Assumes 50% chance of winning for both teams.
        return ((this.getProfitOnTeam1Win() + this.getProfitOnTeam2Win()) / 2)
    }

    getExpectedROI() {
        // The % return on the total amount wagered.
        return ((((this.betOnTeam1.betAmount + this.betOnTeam2.betAmount) + this.getExpectedProfit()) / (this.betOnTeam1.betAmount + this.betOnTeam2.betAmount)) - 1) * 100;
    }

    getMinimumProfit() {
        // Returns the minimum profit that could be earned on an arbitrage bet.
        if(this.getProfitOnTeam1Win() > this.getProfitOnTeam2Win()) {
            return this.getProfitOnTeam2Win()
        } else {
            return this.getProfitOnTeam1Win()
        }
    }

    getMaximumProfit() {
        // Returns the maximum profit that could be earned on an arbitrage bet.
        if(this.getProfitOnTeam1Win() > this.getProfitOnTeam2Win()) {
            return this.getProfitOnTeam1Win()
        } else {
            return this.getProfitOnTeam2Win()
        }
    }

    getVariance() {
        // Return the positive $ difference between the profit if team 1 wins and the profit if team 2 wins.
        if(this.getProfitOnTeam1Win() > this.getProfitOnTeam2Win()) {
            return this.getProfitOnTeam1Win() - this.getProfitOnTeam2Win()
        } else {
            return this.getProfitOnTeam2Win() - this.getProfitOnTeam1Win()
        }
    }
}


class SingleBet {
    constructor(betAmount, team, sportsbook, oddsString, integerOdds) {
        this.betAmount=betAmount;
        this.team=team;
        this.sportsbook=sportsbook;
        this.oddsString=oddsString;
        this.integerOdds=integerOdds;
    }

    getMM() {
        // The Money Multiplier for the bet.  The factor by which your original bet is multiplied if it wins.

        if(this.integerOdds < 0) {
            return (Math.abs(this.integerOdds) + 100) / Math.abs(this.integerOdds)
        }
        else {
            return (100 + this.integerOdds) / 100
        }
    }

    getLoss() {
        return this.betAmount
    }

    getWinnings() {
        // Total $ amount returned to bettor on bet win.
        return this.betAmount * this.getMM()
    }

    getProfit() {
        // The profit on a won bet ie the winnings minus the original bet amount.
        return this.getWinnings() - this.betAmount
    }

    getROI() {
        // The % ROI on the original wager amount.
        return ((this.getWinnings() / this.betAmount) - 1) * 100
    }

    betSummary() {
        return `$${this.betAmount} bet on ${this.team} at ${this.oddsString} odds from ${this.sportsbook}.`
    }
}