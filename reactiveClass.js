if (Meteor.isServer)
	return false;

ReactiveClass = function ( passedClass, optionsStructure ) {

	passedClass.prototype.reactiveData = new ReactiveVar( optionsStructure );

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
		this.reactiveData.set( this.initData );
		if (!this.checkReactiveValues())
			throw new Meteor.Error("reactiveData-wrong-structure", "Error");
		return true;
	};
	
	return passedClass;

};