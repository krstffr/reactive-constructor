var throttleTime = 800;
var defKey = 'currency';
var defVal = 'SEK';

if (Meteor.isClient) {

  InvoceListItem = function ( initData ) {
    
    this.initData = initData;

    this.endPrice = function ( context ) {
      return this.getReactiveValue('units') * this.getReactiveValue('unitPrice');
    };

    this.priceAfterTax = function () {
      return this.endPrice() * (( this.getReactiveValue('tax') / 100)+1);
    };

    this.initReactiveValues();
    
  };

  InvoceListItem = ReactiveClass( InvoceListItem, {
    itemName: String,
    units: Number,
    unitPrice: Number,
    unitDescription: String,
    tax: Number,
    taxDescription: String
  });

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
      this.setReactiveValue('itemName', this.getReactiveValue('itemName') + '_X' );
      this.setReactiveValue('tax', this.getReactiveValue('tax')+1 );
    },
    'click button': function () {
      invoice1.setValue('something', invoice1.getValue('something').split("").reverse().join("") );
    },
    'keyup input': _.throttle(function ( e ) {
      invoice1.setValue('something', $(e.currentTarget).val() );
    }, throttleTime )
  });

}












