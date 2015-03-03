var throttleTime = 800;
var defKey = 'currency';
var defVal = 'SEK';

if (Meteor.isClient) {

  InvoceListItem = function ( options ) {

    this.reactiveData = new ReactiveVar( options );

    this.setValue = function ( key, value ) {
      var newVal = this.reactiveData.get();
      newVal[ key ] = value;
      this.reactiveData.set( newVal );
      return this.checkValues();
    };

    this.getValue = function ( key ) {
      return this.reactiveData.get()[key];
    };

    this.endPrice = function ( context ) {
      return this.getValue('units') * this.getValue('unitPrice');
    };

    this.priceAfterTax = function () {
      return this.endPrice() * (( this.getValue('tax') / 100)+1);
    };

    this.checkValues = function () {

      check(this.reactiveData.get(), {
        itemName: String,
        units: Number,
        unitPrice: Number,
        unitDescription: String,
        tax: Number,
        taxDescription: String
      });

      check( this.priceAfterTax(), Number );

      check( this.endPrice(), Number );

      return true;

    };

    this.checkValues();
    
  };

  Invoice = function( defValue ) {

    var that = this;

    that.something = 1;

    that.reactiveData = new ReactiveVar({ something: 1 });

    that.setValue = function ( key, value ) {
      var newVal = that.reactiveData.get();
      newVal[ key ] = value;
      return that.reactiveData.set( newVal );
    };

    that.getValue = function ( key ) {
      return that.reactiveData.get()[key];
    };

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

      var items = that.getValue( that.items.key ) || [];
      items.push( new InvoceListItem( itemOptions ) );

      return that.setValue(that.items.key, items );

    };

    that.items.getTotal = function ( key ) {
      
      var items = that.getValue(that.items.key);

      return _.reduce(items, function( memo, item ){
        if (typeof item[key] === 'function')
          return memo + item[key]();
        return memo + item[key];
      }, 0);

    };

    that.init = function () {

      console.log('init by setting something to: "' + defValue + '"');
      that.setValue('something', defValue );

      that.setValue(defKey, defValue );

      console.log('adding an item as well!');
      that.items.addItem( that.items.defaultItem );

    }();

  };

  invoice1 = new Invoice( defVal );

  Template.invoiceTestTemplate.helpers({
    invoice: function () {
      return invoice1;
    }
  });

  Template.invoiceTestTemplate.events({
    'click .change-val': function () {
      this.setValue('itemName', this.getValue('itemName') + '_X' );
      this.setValue('tax', this.getValue('tax')+1 );
    },
    'click button': function () {
      invoice1.setValue('something', invoice1.getValue('something').split("").reverse().join("") );
    },
    'keyup input': _.throttle(function ( e ) {
      invoice1.setValue('something', $(e.currentTarget).val() );
    }, throttleTime )
  });

}












