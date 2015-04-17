var typeKey = 'rcType';

// Holder for all current constructors
ReactiveConstructors = {};

ReactiveConstructor = function( passedClass ) {

	var that = this;

	// Method for adding the methods passed from the passed typeStructure object
	// to the type object.
	// TODO: How to make this more testable?
	passedClass.prototype.setupTypeMethods = function ( reactiveObject ) {
		_.each(reactiveObject.getCurrentTypeMethods(), function( method, methodName ){
			reactiveObject[ methodName ] = method;
		});
	};

	// Method for getting all custom methods of this 
	passedClass.prototype.getCurrentTypeMethods = function () {
		return _.findWhere( this.typeStructure, { type: this.getType() }).methods;
	};

	// Method for returning the current structure for the current type
	passedClass.prototype.getCurrentTypeStructure = function () {
		return _.findWhere( this.typeStructure, { type: this.getType() }).fields;
	};

	// Method for removing a value of a reactive item.
	passedClass.prototype.unsetReactiveValue = function ( key ) {

		// Get all the data
		var reactiveData = this.reactiveData.get();

		// Set the key field of the data to the new value
		reactiveData[ key ] = undefined;

		this.reactiveData.set( reactiveData );

		// Check the entire stucture of the data
		if (!this.checkReactiveValues())
			throw new Meteor.Error('reactiveData-wrong-structure', 'Error');

		return true;

	};

	// Method for setting the value of a reactive item.
	passedClass.prototype.setReactiveValue = function ( key, value ) {

		// Make sure the passed value has the correct type
		if (!this.checkReactiveValueType( key, value ))
			throw new Meteor.Error('reactiveData-wrong-type', 'Error');
		
		// Get all the data
		var reactiveData = this.reactiveData.get();

		// Set the key field of the data to the new value
		reactiveData[ key ] = value;
		
		// Set the reactive var to the new data
		this.reactiveData.set( reactiveData );

		// Check the entire stucture of the data
		if (!this.checkReactiveValues())
			throw new Meteor.Error('reactiveData-wrong-structure', 'Error');

		// return the newly set value!
		return value;

	};

	// Get the value of the reactive data from key
	passedClass.prototype.getReactiveValue = function ( key ) {
		if (!this.reactiveData)
			return false;
		return this.reactiveData.get()[key];
	};

	// Check the type of a passed value compared to what has been defined
	// by the user.
	passedClass.prototype.checkReactiveValueType = function ( key, value ) {
		check(value, this.getCurrentTypeStructure()[key]);
		return true;
	};

	// Check the entire structure of the reactive data.
	passedClass.prototype.checkReactiveValues = function () {

		// We need to allow the existence of unset values,
		// for examples if a Person has a father field of type
		// Person, this field must be able to be empty.
		// So here we get all the keys which have a value, which
		// we later use to typecheck.
		var keysToCheck  = _.chain(this.reactiveData.get())
		.map( function( value, key ){
			if (value === undefined)
				return false;
			return key;
		})
		.compact()
		.value();

		check(
			_.pick( this.reactiveData.get(), keysToCheck ),
			_.pick( this.getCurrentTypeStructure(), keysToCheck )
			);

		return true;

	};

	// Method for returning the entire object as only the reactive
	// data, with no nested types with methods and stuff.
	passedClass.prototype.getDataAsObject = function () {

		// Map over the reactive data object
		return _.mapValues(this.reactiveData.get(), function ( value ) {

			// Does the value have this method? Then it's "one of us", recurse!
			if ( Match.test( value.getDataAsObject, Function ) )
				value = value.getDataAsObject();

			// Is it an array of items?
			if ( Match.test( value, Array ) ) {
				value = _.map( value, function( arrayVal ) {
					// Does the value have this method? Then it's "one of us", recurse!
					if ( Match.test( arrayVal.getDataAsObject, Function ) )
						return arrayVal.getDataAsObject();
					return arrayVal;
				});
			}

			// Return the value
			return value;

		});

	};

	// Method for converting initData to correct data types
	passedClass.prototype.prepareDataToCorrectTypes = function ( data ) {

		var that = this;

		var getValueAsType = function ( value, key ) {

			var valueType = that.getCurrentTypeStructure()[key];

			// Check for normal types and just return those
			if ( valueType && valueType.name && valueType.name.search(/String|Number/g) > -1)
				return value;

			// Is it an array?
			// Iterate this method over every field
			if ( Match.test( value, Array ) ) {
				return _.map( value, function ( arrayVal ) {
					// Is it a "plain" object? Then transform it into a non-plain
					// from the type provided in the typeStructure!
					// Else just return the current array value
					if ( Match.test( arrayVal, Object ) && ReactiveConstructors[ valueType[ 0 ].name ] )
						return new ReactiveConstructors[ valueType[ 0 ].name ]( arrayVal );
					return arrayVal;
				});
			}

			// Is it a "plain" object? Then transform it into a non-plain
			// from the type provided in the typeStructure!
			if ( Match.test( value, Object ) && valueType && ReactiveConstructors[ valueType.name ] )
				return new ReactiveConstructors[ valueType.name ]( value );

			// If the value is a string, and there is a window object with this name,
			// create a new instance from it!
			if ( Match.test( value, String ) && valueType && window[ valueType.name ] )
				return new window[ valueType.name ]( value );

			return value;

		};

		return _.mapValues( data, getValueAsType );

	};

	// Method for returning the default values for the type, as defined in the
	// constructor function.
	passedClass.prototype.getDefaultValues = function () {
		return _.findWhere( this.typeStructure, { type: this.getType() }).defaultData || {};
	};

	// Method for setting up all initValues, no matter what initValues
	// the user has passed. The initValues will be constructed from
	// the typeStructure the user has set for this type.
	passedClass.prototype.setupInitValues = function ( initValues ) {
		
		// Create a "bare" value from the type structure.
		// For example: a String will return "", a Number will return 0
		// and an array will return [].
		// A class constructor will return a new bare bones object from that class
		var bareValues = _.mapValues( this.getCurrentTypeStructure(), function ( val ) {

			// For arrays: return an empty array
			if ( Match.test( val, Array ) )
				return [];

			// If it's niot an array, and not a String/Number or Boolean,
			// don't return anything.
			// BUG IN <IE9, .name does not work!
			if (val.name.search(/String|Number|Boolean/g) < 0)
				return ;

			// Create a new default object from the type.
			// For example: a new String() or a new Number().
			// (or whatever constructor function has been passed).
			var initVal = new val();

			// Is there a valueOf method? If so: return the value of this method.
			// For example: new String().valueOf() will return "".
			if ( Match.test( initVal.valueOf, Function ) )
				return initVal.valueOf();

			// If there is not, something is wrong!
			throw new Meteor.Error('setup-init-value-missing-method', val + ' has no valueOf() method!');

		});

		// Overwrite all the "bare values" with the values which got passed
		// in the initValues and return this new "complete" set of initValues.
		return _.assign( bareValues, this.getDefaultValues(), initValues );

	};

	// TODO: This needs to be handled in a cleaner way probably!
	passedClass.prototype.setType = function ( initData ) {
		
		typeValue = (initData && initData[ typeKey ]) ? initData[ typeKey ] : this.typeStructure[0].type;
		
		// Make sure it's a string!
		check(typeValue, String );

		// Make sure the type is actually defined!
		if (!_.findWhere( this.typeStructure, { type: typeValue }))
			throw new Meteor.Error('reactiveData-wrong-type', 'There is no type: '+typeValue+'!');

		this[ typeKey ] = typeValue;

		return this[ typeKey ];

	};

	// Method for returning the current type of the object.
	// Either return this.type or the first type declared in
	// the typeStructure.
	passedClass.prototype.getType = function () {
		return this[ typeKey ];
	};


	// Method for running plugins' init methods
	that.initPlugins = function ( instance ) {

		if (!ReactiveConstructorPlugins)
			return false;

		_.each(ReactiveConstructorPlugins, function( RCPlugin ){
			
			// Run all plugin initClass on class
			if ( Match.test( RCPlugin.options.initClass, Function ) )
				passedClass = RCPlugin.options.initClass( passedClass );

			// Run initInstance method on this instance
			if ( Match.test( RCPlugin.options.initInstance, Function ) )
				instance = RCPlugin.options.initInstance( instance );
		
		});
		
	};


	// Method for initiating the ReactiveConstructor.
	passedClass.prototype.initReactiveValues = function () {

		// Setup the type of this constructor
		this.setType( this.initData );
		
		// Remove the type key!
		// TODO: This needs to be handled in a cleaner way probably!
		if (this.initData && this.initData[ typeKey ])
			delete this.initData[ typeKey ];

		// Setup the init data, setting default data and bare data
		// (Strings should be set to "" and numbers to 0 if no default or init value is set)
		var initData = this.setupInitValues( this.initData );
		initData = this.prepareDataToCorrectTypes( initData );

		// Init all plugins
		that.initPlugins( this );

		// Set the reactiveData source for this object.
		this.reactiveData = new ReactiveVar( initData );

		// Setup all type specific methods
		this.setupTypeMethods( this );

		// TODO: Make a decision about this:
		// Maybe delete the initData??
		// Will we ever need it later? Probably not?
		delete this.initData;

		if (!this.checkReactiveValues())
			throw new Meteor.Error('reactiveData-wrong-structure', 'Error');

		return true;

	};

	// Store the class in the ReactiveConstructors object.
	// This is so that we can create new instances of these constructors
	// later when needed!

	// First: Make sure we're not overwriting an existing class
	if (ReactiveConstructors[ passedClass.name ])
		throw new Meteor.Error('reactive-class-already-defined', 'The reactive class' + passedClass.name + ' is already defined!');

	ReactiveConstructors[ passedClass.name ] = passedClass;
	
	return passedClass;

};