Tinytest.add('exported objects', function ( test ) {

	test.equal( typeof ReactiveConstructors, 'object' );
	test.equal( typeof ReactiveConstructor, 'function' );
	test.equal( typeof ReactiveConstructorPlugin, 'function' );

});

Tinytest.add('Person - Init constructors without params', function ( test ) {

	var defaultData = Person.constructorDefaults().typeStructure[0].defaultData;
	var defaultDataKeys = _( defaultData ).keys();
	var testPerson = new Person();

	_.each(defaultDataKeys, function( key ){

		// Make sure the defaults values are correct.
		// Also make sure you can get the reactive values of these and
		// that those are correct.
		test.equal( testPerson.getDataAsObject()[key].toString(), defaultData[key].toString() );
		test.equal( testPerson.getReactiveValue(key).toString(), defaultData[key].toString() );

	});

});


Tinytest.add('Invoice - Init constructors without params', function ( test ) {

	var defaultData = Invoice.constructorDefaults().typeStructure[0].defaultData;
	var defaultDataKeys = _( defaultData ).keys();
	var testInvoice = new Invoice();

	_.each(defaultDataKeys, function( key ){

		// Make sure the defaults values are correct.
		test.equal( testInvoice.getReactiveValue(key).toString(), defaultData[key].toString() );

	});

});


Tinytest.add('Various constructors - Init constructors with some params', function ( test ) {

	var setValues = {
		invoiceName: 'A name set from here',
		currency: 'SEK',
		superCool: true,
		items: [
		new InvoiceListItem(),
		new InvoiceListItem({
			units: 10,
			unitPrice: 500
		})
		]
	};

	var setKeys = _( setValues ).keys();

	// The invoice with the set values
	var testInvoice = new Invoice( setValues );

	_.each(setKeys, function( key ){
		// Make sure the set values match
		test.equal( testInvoice.getReactiveValue(key), setValues[key] );
	});

	var coolDude = {
		rcType: 'husband',
		wife: {
			rcType: 'wife'
		}
	};

	var dude = new Person( coolDude );

	test.equal( dude.getReactiveValue('wife').getType(), 'wife' );

	var rangerValues = {
		rcType: 'ranger',
		favouritePet: {
			rcType: 'dog',
			hasBrain: false,
			pals: [{
				rcType: 'dog',
				hasBrain: true
			}, {
				rcType: 'dog',
				hasBrain: false,
				pals: [{
					rcType: 'dog',
					hasBrain: true,
					lifeExpectancyInYears: 100
				}]
			}]
		},
		animals: [{
			rcType: 'crippledCat',
			numberOfLegs: 2
		}, {
			rcType: 'dog',
			hasBrain: false,
			pals: [{
				rcType: 'dog',
				hasBrain: true
			}, {
				rcType: 'dog',
				hasBrain: false,
				pals: [{
					rcType: 'dog',
					hasBrain: true
				}]
			}]
		}]
	};

	var testRanger = new Person( rangerValues );

	var animals = testRanger.getReactiveValue('animals');
	var fav = testRanger.getReactiveValue('favouritePet');
	var favPals = fav.getReactiveValue('pals');
	var secondFavPalsPal = favPals[1].getReactiveValue('pals');

	test.equal( animals[0].getReactiveValue('hasBrain'), true );
	test.equal( animals[1].getReactiveValue('hasBrain'), false );
	test.equal( animals[1].getReactiveValue('pals')[0].getReactiveValue('hasBrain'), true );

	test.equal( fav.getReactiveValue('hasBrain'), false );
	test.equal( favPals[0].getReactiveValue('hasBrain'), true );
	test.equal( secondFavPalsPal[0].getReactiveValue('lifeExpectancyInYears'), 100 );


});

Tinytest.add('Various constructors - Init constructors with params + parms which are not part of defined structure', function ( test ) {

	var setValues = {
		invoiceName: 'A name set from here',
		currency: 'SEK',
		superCool: true,
		items: [
		new InvoiceListItem(),
		new InvoiceListItem({
			units: 10,
			unitPrice: 500
		})
		]
	};

	setValues.additionalField = true;
	setValues.additionalFieldNumber2 = 'A string';
	setValues.additionalFieldNumber3 = { subVal: 'string', subVal2: 123 };

	var testInvoice = new Invoice( setValues );

});

