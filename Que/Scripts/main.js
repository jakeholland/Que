/*global $,ko,Parse, parse, console, Chart*/

Parse.initialize("HtZwAbdY7IccFNKh84HeXEzrh5O4KmHb5fmGY0ry", "ahLgmci5A03sn0trzMNz25W5j9srbfgHIyi1pmPP"); // Hide somewhere

// Spark Core login and device grab
spark.login({username: 'jakeholland@me.com', password: 'Th5M0us3'});
spark.on('login', function() {
    spark.listDevices(function(err, devices) {
        var device = devices[0];

        console.log('Device name: ' + device.name);
        console.log('- connected?: ' + device.connected);
        console.log('- variables: ' + device.variables);
        console.log('- functions: ' + device.functions);
        console.log('- version: ' + device.version);
        console.log('- requires upgrade?: ' + device.requiresUpgrade);
    });
});

//-------- Que Controller ----------
var pitGaugeTemp = 0;
var probe1GaugeTemp = 0;
var probe2GaugeTemp = 0;
var probe3GaugeTemp = 0;

var refreshRate = 10000;
var parseResults = {};
var tempObj = {
    labels: [],
    pitTemps: [],
    probe1Temps: [],
    probe2Temps: [],
    probe3Temps: []
};

var settingsObj = {
    type: '',
    active: false
};

var chartData = {
    labels: [],
    series: []
};

// Parse initialization
var Que = Parse.Object.extend("Que");
var que = new Que();
que.id = "oL1PFPa7b3";

// Chatist options 
var options = {
    low: 0
};

getData(updateTemps);

function getData(callback) {
    // Grab the most recent temps.
    var query = new Parse.Query(Que);
    query.equalTo("user", "jakeholland");
    query.find({
        success: function (results) {
            parseResults = results;
            parseResults = parseResults[0].attributes;

            //console.log(parseResults);
            settingsObj = parseResults.settings;
            // Update settings
            settingsView.selectedGrill(settingsObj.type);
            active: dashboardView.active(settingsObj.active);
            callback();
        },
        error: function (error) {
            parseResults = null;
        }
    }); 
}

function updateTemps() {
    // Set the set points
    dashboardView.pitSet(parseResults.setTemps.pitProbe);
    dashboardView.probe1Set(parseResults.setTemps.probe1);
    dashboardView.probe2Set(parseResults.setTemps.probe2);
    dashboardView.probe3Set(parseResults.setTemps.probe3);

    // Set the values of the gauges with the newest one from parse.
    pitGaugeTemp = parseResults.temps[parseResults.temps.length - 1][0];
    probe1GaugeTemp = parseResults.temps[parseResults.temps.length - 1][1];
    probe2GaugeTemp = parseResults.temps[parseResults.temps.length - 1][2];
    probe3GaugeTemp = parseResults.temps[parseResults.temps.length - 1][3];

    var scaler = Math.ceil(parseResults.temps.length / 25); // scale down to 25 values
    
    var i = 0; // init i
    // Go from 0-the scaler value to get scaler amounts of temps (k)
    // Actually get the temps from increments of the scaler value (i)
    var numberOfPoints = Math.ceil(screen.width / 40);
    console.log(numberOfPoints);
    for (var k = 0; k < 25; k++) {
        
        if (i > parseResults.temps.length - 1) {
            i = parseResults.temps.length - 1;
        }
        tempObj.pitTemps[k] = parseResults.temps[i][0];
        tempObj.probe1Temps[k] = parseResults.temps[i][1]
        tempObj.probe2Temps[k] = parseResults.temps[i][2]
        tempObj.probe3Temps[k] = parseResults.temps[i][3]
        tempObj.labels[k] = moment.parseZone(parseResults.temps[i][4]).format("h:mm A");;
        i = i + scaler;
        console.log(tempObj);
    }
    // Make sure the latest is up incase the scaler had to be rounded
    if (i < parseResults.temps.length -1) {
        i = parseResults.temps.length -1;
        tempObj.pitTemps[i] = parseResults.temps[i][0];
        tempObj.probe1Temps[i] = parseResults.temps[i][1]
        tempObj.probe2Temps[i] = parseResults.temps[i][2]
        tempObj.probe3Temps[i] = parseResults.temps[i][3]
        tempObj.labels[i] = moment.parseZone(parseResults.temps[i][4]).format("h:mm A");;
    }
    //console.log(tempObj);

    // Push the chart series to the data series
    chartData.series = []; // Clear the array.
    if (tempObj.pitTemps[0] != 0 && tempObj.pitTemps[tempObj.pitTemps.length] != 0) {
        chartData.series.push(tempObj.pitTemps);
    }
    if (tempObj.probe1Temps[0] != 0 && tempObj.probe1Temps[tempObj.probe1Temps.length] != 0) {
        chartData.series.push(tempObj.probe1Temps);
    }
    if (tempObj.probe2Temps[0] != 0 && tempObj.probe2Temps[tempObj.probe2Temps.length] != 0) {
        chartData.series.push(tempObj.probe2Temps);
    }
    if (tempObj.probe3Temps[0] != 0 && tempObj.probe3Temps[tempObj.probe3Temps.length] != 0) {
        chartData.series.push(tempObj.probe3Temps);
    }
    chartData.labels = tempObj.labels;

    // Setup Views
    if (viewModel.selectedView().title == "Dashboard") {
        setGauges();
    } else if (viewModel.selectedView().title == "Temperature History") {
        new Chartist.Line('.ct-chart', chartData, options);
    }   
}

