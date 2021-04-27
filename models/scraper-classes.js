// CLASS DEFINITIONS

module.exports = class Matchup {
    constructor(sport, team_1, team_2, match_datetime, match_odds) {
        this.sport = sport;
        this.team_1 = team_1;
        this.team_2 = team_2;
        this.match_datetime = match_datetime;
        this.match_odds = match_odds;
        // Attrbibute which holds all Arbitrage objects.
        //this.arbitrage_opportunities = arbChecker(sport, team_1, team_2, match_odds);
        this.arbitrageBets = this.checkForArbitrage()
        /*
        this.arbitrageExistsinMatchup = function() {
            if(this.arbitrage_opportunities.length > 0) {
                return true
            } else {
                return false
            }
        };
    

        this.getBestArbitrage = function() {
            if(this.arbitrageExistsinMatchup()) {
                let bestArbObject;
                let leadingArb = 0;
                this.arbitrage_opportunities.forEach((arbOpp) => {
                    if(arbOpp.getExpectedROI() > leadingArb) {
                        bestArbObject = arbOpp;
                        leadingArb = arbOpp.get_expected_ROI;
                    }
                })
                return bestArbObject;
            }
        }
        */
    }

    
    arbitrageExistsinMatchup() {
        if(this.arbitrage_opportunities.length > 0) {
            return true
        } else {
            return false
        }
    };

    getBestArbitrage() {
        if (this.arbitrageExistsinMatchup()) {
            let bestArbObject;
            let leadingArb = 0;
            for(let i=0; i<this.arbitrage_opportunities.length; i++) {
                if(this.arbitrage_opportunities[i].getExpectedROI() > leadingArb) {
                    bestArbObject = this.arbitrage_opportunities[i];
                    leadingArb = bestArbObject.getExpectedROI();
                }
            }
            return bestArbObject;
        }
    };

    // This gets the highest potential profiting Arbitrage opportunity and 
    // the lowest variance Arbitrage Opportunity for each sportsbook combo.
    // To get the best ones in total across all combos, further calculation is required.
    checkForArbitrage() {
        // Call on a matchup to get the 
        let highestPotentialProfitArbitrage;
        let highestPotentialProfit = 0;
        let minimumVarianceArbitrage;
        let minimumVariance = 10000;
        let largestMinimumProfitArbitrage;
        let largestMinimumProfit = 0;
        for (let book1 in this.match_odds[0]) {
            for(let i=0; i<2; i++) {
                let team1OddsString = match_odds[0][book1][i];
                let team1IntegerOdds = oddsStringToInteger(team1OddsString);
                for(let book2 in this.match_odds[0]) {
                    let team2OddsString = match_odds[0][book2][1-i];
                    let team2IntegerOdds = oddsStringToInteger(team2OddsString);
                    // This is the point where we loop through every possible sportsbook combo.
                    // Don't bother comparing firsts and seconds at the same book.
                    
                    if (book1 != book2) {
                        let leadingHighestProfitArbForBookCombo; // this is the object with the highest possible profit.
                        let leadingHighestProfitForBookCombo = 0; // this is its possible profit.

                        let leadingMinimumVarianceArbForBookCombo; // this is the object with the minimum variance.
                        let leadingMinimumVarianceForBookCombo = 10000; // this is its variance.

                        let singleComboLargestMinimumProfitArbitrage;
                        let singleComboLargestMinimumProfit = 0;
                        

                        //console.log(`Checking combo: ${book1} and ${book2}`);
                        for(let bet1Amount=10; bet1Amount<500; bet1Amount+=10) {
                            for(let bet2Amount=10; bet2Amount<500; bet2Amount+=10) {
                                // This is the point where we loop through every possible bet amount combo.

                                // If arb conditions are met, create a new Arbitrage object
                                if (arbitrageExists(bet1Amount, team1IntegerOdds, bet2Amount, team2IntegerOdds)) {
                                    let singleBet1 = new SingleBet(bet1Amount, this.team_1, book1, team1OddsString)
                                    let singleBet2 = new SingleBet(bet2Amount, this.team_2, book2, team2OddsString)
                                    let newArb = new ArbitrageBet(singleBet1, singleBet2)
                                    //console.log(newArb);

                                    let newArbHighestProfit = newArb.getMaximumProfit()
                                    let newArbVariance = newArb.getVariance()

                                    let newArbMinimumProfit = newArb.getMinimumProfit();
                                    
                                    if(newArbHighestProfit > leadingHighestProfitForBookCombo) {
                                        leadingHighestProfitArbForBookCombo = newArb;
                                        leadingHighestProfitForBookCombo = newArbHighestProfit
                                    }

                                    if(newArbVariance < leadingMinimumVarianceForBookCombo) {
                                        leadingMinimumVarianceArbForBookCombo = newArb;
                                        leadingMinimumVarianceForBookCombo = newArbVariance
                                    }

                                    if(newArbMinimumProfit > singleComboLargestMinimumProfit) {
                                        singleComboLargestMinimumProfitArbitrage = newArb;
                                        singleComboLargestMinimumProfit = newArbMinimumProfit;
                                    }

                                    if(leadingHighestProfitForBookCombo > highestPotentialProfit) {
                                        highestPotentialProfitArbitrage = leadingHighestProfitArbForBookCombo;
                                        highestPotentialProfit = leadingHighestProfitForBookCombo
                                    }
            
                                    if(leadingMinimumVarianceForBookCombo < minimumVariance) {
                                        minimumVarianceArbitrage = leadingMinimumVarianceArbForBookCombo;
                                        minimumVariance = leadingMinimumVarianceForBookCombo
                                    }

                                    if(singleComboLargestMinimumProfit > largestMinimumProfit) {
                                        largestMinimumProfitArbitrage = singleComboLargestMinimumProfitArbitrage;
                                        largestMinimumProfit = singleComboLargestMinimumProfit;
                                    }
                                    //arrayOfArbOpps.push(arbOpp);
                                }
                            }
                        }
                        // This is the end of a combo. Here, check if the combo figures are better than overall figures.
                        
                        
                    }

                }
            }
        }
        if(largestMinimumProfitArbitrage && highestPotentialProfitArbitrage) {
            let arbitrageOpportunities = [
                {
                    largestMinimumProfit: [largestMinimumProfitArbitrage]
                },
                {
                    largestMaximumProfit:[highestPotentialProfitArbitrage]
                }
            ]    
            return arbitrageOpportunities;
        } else {
            return []
        }
    }
    
}

