if (Meteor.isServer)
	return false;

ReactiveClass = function( passedClass ) {

	var that = this;

	// TODO: This should probably be moved to the CMS-thing!
	// Method for returning the type of an item as a string.
	that.getTypeOfStructureItem = function ( item ) {
		// Does the item actaully have a name?
		// Then it's probably a String or a Number or a Boolean, return it
		if (item.name)
			return item.name;

		// Is it an array?
		if ( Match.test( item, Array ) ) {
			
			// Does it have any items?
			if (item.length > 1)
				return 'Array';

			return 'Collection_'+item[0].name;
		}
	};
	// TODO: This should probably be moved to the CMS-thing!
	// Method for returning the data for the CMS frontend basically
	passedClass.prototype.getReactiveValuesAsArray = function () {
		var typeStructure = this.getCurrentTypeStructure();
		return _( this.reactiveData.get() ).map( function( value, key, list ) {
			return {
				key: key,
				value: value,
				type: that.getTypeOfStructureItem( typeStructure[key] )
			};
		});
	};




	// Make typeStructure able to reference itself basically.
	// Iterate over all the passed fields, and change ['self'] to [passedClass]
	// to make the type refer to the passedClass
	that.setupTypeStructureFields = function ( typeStructureFields ) {

		return lodash.mapValues( typeStructureFields, function ( value ) {

			if ( value === 'self') {
				console.log('TODO: value of: "self" this need to be made recursive!');
				return String;
			}

			// If it's not an array, skip this
			if ( Match.test(value, Array) ) {
				// Exchange any array values which might be 'self' to passedClass
				value = _.map(value, function( arrayItem ){
					if (arrayItem === 'self')
						return passedClass;
					return arrayItem;
				});
			}

			// Return the value to the typeStructure
			return value;
			
		});

	};

	// Method for returning the current structure for the current type
	passedClass.prototype.getCurrentTypeStructure = function () {
		return _( this.typeStructure ).findWhere({ type: this.getType() }).fields;
	};

	// Method for setting the value of a reactive item.
	passedClass.prototype.setReactiveValue = function ( key, value ) {

		// Make sure the passed value has the correct type
		if (!this.checkReactiveValueType( key, value ))
			throw new Meteor.Error("reactiveData-wrong-type", "Error");
		
		// Get all the data
		var reactiveData = this.reactiveData.get();
		// Set the key field of the data to the new value
		reactiveData[ key ] = value;
		// Set the reactive var to the new data
		this.reactiveData.set( reactiveData );

		// Check the entire stucture of the data
		if (!this.checkReactiveValues())
			throw new Meteor.Error("reactiveData-wrong-structure", "Error");

		// return the newly set value!
		return value;

	};

	// Get the value of the reactive data from key
	passedClass.prototype.getReactiveValue = function ( key ) {
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
		check(this.reactiveData.get(), this.getCurrentTypeStructure() );
		return true;
	};

	// Method for returning the entire object as only the reactive
	// data, with no nested types with methods and stuff.
	passedClass.prototype.getDataAsObject = function () {

		// Map over the reactive data object
		return lodash.mapValues(this.reactiveData.get(), function ( value ) {

			// Does the value have this method? Then it's "one of us", recurse!
			if ( Match.test( value.getDataAsObject, Function ) )
				value = value.getDataAsObject();

			// Is it an array of items?
			if ( Match.test( value, Array ) ) {
				value = _( value ).map( function( arrayVal ) {
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
				return _(value).map( function ( arrayVal, arrayKey ) {
					// Is it a "plain" object? Then transform it into a non-plain
					// from the type provided in the typeStructure!
					if ( Match.test( arrayVal, Object ) )
						return new window[ valueType[ 0 ].name ]( arrayVal );
					return value;
				});
			}

			// Is it a "plain" object? Then transform it into a non-plain
			// from the type provided in the typeStructure!
			if ( Match.test( value, Object ) )
				return new window[ valueType.name ]( value );

			return value;

		};

		return lodash.mapValues( data, getValueAsType );

	};

	// Method for returning the default values for the type, as defined in the
	// constructor function.
	passedClass.prototype.getDefaultValues = function () {
		return _( this.typeStructure ).findWhere({ type: this.getType() }).defaultData || {};
	};

	// Method for setting up all initValues, no matter what initValues
	// the user has passed. The initValues will be constructed from
	// the typeStructure the user has set for this type.
	passedClass.prototype.setupInitValues = function ( initValues ) {
		
		// Create a "bare" value from the type structure.
		// For example: a String will return "", a Number will return 0
		// and an array will return [].
		// A class constructor will return a new bare bones object from that class
		var bareValues = lodash.mapValues( this.getCurrentTypeStructure(), function ( val ) {

			// For arrays: return an empty array
			if ( Match.test( val, Array ) )
				return [];

			// Create a new default object from the type.
			// For example: a new String() or a new Number().
			// (or whatever constructor function has been passed).
			var initVal = new val();

			// Is there a valueOf method? If so: return the value of this method.
			// For example: new String().valueOf() will return "".
			if ( Match.test( initVal.valueOf, Function ) )
				return initVal.valueOf();

			// Else just return the object which was created from the class
			// constructor function.
			return initVal;

		});

		// Overwrite all the "bare values" with the values which got passed
		// in the initValues and return this new "complete" set of initValues.
		return _( bareValues ).extend( this.getDefaultValues(), initValues );

	};

	// Method for returning the current type of the object.
	// Either return this.type or the first type declared in
	// the typeStructure.
	passedClass.prototype.getType = function () {
		return (this.type) ? this.type : this.typeStructure[0].type;
	};

	// Method for initiating the reactiveClass.
	passedClass.prototype.initReactiveValues = function () {

		// Make the ['self'] field work, meaning that a field set to
		// = ['self'] should really reference itself.
		this.typeStructure = _( this.typeStructure ).map(function ( val ) {
			val.fields = that.setupTypeStructureFields( val.fields );
			return val;
		});

		// Setup the init data, setting default data and bare data
		// (Strings should be set to "" and numbers to 0 if no default or init value is set)
		var initData = this.setupInitValues( this.initData );

		// Set the reactiveData source for this object.
		this.reactiveData = new ReactiveVar( this.prepareDataToCorrectTypes( initData ) );

		// TODO: Make a decision about this:
		// Maybe delete the initData??
		// Will we ever need it later? Probably not?
		delete this.initData;

		if (!this.checkReactiveValues())
			throw new Meteor.Error("reactiveData-wrong-structure", "Error");

		return true;

	};
	
	return passedClass;

};