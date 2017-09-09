
// 1. Text strings =====================================================================================================
//    Modify these strings and messages to change the behavior of your Lambda function

const languageStrings = {
    'en': {
        'translation': {
            'WELCOME' : "Welcome to Recipe buddy",
            'HELP'    : "What do you have in your fridge. You can say bacon, eggs, potato",
            'ABOUT'   : "Recipe buddy look for recipes in the internet based on you ingredient list that you have in your fridge.",
            'STOP'    : "Okay, see you next time!"
        }
    }
    // , 'de-DE': { 'translation' : { 'TITLE'   : "Local Helfer etc." } }
};
const data = {
    "city"        : "Gloucester",
    "state"       : "MA",
    "postcode"    : "01930",
    "restaurants" : [
        { "name":"Zeke's Place",
            "address":"66 East Main Street", "phone": "978-283-0474",
            "meals": "breakfast, lunch",
            "description": "A cozy and popular spot for breakfast.  Try the blueberry french toast!"
        }

    ],
    "attractions":[
        {
            "name": "Fenway Park",
            "description": "Home of the Boston Red Sox, Fenway park hosts baseball games From April until October, and is open for tours. ",
            "distance": "38"
        }
    ]
}

const SKILL_NAME = "Recipe buddy";

// Weather courtesy of the Yahoo Weather API.
// This free API recommends no more than 2000 calls per day


// 2. Skill Code =======================================================================================================

const Alexa = require('alexa-sdk');

exports.handler = function(event, context, callback) {
    var alexa = Alexa.handler(event, context);

    // alexa.appId = 'amzn1.echo-sdk-ams.app.1234';
    ///alexa.dynamoDBTableName = 'YourTableName'; // creates new table for session.attributes
    alexa.resources = languageStrings;
    alexa.registerHandlers(handlers);
    alexa.execute();
};

const handlers = {
    'LaunchRequest': function () {
        var say = this.t('WELCOME') + ' ' + this.t('HELP');
        this.response.speak(say).listen(say);
        this.emit(':responseReady');
    },

    'AboutIntent': function () {
        this.response.speak(this.t('ABOUT'));
        this.emit(':responseReady');
    },
    'IngredientIntent': function () {

        var ingredient = this.event.request.intent.slots.ingredient.value;
        var old = this.attributes['ingredients'];

        if (old == null) {
            old = [ingredient];
         } else {
          old.push(ingredient);
         }

        this.attributes['ingredients'] = old;

        var say = 'Ok. I have added ' + ingredient + ' to the list. You have ' + old.length + ' items in total. What else do you have?';
        this.response.speak(say).listen(say);
        this.emit(':responseReady');
    },

    'SearchRecipeIntent': function () {
        var allIngs = this.attributes['ingredients'].toString();

        recipeSearch(allIngs, (json) => {




                var recipes = JSON.stringify(json);
                var say = 'Searching for recipes with ' + allIngs + '... I have found ' + json.length + ' different recipes. Do you want to hear the first recipe?';
                this.response.speak(say).listen(say);
                this.attributes['json'] = json;
                this.attributes['lastNumber'] = 0;
                this.emit(':responseReady');

        });
        
    },

    'NextRecipeIntent': function() {
        var lastNumber = this.attributes['lastNumber'];
        var next = lastNumber + 1
        this.attributes['lastNumber'] = next;
        var json = this.attributes['json'];
        var title = json[next].title;
        var ingredients = json[next].ingredients;
        var say = 'Here is recipe number ' + next + ' It is  ' + title +  '. The ingredients you will need are ' + ingredients + '... Do you want to listen for the next one?';

        this.response.speak(say).listen(say);
        this.emit(':responseReady');
    },


    'FinishRecipeIntent': function() {
        var lastNumber = this.attributes['lastNumber'];
        var say = 'We have sent link to recipe number ' + lastNumber + ' to your mobile phone. Bon appetite!';
        this.response.speak(say).listen(say);
        this.emit(':responseReady');
    },

    'AMAZON.YesIntent': function () {
        this.emit('NextRecipeIntent');
    },

    'AMAZON.NoIntent': function () {
        this.emit('FinishRecipeIntent');
    },
    'AMAZON.HelpIntent': function () {
        this.response.speak(this.t('HELP')).listen(this.t('HELP'));
        this.emit(':responseReady');
    },
    'AMAZON.CancelIntent': function () {
        this.response.speak(this.t('STOP'));
        this.emit(':responseReady');
    },
    'AMAZON.StopIntent': function () {
        this.emit('SessionEndedRequest');
    },
    'SessionEndedRequest': function () {
        this.response.speak(this.t('STOP'));
        this.emit(':responseReady');
    }

};

//    END of Intent Handlers {} ========================================================================================
// 3. Helper Function  =================================================================================================


function recipeSearch(allIngs, callback) {
    var http = require('http');

    var req = http.request({
        host: 'www.recipepuppy.com',
        port: 80,
        path: '/api/?i='+allIngs,
        method: 'GET'
    }, res => {
        res.setEncoding('utf8');
        var returnData = "";

        res.on('data', chunk => {
            returnData = returnData + chunk;
        });
        res.on('end', () => {
            var json = JSON.parse(returnData);
            callback(json.results);
        });

    });
    req.end();
}
function randomArrayElement(array) {
    var i = 0;
    i = Math.floor(Math.random() * array.length);
    return(array[i]);
}