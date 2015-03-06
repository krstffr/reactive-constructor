if (Meteor.isServer)
  return false;

Person = ReactiveClass(function Person( initData, type ) {

  var that = this;

  that.initData = {};

  that.type = type || 'child';

  if (that.type === 'worker') {
    that.defaultData = {
      name: 'Kristoffer',
      children: []
    };
  }
  if (that.type === 'child') {
    that.defaultData = {
      age: 15,
      parents: []
    };
  }

  _(that.initData).extend( that.defaultData, initData );

  that.initReactiveValues();

}, [{
  type: 'worker',
  fields: {
    name: String,
    children: ['self']
  }
}, {
  type: 'child',
  fields: {
    age: Number,
    parents: ['self']
  }
}
]);

person = new Person({ name: 'Stoffe K' }, 'worker');
person2 = new Person({}, 'child');

Client = ReactiveClass( function Client( initData ) {

  var that = this;
  
  that.initData = {};

  that.defaultData = {
    clientName: 'New client',
    adressStreet: '',
    staff: []
  };

  _(that.initData).extend( that.defaultData, initData );

  that.initReactiveValues();

}, {
  clientName: String,
  adressStreet: String,
  staff: [Person]
});

client = new Client();

client.setReactiveValue('staff', [ person ] );

InvoceListItem = ReactiveClass(function InvoceListItem ( initData ) {

  var that = this;
  
  that.initData = {};

  that.defaultData = {
    itemName: '',
    units: 0,
    unitPrice: 700,
    unitDescription: 'timmar',
    tax: 25,
    taxDescription: 'moms'
  };

  _(that.initData).extend( that.defaultData, initData );

  that.endPrice = function ( context ) {
    return that.getReactiveValue('units') * that.getReactiveValue('unitPrice');
  };

  that.priceAfterTax = function () {
    return that.endPrice() * (( that.getReactiveValue('tax') / 100)+1);
  };

  that.initReactiveValues();
  
}, {
  itemName: String,
  units: Number,
  unitPrice: Number,
  unitDescription: String,
  tax: Number,
  taxDescription: String
});

Invoice = ReactiveClass(function Invoice ( initData ) {

  var that = this;

  that.initData = {};

  that.defaultData = {
    invoiceName: 'KK000',
    currency: 'SEK',
    items: [],
    client: new Client(),
    invoices: []
  };

  _(that.initData).extend( that.defaultData, initData );

  // Invoice items
  that.items = {};

  that.items.key = 'items';

  that.items.addItem = function ( itemOptions ) {
    var items = that.getReactiveValue( that.items.key ) || [];
    items.push( new InvoceListItem() );
    return that.setReactiveValue( that.items.key, items );
  };

  that.items.getTotal = function ( key ) {
    var items = that.getReactiveValue( that.items.key );
    return _.reduce(items, function( memo, item ){
      if (typeof item[key] === 'function')
        return memo + item[key]();
      return memo + item[key];
    }, 0);
  };

  that.initReactiveValues();

}, {
  invoiceName: String,
  currency: String,
  items: [InvoceListItem],
  client: Client,
  invoices: ['self']
});

invoice1 = new Invoice();

invoice1.setReactiveValue('client', client );

invoices = new ReactiveVar( [ invoice1 ] );

Template.invoiceTestTemplate.helpers({
  person: function () {
    return person;
  },
  invoice: function () {
    return invoice1;
  },
  client: function () {
    return client;
  },
  invoices: function () {
    return invoices.get();
  }
});

Handlebars.registerHelper('getTemplateFromType', function () {

  if (!this.type || !this.key)
    return 'editTemplate';

  // Is it a string? Return the basic template
  if (this.type === 'String' || this.type === 'Number')
    return 'editTemplate__String';

  // Is it a collection of items?
  if (this.type.search(/Collection_/g) > -1)
    return 'editTemplate__Collection';

  return 'editTemplate';

});

Template.editTemplate.helpers({
  data: function () {

    // The default values should return the value of this
    if (this.type.search(/String|Number/g) > -1)
      return this;
    
    // Collections should return the value of this
    if (this.type.search(/Collection_/g) > -1)
      return this;

    // Else the "actual value" should be returned!
    return this.value;

  }
});

Template.editTemplate.events({
  // Method for adding new items to a collection
  'click .temp-add-new-coll-item': function ( e ) {

    e.stopImmediatePropagation();

    var newItem = new window[this.type.replace(/Collection_/g, '')]();

    var items = Template.currentData().getReactiveValue( this.key );
    
    items.push( newItem );

    Template.currentData().setReactiveValue( this.key, items );

  },
  // Method for updating the value of a property on keyup!
  'blur input': function ( e ) {

    e.stopImmediatePropagation();
    var value = $(e.currentTarget).val();

    if (this.type === 'Number')
      value = parseFloat( value, 10 );

    Template.currentData().setReactiveValue( this.key, value );

  }
});









