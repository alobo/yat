var WIT_API_KEY = "";
var GMAPS_API_KEY = "";

var wit = require('node-wit');
var result = {}
var callback;

exports.parseEmail = function(bodyText, cB) {
    callback = cB;
    checkFoodWanted(bodyText);
}

function checkFoodWanted(bodyText) {
    result.wantFood = (bodyText.toLowerCase().indexOf("breakfast") > -1 ||
                       bodyText.toLowerCase().indexOf("lunch") > -1 ||
                       bodyText.toLowerCase().indexOf("dinner") > -1 ||
                       bodyText.toLowerCase().indexOf("supper") > -1 ||
                       bodyText.toLowerCase().indexOf("food") > -1 ||
                       bodyText.toLowerCase().indexOf("eat") > -1 ||
                       bodyText.toLowerCase().indexOf("hungry") > -1);
    applyNLP(bodyText);
}

function applyNLP(bodyText) {    
    wit.captureTextIntent(WIT_API_KEY, bodyText, function (err, res) {
        // console.log("Response from Wit for text input: ");  
        if (err) return console.log("Error: ", err);
        // console.log(JSON.stringify(res, null, " "));

        if (res && res.outcomes && res.outcomes.length > 0) {
            if (res.outcomes[0].entities) {
                result.date = 0; //Should never be undefined
                
                //Handle null edge cases.
                if (res.outcomes[0].entities.location && res.outcomes[0].entities.location.length > 0) {
                    result.address = res.outcomes[0].entities.location[0].value;
                }
                if (res.outcomes[0].entities.datetime && res.outcomes[0].entities.datetime.length > 0 && res.outcomes[0].entities.datetime[0].value.from) {
                    result.date = Date.parse(res.outcomes[0].entities.datetime[0].value.from);
                }
            }
        }

        if (result.address) {
            getLatLng(result.address);
        } else {
            callback(result);            
        }
    });
}

function getLatLng(address) {
    var geocoderProvider = 'google';    
    var httpAdapter = 'https';
    var extra = {
        apiKey: GMAPS_API_KEY,
        formatter: null
    };

    var geocoder = require('node-geocoder').getGeocoder(geocoderProvider, httpAdapter, extra);

    // Using callback
    geocoder.geocode(address, function(err, res) {
        if(err) console.log('ERROR[emailParser]', err);
        if(res) {
            result.lat = res[0].latitude;
            result.lng = res[0].longitude;
            result.city = res[0].city;
            result.country = res[0].country;
            console.log(res);
        }

        callback(result);
    });
}