function sendSetTemps() {
    var setTempsObj = {
        pitProbe: dashboardView.pitSet(),
        probe1: dashboardView.probe1Set(),
        probe2: dashboardView.probe1Set(),
        probe3: dashboardView.probe1Set()
    }
    var tempString = dashboardView.pitSet() + "&" + dashboardView.probe1Set();

    device.callFunction('changeTemps', tempString, function(err, data) {
        if (err) {
            console.log('An error occurred:', err);
        } else {
            console.log('Function called succesfully:', data);
        }
    });
    
    que.set("setTemps", setTempsObj);
    // Save the object to Parse
    que.save();
}

function setGauges() {
    var pitTempGauge = new JustGage({
        id: "pitGauge",
        value: pitGaugeTemp,
        min: 0,
        max: 500,
        title: "Pit",
        showMinMax: false
    });
    var meat1TempGauge = new JustGage({
        id: "meat1Gauge",
        value: probe1GaugeTemp,
        min: 0,
        max: 200,
        title: "Probe 1",
        showMinMax: false
    });

    var meat2TempGauge = new JustGage({
        id: "meat2Gauge",
        value: probe2GaugeTemp,
        min: 0,
        max: 200,
        title: "Probe 2",
        showMinMax: false
    });

    var meat3TempGauge = new JustGage({
        id: "meat3Gauge",
        value: probe3GaugeTemp,
        min: 0,
        max: 200,
        title: "Probe 3",
        showMinMax: false
    });

    // Visible or not?
    dashboardView.shouldShowPitGauge(pitGaugeTemp > 0);
    dashboardView.shouldShowGauge1(probe1GaugeTemp > 0);
    dashboardView.shouldShowGauge2(probe2GaugeTemp > 0);
    dashboardView.shouldShowGauge3(probe3GaugeTemp > 0);
    // Refresh the values of the gauges.
    pitTempGauge.refresh(pitGaugeTemp);
    meat1TempGauge.refresh(probe1GaugeTemp);
    meat2TempGauge.refresh(probe2GaugeTemp);
    meat3TempGauge.refresh(probe1GaugeTemp);
}

// Not implemented anywhere yet
function newUser() {
    var user = new Parse.User();
    user.set("username", "my name");
    user.set("password", "my pass");
    user.set("email", "email@example.com");

    // other fields can be set just like with Parse.Object
    user.set("phone", "415-392-0202");

    user.signUp(null, {
        success: function (user) {
            // Hooray! Let them use the app now.
        },
        error: function (user, error) {
            // Show the error message somewhere and let the user try again.
            alert("Error: " + error.code + " " + error.message);
        }
    });
}

// View constructor
var View = function (title, templateName, data) {
    var self = this;
    this.title = title;
    this.templateName = templateName;
    this.data = data;
};

var dashboardView = {
    shouldShowPitGauge: ko.observable(true),
    shouldShowGauge1: ko.observable(true),
    shouldShowGauge2: ko.observable(true),
    shouldShowGauge3: ko.observable(true),
    pitSet: ko.observable("0"),
    probe1Set: ko.observable("0"),
    probe2Set: ko.observable("0"),
    probe3Set: ko.observable("0"),
    active: ko.observable(false),
    startStopCSS: ko.pureComputed(function () {
        return dashboardView.active() ? 'btn btn-danger' : 'btn btn-success';
    }),
    startStopText: ko.pureComputed(function () {
        return dashboardView.active() ? 'Stop' : 'Start';
    }),
    startStop: function () {
        settingsObj.active = !settingsObj.active;
        dashboardView.active(settingsObj.active);

        var startStop = settingsObj.active 'start':'stop';

        // Save the object to Parse
        device.callFunction('cookStartStop', startStop, function(err, data) {
            if (err) {
                console.log('An error occurred:', err);
            } else {
                console.log('Function called succesfully:', data);
            }
        });
        // Save the object to Parse
        que.set("settings", settingsObj);
        que.save();
    },
    setupView: function () {
        getData(updateTemps);
    }
};

var temperaturehistoryView = {
    setupView: function () {
        getData(updateTemps);
    }
};

var settingsView = {
    selectedGrill: ko.observable(),
    grillTypes: ko.observableArray([{ 'name': "Gas" }, { 'name': "Charcoal" }, { 'name': "Electric" }]),
    saveSettings: function () {
        settingsObj = {
            active: dashboardView.active(),
            type: settingsView.selectedGrill().name
        };
        // Save the object
        que.set("settings", settingsObj);
        que.save();
    },
    setupView: function () {
        getData(); // Make sure the settings object is current
    }
};

