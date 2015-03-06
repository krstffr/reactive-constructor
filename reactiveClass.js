if (Meteor.isServer)
	return false;

ReactiveClass = function( passedClass, optionsStructure ) {

	var that = this;

	// Make optionsStructure able to reference itself
	// Iterate over all the passed options, and change ['self'] to [passedClass]
	// to make the type refer to the passedClass
	that.setupOptionsStructure = function ( passedOptionsStructure ) {

		var structure = passedOptionsStructure.fields || passedOptionsStructure;

		return lodash.mapValues(structure, function ( value ) {

			// If it's not an array, skip this
			if (Match.test(value, Array) ) {
				// Exchange any array values which might be 'self' to passedClass
				value = _.map(value, function( arrayItem ){
					if (arrayItem === 'self')
						return passedClass;
					return arrayItem;
				});
			}

			// Add the value to the optionsStructure
			return value;
			
		});

	};

	passedClass.prototype.getCurrentOptionsStructure = function () {
		if ( this.type )
			return _(optionsStructure).findWhere({ type: this.type }).fields;
		return optionsStructure;
	};

	that.getTypeOfStructureItem = function ( item ) {
		
		// Does the item actaully have a name?
		// Then it's probably a String, return it
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

	passedClass.prototype.setReactiveValue = function ( key, value ) {
		
		var newVal = this.reactiveData.get();
		newVal[ key ] = value;

		if (!this.checkReactiveValue( key, value ))
			throw new Meteor.Error("reactiveData-wrong-type", "Error");

		this.reactiveData.set( newVal );

		if (!this.checkReactiveValues())
			throw new Meteor.Error("reactiveData-wrong-structure", "Error");

		return value;

	};

	passedClass.prototype.getReactiveValuesAsArray = function () {
		var optionsStructure = this.getCurrentOptionsStructure();
		return _( this.reactiveData.get() ).map( function( value, key, list ) {
			return {
				key: key,
				value: value,
				type: that.getTypeOfStructureItem( optionsStructure[key] )
			};
		});
	};

	passedClass.prototype.getReactiveValue = function ( key ) {
		return this.reactiveData.get()[key];
	};

	passedClass.prototype.checkReactiveValue = function ( key, value ) {
		check(value, this.getCurrentOptionsStructure()[key]);
		return true;
	};



	passedClass.prototype.checkReactiveValues = function () {

		check(this.reactiveData.get(), this.getCurrentOptionsStructure() );

		return true;

	};

	// Method for returning the entire object as only the reactive
	// data, with no nested types with methods and stuff.
	passedClass.prototype.getDataAsObject = function () {

		// Map over the reactive data object
		return lodash.mapValues(this.reactiveData.get(), function ( value ) {

			// Does the value have this method? Then it's "one of us"!
			if ( Match.test( value.getDataAsObject, Function ) )
				value = value.getDataAsObject();

			// Is it an array of items?
			if ( Match.test( value, Array ) ) {
				value = _( value ).map( function( arrayVal ) {
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

			// Check for normal types and just return those
			if ( that.getCurrentOptionsStructure()[key] && that.getCurrentOptionsStructure()[key].name && that.getCurrentOptionsStructure()[key].name.search(/String|Number/g) > -1)
				return value;

			// Is it an array?
			// Iterate this method over every field
			if ( Match.test( value, Array ) ) {
				return _(value).map( function ( arrayVal, arrayKey ) {
					// Is it a "plain" object? Then transform it into a non-plain
					// from the type provided in the optionsStructure!
					if ( Match.test( arrayVal, Object ) )
						return new that.getCurrentOptionsStructure()[ key ][ 0 ]( arrayVal );
					return value;
				});
			}

			// Is it a "plain" object? Then transform it into a non-plain
			// from the type provided in the optionsStructure!
			if ( Match.test( value, Object ) )
				return new that.getCurrentOptionsStructure()[key]( value );

			return value;

		};

		return lodash.mapValues( data, getValueAsType );

	};

	passedClass.prototype.setupInitValues = function ( initValues ) {
		return initValues;
	};

	passedClass.prototype.initReactiveValues = function () {

		if ( Match.test( optionsStructure, Array ) ) {
			optionsStructure = _( optionsStructure ).map(function ( val ) {
				val.fields = that.setupOptionsStructure( val.fields );
				return val;
			});
		}
		if ( Match.test( optionsStructure, Object ) )
			optionsStructure = that.setupOptionsStructure( optionsStructure );

		this.reactiveData = new ReactiveVar( this.prepareDataToCorrectTypes( this.initData ) );

		if (!this.checkReactiveValues())
			throw new Meteor.Error("reactiveData-wrong-structure", "Error");

		return true;

	};
	
	return passedClass;

};