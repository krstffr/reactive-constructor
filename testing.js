var throttleTime = 800;

if (Meteor.isClient) {

  Client = function ( initData ) {

    var that = this;
    
    that.initData = initData;

    that.initReactiveValues();

  };

  Client = ReactiveClass( Client, {
    clientName: String,
    adress: Object
  });

  client = new Client({
    clientName: 'String',
    adress: {}
  });

  InvoceListItem = function ( initData ) {

    var that = this;
    
    that.initData = initData;

    that.endPrice = function ( context ) {
      return that.getReactiveValue('units') * that.getReactiveValue('unitPrice');
    };

    that.priceAfterTax = function () {
      return that.endPrice() * (( that.getReactiveValue('tax') / 100)+1);
    };

    that.initReactiveValues();
    
  };

  InvoceListItem = ReactiveClass( InvoceListItem, {
    itemName: String,
    units: Number,
    unitPrice: Number,
    unitDescription: String,
    tax: Number,
    taxDescription: String
  });

  Invoice = function( initData ) {

    var that = this;

    that.initData = initData;

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

  };

  Invoice = ReactiveClass( Invoice, {
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

  Template.invoiceTestTemplate.events({
    'click .change-val': function () {
      this.setReactiveValue('itemName', this.getReactiveValue('itemName') + '_X' );
      this.setReactiveValue('tax', this.getReactiveValue('tax')+1 );
    },
    'click button': function () {
      invoice1.setReactiveValue('currency', invoice1.getReactiveValue('currency').split("").reverse().join("") );
    },
    'keyup input': _.throttle(function ( e ) {
      invoice1.setReactiveValue('currency', $(e.currentTarget).val() );
    }, throttleTime )
  });

}