Tinytest.add('Various constructors - instance.constructor.constructorName', function ( test ) {

	var person = new Person();
	var animal = new Animal();
	var invoice = new Invoice();

	test.equal(person.constructor.constructorName, 'Person');
	test.equal(animal.constructor.constructorName, 'Animal');
	test.equal(invoice.constructor.constructorName, 'Invoice');

});

Tinytest.add('Person - Init persons with references to other Person', function ( test ) {

	var testPersonWithChild = new Person({
		children: [ new Person() ]
	});

	var testWife = new Person({
		rcType: 'wife',
		happy: true
	});

	var buddy = new Person({
		rcType: 'worker',
		name: 'Buddy Holly'
	});

	var testHusband = new Person({
		rcType: 'husband',
		wife: testWife,
		buddies: [ buddy, {
			rcType: 'worker',
			name: 'Mary Tyler More'
		}]
	});

	test.isTrue( testPersonWithChild.getReactiveValue('children')[0] instanceof Person );
	test.isTrue( testHusband.getReactiveValue('wife') instanceof Person );
	test.isTrue( testHusband.getReactiveValue('wife').getReactiveValue('happy') );
	test.equal( testHusband.getReactiveValue('buddies')[0].getReactiveValue('name'), 'Buddy Holly' );
	test.equal( testHusband.getReactiveValue('buddies')[1].getReactiveValue('name'), 'Mary Tyler More' );

	testWife.setReactiveValue('happy', false);

	test.isFalse( testHusband.getReactiveValue('wife').getReactiveValue('happy') );
	test.isFalse( testWife.getReactiveValue('happy') );

});


Tinytest.add('Person - Init persons with references to other Person, plain objects', function ( test ) {

	// An object with lot's of nested children, some with type explicitly defined
	// and some without (where it will be defined by the first "type")
	var testPersonWithGrandChildren = new Person({
		name: 'Grand father',
		children: [{
			name: 'Mother',
			birthDate: 'jan 13 1984',
			children: [{
				rcType: 'worker',
				name: 'Little baby boy child',
				children: [{
					rcType: 'worker',
					name: 'Future grand child'
				}]
			}, {
				rcType: 'worker',
				name: 'Little baby girl'
			}]
		}]
	});

	var mothers = testPersonWithGrandChildren.getReactiveValue('children');

	test.equal( mothers.length, 1 );
	test.equal( mothers[0].getReactiveValue('name'), 'Mother' );

	var children = mothers[0].getReactiveValue('children');

	test.equal( children.length, 2 );
	test.equal( children[1].getReactiveValue('name'), 'Little baby girl' );

	var grandChildren = children[0].getReactiveValue('children');

	test.equal( grandChildren.length, 1 );
	test.equal( grandChildren[0].getReactiveValue('name'), 'Future grand child' );

});

Tinytest.add('Person - Init person with "child" type', function ( test ) {

	var testChild = new Person({ rcType: 'child' });

	test.equal( testChild.getType(), 'child' );
	test.isFalse( testChild.getReactiveValue('rcType') );

});

Tinytest.add('Person - Init person with Boolean field set to false', function ( test ) {

	var wife = new Person({ rcType: 'wife', happy: false });
	var happyWife = new Person({ rcType: 'wife', happy: true });

	test.isFalse( wife.getReactiveValue('happy') );
	test.isTrue( happyWife.getReactiveValue('happy') );

});

Tinytest.add('Invoice / invoiceListItem - Throw errors when using wrong types', function ( test ) {

	test.throws(function () {
		new Invoice({ currency: 1.23 });
	});

	test.throws(function () {
		new Invoice({ invoiceName: function() {} });
	});

	test.throws(function () {
		new Invoice({ items: 'a string' });
	});

	test.throws(function () {
		new Invoice({ superCool: 0 });
	});

	test.throws(function () {
		new Invoice({ client: new Invoice() });
	});

	test.throws(function () {
		new Invoice({ items: new invoiceListItem() });
	});

	test.throws(function () {
		new InvoiceListItem({ units: true });
	});

	test.throws(function () {
		new InvoiceListItem({ units: [{ wrong: 'type this is!' }] });
	});

	test.throws(function () {
		new InvoiceListItem({ unitPrice: function() { return 1; } });
	});

});


