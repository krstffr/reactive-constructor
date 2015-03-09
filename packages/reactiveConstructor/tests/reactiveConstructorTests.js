Tinytest.add('Person – Init constructors without params', function (test) {
	
	var defaultData = new Person().typeStructure[0].defaultData;
	var defaultDataKeys = _( defaultData ).keys();
	var testPerson = new Person();

	_.each(defaultDataKeys, function( key ){

		// Make sure the defaults values are correct.
		// Also make sure you can get the reactive values of these and
		// that those are correct.
		test.equal( testPerson.getDataAsObject()[key], defaultData[key] );
		test.equal( testPerson.getReactiveValue(key), defaultData[key] );
	
	});

});


Tinytest.add('Invoice – Init constructors without params', function (test) {
	
	var defaultData = new Invoice().typeStructure[0].defaultData;
	var defaultDataKeys = _( defaultData ).keys();
	var testInvoice = new Invoice();

	_.each(defaultDataKeys, function( key ){

		// Make sure the defaults values are correct.
		test.equal( testInvoice.getReactiveValue(key), defaultData[key] );
	
	});

});


Tinytest.add('Invoice – Init constructors with some params', function (test) {
	
	var setValues = {
		invoiceName: 'A name set from here',
		currency: 'SEK',
		superCool: true
	};

	var setKeys = _( setValues ).keys();

	// The invoice with the set values
	var testInvoice = new Invoice('invoice', setValues );

	_.each(setKeys, function( key ){
		// Make sure the set values match
		test.equal( testInvoice.getReactiveValue(key), setValues[key] );
	});

});

Tinytest.add('Invoice / invoiceListItem – Throw errors when using wrong types', function (test) {
	
	test.throws(function () {
		new Invoice('invoice', { currency: 1.23 });
	});
	
	test.throws(function () {
		new Invoice('invoice', { invoiceName: function() {} });
	});

	test.throws(function () {
		new Invoice('invoice', { items: 'a string' });
	});

	test.throws(function () {
		new Invoice('invoice', { superCool: 0 });
	});

	test.throws(function () {
		new Invoice('invoice', { client: new Invoice() });
	});

	test.throws(function () {
		new Invoice('invoice', { items: new invoiceListItem() });
	});

	test.throws(function () {
		new InvoceListItem('invoice', { units: true });
	});

	test.throws(function () {
		new InvoceListItem('invoice', { units: [{ wrong: 'type this is!' }] });
	});

	test.throws(function () {
		new InvoceListItem('invoice', { unitPrice: function() { return 1; } });
	});

});


Tinytest.add('Invoice – Test some methods', function (test) {
	
	var testInvoice = new Invoice();

	// Test both methods for their deafult values
  test.equal( testInvoice.items.getTotal('endPrice'), 0 );
  test.equal( testInvoice.items.getTotal('tax'), 0 );

  // Create a new item and add it to the invoice
  var units     = 10;
	var unitPrice = 500;
	var tax       = 30;

	var newItem = new InvoceListItem('invoiceListItem', {
		units: units,
		unitPrice: unitPrice,
		tax: tax
	});

  var items = testInvoice.getReactiveValue('items');

  testInvoice.setReactiveValue('items', items.concat([newItem]) );

  // Test both methods again.
  test.equal( testInvoice.items.getTotal('endPrice'), units * unitPrice );
  test.equal( testInvoice.items.getTotal('tax'), testInvoice.items.getTotal('endPrice') * tax / 100 );

});