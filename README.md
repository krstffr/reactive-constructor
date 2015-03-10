# reactive-constructor [![Build Status](https://travis-ci.org/krstffr/reactive-constructor.svg)](https://travis-ci.org/krstffr/reactive-constructor)

This is a package for creating reactive-by-default objects. And what does that mean? Basically that the objects created from your reactive constructors get specific set and get methods which enable reactivity. These methods (which are the methods you'll use the most) are ```getReactiveValue( key )``` and ```getReactiveValue( key, newValue )```.

For example, let's say you have an ```Invoice``` object, which in turn has a couple of ```InvoiceListItem``` objects in it which has a ```name```, a ```price``` and a ```tax``` property. Let's say you want that Invoice object to automatically compute the sum of all the items ```price``` and ```tax``` values, and always has this value up to date no matter when an individual Item object is added, removed or changed. 

This would be super simple using reactive-constructor. Just do the following (this example is also in the /examples/example-2/ dir):

```javascript

// Create the Invoice constructor
Invoice = ReactiveConstructor(function Invoice ( initData ) {
  
  // You need to set this.initData to the passed initData
  // (Maybe this will be updated in the future.)
  this.initData = initData;
  
  // Define the structure of this object.
  // You can have multiple types of invoices if you want,
  // but in this case we'll only have one.
  this.typeStructure = [{
    type: 'invoice',
    fields: {
      items: [InvoiceListItem],
    }
  }];
  
  // Here's a method for getting the total value of the
  // invoice list items price value
  this.getEndPrice = function() {
    var items = this.getReactiveValue( 'items' );
    return _.reduce(items, function( memo, item ){
      return memo + item.getReactiveValue('price');
    }, 0);
  };
  
  // This method needs to be called like this.
  // (Maybe this will be updated in the future.)
  this.initReactiveValues();

});

// …and setup the InvoiceListItem constructor
InvoiceListItem = ReactiveConstructor(function InvoiceListItem ( initData ) {

  this.initData = initData;
  
  this.typeStructure = [{
    type: 'invoiceListItem',
    fields: {
      itemName: String,
      price: Number,
      tax: Number
    }
  }];
  
  this.initReactiveValues();

});

// Here we create the items which will be in the invoice…
var listItem1 = new InvoiceListItem({
  itemName: "Cup of coffe",
  price: 5,
  tax: 1
});
var listItem2 = new InvoiceListItem({
  itemName: "A cupcake",
  price: 7,
  tax: 1.4
});

// …and here we create the invoice itself.
var invoice = new Invoice({
  items: [ listItem1, listItem2 ]
});

// endPrice() will now always return the sum of the 
// invoice list items price var. So right now it's 12…
console.log( invoice.getEndPrice() );
// …but when I update one of the items values here…
listItem1.setReactiveValue('price', 10);
// …and now it should be 17.
console.log( invoice.getEndPrice() );

// This also works if we add another item to the invoice list items.
var items = invoice.getReactiveValue('items');
items.push( new InvoiceListItem({ price: 100 }) );
var items = invoice.getReactiveValue('items', items );
// …and now it should be 117.
console.log( invoice.getEndPrice() );

// This will update the value of the first two items every second,
// which will be reflected in the template.
Meteor.setInterval(function () {
  listItem1.setReactiveValue('price', Math.ceil( Math.random() * 100) );
  listItem2.setReactiveValue('price', Math.ceil( Math.random() * 100) );
}, 1000);

// Here we just bind the invoice helper in the template to our invoice
Template.exampleTemplate.helpers({
  invoice: function () {
    return invoice;
  }
});

```

```HTML

<template name="exampleTemplate">

	{{#with invoice }}

		<ul>
		{{#each getReactiveValue 'items' }}
			<li>${{ getReactiveValue 'price' }}</li>
		{{/each}}

		<li><strong>${{ getEndPrice }}</strong> total</li>
		</ul>

	{{/with}}
	
</template>

```

## Setting up a reactive constructor

EXPLAIN WHAT NEEDS TO BE DONE!

## Type safety

This package forces you to make rather strict choices about what type of values can be stored.
NEEDS MORE TEXT!