Tinytest.add('Invoice - Test some methods', function ( test ) {

	var testInvoice = new Invoice();

	// Test both methods for their deafult values
	test.equal( testInvoice['items/getTotal']('endPrice'), 0 );
	test.equal( testInvoice['items/getTotal']('tax'), 0 );

  // Create a new item and add it to the invoice
  var units     = 10;
  var unitPrice = 500;
  var tax       = 30;

  var newItem = new InvoiceListItem({
  	units: units,
  	unitPrice: unitPrice,
  	tax: tax
  });

  var items = testInvoice.getReactiveValue('items');

  testInvoice.setReactiveValue('items', items.concat([newItem]) );

  // Test both methods again.
  test.equal( testInvoice['items/getTotal']('endPrice'), units * unitPrice );
  test.equal( testInvoice['items/getTotal']('tax'), testInvoice['items/getTotal']('endPrice') * tax / 100 );

});

Tinytest.add('Animal - Test some methods', function( test ) {

	var randomAnimal = new Animal();
	var randomAnimalType = randomAnimal.getType();
	test.equal( randomAnimal.makeSound(), '"grrrrr!" says: ' + randomAnimalType );

	var doggy = new Animal({ rcType: 'dog', age: 4 });
	test.equal( doggy.howl(), 'AAUUUIIII' );
	test.equal( doggy.getAgeInDogYears(), 28 );

});

Tinytest.add('setReactiveValueWithTypecasting()', function( test ) {

	var testPerson = new Person({ rcType: 'worker', age: 50, name: 'Josef' });

	test.equal( testPerson.getReactiveValue('age'), 50 );
	test.equal( testPerson.getReactiveValue('name'), 'Josef' );

	test.throws(function(){
		testPerson.setReactiveValue('age', '55');
	});

	test.throws(function(){
		testPerson.setReactiveValue('birthDate', '1971 january 1');
	});

	test.throws(function(){
		testPerson.setReactiveValue('happy', 'true');
	});

	test.throws(function(){
		testPerson.setReactiveValue('name', 123456 );
	});

	testPerson.setReactiveValueWithTypecasting('age', '55' );

	test.equal( testPerson.getReactiveValue('age'), 55 );

	testPerson.setReactiveValueWithTypecasting('birthDate', '1971 january 1' );

	test.equal( testPerson.getReactiveValue('birthDate').valueOf(), new Date('1971 january 1').valueOf() );

	testPerson.setReactiveValueWithTypecasting('happy', 'true' );

	test.equal( testPerson.getReactiveValue('happy'), true );

	testPerson.setReactiveValueWithTypecasting('happy', 'false' );

	test.equal( testPerson.getReactiveValue('happy'), false );

	testPerson.setReactiveValue('happy', true );

	testPerson.setReactiveValueWithTypecasting('happy', '0' );

	test.equal( testPerson.getReactiveValue('happy'), false );

	testPerson.setReactiveValue('happy', true );

	testPerson.setReactiveValueWithTypecasting('happy', 0 );

	test.equal( testPerson.getReactiveValue('happy'), false );

	testPerson.setReactiveValueWithTypecasting('name', 123456 );

	test.equal( testPerson.getReactiveValue('name'), '123456' );

});

Tinytest.add('getCurrentTypeMethods()', function ( test ) {

	var methodsDefinedInConstructor = _( Person.constructorDefaults().typeStructure )
	.findWhere({ type: 'child'} ).methods;

	var child = new Person({});

	var methods = child.getCurrentTypeMethods();

	// All methods should be functions.
	// And they should be the same as the one's which have been
	// defined in the constructor.
	_.each(methods, function( method, methodName ){
		// Method is a function?
		test.equal( typeof method, 'function' );
		// Method is also in the constructor?
		test.equal( typeof methodsDefinedInConstructor[methodName], 'function' );
	});

});

