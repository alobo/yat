var API = 'http://yat.herokuapp.com';
var map, spinner;
var recipientID;

var pinkCircle = {
	url: '/images/pink-icon.png',
	size: new google.maps.Size(56, 56),
	origin: new google.maps.Point(0, 0),
	scaledSize: new google.maps.Size(28, 28),
	anchor: new google.maps.Point(14, 14)
};
var purpleCircle = _.clone(pinkCircle);
	purpleCircle.url = 'images/purple-icon.png';
var blueCircle = _.clone(pinkCircle);
	blueCircle.url = 'images/blue-icon.png';

var friendMarkers = [],
	myMarker = new google.maps.Marker({icon: blueCircle}),
	eventMarker = new google.maps.Marker({icon: pinkCircle});

google.maps.event.addListener(myMarker, 'click', function(e) {
	dialogController.dismissAllDialogs();
	dialogController.preventDismiss();
	setTimeout(function() {
		dialogController.allowDismiss()
	}, 0);
	dialogController.newDialog(StudentNamePopup, {
		name: 'student-name-popup',
		studentName: 'This is me',
	});
});

document.addEventListener('touchstart', function() {}, true);

$(document).ready(function () {
	// Validation
	recipientID = queryString.recipient;
    if (!recipientID) {
    	$('#no-recipient').show();
    	$('#overlay').hide();
    	return console.error('no recipientID ID');
    }

    // Load spinner
	var target = document.getElementById('overlay');
	spinner = new Spinner({width: 2}).spin(target);

	// Load map
	map = new google.maps.Map(document.getElementById('map'), {zoom: 14});
	map.set('styles', [
		{
			featureType: 'poi',
			elementType: 'labels',
			stylers: [
				{visibility: 'off'}
			]
		}
	]);
    google.maps.event.addListener(map, 'click', function (e) {
        //lat and lng is available in e object
        var latLng = e.latLng;
        console.log('latLng', latLng);
    });

	$.get(API + '/session/' + recipientID, function(r) {
		downloadComplete(r);
	});
});

function downloadComplete(r) {
	var event = r.event;

	console.log('r', r);

	dialogController.newDialog(WelcomeDialog, {
		name: 'welcome',
		event: event,
		eventName: event.name,
		eventDescription: event.description,
		recipient: r.recipient,
		recipients: r.recipients
	});

	var str = '<strong>' + event.name + '</strong>';
	if (event.address) str += '<br>Address: ' + event.address;
	if (event.eventTime) {
		var date = moment(event.eventTime);
		// var now = new Date().getTime();
		// var diff = event.eventTime - now;
		var timeStr = date.format('h:mm a');
		str += '<br>Time: ' + timeStr;// + ' ('+moment(diff).format('H:mm')+' remaining)';
	}

	if (event.lat && event.lng) {
		// Event marker
		eventMarker.setPosition({lat: event.lat, lng: event.lng});
		eventMarker.setMap(map);
	}

	google.maps.event.addListener(eventMarker, 'click', function() {
		dialogController.dismissAllDialogs();
		dialogController.preventDismiss();
		setTimeout(function() {
			dialogController.allowDismiss()
		}, 0);
		dialogController.newDialog(StudentNamePopup, {
			name: 'student-name-popup',
			studentName: str,
		});
	});

	// Get friends
	var others = _.reject(r.recipients, function(person) {
		return person._id == r.recipient._id;
	});

	initializeFriendPositions(others);

	setMyPosition();
	setInterval(function() {
		setMyPosition();
		setFriendPositions();
	}, 1000);

	ready();
}

function ready() {
	if (spinner) spinner.stop();
	$('#overlay').animate({
		opacity: 0
	}, 500, function() {
		$(this).remove();
	});
}

function clearFriendMarkers() {
	for (var i = 0; i < friendMarkers.length; i++) {
		friendMarkers[i].setMap(null);
	}
	friendMarkers = [];
}

function initializeFriendPositions(others) {
	friendMarkers = _(others).map(function(person) {
		var marker = new google.maps.Marker({
			map: map,
			icon: purpleCircle,
			id: person._id
		});

		google.maps.event.addListener(marker, 'click', function() {
			dialogController.dismissAllDialogs();
			dialogController.preventDismiss();
			setTimeout(function() {
				dialogController.allowDismiss()
			}, 0);
			dialogController.newDialog(StudentNamePopup, {
				name: 'student-name-popup',
				studentName: person.name,
			});
		});

		return marker;
	});

	setFriendPositions();
}

function setFriendPositions(friends) {
	var complete = function(friends) {
		_(friends).each(function(friend) {
			if (!friend.lat || !friend.lng) return;
			var marker = _(friendMarkers).findWhere({id: friend._id});
			marker.setPosition({
				lat: friend.lat,
				lng: friend.lng
			});
		});
	};
	if (friends) complete(friends);
	else if (friends != 'fail') {
		$.get(API + '/session/' + recipientID, function(r) {
			var friends = _.reject(r.recipients, function(person) {
				return person._id == r.recipient._id;
			});
			if (!friends) friends = 'fail';
			setFriendPositions(friends);
		});
	} else {
		console.log('fail');
	}
}

