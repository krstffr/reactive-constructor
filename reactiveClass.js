if (Meteor.isServer)
	return false;

ReactiveClass = function( passedClass, optionsStructure ) {

	var that = this;

	that.getTypeOfStructureItem = function ( item ) {
		
		// Does the item actaully have a name?
		// Then it's probably a String, return it
		if (item.name)
			return item.name;

		// Is it an array?
		if ( item instanceof Array ) {
			
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
		check(value, optionsStructure[key]);
		return true;
	};

	passedClass.prototype.checkReactiveValues = function () {
		check(this.reactiveData.get(), optionsStructure );
		return true;
	};

	passedClass.prototype.initReactiveValues = function () {
		this.reactiveData = new ReactiveVar( this.initData );
		if (!this.checkReactiveValues())
			throw new Meteor.Error("reactiveData-wrong-structure", "Error");
		return true;
	};
	
	return passedClass;

};