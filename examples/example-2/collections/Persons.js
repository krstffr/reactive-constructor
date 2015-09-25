if (Meteor.isServer){
	Persons = new Meteor.Collection('persons');
	// Do nothing more on the server…
	return ;
}

Persons = new Meteor.Collection('persons', {
	transform: function( doc ) {
		return new Person( doc );
	}
});