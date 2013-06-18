/*global define */

define(['ledger', 'dashboard/router', 'dashboard/controller', 'backbone', 'marionette', 'vent', 'jquery', 'underscore'], 
  function(Ledger, Router, Controller, Backbone, Marionette, vent, $, _) {
  'use strict';

  var Dashboard = Ledger.module('Dashboard');

  // Initializer
  // -----------
  Dashboard.addInitializer(function() {
		var controller = new Controller(),
		    router = new Router({	controller: controller });
	
		controller.router = router;
	
		// Immediately start the dashboard controller (home page)
    controller.start();
  
    this.listenTo(router, 'route', function(page) {
      vent.trigger('section:activated', {name: 'dashboard'});
    });
  });
  
  return Dashboard;
});