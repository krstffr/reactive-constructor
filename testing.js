if (Meteor.isServer)
  return false;

var throttleTime = 800;

Client = ReactiveClass( function Client( initData ) {

  var that = this;
  
  that.initData = {};

  that.defaultData = {
    clientName: '',
    adressStreet: ''
  };

  _(that.initData).extend( that.defaultData, initData );

  that.initReactiveValues();

}, {
  clientName: String,
  adressStreet: String
});

client = new Client({
  clientName: 'A cool client',
  adressStreet: 'Vikingagatan 19'
});

InvoceListItem = ReactiveClass(function InvoceListItem ( initData ) {

  var that = this;
  
  that.initData = {};

  that.defaultData = {
    itemName: '',
    units: 0,
    unitPrice: 0,
    unitDescription: '',
    tax: 25,
    taxDescription: ''
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
    currency: 'SEK',
    items: []
  };

  _(that.initData).extend( that.defaultData, initData );

  // Invoice items
  that.items = {};

  that.items.key = 'items';

  that.items.defaultItem = {
    itemName: 'Default item',
    units: 35,
    unitPrice: 700,
    unitDescription: 'hours',
    tax: 25,
    taxDescription: 'moms'
  };

  that.items.addItem = function ( itemOptions ) {
    var items = that.getReactiveValue( that.items.key ) || [];
    items.push( new InvoceListItem( itemOptions ) );
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
  that.items.addItem( that.items.defaultItem );

}, {
  currency: String,
  items: [InvoceListItem],
  client: Client
});

invoice1 = new Invoice({
  currency: 'SEK',
  items: [],
  client: client
});

Template.invoiceTestTemplate.helpers({
  invoice: function () {
    return invoice1;
  },
  client: function () {
    return client;
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
    // The default values
    if (this.type.search(/String|Number/g) > -1)
      return this;
    // Collections
    if (this.type.search(/Collection_/g) > -1)
      return this;
    console.log('not a string/number or collection: ', this.type );
    console.log('So: return the value instead!');
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