//viewModel which consists of multiple subviews
var viewModel = {
    views: ko.observableArray([
        new View("Dashboard", "dashboard", dashboardView),
        new View("Temperature History", "temperaturehistory", temperaturehistoryView),
        new View("Settings", "settings", settingsView)
    ]),
    selectedView: ko.observable(),
    login: function (formElement) {
        console.log(formElement);
        Parse.User.logIn("jakeholland", "Th5M0us3", {
            success: function (user) {
                // Do stuff after successful login.
            },
            error: function (user, error) {
                // The login failed. Check error to see why.
            }
        });
    }
};

$(document).ready(function () {
    ko.transitions = {
        slide: {
            //With callbacks
            right: function (element, callback) {
                element.toggle("slide", {
                    direction: "right"
                }, "medium", callback);
            },
            left: function (element, callback) {
                element.toggle("slide", {
                    direction: "left"
                }, "medium", callback);
            },
            down: function (element, callback) {
                element.toggle("slide", {
                    direction: "down"
                }, "medium", callback);
            },
            up: function (element, callback) {
                element.toggle("slide", {
                    direction: "up"
                }, "medium", callback);
            }
        }
    };

    ko.bindingHandlers.withSlide = {
        init: function (element, valueAccessor, allBindings, viewModel, bindingContext) {
            var $element = $(element);
            var options = valueAccessor();
            var transition = options.transition;
            var observable = options.data;
            var wrapper = ko.observable(observable());
            var mainViewlist = ["dashboard", "temperaturehistory", "settings"];

            var subscription = observable.subscribe(function (value) {
                var current = wrapper();
                var past = current.templateName;
                var next = viewModel.selectedView().templateName;
                //console.log(viewModel.selectedView());
                slideLeft = function () {
                    wrapper(value);
                    transition.left($element, viewModel.selectedView().data.setupView);
                };
                slideRight = function () {
                    wrapper(value);
                    transition.right($element, viewModel.selectedView().data.setupView);
                };
                slideDown = function () {
                    wrapper(value);
                    transition.down($element, viewModel.selectedView().data.setupView);
                };
                slideUp = function () {
                    wrapper(value);
                    transition.up($element, viewModel.selectedView().data.setupView);
                };

                var nextIndex = mainViewlist.indexOf(next),
                    pastIndex = mainViewlist.indexOf(past);
                //slide animation
                if (nextIndex > -1 && pastIndex > -1 && current) {
                    //current main view is to 'left' of next view
                    if (nextIndex < pastIndex) {
                        transition.right($element, slideLeft);
                    } else if (nextIndex > pastIndex) { //current main view is to 'right' of next view
                        transition.left($element, slideRight);
                    }
                } else { //hide and show
                    $element.hide();
                    wrapper(value);
                    $element.show();
                }
            });
            ko.utils.domNodeDisposal.addDisposeCallback(element, function () {
                subscription.dispose();
            });
            ko.applyBindingsToNode(element, {
                with: wrapper
            }, bindingContext);
            return {
                controlsDescendantBindings: true
            };
        }
    };

    // Update the set temps on change
    dashboardView.pitSet.subscribe(function (value) {
        //console.log("Pit Set Temp= " + dashboardView.pitSet());
        sendSetTemps();
    });

    // Sammy route control
    Sammy(function () {
        this.get('#:view', function () {
            var hash = this.params.view;

            var nextViewObjLoc;
            var currViewObjLoc;

            if (viewModel.selectedView()) {
                var counter1 = 0,
                    counter2 = 0;
                ko.utils.arrayFirst(viewModel.views(), function (item) {

                    if (item.templateName === hash) {
                        nextViewObjLoc = counter1;
                    }
                    if (item.templateName === viewModel.selectedView().templateName) {
                        currViewObjLoc = counter2;
                    }
                    counter1++;
                    counter2++;
                });

                //console.log(viewModel.views()[currViewObjLoc].templateName + " to " + viewModel.views()[nextViewObjLoc].templateName);

                if (currViewObjLoc > nextViewObjLoc) {

                    viewModel.selectedView(viewModel.views()[nextViewObjLoc]);
                } else if (currViewObjLoc < nextViewObjLoc) {
                    viewModel.selectedView(viewModel.views()[nextViewObjLoc]);
                }
            } else {
                ko.utils.arrayFirst(viewModel.views(), function (item) {
                    if (item.templateName === hash) {
                        viewModel.selectedView(item);

                    }
                });
            }

            
        });

    }).run('#dashboard');
    
    //Apply knockout bindings
    ko.applyBindings(viewModel);
});

// Force close for mobile view
$(".auto-close").click(function (event) {

    if (screen.width <= 767) {
        event.stopPropagation();
        $(".navbar-collapse").collapse('hide');
    }
});