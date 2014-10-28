var constants = require('./constants');

var http = require('http');
var result = {}
var callback = null;

exports.buildEmailData = function(eventDetails, cB) {
    callback = cB;
    checkPrecipitation(eventDetails);
}

function checkPrecipitation(eventDetails) {

    var url = 'http://api.openweathermap.org/data/2.5/weather?lat=' + eventDetails.lat + '&lon=' + eventDetails.lng;

    http.get(url, function(res) {
        var body = '';

        res.on('data', function(chunk) {
            body += chunk;
        });

        res.on('end', function() {
            var resp = JSON.parse(body)
            console.log("Got response: ", resp);
            if(resp && resp.weather && resp.weather.length > 0) {

                if (resp.weather && resp.weather.length > 0) {
                    result.weatherDescription = resp.weather[0].description;
                }

                if (resp.main && resp.main.temp) {
                    result.temperature = Math.round((resp.main.temp - 273.15)* 1.8000 + 32.00);
                }
            }

            checkFood(eventDetails);

        });
    }).on('error', function(e) {
        console.log("Got error: ", e);        
        checkFood(eventDetails);
    });
}

function checkFood(eventDetails) {

    console.log('Want Food', eventDetails.wantFood);

    if (eventDetails.wantFood) {

        var yelp = require("yelp").createClient({
            consumer_key: constants.YELP_CONSUMER_KEY, 
            consumer_secret: constants.YELP_CONSUMER_SECRET,
            token: constants.YELP_TOKEN,
            token_secret: constants.YELP_TOKEN_SECRET
        });

        // See http://www.yelp.com/developers/documentation/v2/search_api
        //TODO: Add latitide + longitude here
        yelp.search({term: "food", location: eventDetails.city, limit: 3, sort: 2, radius_filter: 1500}, function(error, data) {
            if(error) console.log('ERROR', error);
            console.log('Yelp', data);

            if(data && data.businesses && data.businesses.length >= 3) {
                result.food = [data.businesses[0], data.businesses[1], data.businesses[2]];
            }

            callback(result);
        });
    } else {
        callback(result);
    }
}