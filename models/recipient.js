var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var recipientSchema = new Schema({
    	eventID: {type: Schema.Types.ObjectId, ref: 'Event'},
    	name: String,
    	email: String,
    	isHost: Boolean,
    	lat: Number,
    	lng: Number
});

module.exports = mongoose.model('Recipient', recipientSchema);
