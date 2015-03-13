Schedule = new ReactiveConstructor(function Schedule( initData ) {

  this.initData = initData || {};

  this.getFirstDayOfWeekFromDate = function ( date ) {
    return moment().set('week', moment( date ).get('week') ).startOf('isoweek')._d;
  };

  this.typeStructure = [{
    type: 'schedule',
    fields: {
      startDate: Date,
      rows: Number,
      weeksPerRow: Number,
      people: String
    },
    defaultData: {
      startDate: this.getFirstDayOfWeekFromDate( new Date() ),
      rows: 25,
      weeksPerRow: 2,
      people: 'Stina & Kristoffer, William, Marie'
    }
  }];

  this.getRows = function () {

    // For using the schedules' methods inside the underscore chain
    var that = this;

    var people = that.getReactiveValue('people').split(',');

    // Create an array with X array items using underscores _range
    // method from the rective 'rows' value.
    // Then iterate over each item and return a start/end date from
    // the iterator multiplied by the reactive value 'weeksPerRow'.
    // Use moment.js to add and subtract weeks (and 1 day for endDate)
    return _.chain( _.range( this.getReactiveValue('rows') ) )
    .map(function ( iteratorNum ) {

      var personToClean = people[ iteratorNum % people.length ];
      
      // Get the current weeks to add to the start date and end dates
      var weeksToAdd = iteratorNum * that.getReactiveValue('weeksPerRow');
      
      // Add the weeks to the start date to generate the startDate
      var startDate = moment( that.getReactiveValue('startDate') )
      .add( weeksToAdd, 'weeks')._d;

      // Add another weeksPerRow - 1 day to get the end date.
      var endDate = moment( startDate )
      .add( weeksToAdd + that.getReactiveValue('weeksPerRow'), 'weeks')
      .subtract(1, 'days')._d;

      return { startDate: startDate, endDate: endDate, personToClean: personToClean };

    })
    .value();

  };

  this.initReactiveValues();

});

// Create the schedule which will be used in the template.
schedule = new Schedule();

// Method for formatting date the way we want to in the template.
formatDate = function ( date ) {
  return moment( date ).format('D MMMM YYYY');
};

// Some template helpers
Template.schedule.helpers({
  schedule: function () {
    return schedule;
  },
  formatDate: formatDate,
  formatReactiveDate: function ( reactiveKey ) {
    var date = this.getReactiveValue( reactiveKey );
    return formatDate( date );
  },
});

// Some template events
Template.schedule.events({
  'click .set-start-date': function () {
    var userInput = prompt('What start date? Examples: 2015-03-25, 25 mars 2015.');
    if (!userInput)
      return false;
    this.setReactiveValue('startDate', new Date( userInput ) );
  },
  'click .set-weeks-per-row': function () {
    var userInput = prompt('How many weeks per row?');
    if (!userInput)
      return false;
    this.setReactiveValue('weeksPerRow', parseInt( userInput, 10 ) );
  },
  'click .set-people': function () {
    var userInput = prompt(
      'How should clean the stairs? (comma separated)',
      this.getReactiveValue('people')
      );

    if (!userInput)
      return false;

    this.setReactiveValue('people', userInput );
  },
  'click .set-rows': function () {
    var userInput = prompt('How many rows you need?');
    if (!userInput)
      return false;
    this.setReactiveValue('rows', parseInt( userInput, 10 ) );
  },
  'click .do-print-schedule': function () {
    return window.print();
  }
});