Tinytest.add('getGlobalMethods()', function( test ) {

	var animal = new Animal();

	test.isTrue( Match.test( animal.getGlobalMethods().makeSound, Function ) );
	test.isTrue( Match.test( animal.getGlobalMethods().makeLoudNoise, Function ) );

	test.equal( animal.getGlobalMethods().makeLoudNoise.call(animal), animal.makeLoudNoise() );
	test.equal( animal.getGlobalMethods().makeSound.call(animal), animal.makeSound() );


});

Tinytest.add('getCurrentTypeStructure()', function ( test ) {

	// Construct a new item for all these constructors
	var constructorsToCreate = [ Person, InvoiceListItem, Invoice, Client ];

	_.each(constructorsToCreate, function( constructor ){
		// Create new instance
		var item = new constructor();
		// Get the default structure
		var structureDefinedInClass = constructor.constructorDefaults().typeStructure[0].fields;
		// Get the structure from the getCurrentTypeStructure method
		var structure = item.getCurrentTypeStructure();
		_.each(structure, function( structureType, key ){
			// Compare the stringified version of the constructor methods
			// to the ones returned frmo the getCurrentTypeStructure method
			test.equal( structureDefinedInClass[key].toString(), structureType.toString() );
		});
	});

});

Tinytest.add('setReactiveValue()', function ( test ) {

	var testInvoice = new Invoice();
	var resultFromSetting;

	var newValues = {
		invoiceName: 'new name!',
		currency: 'US $ Dollars',
		client: new Client(),
		items: [ new InvoiceListItem(), new InvoiceListItem() ],
		superCool: true
	};

	_.each(newValues, function( newValue, key ){
		resultFromSetting = testInvoice.setReactiveValue( key, newValue );
		test.equal( resultFromSetting, newValue );
	});

	var testPerson = new Person();

	newValues = {
		name: 'Name of a cool person',
		title: 'CEO of something cool',
		age: 50,
		children: [ new Person() ]
	};

	_.each(newValues, function( newValue, key ){
		resultFromSetting = testPerson.setReactiveValue( key, newValue );
		test.equal( resultFromSetting, newValue );
	});

});

Tinytest.add('setReactiveValue() - wrong type should throw errors', function ( test ) {

	var testInvoice = new Invoice();

	var wrongValueTypes = {
		invoiceName: 5012,
		currency: false,
		client: 'new Client()',
		items: [ 'new InvoiceListItem()', new InvoiceListItem() ],
		superCool: function () {}
	};

	_.each(wrongValueTypes, function( wrongTypeValue, key ){
		test.throws(function () {
			testInvoice.setReactiveValue( key, wrongTypeValue );
		});
	});

});

Tinytest.add('getReactiveValue()', function ( test ) {

	var initValues = {
		invoiceName: 'new name!',
		currency: 'US $ Dollars',
		client: new Client(),
		items: [ new InvoiceListItem(), new InvoiceListItem() ],
		superCool: true
	};

	var testInvoice = new Invoice( initValues );

	_.each(initValues, function( value, key ) {
		test.equal( testInvoice.getReactiveValue( key ), value );
	});

});

Tinytest.add('unsetReactiveValue()', function( test ) {

	// Let's get an invoice to test the method on
	var testInvoice = new Invoice();

	// Let's add a client to the invoice, and make sure we can get it as well
	var newClient = new Client();
	testInvoice.setReactiveValue('client', newClient);
	test.equal( testInvoice.getReactiveValue('client'), newClient );

	// Now let's unset it!
	testInvoice.unsetReactiveValue('client');
	test.equal( testInvoice.getReactiveValue('client'), undefined );

	// Let's test some other types of values as well
	var newValues = {
		invoiceName: 'new name!',
		currency: 'US $ Dollars',
		client: new Client(),
		items: [ new InvoiceListItem(), new InvoiceListItem() ],
		superCool: true
	};

	_.each( newValues, function( value, key ){
		testInvoice.setReactiveValue( key, value );
		test.equal( testInvoice.getReactiveValue( key ), value );
		testInvoice.unsetReactiveValue(key);
		test.equal( testInvoice.getReactiveValue(key), undefined );
	});

});


