var typeKey = 'rcType';

// Holder for all current constructors
ReactiveConstructors = {};

ReactiveConstructor = function( passedConstructor, constructorDefaults ) {

	var that = this;

	// Make sure there are passed constructorDefaults
	if(!constructorDefaults)
		throw new Meteor.Error('no-constructor-defaults-passed', 'No constructor defaults passed for: ' + passedConstructor.name );

	// Add the default to the constructor
	passedConstructor.constructorDefaults = constructorDefaults;

	// Method for adding the methods passed from the passed typeStructure object
	// to the type object.
	// TODO: How to make this more testable?
	passedConstructor.prototype.setupTypeMethods = function ( reactiveObject ) {
		_.each(reactiveObject.getCurrentTypeMethods(), function( method, methodName ){
			reactiveObject[ methodName ] = method;
		});
	};

	// Method for getting all custom methods of this 
	passedConstructor.prototype.getCurrentTypeMethods = function () {
		return _.findWhere( passedConstructor.constructorDefaults().typeStructure, { type: this.getType() }).methods;
	};

	// Method for returning the current structure for the current type
	passedConstructor.prototype.getCurrentTypeStructure = function () {
		// Get the fields specific for this type
		// var typeFields = _.findWhere( this.typeStructure, { type: this.getType() }).fields;
		var typeFields = _.findWhere( passedConstructor.constructorDefaults().typeStructure, { type: this.getType() }).fields;
		// If there are no global fields, just return the type specific fields
		if (!passedConstructor.constructorDefaults().globalValues || !passedConstructor.constructorDefaults().globalValues.fields)
			return typeFields;
		// Else combine the fields and return all of them
		return _.assign( passedConstructor.constructorDefaults().globalValues.fields, typeFields );
	};

	// Method for removing a value of a reactive item.
	passedConstructor.prototype.unsetReactiveValue = function ( key ) {

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
	passedConstructor.prototype.setReactiveValue = function ( key, value ) {

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
	passedConstructor.prototype.getReactiveValue = function ( key ) {
		if (!this.reactiveData)
			return false;
		return this.reactiveData.get()[key];
	};

	// Check the type of a passed value compared to what has been defined
	// by the user.
	passedConstructor.prototype.checkReactiveValueType = function ( key, value ) {
		// if ( !Match.test( value, this.getCurrentTypeStructure()[key] ) )
			// console.log( value, this.getCurrentTypeStructure(), key );
			check(value, this.getCurrentTypeStructure()[key]);
			return true;
		};

	// Check the entire structure of the reactive data.
	passedConstructor.prototype.checkReactiveValues = function () {

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
	passedConstructor.prototype.getDataAsObject = function () {

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
	passedConstructor.prototype.prepareDataToCorrectTypes = function ( data ) {

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
	// constructor function. If there are global default sets, return those as well 
	// (however they will be overwritten by the type specific data)
	passedConstructor.prototype.getDefaultValues = function () {
		// Get the default data specific for this type
		var typeDefaults = _.findWhere( passedConstructor.constructorDefaults().typeStructure, { type: this.getType() }).defaultData || {};
		// If there are no global defaults, just return the type specific defaults
		if (!passedConstructor.constructorDefaults().globalValues || !passedConstructor.constructorDefaults().globalValues.defaultData)
			return typeDefaults;
		// Else combine the data and return all of it
		return _.assign( passedConstructor.constructorDefaults().globalValues.defaultData, typeDefaults );
	};

	// Method for setting up all initValues, no matter what initValues
	// the user has passed. The initValues will be constructed from
	// the typeStructure the user has set for this type.
	passedConstructor.prototype.setupInitValues = function ( initValues ) {
		
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
	passedConstructor.prototype.setType = function ( initData ) {
		
		var typeValue = (initData && initData[ typeKey ]) ? initData[ typeKey ] : passedConstructor.constructorDefaults().typeStructure[0].type;
		
		// Make sure it's a string!
		check(typeValue, String );

		// Make sure the type is actually defined!
		if (!_.findWhere( passedConstructor.constructorDefaults().typeStructure, { type: typeValue }))
			throw new Meteor.Error('reactiveData-wrong-type', 'There is no type: '+typeValue+'!');

		this[ typeKey ] = typeValue;

		return this[ typeKey ];

	};

	// Method for returning the current type of the object.
	// Either return this.type or the first type declared in
	// the typeStructure.
	passedConstructor.prototype.getType = function () {
		return this[ typeKey ];
	};


	// Method for running plugins' init methods
	that.initPlugins = function ( instance ) {

		if (!ReactiveConstructorPlugins)
			return false;

		_.each(ReactiveConstructorPlugins, function( RCPlugin ){
			
			// Run all plugin initClass on class
			if ( Match.test( RCPlugin.options.initClass, Function ) )
				passedConstructor = RCPlugin.options.initClass( passedConstructor );

			// Run initInstance method on this instance
			if ( Match.test( RCPlugin.options.initInstance, Function ) )
				instance = RCPlugin.options.initInstance( instance );

		});
		
	};


	// Method for initiating the ReactiveConstructor.
	passedConstructor.prototype.initReactiveValues = function ( initData ) {

		// Setup the type of this constructor
		this.setType( initData );
		
		// Remove the type key!
		// TODO: This needs to be handled in a cleaner way probably!
		if (initData && initData[ typeKey ])
			delete initData[ typeKey ];

		// Setup the init data, setting default data and bare data
		// (Strings should be set to "" and numbers to 0 if no default or init value is set)
		initData = this.setupInitValues( initData );
		initData = this.prepareDataToCorrectTypes( initData );

		// Init all plugins
		that.initPlugins( this );

		// Set the reactiveData source for this object.
		this.reactiveData = new ReactiveVar( initData );

		// Setup all type specific methods
		this.setupTypeMethods( this );

		if (!this.checkReactiveValues())
			throw new Meteor.Error('reactiveData-wrong-structure', 'Error');

		return true;

	};

	// Method for adding the auto init stuff!
	// CAN THIS WORK??
	// TODO: Remove this if I can't figure out a way to make it work!
	// The problem is with the name property!
	function injectToConstructor(C) {
		return function(){
			var self = new (C.bind.apply(C,[C].concat([].slice.call(arguments))))();			
			console.log('test');
			return self;
		};
	}

	// Store the class in the ReactiveConstructors object.
	// This is so that we can create new instances of these constructors
	// later when needed!

	// First: Make sure we're not overwriting an existing class
	if (ReactiveConstructors[ passedConstructor.name ])
		throw new Meteor.Error('reactive-class-already-defined', 'The reactive class' + passedConstructor.name + ' is already defined!');

	ReactiveConstructors[ passedConstructor.name ] = passedConstructor;
	
	return passedConstructor;

};