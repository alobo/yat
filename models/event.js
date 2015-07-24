var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var eventSchema = new Schema({
    	name: String,
    	description: String,
    	eventTime: Number,
      address: String,
      city: String,
      wantFood: Boolean,
    	lat: Number,
    	lng: Number,
    	date: {type: Date, default: Date.now},
    	recipientIDs: [{type: Schema.Types.ObjectId, ref: 'Recipient'}]
});

module.exports = mongoose.model('Event', eventSchema);