Tinytest.add('checkReactiveValues()', function( test ) {

	var testPerson = new Person();
	var testAnimal = new Animal();
	var testInvoice = new Invoice();

	test.isTrue( testPerson.checkReactiveValues() );
	test.isTrue( testAnimal.checkReactiveValues() );
	test.isTrue( testInvoice.checkReactiveValues() );

	test.throws(function() {
		testPerson.checkReactiveValues({ age: 'wrong type', name: 7355380 });
	});
	test.throws(function() {
		testAnimal.checkReactiveValues({ numberOfLegs: 'four', hasBrain: function() {} });
	});
	test.throws(function() {
		testInvoice.checkReactiveValues({ items: ['yes'] });
	});

});


Tinytest.add('checkReactiveValueType()', function ( test ) {

	var testPerson = new Person();

	var checkValues = {
		name: 'A sweet sweet name',
		title: 'Dr. Prince of Bel Air',
		age: 87,
		children: [ new Person(), new Person() ]
	};

	_.each(checkValues, function( value, key ){
		test.isTrue( testPerson.checkReactiveValueType( key, value ) );
	});

	var testInvoiceListItem = new InvoiceListItem();

	checkValues = {
		itemName: 'Item Name of the item',
		units: 500,
		unitPrice: 750,
		unitDescription: 'hours',
		tax: 25,
		taxDescription: 'tax'
	};

	_.each(checkValues, function( value, key ){
		test.isTrue( testInvoiceListItem.checkReactiveValueType( key, value ) );
	});

});

Tinytest.add('checkReactiveValueType() - wrong type should throw errors', function ( test ) {

	var wrongValueTypes = {
		name: 50,
		title: function() {},
		age: '50',
		children: ['sweet child o mine']
	};

	_.each(wrongValueTypes, function( wrongTypeValue, key ){
		test.throws(function () {
			testInvoice.checkReactiveValueType( key, wrongTypeValue );
		});
	});

	var testInvoiceListItem = new InvoiceListItem();

	wrongValueTypes = {
		itemName: 50,
		units: '500',
		unitPrice: function() {},
		unitDescription: new Person(),
		tax: false,
		taxDescription: true
	};

	_.each(wrongValueTypes, function( wrongTypeValue, key ){
		test.throws(function () {
			testInvoiceListItem.checkReactiveValueType( key, wrongTypeValue );
		});
	});

});

Tinytest.add('getDataAsObject()', function ( test ) {

	// Test a crippled cat.
	var testAnimal = new Animal({ rcType: 'crippledCat' });

	test.equal( testAnimal.getDataAsObject(), {
		rcType: 'crippledCat',
		hasBrain: true,
		canMove: true,
		lifeExpectancyInYears: 18,
		numberOfLegs: 3,
		age: 12
	});

	var childAge = 50;

	var testPerson = new Person({
		children: [ new Person({
			age: childAge
		}) ]
	});

	var reactiveChild = testPerson.getReactiveValue('children')[0];
	var plainChild = testPerson.getDataAsObject().children[0];

	// The item in the children array should be a Person
	test.instanceOf( reactiveChild, Person );

	// Since it is also made from a reactive constructor it should have
	// some of the methods from the reactive constructor.
	test.instanceOf( reactiveChild.getReactiveValue, Function );
	test.equal( reactiveChild.getReactiveValue('age'), childAge );

	// The plain object and the reactive object should have the same ages.
	test.equal( plainChild.age, reactiveChild.getReactiveValue('age') );

	// The "getDataAsObject" method should just return the plain data structure
	test.instanceOf( plainChild, Object );

	// The plain child should not have get/setReactiveValue methods
	test.throws(function () {
		plainChild.getReactiveValue('age');
	});
	test.throws(function () {
		plainChild.setReactiveValue('age', 50);
	});

});


Tinytest.add('prepareDataToCorrectTypes()', function ( test ) {

	var initData = {
		items: [{
			itemName: '',
			units: 50,
			unitPrice: 700,
			unitDescription: 'timmar',
			tax: 25,
			taxDescription: 'moms'
		}]
	};

	var testInvoice = new Invoice( initData );

	// The nested InvoiceListItem (which was defined as a plain object)
	// shoule now be an actual instance of the InvoiceListItem constructor
	test.instanceOf( testInvoice.getReactiveValue('items')[0], InvoiceListItem );
	test.equal( testInvoice.getReactiveValue('items')[0].getReactiveValue('units'), initData.items[0].units );

});

