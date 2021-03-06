var setLanguage = function ( lang ) {
  TAPi18n.setLanguage(lang)
  .done(function () {
    moment.locale(lang);
    schedule.setReactiveValue('weeks', schedule.getReactiveValue('weeks') );
  })
  .fail(function ( errorMessage ) {
    console.log( errorMessage );
  });
};

var getFirstDayOfWeekFromDate = function ( date ) {
  return moment().set('week', moment( date ).get('week') ).startOf('isoweek')._d;
};

Meteor.startup(function () {

  setLanguage('sv');

});

Schedule = new ReactiveConstructor('Schedule', function() {
  return {
    globalValues: {
      methods: {
        getRows: function () {

          // For using the schedules' methods inside the underscore chain
          var that = this;

          var people = that.getReactiveValue('people').split(',');

          var showWeeksOrMonths = that.getReactiveValue('showWeeksOrMonths');

          // Create an array with X array items using underscores _range
          // method from the rective 'rows' value.
          // Then iterate over each item and return a start/end date from
          // the iterator multiplied by the reactive value 'weeksPerRow'.
          // Use moment.js to add and subtract weeks (and 1 day for endDate)
          return _.chain( _.range( this.getReactiveValue('rows') ) )
          .map(function ( iteratorNum ) {

            var returnObject = {
              personToClean: people[ iteratorNum % people.length ]
            };

            if (showWeeksOrMonths === 'weeks') {
              
              // Get the current weeks to add to the start date and end dates
              var weeksToAdd = iteratorNum * that.getReactiveValue('weeksPerRow');
              
              // Add the weeks to the start date to generate the startDate
              returnObject.startDate = moment( that.getReactiveValue('startDate') )
              .add( weeksToAdd, 'weeks')._d;

              // Add another weeksPerRow - 1 day to get the end date.
              returnObject.endDate = moment( returnObject.startDate )
              .add( that.getReactiveValue('weeksPerRow'), 'weeks')
              .subtract(1, 'days')._d;

            }

            if (showWeeksOrMonths === 'months') {

              returnObject.startDate = moment( that.getReactiveValue('startDate') )
              .add( iteratorNum, 'months')
              .startOf('month')._d;

            }

            return returnObject;

          })
          .value();

        }
      }
    },
    typeStructure: [{
      type: 'schedule',
      fields: {
        startDate: Date,
        rows: Number,
        weeksPerRow: Number,
        people: String,
        showWeeksOrMonths: String,
        weirdNestedSchedule: Schedule
      },
      defaultData: {
        startDate: getFirstDayOfWeekFromDate( new Date() ),
        rows: 25,
        weeksPerRow: 2,
        showWeeksOrMonths: 'weeks',
        people: 'Stina & Kristoffer, William, Marie'
      }
    }]
  };
});

// Create the schedule which will be used in the template.
schedule = new Schedule();

// Method for formatting date the way we want to in the template.
formatDate = function ( date ) {
  if (schedule.getReactiveValue('showWeeksOrMonths') === 'weeks')
    return moment( date ).format('D MMMM YYYY');
  var dateString = moment( date ).format('MMMM YYYY');
  return dateString.charAt(0).toUpperCase() + dateString.slice(1);
};

// Some template helpers
Template.schedule.helpers({
  showWeeks: function() {
    return schedule.getReactiveValue('showWeeksOrMonths') === 'weeks';
  },
  schedule: function () {
    return schedule;
  },
  formatDate: formatDate,
  formatReactiveDate: function ( reactiveKey ) {
    var date = this.getReactiveValue( reactiveKey );
    return formatDate( date );
  },
  languages: function () {
    return _( TAPi18n.getLanguages() ).toArray();
  }
});

// Some template events
Template.schedule.events({
  'click .set-display-to-weeks': function() {
    return this.setReactiveValue('showWeeksOrMonths', 'weeks');
  },
  'click .set-display-to-months': function() {
    return this.setReactiveValue('showWeeksOrMonths', 'months');
  },
  'click .set-start-date': function () {
    var userInput = prompt( TAPi18n.__('prompt_change_date') );
    if (!userInput)
      return false;
    this.setReactiveValue('startDate', new Date( userInput ) );
  },
  'click .set-weeks-per-row': function () {
    var userInput = prompt( TAPi18n.__('prompt_change_weeks_per_row') );
    if (!userInput)
      return false;
    this.setReactiveValue('weeksPerRow', parseInt( userInput, 10 ) );
  },
  'click .set-people': function () {
    var userInput = prompt( TAPi18n.__('prompt_change_people'), this.getReactiveValue('people') );

    if (!userInput)
      return false;

    this.setReactiveValue('people', userInput );
  },
  'click .set-rows': function () {
    var userInput = prompt( TAPi18n.__('prompt_change_rows') );
    if (!userInput)
      return false;
    this.setReactiveValue('rows', parseInt( userInput, 10 ) );
  },
  'click .do-print-schedule': function () {
    return window.print();
  },
  'click .lang-switch': function () {
    setLanguage( this.name.toLowerCase().substr(0,2) );
  }
});