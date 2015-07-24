var constants = require('./constants'),
    _ = require('underscore'),
    express = require('express'),
    bodyParser = require('body-parser'),
    multipart = require('connect-multiparty'),
    mongoose = require('mongoose'),
    Event = require('./models/event.js'),
    Recipient = require('./models/recipient.js'),
    emailParser = require('./emailParser.js'),
    emailSender = require('./emailSender.js'),

    app = express(),
    db = mongoose.connection,
    Schema = mongoose.Schema;


// Setup app
app.use(express.static('public'));
app.use(multipart());
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
app.use(function(req, res, next) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With, content-type');
  res.setHeader('Access-Control-Allow-Credentials', true);
  next();
});

// Setup database connection
db.on('error', console.log);
db.once('open', function() {
  console.log('Connected to mongodb');
});
mongoose.connect(constants.MONGODB_URL);


// Setup endpoints
app.get('/', function(req, res) {
  res.send('Welcome!');
});

app.get('/recipient/:id', function(req, res) {
  console.log('get recipient', req.params.id);

  Recipient.findById(req.params.id, function(err, recipient) {
  	if (err) return console.log(err);
  	return res.send(recipient).end();
  });
});

app.post('/recipient/:id', function(req, res) {
	Recipient.findById(req.params.id, function(err, recipient) {
		recipient.lat = req.body.lat;
	    recipient.lng = req.body.lng;

	    console.log('recipient', recipient);

	    recipient.save(function (err) {
			if (err) console.log(err);
			  return res.send(recipient).end();
	    });
	});
});

app.get('/event/:id', function(req, res) {
	Event.findById(req.params.id, function(err, event) {
		if (err) return console.error(err);
		return res.send(event).end();
	});
});

app.get('/session/:recipientID', function(req, res) {
	Recipient.findById(req.params.recipientID, function(err, recipient) {
		if (err) return console.error(err);
		if (!recipient) {
			return res.send('no recipient').status(400).end();
		}
		Event.findById(recipient.eventID, function(err, event) {
			if (err) return console.error(err);
			Recipient.find({eventID: event.id}, function(err, recipients) {
				if (err) return console.error(err);
				return res.status(200).send({
					event: event,
					recipient: recipient,
					recipients: recipients
				}).end();
			});
		});
	});
});

app.post('/event', function(req, res) {
	// Create event
  console.log('req body', req.body);

	var eventFields = {
		name: req.body.subject,
		date: new Date()
	};

	var host = req.body.from;
	var formattedHost = formatNameAndEmail(host);
	formattedHost.isHost = true;

	var to_array = req.body.to.split(',');
	var recipients = _(to_array).map(formatNameAndEmail);
	recipients.push(formattedHost);

	// Parses email and updates database
  emailParser.parseEmail(req.body.text, function(output) {
  	if (output.lat && output.lng) {
  		eventFields.lat = output.lat;
  		eventFields.lng = output.lng;
  	}

    if (output.date) eventFields.eventTime = output.date;
    if (output.address) eventFields.address = output.address;
    if (output.city) eventFields.city = output.city;
    if (output.wantFood) eventFields.wantFood = output.wantFood;

  	console.log('eventFields', eventFields);

  	var complete = _.after(recipients.length, function() {
  		emailSender.sendInvitation(savedRecipients, event);

  		res.send({
  			event: event,
  			recipients: savedRecipients
  		});
  		res.status(200).end();
  	});

  	var savedRecipients = [];
  	// Saves to database
  	var event = new Event(eventFields);
  	event.save(function (err, r) {
  		if (err) return console.error(err);

  		_(recipients).each(function(recipient) {
  			var recipientDB = new Recipient({
  				name: recipient.name,
  				email: recipient.email,
  				isHost: recipient.isHost,
  				eventID: r.id
  			});
  			recipientDB.save(function(err, res) {
  				if (err) return console.error(err);
  				savedRecipients.push(res);
  				complete();
  			});
  		});
  	});
  });

  function formatNameAndEmail(str) {
  	if (str.indexOf('<') >= 0) {
  		var name = str.match(/.*(?=<)/g);
  		var email = str.match(/<(.*)>/);
  		return {
  			name: name[0].trim(),
  			email: email[1].trim()
  		}
  	} else {
  		var name = str.match(/.*(?=@)/g);
  		return {
  			name: name[0].trim(),
  			email: str.trim()
  		}
  	}
  }

});

var server = app.listen(process.env.PORT || 5000, function() {
    console.log('Listening on port %d', server.address().port);
});