class SingleBet {
    constructor(betAmount, team, sportsbook, oddsString) {
        this.betAmount=betAmount;
        this.team=team;
        this.sportsbook=sportsbook;
        this.oddsString=oddsString;
        this.integerOdds=oddsStringToInteger(oddsString); // Convert the +xxx or -xxx string to an integer using RegEx.
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

class ArbitrageBet {
    // An Arbitrage Bet is comprised of two individial bets. One bet on each team winning.
    // The arguments are both SingleBet objects.
    constructor(betOnTeam1, betOnTeam2) {
        this.betOnTeam1=betOnTeam1;
        this.betOnTeam2=betOnTeam2;
    }

    getMM1() {
        // The Money Multiplier for team 1.  The factor by which your original bet is multiplied if it wins.
        return this.betOnTeam1.getMM()

    }

    getMM2() {
        // The Money Multiplier for team 2.  The factor by which your original bet is multiplied if it wins.
        return this.betOnTeam2.getMM()
    }

    getWinningsOnTeam1Win() {
        // The total amount paid out - the original bet amount.  Essentially the profit on the standalone bet.
        return this.betOnTeam1.getWinnings()
    }

    getProfitOnTeam1Win() {
        // The profit on the winning bet - the lost $$ from the bet that loses.
        return this.betOnTeam1.getProfit() - this.betOnTeam2.betAmount
    }

    getWinningsOnTeam2Win() {
        // The total amount paid out - the original bet amount.  Essentially the profit on the standalone bet.
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

    getMaximumProfit() {
        // Returns the maximum profit that could be earned on an arbitrage bet.
        if(this.getProfitOnTeam1Win() > this.getProfitOnTeam2Win()) {
            return this.getProfitOnTeam1Win()
        } else {
            return this.getProfitOnTeam2Win()
        }
    }

    getMinimumProfit() {
        // Returns the maximum profit that could be earned on an arbitrage bet.
        if(this.getProfitOnTeam1Win() > this.getProfitOnTeam2Win()) {
            return this.getProfitOnTeam2Win()
        } else {
            return this.getProfitOnTeam1Win()
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


class Arbitrage {
    constructor(sport, betOnTeam1, team_1, book1, oddsForTeam1AtBook1, betOnTeam2, team_2, book2, oddsForTeam2AtBook2) {
        this.sport = sport;
        this.betOnTeam1 = betOnTeam1;
        this.team_1 = team_1;
        this.book1 = book1;
        this.oddsForTeam1AtBook1 = oddsForTeam1AtBook1;
        this.betOnTeam2 = betOnTeam2;
        this.team_2 = team_2;
        this.book2 = book2;
        this.oddsForTeam2AtBook2 = oddsForTeam2AtBook2;
        /*
        this.getExpectedROI = function() {
            let mm1;
            let mm2;
            let odds1 = this.oddsForTeam1AtBook1
            let odds2 = this.oddsForTeam2AtBook2
            let bet1 = this.betOnTeam1;
            let bet2 = this.betOnTeam2;
            if(odds1 < 0) {
                mm1 = (Math.abs(odds1) + 100) / Math.abs(odds1)
            }
            else {mm1 = (100 + odds1) / 100}

            if(odds2 < 0) {
                mm2 = (Math.abs(odds2) + 100) / Math.abs(odds2)
            }
            else {mm2 = (100 + odds2) / 100}

            let winningsOnT1Win = (bet1 * mm1) - bet1;
            let profitOnT1Win = winningsOnT1Win - bet2;

            let winningsOnT2Win = (bet2 * mm2) - bet2;
            let profitOnT2Win = winningsOnT2Win - bet1;

            let expectedProfit = ((profitOnT1Win + profitOnT2Win) / 2)
            let expectedReturn = ((((bet1 + bet2) + expectedProfit) / (bet1 + bet2)) - 1) *100;

            return expectedReturn
        }
        */
    }

    
    getExpectedROI() {
        let mm1;
        let mm2;
        let odds1 = this.oddsForTeam1AtBook1
        let odds2 = this.oddsForTeam2AtBook2
        let bet1 = this.betOnTeam1;
        let bet2 = this.betOnTeam2;

        if(odds1 < 0) {
            mm1 = (Math.abs(odds1) + 100) / Math.abs(odds1)
        }
        else {mm1 = (100 + odds1) / 100}

        if(odds2 < 0) {
            mm2 = (Math.abs(odds2) + 100) / Math.abs(odds2)
        }
        else {mm2 = (100 + odds2) / 100}

        let winningsOnT1Win = (bet1 * mm1) - bet1;
        let profitOnT1Win = winningsOnT1Win - bet2;

        let winningsOnT2Win = (bet2 * mm2) - bet2;
        let profitOnT2Win = winningsOnT2Win - bet1;

        let expectedProfit = ((profitOnT1Win + profitOnT2Win) / 2)
        let expectedReturn = ((((bet1 + bet2) + expectedProfit) / (bet1 + bet2)) - 1) *100;

        return expectedReturn
    }
    
}

// This will always be called on a Matchup object.
function arbChecker(sport, team_1, team_2, match_odds) {
    let arrayOfArbOpps = [];
    for (const book1 in match_odds[0]) {
        for(let i=0; i<2; i++) {
            let first = oddsStringToInteger(match_odds[0][book1][i]);
            for(const book2 in match_odds[0]) {
                let second = oddsStringToInteger(match_odds[0][book2][1-i]);
                // This is the point where we loop through every possible sportsbook combo.
                // Don't bother comparing firsts and seconds at the same book.
                
                if (book1 != book2) {
                    let highestROIArb; // this is the object with the highest ROI
                    let leadingROI = 0; // this is its ROI.
                    //console.log(`Checking combo: ${book1} and ${book2}`);
                    for(let i=10; i<500; i+=10) {
                        for(let j=10; j<500; j+=10) {
                            // This is the point where we loop through every possible bet amount combo.

                            // If arb conditions are met, create a new Arbitrage object
                            if (arbitrageExists(bet1=i, odds1=first, bet2=j, odds2=second)) {
                                let arbOpp = new Arbitrage(sport, i, team_1, book1, first, j, team_2, book2, second)
                                let currentArbsROI = arbOpp.getExpectedROI();
                                if(currentArbsROI > leadingROI) {
                                    leadingROI = currentArbsROI;
                                    highestROIArb = arbOpp
                                }
                                //arrayOfArbOpps.push(arbOpp);
                            }
                        }
                    }
                    if(highestROIArb) {
                        arrayOfArbOpps.push(highestROIArb);
                    }
                    
                }

            }
        }
    }
    return arrayOfArbOpps;
}

function arbitrageExists(bet1, odds1, bet2, odds2) {
    let mm1;
    let mm2;
    if(odds1 < 0) {
        mm1 = (Math.abs(odds1) + 100) / Math.abs(odds1)
    }
    else {mm1 = (100 + odds1) / 100}

    if(odds2 < 0) {
        mm2 = (Math.abs(odds2) + 100) / Math.abs(odds2)
    }
    else {mm2 = (100 + odds2) / 100}

    let winningsOnTeam1Win = (bet1 * mm1) - bet1;
    let profitOnTeam1Win = winningsOnTeam1Win - bet2;

    let winningsOnTeam2Win = (bet2 * mm2) - bet2;
    let profitOnTeam2Win = winningsOnTeam2Win - bet1;

    return ((profitOnTeam1Win > 0) && (profitOnTeam2Win > 0))
}

function oddsStringToInteger(oddString) {
    // Remove the first character.  If it is -, 
    // return the rest of the string to num * -1,
    // else, return the rest of the string to num

    if (/^[-+]?(\d+|Infinity)$/.test(oddString)) {
        return Number(oddString)
      } else {
        return NaN
      }
}