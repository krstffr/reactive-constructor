var typeKey = 'rcType';

// Holder for all current constructors
ReactiveConstructors = {};

ReactiveConstructor = function( constructorName, constructorDefaults ) {

	var that = this;

	// Make sure there are passed constructorDefaults
	if(!constructorDefaults)
		throw new Meteor.Error('no-constructor-defaults-passed', 'No constructor defaults passed for: ' + constructorName );

	check( constructorName, String );

	// This is the method which will be returned
	var passedConstructor = function() {
		this.initReactiveValues( arguments[0] );
	};

	passedConstructor.constructorName = constructorName;

	// Add the default to the constructor
	passedConstructor.constructorDefaults = constructorDefaults;

	// Store the constructor in the ReactiveConstructors object.
	// This is so that we can create new instances of these constructors
	// later when needed!

	// First: Make sure we're not overwriting an existing constructor
	if (ReactiveConstructors[ constructorName ])
		throw new Meteor.Error('reactive-constructor-already-defined', 'The reactive constructor' + constructorName + ' is already defined!');

	ReactiveConstructors[ constructorName ] = passedConstructor;

	if (Meteor.isServer){

		// Add this method since it's still being called (on server as well)
		passedConstructor.prototype.initReactiveValues = function() { return true; };

		return passedConstructor;

	}

	// Method for retrieving all the defined types of a constructor
	passedConstructor.getTypeNames = function() {
		return _.pluck( passedConstructor.constructorDefaults().typeStructure, 'type' );
	};

	// Method for adding the methods passed from the passed typeStructure object
	// to the type object.
	// TODO: How to make this more testable?
	passedConstructor.prototype.setupTypeMethods = function ( reactiveObject ) {
		var methods = _.assign( reactiveObject.getGlobalMethods(), reactiveObject.getCurrentTypeMethods() );
		_.each(methods, function( method, methodName ){
			reactiveObject[ methodName ] = method;
		});
	};

	passedConstructor.prototype.getGlobalMethods = function() {

		var defaults = passedConstructor.constructorDefaults();

		check( defaults, Object );

		// See if there are any default methods passed
		if (!defaults.globalValues ||
			!defaults.globalValues.methods)
			return {};

		// Return the global methods
		return defaults.globalValues.methods;

	};

	// Method for getting all custom methods of this
	passedConstructor.prototype.getCurrentTypeMethods = function () {
		return _.findWhere( passedConstructor.constructorDefaults().typeStructure, { type: this.getType() }).methods;
	};

	// Method for returning the current structure for the current type
	passedConstructor.prototype.getCurrentTypeStructure = function () {

		var instance = this;

		var globalFields = {};

		// Get the fields specific for this type
		var typeFields = _.findWhere( passedConstructor.constructorDefaults().typeStructure, { type: instance.getType() }).fields || {};
		check( typeFields, Object );

		// If there are no global fields, just return the type specific fields
		if (passedConstructor.constructorDefaults().globalValues && passedConstructor.constructorDefaults().globalValues.fields)
			globalFields = passedConstructor.constructorDefaults().globalValues.fields;

		check( globalFields, Object );

		// A plugin might have added some fields, add those as well to the mix
		var pluginTypeFields = _.reduce(ReactiveConstructorPlugins, function( memo, plugin ){
			if (plugin.options.pluginTypeStructure)
				return _.assign( memo, plugin.options.pluginTypeStructure( instance ) );
			return memo;
		}, {});

		check( pluginTypeFields, Object );

		var validPluginTypeFields = instance.getValidTypeStructureFieldsFromPlugins();

		check( pluginTypeFields, Object );

		// Else combine the fields and return all of them
		return _.assign( globalFields, typeFields, pluginTypeFields, validPluginTypeFields );

	};

	// Method for getting possible plugin extra fields
	// For example: if a plugin adds a special "pluginValue" field to SOME instances (not all),
	// then this method will return this value.
	passedConstructor.prototype.getValidTypeStructureFieldsFromPlugins = function() {
		var instance = this;
		return _.reduce(ReactiveConstructorPlugins, function( memo, plugin ){
			if (plugin.options.validTypeStructureFields)
				return _.assign( memo, plugin.options.validTypeStructureFields( instance ) );
		}, {});
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

	// Method for setting the value of a reactive item, with typecasting
	// Supported types: Number, Date, String, Boolean
	passedConstructor.prototype.setReactiveValueWithTypecasting = function ( key, value ) {

		check( key, String );

		var instance = this;

		if ( instance.getCurrentTypeStructure()[ key ] === Number )
			value = parseFloat( value, 10 );

		if ( instance.getCurrentTypeStructure()[ key ] === Date )
			value = new Date( value );

		if ( instance.getCurrentTypeStructure()[ key ] === String )
			value = new String( value ).valueOf();

		if ( instance.getCurrentTypeStructure()[ key ] === Boolean )
			value = new Boolean( value ).valueOf();

		return instance.setReactiveValue( key, value );

	};

	// Method for setting the value of a reactive item.
	passedConstructor.prototype.setReactiveValue = function ( key, value ) {

		var instance = this;

		var ordinaryMethod = function( instance, key, value ) {

			// Make sure the passed value has the correct type
			if (!instance.checkReactiveValueType( key, value ))
				throw new Meteor.Error('reactiveData-wrong-type', 'Error');

			// Get all the data
			var reactiveData = instance.reactiveData.get();

			// Set the key field of the data to the new value
			reactiveData[ key ] = value;

			// Check the entire stucture of the data about to be set
			if ( !instance.checkReactiveValues( reactiveData ) )
				throw new Meteor.Error('reactiveData-wrong-structure', 'Error');

			// Set the reactive var to the new data
			instance.reactiveData.set( reactiveData );

			// return the newly set value!
			return value;

		};

		var args = [ instance, key, value, ordinaryMethod ];

		return instance.getPluginOverrides('setReactiveValue', args );

	};

	// Get the value of the reactive data from key
	passedConstructor.prototype.getReactiveValue = function ( key ) {
		if (!this.reactiveData)
			return false;
		return this.reactiveData.get()[key];
	};

	// Method for getting the constructor for the passed key
	passedConstructor.prototype.getConstructorOfKey = function( key ) {
		var constructor = this.getCurrentTypeStructure()[ key ];
		if ( Match.test( constructor, Array ) )
			return constructor[0];
		return constructor;
	};

	// Method for getting the name of the constructor for the passed key
	passedConstructor.prototype.getConstructorNameOfKey = function( key ) {
		var constructor = this.getConstructorOfKey( key );
		return constructor.constructorName || constructor.name;
	};

	// Check the type of a passed value compared to what has been defined
	// by the user.
	passedConstructor.prototype.checkReactiveValueType = function ( key, passedValue ) {

		var instance = this;

		var ordinaryMethod = function( key, passedValue ) {
			check( key, String );
			check( passedValue, instance.getCurrentTypeStructure()[ key ] );
			return true;
		};

		var args = [ key, passedValue, ordinaryMethod ];

		return this.getPluginOverrides('checkReactiveValueType', args );

	};

	// This method allows plugins to override a "native" (ordinary) method.
	// The "native" method MUST be provided as the last item in the args array!
	passedConstructor.prototype.getPluginOverrides = function( methodName, args ) {

		// The ordinary method MUST be provided as the last item
		var ordinaryMethod = _.last(args);

		check( methodName, String );
		check( ordinaryMethod, Function );

		// Allow plugins to override this check
		if (ReactiveConstructorPlugins.length > 0){

			// Get all plugins which have this method.
			var pluginsWithChecks = _.filter( ReactiveConstructorPlugins, function(plugin){
				return Match.test( plugin[ methodName ], Function );
			});

			// If there are none, just return the ordinary method
			if (pluginsWithChecks.length < 1)
				return ordinaryMethod.apply( this, _.initial( args ) );

			// If one of the plugins allows this method, accept it
			// TODO: Does this make sense? Probably?
			var pluginResults = _.map(pluginsWithChecks, function( plugin ){
				return plugin[ methodName ].apply( this, args );
			});

			// TODO: WHICH ONE TO CHOOSE IF THERE ARE SEVERAL
			if (pluginResults.length > 0)
				return pluginResults[0];

			return true;

		}

		return ordinaryMethod.apply( this, _.initial( args ) );

	};


	// Either check the data of the the instance, or the passed data.
	passedConstructor.prototype.checkReactiveValues = function ( values ) {

		var dataToCheck = values || this.reactiveData.get();
		var currentTypeStructure = this.getCurrentTypeStructure();

		var ordinaryMethod = function( dataToCheck, currentTypeStructure ) {

			// We need to allow the existence of unset values,
			// for examples if a Person has a father field of type
			// Person, this field must be able to be empty.
			// So here we get all the keys which have a value, which
			// we later use to typecheck.

			// Also: only check against the currentTypeStructure keys,
			// meaning that objects can also have additional fields which
			// have been set elsewhere. (For example: in a DB.)
			var keysToCheck  = _.chain( dataToCheck )
			.map( function( value, key ){
				if (value === undefined || !currentTypeStructure[key])
					return false;
				return key;
			})
			.compact()
			.value();

			check(
				_.pick( dataToCheck, keysToCheck ),
				_.pick( currentTypeStructure, keysToCheck )
				);

			return true;

		};

		var args = [ dataToCheck, currentTypeStructure, ordinaryMethod ];

		return this.getPluginOverrides('checkReactiveValues', args );

	};

	// Method for returning the entire object as only the reactive
	// data, with no nested types with methods and stuff.
	passedConstructor.prototype.getDataAsObject = function () {

		// Map over the reactive data object
		var dataToReturn = _.assign({ rcType: this.getType() }, this.reactiveData.get() );

		return _.mapValues(dataToReturn, function ( value ) {

			// Does the value have this method? Then it's a reactiveConstructor instance, recurse!
			if ( value && Match.test( value.getDataAsObject, Function ) )
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

		var instance = this;

		var getValueAsType = function ( value, key ) {

			var ordinaryMethod = function( instance, value, key  ) {

				var valueType = instance.getCurrentTypeStructure()[key];

				// Check for normal types and just return those
				if ( valueType && valueType.name && valueType.name.search(/String|Number|Boolean/g) > -1)
					return value;

				// Is it an array?
				// Iterate this method over every field
				if ( Match.test( value, Array ) ) {
					return _.map( value, function ( arrayVal ) {
						// Is it a "plain" object? Then transform it into a non-plain
						// from the type provided in the typeStructure!
						// Else just return the current array value
						if ( Match.test( arrayVal, Object ) && ReactiveConstructors[ valueType[0].constructorName ] )
							return new ReactiveConstructors[ valueType[0].constructorName ]( arrayVal );
						return arrayVal;
					});
				}

				// Is it a "plain" object? Then transform it into a non-plain
				// from the type provided in the typeStructure!
				if ( Match.test( value, Object ) && valueType && ReactiveConstructors[ valueType.constructorName ] )
					return new ReactiveConstructors[ valueType.constructorName ]( value );

				// If the value is a string, and there is a window object with this name,
				// create a new instance from it!
				if ( Match.test( value, String ) && valueType && window[ valueType.name ] )
					return new window[ valueType.name ]( value );

				return value;

			};

			var args = [ instance, value, key, ordinaryMethod ];

			return instance.getPluginOverrides('setValueToCorrectType', args );

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

			// If it is not a String, Number or Boolean, return nothing.
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


	// Method for running plugins' init methods on INSTANCE
	that.initPluginsOnInstance = function ( instance ) {

		if (!ReactiveConstructorPlugins)
			return false;

		_.each(ReactiveConstructorPlugins, function( RCPlugin ){

			// Run initInstance method on this instance
			if ( Match.test( RCPlugin.options.initInstance, Function ) )
				instance = RCPlugin.options.initInstance( instance );

		});

	};

	// Method for running plugins' init methods on CONSTRUCTOR
	var initPluginsOnConstructor = function ( passedConstructor ) {

		if (!ReactiveConstructorPlugins)
			return false;

		_.each(ReactiveConstructorPlugins, function( RCPlugin ){

			// Run all plugin initConstructor on constructor
			if ( Match.test( RCPlugin.options.initConstructor, Function ) )
				passedConstructor = RCPlugin.options.initConstructor( passedConstructor );

		});

		return passedConstructor;

	};

	// Method for stripping any fields from the initData object
	// which are not part of the type structure
	passedConstructor.prototype.removeAdditionalDataFields = function( data ) {
		return _.pick( data, _.keys( this.getCurrentTypeStructure() ) );
	};


	// Method for initiating the ReactiveConstructor.
	passedConstructor.prototype.initReactiveValues = function ( initData ) {

		var ordinaryMethod = function( instance, initData ) {

			// Setup the type of this constructor
			instance.setType( initData );

			// Remove the type key!
			// TODO: This needs to be handled in a cleaner way probably!
			if (initData && initData[ typeKey ])
				delete initData[ typeKey ];

			// Remove any fields which are not part of the type structure
			initData = instance.removeAdditionalDataFields( initData );

			// Setup the init data, setting default data and bare data
			// (Strings should be set to "" and numbers to 0 if no default or init value is set)
			initData = instance.setupInitValues( initData );
			initData = instance.prepareDataToCorrectTypes( initData );

			// Set the reactiveData source for this object.
			instance.reactiveData = new ReactiveVar( initData );

			// Setup all type specific methods
			instance.setupTypeMethods( instance );

			// Init all plugins on this instance
			that.initPluginsOnInstance( instance );

			if (!instance.checkReactiveValues())
				throw new Meteor.Error('reactiveData-wrong-structure', 'Error');

			return true;

		};

		var args = [ this, initData, ordinaryMethod ];

		return this.getPluginOverrides('initReactiveValues', args );

	};

	// Init all plugins on this constructor
	passedConstructor = initPluginsOnConstructor( passedConstructor );

	return passedConstructor;

};
