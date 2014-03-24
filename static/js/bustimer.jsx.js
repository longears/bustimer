/** @jsx React.DOM */

//--------------------------------------------------------------------------------
// CONFIG

var UI_UPDATE = 2; // update UI every this many seconds
var JSON_UPDATE = 20; // fetch new data every this many seconds
var ROUTE_TO_COLOR_MAP = {
    '#default': '#ddd',
    // actransit
    'NL': '#f99',
    'B': '#ad8',
    'NX': '#bbf',
    'NX1': '#bbf',
    // bart
    'PITT': '#ee8',
    'RICH': '#f66',
    'MLBR': '#f66',
    'DALY': '#ee8',
};

//--------------------------------------------------------------------------------
// UTILS

var epochTimeToRelativeHumanMinutes = function(epochTime) {
    var now = (new Date).getTime();
    var minutes = Math.round((epochTime - now) / 1000 / 60);
    return minutes
};

var epochTimeToTimeOfDay = function(epochTime) {
    //var d = new Date(epochTime);
    //return d.getHours() + ':' + d.getMinutes()
    return moment(epochTime).format('h:mm a');
};

var toTitleCase = function(str) {
    return str.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
};

var SetIntervalMixin = {
    componentWillMount: function() {
        this.intervals = [];
    },
    setInterval: function() {
        this.intervals.push(setInterval.apply(null, arguments));
    },
    componentWillUnmount: function() {
        this.intervals.map(clearInterval);
    }
};

//--------------------------------------------------------------------------------

var BoardRow = React.createClass({displayName: 'BoardRow',
    // props:
    //      route
    //      epochTime
    //      walkTimeMs
    render: function() {
        // color late rows differently
        var now = (new Date).getTime();
        if (this.props.epochTime - this.props.walkTimeMs < now) {
            className = 'busRow tooLate';
        } else {
            className = 'busRow';
        }
        // color by route
        var background = ROUTE_TO_COLOR_MAP[this.props.route];
        if (background === undefined) {
            background = ROUTE_TO_COLOR_MAP['#default'];
        }
        // title-case long route names
        var route = this.props.route;
        if (route.length >= 4) {
            route = toTitleCase(route);
        }
        return (
            React.DOM.div(
                {className:className,
                style:{background: background},
                key:this.props.route+'-'+this.props.epochTime}
            , 
                React.DOM.div( {className:"busRowCell busRowRouteName"}, route),
                React.DOM.div( {className:"busRowCell busRowRelativeTime"}, epochTimeToRelativeHumanMinutes(this.props.epochTime - this.props.walkTimeMs), " m"),
                React.DOM.div( {className:"busRowCell busRowAbsoluteTime"}, epochTimeToTimeOfDay(this.props.epochTime - this.props.walkTimeMs))
            )
        );
    }
});

//--------------------------------------------------------------------------------

var BoardHeader = React.createClass({displayName: 'BoardHeader',
    // props:
    //      stopName
    //      includeWalkTime
    //      lastUpdated // epoch time of last data update
    //      handleWalkTimeButtonClick
    //      handleRefreshClick
    render: function() {
        // decide appearance of walk time button
        var walkTimeButtonStateClass;
        var walkTimeButtonText;
        if (this.props.includeWalkTime) {
            walkTimeButtonStateClass = 'walkTimeButtonEnabled';
            walkTimeButtonText = 'start walking in...';
        } else {
            walkTimeButtonStateClass = 'walkTimeButtonDisabled';
            walkTimeButtonText = 'bus leaves in...';
        }

        // decide appearance of loading indicator and build it
        var now = (new Date).getTime();
        var secondsSinceUpdate = (now - this.props.lastUpdated) / 1000;
        var lastUpdatedDiv;
        if (secondsSinceUpdate <= JSON_UPDATE + 2) {
            lastUpdatedDiv = undefined;
        } else {
            var icon = '\u21bb';
            lastUpdatedDiv = React.DOM.div(
                {onClick:this.props.handleRefreshClick,
                onTouchStart:this.props.handleRefreshClick,
                className:"lastUpdated"}, 
                    icon
            )
        }

        return (
            React.DOM.div( {className:"boardHeader"}, 
                lastUpdatedDiv,
                React.DOM.div( {className:"boardTitle"}, this.props.stopName),
                React.DOM.div( {className:"walkTimeGroup"}, 
                    React.DOM.div( {className:"walkTimeLabel"}),
                    React.DOM.a( {href:"#",
                        className:'walkTimeButton ' + walkTimeButtonStateClass,
                        onClick:this.props.handleWalkTimeButtonClick,
                        onTouchStart:this.props.handleWalkTimeButtonClick}
                    , 
                        walkTimeButtonText
                    )
                )
            )
        );
    }
});

//--------------------------------------------------------------------------------

