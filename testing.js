Invoices = new Meteor.Collection('invoices');

if (Meteor.isServer)
  return false;

Person = ReactiveClass(function Person( initData, type ) {

  var that = this;

  that.initData = initData || {};

  that.type = type || 'worker';

  that.initReactiveValues();

}, [{
  type: 'worker',
  fields: {
    name: String,
    title: String,
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
  
  that.initData = initData || {};

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

  that.defaultData = {
    itemName: '',
    units: 0,
    unitPrice: 700,
    unitDescription: 'timmar',
    tax: 25,
    taxDescription: 'moms'
  };

  that.initData = _( that.defaultData ).extend( initData || {} );

  that.endPrice = function ( context ) {
    return that.getReactiveValue('units') * that.getReactiveValue('unitPrice');
  };

  that.priceAfterTax = function () {
    return that.endPrice() * (( that.getReactiveValue('tax') / 100)+1);
  };

  that.tax = function () {
    return that.priceAfterTax() - that.endPrice();
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

  that.defaultData = {
    invoiceName: 'KK000',
    currency: 'SEK',
    items: [],
    client: new Client(),
    invoices: []
  };

  that.initData = _( that.defaultData ).extend( initData || {} );

  // Invoice items
  that.items = {};

  that.items.getTotal = function ( key ) {
    var items = that.getReactiveValue( 'items' );
    return _.reduce(items, function( memo, item ){
      if (typeof item[key] === 'function')
        return memo + item[key]();
      return memo + item[key];
    }, 0);
  };

  that.items.getTaxPercentage = function () {
    return (that.items.getTotal('tax') / that.items.getTotal('endPrice') * 100 || 0).toFixed(1);
  };

  that.saveInvoice = function () {
    var dataToSave = that.getDataAsObject();
    return Invoices.upsert( { _id: dataToSave._id }, dataToSave );
  };

  that.initReactiveValues();

}, {
  _id: String,
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

  },
  className: function () {
    return this.constructor.name;
  }
});

Template.invoiceTestTemplate.events({
  'click .edit-invoice': function ( e, tmpl ) {
    
    e.stopImmediatePropagation();

    Blaze.renderWithData( Template.editTemplate, this, document.body );

  }
});

Template.editTemplate.events({
  'click .save': function () {
    return this.saveInvoice();
  },
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