Tinytest.add('getDefaultValues()', function ( test ) {

	var testPerson = new Person();

	test.equal( testPerson.getDefaultValues().toString(), Person.constructorDefaults().typeStructure[0].defaultData.toString() );

});

Tinytest.add('setupInitValues()', function ( test ) {

	var testClient = new Client();

	var theDefaultItems = Client.constructorDefaults().typeStructure[0];

	var defaultItemsLength = _( theDefaultItems.defaultData ).keys().length;

	test.notEqual( testClient.setupInitValues(), theDefaultItems.defaultData );
	test.notEqual( _( testClient.setupInitValues() ).keys().length, defaultItemsLength );
	test.isTrue( _( testClient.setupInitValues() ).keys().length > defaultItemsLength );

});

Tinytest.add('setType()', function ( test ) {

	var testPerson = new Person();

	var typeKey = 'child';

	test.equal( testPerson.setType({ rcType: typeKey }), typeKey );
	test.equal( testPerson.getType(), typeKey );

});

Tinytest.add('setType() - throw error when trying to set a type which is not defined', function ( test ) {

	var testClient = new Client();

	test.throws(function () {
		testClient.setType({ rcType: 'THIS IS NOT A CORRECT TYPE!' });
	});

	test.throws(function () {
		testClient.setType({ rcType: function () { return 'cool type dude'; } });
	});

});

Tinytest.add('getType()', function ( test ) {

	var testClient = new Client();
	var defaultType = Client.constructorDefaults().typeStructure[0].type;
	test.equal( testClient.getType(), defaultType );

	var testPerson = new Person();
	defaultType = Person.constructorDefaults().typeStructure[0].type;
	test.equal( testPerson.getType(), defaultType );

	var testInvoice = new Invoice();
	defaultType = Invoice.constructorDefaults().typeStructure[0].type;
	test.equal( testInvoice.getType(), defaultType );

	testPerson.setType({ rcType: 'child' });
	test.equal( testPerson.getType(), 'child' );

});

Tinytest.add('duplicate constructor name should throw errer', function( test ) {
	// There is already a Person constructor defined, so this should trow an error
	test.throws(function() {
		Person = new ReactiveConstructor( function Person() {});
	});
});

Tinytest.add('Global fields - setting global fields for constructor', function( test ) {

	var dog = new Animal({ rcType: 'dog' });
	var duck = new Animal({ rcType: 'duck' });
	var crippledCat = new Animal({ rcType: 'crippledCat' });
	var amoeba = new Animal({ rcType: 'amoeba' });

	test.equal( dog.getType(), 'dog' );
	test.equal( duck.getType(), 'duck' );
	test.equal( crippledCat.getType(), 'crippledCat' );
	test.equal( amoeba.getType(), 'amoeba' );

	test.equal( dog.getReactiveValue('hasBrain'), true );
	test.equal( amoeba.getReactiveValue('hasBrain'), false );
	test.equal( crippledCat.getReactiveValue('numberOfLegs'), 3 );
	test.equal( duck.getReactiveValue('numberOfLegs'), 2 );

});

Tinytest.add('Global fields - setting (and overwriting) global default values for constructor', function( test ) {

	var dog = new Animal({ rcType: 'dog' });
	var duck = new Animal({ rcType: 'duck' });
	var amoeba = new Animal({ rcType: 'amoeba' });

	test.equal( dog.getReactiveValue('canMove'), true );
	test.equal( duck.getReactiveValue('canMove'), true );
	test.equal( amoeba.getReactiveValue('canMove'), true );
	test.equal( amoeba.getReactiveValue('hasBrain'), false );

	test.equal( dog.getReactiveValue('lifeExpectancyInYears'), 10 );
	test.equal( duck.getReactiveValue('lifeExpectancyInYears'), 10 );
	test.equal( amoeba.getReactiveValue('lifeExpectancyInYears'), 0.1 );

});

Tinytest.add('getTypeNames()', function( test ) {

	test.equal( Person.getTypeNames(), ['worker', 'ranger', 'husband', 'wife', 'child']);
	test.equal( Client.getTypeNames(), ['client']);
	test.equal( Invoice.getTypeNames(), ['invoice']);
	test.equal( InvoiceListItem.getTypeNames(), ['invoiceListItem']);
	test.equal( Animal.getTypeNames(), ['dog', 'crippledCat', 'duck', 'amoeba']);

});