var Board = React.createClass({displayName: 'Board',
    mixins: [SetIntervalMixin],
    // props:
    //    stopName="Transbay Terminal"
    //    agency="actransit"
    //    routesAndStops="B:1410350,NX1:1410350,NL:1410340"
    //    walkTimeMinutes={20}
    getInitialState: function() {
        return {
            timeAndRouteList: [], // list of [epochTime, routeId] for each bus for all stops
            lastUpdated: 0,
            includeWalkTime: false,
        };
    },
    componentDidMount: function() {
        var that = this;
        this.setInterval(this.fetchJson, JSON_UPDATE * 1000);
        this.setInterval(function() {that.forceUpdate()}, UI_UPDATE * 1000);
        this.fetchJson();
    },
    handleWalkTimeButtonClick: function(e) {
        e.preventDefault();
        this.setState({includeWalkTime: !this.state.includeWalkTime});
    },
    handleRefreshClick: function(e) {
        e.preventDefault();
        this.fetchJson();
    },
    fetchJson: function() {
        if (this.props.agency == 'bart') {
            // assume all stops are the same
            var stop = this.props.routesAndStops[0][1];
            var interestingRoutes = this.props.routesAndStops.map(function(item) {return item[0]});
            var url = 'http://api.bart.gov/api/etd.aspx?cmd=etd&orig='+stop+'&key=MW9S-E7SL-26DU-VV8V';
            console.log('fetching... ');
            var that = this;
            $.get(url, function(result) {
                console.log('        ...fetched');
                var now = (new Date).getTime();
                var routeXMLs = $(result).find('root station etd');
                var timeAndRouteList = [];
                for (var rr=0; rr < routeXMLs.length; rr++) {
                    var routeXML = routeXMLs[rr];
                    var route = $(routeXML).find('abbreviation').text();
                    var predictions = $(routeXML).find('estimate');
                    for (var pp=0; pp < predictions.length; pp++) {
                        var prediction = predictions[pp];
                        var minutes = $(prediction).find('minutes').text();
                        if (minutes == 'Leaving') {
                            minutes = 0
                        } else {
                            minutes = parseInt(minutes,10);
                        }
                        var epochTime = now + minutes * 60 * 1000;
                        timeAndRouteList.push([epochTime, route]);
                    }
                }
                timeAndRouteList.sort(function(a,b) {return a[0]-b[0]});

                // filter out routes we don't care about
                timeAndRouteList = timeAndRouteList.filter(function(item) {
                    return interestingRoutes.indexOf(item[1]) > -1;
                });

                that.setState({
                    timeAndRouteList: timeAndRouteList,
                    lastUpdated: now
                });
            });
        } else { // actransit or other nextbus agencies
            var nbStyleRoutesAndStops = this.props.routesAndStops.map(function(item) {return item[0]+':'+item[1]}).join(',');
            var url = 'http://restbus.info/api/agencies/'+this.props.agency+'/tuples/'+nbStyleRoutesAndStops+'/predictions';
            console.log('fetching... ');
            var that = this;
            $.get(url, function(result) {
                console.log('        ...fetched');
                var timeAndRouteList = [];
                for (var ii=0; ii < result.length; ii++) {
                    var routePredictions = result[ii];
                    var routeId = routePredictions.route.id;
                    var epochTimes = [];
                    for (var pp=0; pp < routePredictions.values.length; pp++) {
                        var prediction = routePredictions.values[pp];
                        epochTimes.push(prediction.epochTime);
                        timeAndRouteList.push([prediction.epochTime, routeId]);
                    }
                }
                timeAndRouteList.sort(function(a,b) {return a[0]-b[0]});
                that.setState({
                    timeAndRouteList: timeAndRouteList,
                    lastUpdated: (new Date).getTime()
                });
            });
        }
    },
    render: function() {
        // make list of busRow elems
        var walkTimeMs = this.props.walkTimeMinutes * 60 * 1000 * this.state.includeWalkTime;
        var busRows = [];
        for (var ii = 0; ii < this.state.timeAndRouteList.length; ii++) {
            var epochTime = this.state.timeAndRouteList[ii][0];
            var routeId = this.state.timeAndRouteList[ii][1];
            busRows.push(BoardRow(
                {route:routeId,
                epochTime:epochTime,
                walkTimeMs:walkTimeMs}
            ));
        }

        return (
            React.DOM.div( {className:"boardContainer"}, 
                BoardHeader(
                    {stopName:this.props.stopName,
                    includeWalkTime:this.state.includeWalkTime,
                    lastUpdated:this.state.lastUpdated,
                    handleWalkTimeButtonClick:this.handleWalkTimeButtonClick,
                    handleRefreshClick:this.handleRefreshClick}
                ),
                React.DOM.div( {className:"busRowContainer"}, busRows)
            )
        );

    }
});

//--------------------------------------------------------------------------------

var BoardGroup = React.createClass({displayName: 'BoardGroup',
    // props:
    //      title
    render: function() {
        return React.DOM.div( {className:"boardGroup"}, 
            React.DOM.div( {className:"boardGroupTitle"}, this.props.title),
            React.DOM.div( {className:"boardGroupContents"}, this.props.children)
        )
    }
});

var OverallInterface = React.createClass({displayName: 'OverallInterface',
    render: function() {
        return React.DOM.div( {className:"overallInterfaceChild"}, 
            BoardGroup( {title:"Morning"}, 
                Board(
                    {stopName:"Heart & Dagger Saloon",
                    agency:"actransit",
                    routesAndStops:[['NL','9902310'], ['B','9902310'], ['NX','9902310']],
                    walkTimeMinutes:11}
                ),
                Board(
                    {stopName:"Los Cantaros",
                    agency:"actransit",
                    routesAndStops:[['NL','1011830']],
                    walkTimeMinutes:8}
                ),
                Board(
                    {stopName:"19th St BART",
                    agency:"bart",
                    routesAndStops:[['MLBR','19TH'], ['SFIA','19TH'], ['DALY','19TH']],
                    walkTimeMinutes:27}
                )
            ),
            BoardGroup( {title:"Evening"}, 
                Board(
                    {stopName:"Transbay Terminal",
                    agency:"actransit",
                    routesAndStops:[['B','1410350'], ['NX1','1410350'], ['NL','1410340']],
                    walkTimeMinutes:20}
                ),
                Board(
                    {stopName:"Embarcadero BART",
                    agency:"bart",
                    routesAndStops:[['PITT','EMBR'], ['RICH','EMBR']],
                    walkTimeMinutes:15}
                )
            )
        )
    }
});

//--------------------------------------------------------------------------------
// MAIN

// grand lake
React.renderComponent(
    OverallInterface(null ),
    document.getElementById('slot')
);
