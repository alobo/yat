var constants = require('./constants');

var nodemailer = require("nodemailer");
var smtpTransport = nodemailer.createTransport();
var _ = require('underscore');


//Add format() to the String prototype
if (!String.prototype.format) {
  String.prototype.format = function() {
    var args = arguments;
    return this.replace(/{(\d+)}/g, function(match, number) { 
      return typeof args[number] != 'undefined'
        ? args[number]
        : match
      ;
    });
  };
}

exports.sendInvitation = function(recipients) {
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

        invitationString += '<br><br> Cheers, <br> The Yat Platform';


        var mailOptions = {
            from: "Yat Confirmation <" + constants.YAT_EMAIL + ">", // sender address
            to: self.email, // list of receivers
            subject: "Yat Confirmation", // Subject line
            text: invitationString,
            html: invitationString
        }

        // send mail with defined transport object
        smtpTransport.sendMail(mailOptions, function(error, response){
            if(error){
                console.log(error);
            }else{
                console.log("Message sent: " + response.message);
            }
        });

    });
}

exports.close = function() {
    smtpTransport.close(); // shut down the connection pool, no more messages   
}
