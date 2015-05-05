// Create a reactive constructor which can be used in tests.
Person = new ReactiveConstructor(function Person() {

  this.initReactiveValues( arguments[0] );

}, function () {
  return {
    typeStructure: [{
      type: 'worker',
      fields: {
        name: String,
        title: String,
        birthDate: Date,
        age: Number,
        children: [ Person ]
      },
      defaultData: {
        name: 'Kristoffer Klintberg',
        title: 'Designer',
        birthDate: new Date('2015 01 01'),
        age: 30,
        children: []
      }
    }, {
      type: 'husband',
      fields: {
        wife: Person
      }
    }, {
      type: 'wife',
      fields: {
        happy: Boolean
      }
    }, {
      type: 'child',
      fields: {
        age: Number,
        parents: [ Person ]
      },
      methods: {
        isTeenager: function () {
          var age = this.getReactiveValue('age');
          return age > 12 && age < 20;
        },
        getAgePlus: function ( years ) {
          check( years, Number );
          return this.getReactiveValue('age') + years;
        },
        addYears: function ( years ) {
          check( years, Number );
          var age = this.getReactiveValue('age');
          return this.setReactiveValue('age', age + years );
        }
      }
    }]
  }; 
});



// A generic "Client"
Client = new ReactiveConstructor( function Client() {

  this.initReactiveValues( arguments[0] );

}, function () {
  return {
    typeStructure: [{
      type: 'client',
      fields: {
        clientName: String,
        adressStreet: String,
        staff: [Person]
      },
      defaultData: {
        clientName: 'new client'
      }
    }]
  }});


// A generic "Invoice"
Invoice = new ReactiveConstructor(function Invoice () {

  var that = this;

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
    return (
      that.items.getTotal('tax') /
      that.items.getTotal('endPrice') * 100 ||
      0
      ).toFixed(1);
  };

  that.saveInvoice = function () {
    var dataToSave = that.getDataAsObject();
    return Invoices.upsert( { _id: dataToSave._id }, dataToSave );
  };

  that.initReactiveValues( arguments[0] );

}, function () {
  return {
    typeStructure: [{
      type: 'invoice',
      fields: {
        _id: String,
        invoiceName: String,
        currency: String,
        items: [ InvoiceListItem ],
        client: Client,
        invoices: [ Person ],
        superCool: Boolean
      },
      defaultData: {
        invoiceName: 'KK000',
        items: [],
        currency: 'USD',
        client: new Client(),
        invoices: [],
        superCool: false
      }
    }]
  };
});




// A generic "InvoiceListItem"
InvoiceListItem = new ReactiveConstructor(function InvoiceListItem () {

  var that = this;

  that.endPrice = function () {
    return that.getReactiveValue('units') * that.getReactiveValue('unitPrice');
  };

  that.priceAfterTax = function () {
    return that.endPrice() * (( that.getReactiveValue('tax') / 100)+1);
  };

  that.tax = function () {
    return that.priceAfterTax() - that.endPrice();
  };

  that.initReactiveValues( arguments[0] );
  
}, function () {
  return {
    typeStructure: [{
      type: 'invoiceListItem',
      fields: {
        itemName: String,
        units: Number,
        unitPrice: Number,
        unitDescription: String,
        tax: Number,
        taxDescription: String
      },
      defaultData: {
        itemName: '',
        units: 0,
        unitPrice: 700,
        unitDescription: 'timmar',
        tax: 25,
        taxDescription: 'moms'
      }
    }]
  };
});







Animal = new ReactiveConstructor(function Animal () {

  this.initReactiveValues( arguments[0] );

}, function () {
  return {
    globalValues: {
      fields: {
        numberOfLegs: Number,
        hasBrain: Boolean,
        canMove: Boolean,
        lifeExpectancyInYears: Number
      },
      defaultData: {
        hasBrain: true,
        canMove: true,
        lifeExpectancyInYears: 10
      }
    },
    typeStructure: [{
      type: 'dog',
      defaultData: {
        hasBrain: true
      }
    }, {
      type: 'crippledCat',
      defaultData: {
        numberOfLegs: 3,
        lifeExpectancyInYears: 7
      }
    }, {
      type: 'duck',
      defaultData: {
        numberOfLegs: 2,
        hasBrain: true
      }
    }, {
      type: 'amoeba',
      defaultData: {
        hasBrain: false,
        numberOfLegs: 0,
        lifeExpectancyInYears: 0.1
      }
    }]
  };
});