/*global define */

define([
    'tpl!charting/template-chart-container.html', 
    'nvd3',
    'backbone', 'marionette', 'vent', 'jquery', 'underscore'], 
  function(ChartTemplate, nv, Backbone, Marionette, vent, $, _) {
  'use strict';

  // Income vs. Expenditure Chart View
  // -----------
  //
  // Display an nvd3 chart of income vs. spending.
  var IncomeVsExpenditureChartView = Marionette.ItemView.extend({
    template: ChartTemplate,
		
    initialize: function() {
      this.listenTo(this.collection, 'all', this.buildChart, this);
      this.listenTo(vent, 'controls:groupby', this.groupBy.bind(this));
    },
    
    onRender: function() {
      this.buildChart();
    },

    // Group the chart data by the given date period (day, month, year)
    groupBy: function(groupBy) {
      this.options.groupBy = groupBy.name;
      this.buildChart();
    },

    buildChart: function() {
      if (this.collection.length == 0) { 
        return;
      }
      
      var dateRange = this.collection.getDateRange(),
          sourceData = this.chartData(dateRange),
          dateFormatting = this.dateFormatString(this.options.groupBy);

      nv.addGraph(function() {
        var chart = nv.models.multiBarChart()        
          .stacked(true)
          .x(function(d) { return d.date })
          .y(function(d) { return d.total });

        chart.xAxis
          .axisLabel('Date')
          .showMaxMin(true)
          .tickFormat(function(d) { return d3.time.format(dateFormatting)(new Date(d)); });

        chart.yAxis
          .axisLabel('Amount')
          .tickFormat(d3.format(',.1f'));

        d3.select("#chart svg")
          .datum(sourceData)
          .transition()
          .call(chart);

        return chart;
      });
    },
    
    dateFormatString: function(granularity) {
      switch (granularity) {        
        case 'day': return '%d/%m/%Y';
        case 'month': return '%B %Y';
        case 'year': return '%Y';
      }
      
      throw 'Date range granularity "' + granularity + '" is not supported';		  
    },
    
    chartData: function(dateRange) {
      var income = this.collection.filter(function(entry) { return entry.isIncome(); }),
          expenses = this.collection.filter(function(entry) { return entry.isExpense(); });
      
      var incomeByDate = this.totalByDate(dateRange.between(this.options.groupBy), income, 'Income'),
          expensesByDate = this.totalByDate(dateRange.between(this.options.groupBy), expenses, 'Expenses');
            
      return [
        { key: 'Income', values: incomeByDate }, 
        { key: 'Expenses', values: expensesByDate }
      ];
    },
    
    // Total amount for each date in the given range
    totalByDate: function(dateRange, entries, type) {
      return _.map(dateRange, function(date) {
        return {
          date: date,
          total: this.totalByDateAndAccount(entries, date, type)
        };
      }, this);
    },
    
    totalByDateAndAccount: function(entries, date, type) {
      var total = 0;

      _.each(entries, function(entry) {
        if (entry.groupBy(this.options.groupBy) === date.getTime()) {
          total += entry.totalByAccount(type) * -1  // Invert amounts
        }
      }, this);

      return total;
		}
  });
  
  return {
    IncomeVsExpenditureChartView: IncomeVsExpenditureChartView
  };
});