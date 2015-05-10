// Create a reactive constructor which can be used in tests.
Person = new ReactiveConstructor('Person', function () {
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
Client = new ReactiveConstructor('Client', function () {
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
  };
});


// A generic "Invoice"
Invoice = new ReactiveConstructor('Invoice', function () {
  return {
    globalValues: {
      methods: {
        'items/getTotal': function ( key ) {
          var items = this.getReactiveValue( 'items' );
          console.log( items, key );
          return _.reduce(items, function( memo, item ){
            if (typeof item[key] === 'function')
              return memo + item[key]();
            return memo + item[key];
          }, 0);
        },
        'items/getTaxPercentage': function () {
          return (
            this['items/getTotal']('tax') /
            this['items/getTotal']('endPrice') * 100 ||
            0
            ).toFixed(1);
        },
        saveInvoice: function () {
          var dataToSave = this.getDataAsObject();
          return Invoices.upsert( { _id: dataToSave._id }, dataToSave );
        }
      }
    },
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
InvoiceListItem = new ReactiveConstructor('InvoiceListItem', function () {
  return {
    globalValues: {
      methods: {
        endPrice: function () {
          return this.getReactiveValue('units') * this.getReactiveValue('unitPrice');
        },
        priceAfterTax: function () {
          return this.endPrice() * (( this.getReactiveValue('tax') / 100)+1);
        },
        tax: function () {
          return this.priceAfterTax() - this.endPrice();
        }
      }
    },
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


Animal = new ReactiveConstructor('Animal', function () {
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