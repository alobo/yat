var nodemailer = require("nodemailer"),
    smtpTransport = nodemailer.createTransport(),
    _ = require('underscore');

var emailDataAggregator = require('./emailDataAggregator.js');

exports.sendInvitation = function(recipients, eventDetails) {
    console.log('LOOOG', emailDataAggregator);
    //Get relevent data from Yelp & OpenWeather then actually send emails
    emailDataAggregator.buildEmailData(eventDetails, function(output) { 
        console.log('Data Build Complete', output);
        doSend(recipients, eventDetails, output)
    });
}


function doSend(recipients, eventDetails, additionalDetails) {

    recipients.forEach(function(self) {
        var host = _(recipients).findWhere({isHost: true});

        var others = _(recipients).reject(function(r) {
            return (r._id == host._id || r._id == self._id);
        });
        if (host._id == self._id) host = null;

        var invitationString = 'Hi ' + self.name + ',<br><br>';
        if (host) {
            invitationString += '<strong>'+host.name + '</strong> invited you';

            if (others.length == 0) {
                //invitationString += ' and nobody';
            } else if (others.length == 1) {
                invitationString += ' and ' + others[0].name;
            } else {
                var last = others.pop();
                invitationString += ', ';
                var names = _.pluck(others, 'name');
                invitationString += names.join(', ');
                invitationString += ' and ' + last.name;
            }
            invitationString += ' to share your location';
            if (others.length != 1) invitationString += 's';
            invitationString += '.';
        } else {
            // You are host
            invitationString += 'You invited';

            if (others.length == 0) {
                invitationString += ' nobody';
            } else if (others.length == 1) {
                invitationString += ' ' + others[0].name;
            } else {
                var last = others.pop();
                invitationString += ' ';
                var names = _.pluck(others, 'name');
                invitationString += names.join(', ');
                invitationString += ' and ' + last.name;
            }
            invitationString += ' to share their location';
            if (others.length != 1) invitationString += 's';
            invitationString += '.';
        }

        invitationString += 
            '<br>'+
            '<a font-size="24px" href="@@_YATS_FRONT_END_@@/?recipient='+self._id+'">Click here to share your location</a>' + 
            '<br><br>';

        invitationString += '<b>Your Yat Briefing</b><br><br>';

        invitationString += 'The weather at your destination is ';
        invitationString += additionalDetails.temperature + '°F with '
        invitationString += additionalDetails.weatherDescription;
        invitationString += '.<br>';

        invitationString += "You mentioned you wanted to grab something to eat. Here are some popular restaurants near your destination:";
        invitationString += '<br>';

        additionalDetails.food.forEach(function(restaurant) {
            invitationString += '<a href="' + restaurant.mobile_url + '">';
            invitationString += restaurant.name;
            invitationString += "</a>";
            invitationString += "<br>";
        });

        invitationString += '<br>Cheers, <br> The Yat Platform';

        var mailOptions = {
            from: "Yat Meetup Confirmation <@@_YATS_EMAIL_@@>", // sender address
            to: self.email, // list of receivers
            subject: "Yat Confirmation", // Subject line
            text: invitationString,
            html: invitationString
        }

        // send mail with defined transport object
        smtpTransport.sendMail(mailOptions, function(error, response){
            if (error) return console.log(error);
            console.log("Message sent: " + response.message);
        });
    });
}

exports.close = function() {
    smtpTransport.close(); // shut down the connection pool, no more messages   
}