Tinytest.add('getConstructorOfKey()', function(test) {

	var dog = new Animal({ rcType: 'dog' });

	// Should work for basic data types such as Booleans/String/Numbers etc.
	test.equal( dog.getConstructorOfKey('canMove'), Boolean );
	test.equal( dog.getConstructorOfKey('age'), Number );
	test.equal( dog.getConstructorOfKey('name'), String );

	// Should also be able to return other reactive constructors
	test.equal( dog.getConstructorOfKey('bestFriend'), Animal );
	test.equal( dog.getConstructorOfKey('owner'), Person );

	// Should also be able to get value from arrays
	test.equal( dog.getConstructorOfKey('pals'), Animal );
	test.equal( dog.getConstructorOfKey('petDoctorInvoices'), Invoice );

	// Let's do some more tests
	var testPerson = new Person({ rcType: 'worker' });
	var testClient = new Client();

	test.equal( testPerson.getConstructorOfKey('name'), String );
	test.equal( testPerson.getConstructorOfKey('birthDate'), Date );
	test.equal( testPerson.getConstructorOfKey('age'), Number );
	test.equal( testPerson.getConstructorOfKey('children'), Person );

	test.equal( testClient.getConstructorOfKey('clientName'), String );
	test.equal( testClient.getConstructorOfKey('adressStreet'), String );
	test.equal( testClient.getConstructorOfKey('staff'), Person );

});

Tinytest.add('getConstructorNameOfKey()', function(test) {

	var dog = new Animal({ rcType: 'dog' });

	// Should work for basic data types such as Booleans/String/Numbers etc.
	test.equal( dog.getConstructorNameOfKey('canMove'), 'Boolean' );
	test.equal( dog.getConstructorNameOfKey('age'), 'Number' );
	test.equal( dog.getConstructorNameOfKey('name'), 'String' );

	// Should also be able to return other reactive constructors
	test.equal( dog.getConstructorNameOfKey('bestFriend'), 'Animal' );
	test.equal( dog.getConstructorNameOfKey('owner'), 'Person' );

	// Should also be able to get value from arrays
	test.equal( dog.getConstructorNameOfKey('pals'), 'Animal' );
	test.equal( dog.getConstructorNameOfKey('petDoctorInvoices'), 'Invoice' );

	// Let's do some more tests
	var testPerson = new Person({ rcType: 'worker' });
	var testClient = new Client();

	test.equal( testPerson.getConstructorNameOfKey('name'), 'String' );
	test.equal( testPerson.getConstructorNameOfKey('birthDate'), 'Date' );
	test.equal( testPerson.getConstructorNameOfKey('age'), 'Number' );
	test.equal( testPerson.getConstructorNameOfKey('children'), 'Person' );

	test.equal( testClient.getConstructorNameOfKey('clientName'), 'String' );
	test.equal( testClient.getConstructorNameOfKey('adressStreet'), 'String' );
	test.equal( testClient.getConstructorNameOfKey('staff'), 'Person' );

});

var TestPlugin;

Tinytest.add('Plugins - Init new plugin', function(test) {

	// Passing non functions
	test.throws(function() {
		TestPlugin = new ReactiveConstructorPlugin({
			initConstructor: 'Should be a function, not a string!',
			initInstance: { throw: 'error', equals: true }
		});
	});

	TestPlugin = new ReactiveConstructorPlugin({
		initConstructor: function( passedConstructor ) { return passedConstructor; },
		initInstance: function( instance ) { return instance; },
	});

});

Tinytest.add('Plugins - Override setReactiveValue', function(test) {

	var overrideValue = ' overridden!';

	TestPlugin.setReactiveValue = function( instance, key, value, ordMethod ) {
		value += overrideValue;
		return ordMethod( instance, key, value );
	};

	var testPerson = new Person();

	var newName = 'New name';

	testPerson.setReactiveValue('name', newName);

	test.equal( testPerson.getReactiveValue('name'), newName+overrideValue );

});