function setMyPosition() {
	console.log('setMyPosition');
	navigator.geolocation.getCurrentPosition(function(p) {
		var position = {
			lat: dig(p, 'coords.latitude'),
			lng: dig(p, 'coords.longitude')
		};

		if (myMarker.getPosition() != null) {
			// Existing marker
			var epsilon = 1e-4; // 11 meters
			var oldPosition = myMarker.getPosition();
			var latDiff = Math.abs(oldPosition.lat() - position.lat);
			var lngDiff = Math.abs(oldPosition.lng() - position.lng);

			if (latDiff < epsilon && lngDiff < epsilon) return;
		}

		myMarker.setMap(map);
		myMarker.setPosition(position);
		map.setCenter(position);

		$.post(API + '/recipient/' + recipientID, position, function(data) {
			console.log('post success', data);
		});
	});
}

function WelcomeDialog(opts) {
    var defaults = {
    	event: null,
    	eventName: 'Event',
    	recipients: null,
    	recipient: null,
    };
    if (opts === undefined) opts = defaults;
    for (key in defaults) if (!(key in opts)) opts[key] = defaults[key];
    
    
    /** Private Variables */
    var self = this,
    	event = opts.event,
    	recipient = opts.recipient,
    	recipients = opts.recipients,
    	view,
    	bg;
    	
    	
    /** Public Variables */
    this.view;

    /** Private Methods */
    /** Public Methods */	
    this.dismiss_async = function(dismissOpts, complete) {
    	bg.animate({
    		opacity: 0
    	}, 500, function() {
    		bg.remove();
	    	view.remove();
    		if (complete) complete();
    	});
    };
    this.render = function() {};
    
    
    /** Init */
    (function() {
    	bg = $('<div/>').appendTo('body').css({
    		position: 'absolute',
    		width: '100%',
    		height: '100%',
    		top: 0,
    		left: 0,
    		backgroundColor: 'rgba(0, 0, 0, 0.75)'
    	});

    	var host = _(recipients).findWhere({isHost: true});
    	var others = _(recipients).reject(function(r) {
    		return (r._id == host._id || r._id == recipient._id);
    	});
    	if (host._id == recipient._id) host = null;

    	var invitationString = '';
    	if (host) {
    		invitationString = '<strong>'+host.name + '</strong> invited you';

    		if (others.length == 0) {
    			invitationString += 'and nobody';
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
    		invitationString = 'You invited';

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

    	

    	self.view = view = $(
    		'<div class="welcome-dialog">'+
    			'<h1>Welcome to Yat</h1>'+
    			'<h2>'+opts.eventName+'</h2>'+
    			'<p>'+invitationString+'</p>'+
    			// '<p>'+opts.eventDescription+'</p>'+

    			'<p>'+
	    			'<img src="/images/pink-icon.png" width="28px" height="28px"/>'+event.address+'<br>'+
	    		'</p>'+
	    		'<p>'+
    				'<img src="/images/purple-icon.png" width="28px" height="28px"/>'+'Your Friends'+'<br>'+
    			'</p>'+
    			'<p>'+
    				'<img src="/images/blue-icon.png" width="28px" height="28px"/>'+'You'+
    			'</p>'+
    			'<a class="yat-btn">OK</a>'+
	    	'</div>'
    	);
    	view.appendTo(bg);

    	$('.yat-btn', view).click(function() {
    		if (self.close) self.close();
    	});
    })();
}

function StudentNamePopup(opts) {
    var defaults = {
    	studentName: null,
    };
    if (opts === undefined) opts = defaults;
    for (key in defaults) if (!(key in opts)) opts[key] = defaults[key];
    
    
    /** Private Variables */
    var self = this,
    	view;
    	
    	
    /** Public Variables */
    this.view;

    /** Private Methods */
    /** Public Methods */	
    this.dismiss = function() {
    	view.remove();
    };
    this.render = function() {};
    
    
    /** Init */
    (function() {
    	console.log('init');
    	view = self.view = $(
    		'<div class="overlay-name-wrap">'+
	    		'<div class="overlay-name">'+
					opts.studentName+
	    		'</div>'+
	    	'</div>'
    	);
    	view.appendTo('body');
    })();
}

/////////////
// Helpers //
/////////////

var queryString = (function() {
	// This function is anonymous, is executed immediately and 
	// the return value is assigned to QueryString!
	var query_string = {};
	var query = window.location.search.substring(1);
	var vars = query.split("&");
	for (var i=0;i<vars.length;i++) {
		var pair = vars[i].split("=");
			// If first entry with this name
		if (typeof query_string[pair[0]] === "undefined") {
			query_string[pair[0]] = pair[1];
			// If second entry with this name
		} else if (typeof query_string[pair[0]] === "string") {
			var arr = [ query_string[pair[0]], pair[1] ];
			query_string[pair[0]] = arr;
			// If third or later entry with this name
		} else {
			query_string[pair[0]].push(pair[1]);
		}
	} 
	return query_string;
})();

function dig(object, string) {
	if (object == null || typeof object != 'object') return undefined;
	if (typeof string != 'string') return undefined;

	var parts = string.split('.');
	for (var i = 0; i < parts.length; i++) {
		var value = object[parts[i]];
		if (i === parts.length - 1) return value;
		if (value == null || typeof value != 'object') return undefined;
		else object = value;
	}
}

function fill(string, value) {
	var object = {};
	var ref = object;
	if (typeof string != 'string') return {};
	var keys = string.split('.');
	if (keys.length === 1) {
		ref[keys[0]] = value;
		return object;
	} else {
		for (var i = 0; i < keys.length; i++) {
			if (i === keys.length - 1) {
				ref[keys[i]] = value;
				return object;
			} else {
				ref[keys[i]] = {};
				ref = ref[keys[i]];
			}
		}
	}
}