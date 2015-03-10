# reactive-constructor [![Build Status](https://travis-ci.org/krstffr/reactive-constructor.svg)](https://travis-ci.org/krstffr/reactive-constructor)

This is a package for creating reactive-by-default objects. And what does that mean? Basically that the objects created from your reactive constructors get specific set and get methods which enable reactivity.

For example, let's say you have an ```Invoice``` object, which in turn has a couple of ```InvoiceListItem``` objects in it which has a ```name```, a ```price``` and a ```tax``` property. Let's say you want that Invoice object to automatically compute the sum of all the items ```price``` and ```tax``` values, and always has this value up to date no matter when an individual Item object is added, removed or changed. 

This would be super simple using reactive-constructor. Just do this:

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


// TODO: Create two list items which will be part of the invoice
// TODO: Create the invoice
// TODO: Change reactive values

```
