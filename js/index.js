// Cusom Map JS
// Specific US state configuration data
const STATE_CONFIGURATIONS = {
    Georgia: {
        specific_state_info : './assets/Georgia-data/georgia_March.csv',
        state_name: 'Georgia',
        state_fips: 13,
        map_ratio: 0.5,
        centered_x: 0,
        centered_y: -5
    },
    Texas: {
        specific_state_info : './assets/Texas-data/texas_July.csv',
        state_name: 'Texas',
        state_fips: 48,
        map_ratio: 1.2,
        centered_x: 0,
        centered_y: 11
    },
    Florida: {
        specific_state_info : './assets/Florida-data/florida_July.csv',
        state_name: 'Florida',
        state_fips: 12,
        map_ratio: 0.7,
        centered_x: -20,
        centered_y: 30
    },
    Michigan: {
        specific_state_info : './assets/Michigan-data/michigan_July.csv',
        state_name: 'Michigan',
        state_fips: 26,
        map_ratio: 0.8,
        centered_x: 0,
        centered_y: -2
    }
}
var selectedState = getUrlVars()["state"] == undefined ? 'Georgia' : getUrlVars()["state"];

// --- config --- //
const TOPO_JSON = "./assets/us-counties.topojson";
const US_COUNTIES = "./assets/us-counties.csv";

const CURRENT_STATE = selectedState;
const STATE_NAME = STATE_CONFIGURATIONS[CURRENT_STATE].state_name;
const SPECIFIC_STATE_INFO = STATE_CONFIGURATIONS[CURRENT_STATE].specific_state_info;
const STATE_FIPS = STATE_CONFIGURATIONS[CURRENT_STATE].state_fips;
const MAP_RATIO = STATE_CONFIGURATIONS[CURRENT_STATE].map_ratio;
const CENTERED_X = STATE_CONFIGURATIONS[CURRENT_STATE].centered_x;
const CENTERED_Y = STATE_CONFIGURATIONS[CURRENT_STATE].centered_y;

// var CURRENT_STATE = selectedState;
// var STATE_NAME = STATE_CONFIGURATIONS[CURRENT_STATE].state_name;
// var SPECIFIC_STATE_INFO = STATE_CONFIGURATIONS[CURRENT_STATE].specific_state_info;
// var STATE_FIPS = STATE_CONFIGURATIONS[CURRENT_STATE].state_fips;
// var MAP_RATIO = STATE_CONFIGURATIONS[CURRENT_STATE].map_ratio;
// var CENTERED_X = STATE_CONFIGURATIONS[CURRENT_STATE].centered_x;
// var CENTERED_Y = STATE_CONFIGURATIONS[CURRENT_STATE].centered_y;

const GEORGIA_WALMART_STORES = "./assets/georgia_stores.json";
const WALMART_ICON = "./assets/icons/walmart-white1.png";
const COLOR_1 = "#002f45";
const COLOR_2 = "#12547a";
const COLOR_3 = "#107dc2";
const COLOR_4 = "#44a4aa";
const COLOR_5 = "#8EC07F";
const COLOR_6 = "#cbcb31";
const COLOR_7 = "#fec122";
const COLOR_8 = "#f6914e";
const COLOR_9 = "#f27446";
const COLOR_10 = "#f05d5d";
// ---   end  --- //

var stateInfo = SPECIFIC_STATE_INFO;
var centered;
var zoomable = false;
var georgiaCityData = null;
var georgiaWalmartData = null;

var margin = {
    top: 10,
    bottom: 10,
    left: 10,
    right: 10
}, width = parseInt(d3.select('.georgia-viz').style('width'))
    , width = width - margin.left - margin.right
    , mapRatio = MAP_RATIO
    , height = width * mapRatio
    // , height = $(document).height()
    , active = d3.select(null);

var svg = d3.select('.georgia-viz').append('svg')
    .attr('class', 'center-container georgia-viz-svg')
    .attr('height', height + margin.top + margin.bottom)
    .attr('width', width + margin.left + margin.right);

svg.append('rect')
    .attr('class', 'background center-container')
    .attr('height', height + margin.top + margin.bottom)
    .attr('width', width + margin.left + margin.right)
    .on('click', function (d) {
        const instance = this;
        if (zoomable) {
            clicked(d, instance);
        }
    })

var usMapData = null;

// Promise.resolve(d3.json(TOPO_JSON))
//     .then((us) => {
//         usMapData = us;
//         ready(us, stateInfo);
//     });

d3.json(TOPO_JSON, {
    method: "POST",
    body: '',
    mode: "no-cors",
    headers: {
        "Content-type": "application/json; charset=UTF-8",
        'Access-Control-Allow-Credentials': true,
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'application/json',
    }
}).then((us) => {
    usMapData = us;
    ready(us, stateInfo);
});

toogleZoom();

var projection = d3.geoAlbersUsa()
    .translate([width / 2, height / 2])
    .scale(width);

var path = d3.geoPath()
    .projection(projection);

var g = svg.append("g")
    .attr('class', 'center-container center-items us-state')
    .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')')
    .attr('width', width + margin.left + margin.right)
    .attr('height', height + margin.top + margin.bottom)

var legend_obj = svg.append("g")
    .attr('class', 'legend')
    .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')')
    .attr('width', 200)
    .attr('height', 50)

$('.import-btn').click(function (e) {
    if (e.target.name === 'NoData') {
        stateInfo = './assets/Georgia-data/georgia_' + e.target.name + '.csv';
    } else {
        stateInfo = './assets/Georgia-data/georgia_' + e.target.name + '.csv';
    }
    ready(usMapData, stateInfo);
})

$('.select-state').change(function (e) {
    selectedState = e.target.value;
    console.log(selectedState)
    var route = location.href.toString();
    var newURL = route;
    if (route.split('?state=')[1]) {
        newURL = location.origin + location.pathname + '?state=' + selectedState;
    } else {
        newURL = route + '?state=' + selectedState;    
    }
    location.replace(newURL);
    // initStateConfig(selectedState);
    // ready(usMapData, stateInfo);
})

var usCountiesData = null;
var cityData = null;

function ready(us, stateInfo) {
    d3.csv(US_COUNTIES)
        .then((data) => {
            d3.csv(stateInfo).then((citydata) => {
                usCountiesData = data;
                cityData = citydata;
                mainMapDraw(us, cityData, usCountiesData);
                if (cityData.length == 0) {
                    if(!zoomable) {
                        walMartMark();
                    }
                }
                legend();
            });
        });
}

function mainMapDraw(us, cityData, data) {
    g.append("g")
        .attr("id", "counties")
        .selectAll("path")
        .data(topojson.feature(us, us.objects.counties).features.filter(function (d) {
            var getCounty = window.lodash.filter(data, function (o) {
                return o.id == d.id;
            });
            if (getCounty[0] && getCounty[0].state !== undefined) {
                if (getCounty[0].state === STATE_NAME) {
                    return true;
                } else {
                    return false;
                }
            } else if (getCounty[0] && getCounty[0].state == undefined) {
                return false;
            }
        }))
        .enter().append("path")
        .attr("d", path)
        .attr("class", "county-boundary")
        .style("fill", function (d) {
            if (cityData.length == 0) {
                return '#002F45';
            }
            var getCounty = window.lodash.filter(data, function (o) {
                return o.id == d.id;
            });
            var color = "#002F45";
            if (getCounty[0] && getCounty[0].state !== undefined) {
                if (getCounty[0].state === STATE_NAME) {
                    var getCountyScore = window.lodash.filter(cityData, function (o) {
                        return o.id == getCounty[0].id;
                    });
                    color = getCountyScore.length > 0 ? 
                        colorRange(getCountyScore[0] == undefined ? "#002F45" : getCountyScore[0].CountyScore) : '#002F45';
                } else {
                    color = "#002F45";
                }
            } else if (getCounty[0] && getCounty[0].state == undefined) {
                color = "#fec122";
            }
            return color;
        })
        .on('click', function (d) {
            const instance = this;
            if (zoomable) {
                clicked(d, instance);
            }
        })
        .on("mousemove", function (d) {
            var getCity = window.lodash.filter(data, function (o) {
                return o.id == d.id;
            });
            var getGeorgiaCountyScore = window.lodash.filter(cityData, function (o) {
                return o.id == d.id;
            });

            var html = "";
            html += "<div class=\"tooltip_kv\">";
            html += "<span class=\"tooltip_key\">";
            html += "State: " + getCity[0].state;
            html += "<br/>";
            html += "County: " + getCity[0].county;
            if (getGeorgiaCountyScore[0] !== undefined) {
                html += "<br/>";
                html += "CountyScore: " + getGeorgiaCountyScore[0].CountyScore;
            }
            html += "</span>";
            html += "<span class=\"tooltip_value\">";
            html += "";
            html += "</span>";
            html += "</div>";

            $("#tooltip-container").html(html);
            $(this).attr("fill-opacity", "1.0");
            $("#tooltip-container").show();

            var coordinates = d3.mouse(this);

            var map_width = $('.georgia-viz-svg')[0].getBoundingClientRect().width;
            if (d3.event.layerX < map_width / 2) {
                d3.select("#tooltip-container")
                    .style("top", (d3.event.layerY + 15) + "px")
                    .style("left", (d3.event.layerX + 15) + "px");
            } else {
                var tooltip_width = $("#tooltip-container").width();
                d3.select("#tooltip-container")
                    .style("top", (d3.event.layerY + 15) + "px")
                    .style("left", (d3.event.layerX - tooltip_width - 30) + "px");
            }
        })
        .on("mouseout", function () {
            $(this).attr("fill-opacity", "1.0");
            $("#tooltip-container").hide();
        });

    g.append("g")
        .attr("id", "states")
        .selectAll("path")
        .data(topojson.feature(us, us.objects.states).features)
        .enter().append("path")
        .attr("d", path)
        .attr("class", "state")
        .attr("fill", "none")
        .on('click', function (d) {
            const instance = this;
            if (zoomable) {
                clicked(d, instance);
            }
        })

    g.append("path")
        .datum(topojson.mesh(us, us.objects.states, function (a, b) { return a !== b; }))
        .attr("id", "state-borders")
        .attr("d", path);

    var states = topojson.feature(us, us.objects.states).features;
    var georgia = states.filter(function (d) {
        // list of state FIPS codes
        return d.id === STATE_FIPS;
    });

    centeredMap(georgia[0]);
}

function citiesMark(d) {
    $('.city-marked').css("display", "none");
    d3.csv(SPECIFIC_STATE_INFO).then((cityData) => {
        var getCity = window.lodash.filter(cityData, function (o) {
            return o.id == d.id;
        });

        g.append("g")
            .attr("id", "cities")
            .selectAll("circle")
            .data(getCity)
            .enter().append("circle")
            .attr("class", "county-boundary city-marked city-marked-" + d.id)
            .attr("cx", function (d) {
                return projection([d.Long, d.Lat])[0];
            })
            .attr("cy", function (d) {
                return projection([d.Long, d.Lat])[1];
            })
            .attr("r", function (d) {
                return Math.sqrt(d.CountyScore * 0.01) * 0.5;
            })
            .style("fill", function (d) {
                color = '#' + Math.floor(Math.random() * Math.pow(2, 32) ^ 0xffffff).toString(16).substr(-6);
                return color;
            })
            .style("opacity", 1.0)
            .style("display", "block")
            .style("stroke-width", 0.1)
            .on("click", reset)
            .on("mouseover", function (d) {
                var html = "";
                html += "<div class=\"tooltip_kv\">";
                html += "<span class=\"tooltip_key\">";
                html += "State: " + d.State;
                html += "<br/>";
                html += "County: " + d.County;
                html += "<br/>";
                html += "City: " + d.City;
                html += "<br/>";
                html += "ZipCode: " + d.ZipCode;
                html += "<br/>";
                html += "CountyScore: " + d.CountyScore;
                html += "</span>";
                html += "<span class=\"tooltip_value\">";
                html += "";
                html += "</span>";
                html += "</div>";

                $("#tooltip-container").html(html);
                $(this).attr("fill-opacity", "1.0");
                $("#tooltip-container").show();

                var coordinates = d3.mouse(this);

                var map_width = $('.georgia-viz-svg')[0].getBoundingClientRect().width;
                if (d3.event.layerX < map_width / 2) {
                    d3.select("#tooltip-container")
                        .style("top", (d3.event.layerY + 15) + "px")
                        .style("left", (d3.event.layerX + 15) + "px");
                } else {
                    var tooltip_width = $("#tooltip-container").width();
                    d3.select("#tooltip-container")
                        .style("top", (d3.event.layerY + 15) + "px")
                        .style("left", (d3.event.layerX - tooltip_width - 30) + "px");
                }
            })
            .on("mouseout", function () {
                $(this).attr("fill-opacity", "1.0");
                $("#tooltip-container").hide();
            });


        $('.city-marked-' + d.id).css("display", "block");
    });
}

function legend_line() {
    var x = d3.scaleLinear()
        .domain([1, 10])
        .rangeRound([width - 245, width - 50]);
    var color = d3.scaleThreshold()
        .domain(d3.range(1, 12))
        .range([COLOR_1, COLOR_2, COLOR_3, COLOR_4, COLOR_5, COLOR_6, COLOR_7, COLOR_8, COLOR_9, COLOR_10, "red"]);

    var rangeScore = [1, 60, 120, 180, 240, 300, 360, 420, 480, 540, 600];
    legend_obj.append("g")
        .attr("id", "legend")
        .attr("class", "legend")
        .selectAll("rect")
        .data(color.range().map(function (d) {
            d = color.invertExtent(d);
            if (d[0] == null) d[0] = x.domain()[0];
            if (d[1] == null) d[1] = x.domain()[1];
            return d;
        }))
        .enter().append("rect")
        .attr("height", 8)
        .attr("x", function (d) { return x(d[0]); })
        .attr("width", function (d) { return x(d[1]) - x(d[0]); })
        .attr("fill", function (d) { return color(d[0]); });

    // Legend title - "color reange by score"
    legend_obj.append("text")
        .attr("class", "caption")
        .attr("x", x.range()[0])
        .attr("y", -5)
        .attr("fill", "#000")
        .attr("text-anchor", "start")
        .attr("font-weight", "bold")
        .attr("font-size", "12px")
        .text("legend by score");

    legend_obj.call(d3.axisBottom(x)
        .tickSize(13)
        .tickFormat(function (x, i) { return i ? (x > 1 ? (x - 1) * 60 : 1) : (x > 1 ? (x - 1) * 60 : 1) + ""; })
        .tickValues(color.domain()))
        .attr("transform", "translate(0,70)")
        .select(".domain")
        .remove();
}

function legend() {
    var legendText = ["1 - 400", "400 - 800", "800 - 1200", "1200 - 1600", "1600 - 2000", "2000 - 2400", "2400 - 2800", "2800 - 3200", "3200 - 3600", "3600 - 4000"];
    var color = d3.scaleLinear()
        .range([COLOR_1, COLOR_2, COLOR_3, COLOR_4, COLOR_5, COLOR_6, COLOR_7, COLOR_8, COLOR_9, COLOR_10]);

    color.domain([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);

    var legend = d3.select("body").append("svg")
        .attr("class", "legend")
        .attr("width", 140)
        .attr("height", 200)
        .selectAll("g")
        .data(color.domain().slice().reverse())
        .enter()
        .append("g")
        .attr("transform", function (d, i) { return "translate(0," + i * 20 + ")"; });

    legend.append("rect")
        .attr("width", 18)
        .attr("height", 18)
        .style("fill", color);

    legend.append("text")
        .data(legendText.reverse())
        .attr("x", 24)
        .attr("y", 9)
        .attr("dy", ".35em")
        .text(function (d) { return d; });
}

function zoomWalmartMark(d) {
    var locationMarkData = [];
    $('.city-marked').css("display", "none");

    if (georgiaCityData && georgiaWalmartData) {
        var getCity = window.lodash.filter(georgiaCityData, function (o) {
            return o.id == d.id;
        });

        getCity.map((item, key) => {
            var walmart = window.lodash.filter(georgiaWalmartData, function (o) {
                return o.zip == item.Zipcode;
            });

            if (walmart.length > 0) {
                locationMarkData.push(walmart[0])
            }
        })
        locationMark(locationMarkData, d);

        $('.city-marked-' + d.id).css("display", "block");
    } else {
        d3.json(GEORGIA_WALMART_STORES).then((georgiaWalmarts) => {
            georgiaWalmartData = georgiaWalmarts;

            d3.csv(SPECIFIC_STATE_INFO).then((cityData) => {
                georgiaCityData = cityData;
                var getCity = window.lodash.filter(cityData, function (o) {
                    return o.id == d.id;
                });

                getCity.map((item, key) => {
                    var walmart = window.lodash.filter(georgiaWalmarts, function (o) {
                        return o.zip == item.Zipcode;
                    });

                    if (walmart.length > 0) {
                        locationMarkData.push(walmart[0])
                    }
                })

                locationMark(locationMarkData, d);

                $('.city-marked-' + d.id).css("display", "block");
            });
        });
    }

}

function walMartMark() {

    d3.json(GEORGIA_WALMART_STORES).then((georgiaWalmarts) => {
        g.append("g")
            .attr("id", "walmart")
            .selectAll(".mark")
            .data(georgiaWalmarts)
            .enter()
            .append("image")
            .attr('class', 'mark')
            .attr('width', 3)
            .attr('height', 3)
            .attr("xlink:href", WALMART_ICON)
            .attr("transform", function (d) {
                return "translate(" + projection([d.coordinates[0], d.coordinates[1]]) + ")";
            });
    })
}

function locationMark(data, d) {
    g.append("g")
        .attr("id", "walmart")
        .selectAll(".mark")
        .data(data)
        .enter()
        .append("image")
        .attr('class', "mark county-boundary city-marked city-marked-" + d.id)
        .attr('width', 1)
        .attr('height', 1)
        .attr("xlink:href", WALMART_ICON)
        .attr("transform", function (d) {
            return "translate(" + projection([d.coordinates[0], d.coordinates[1]]) + ")";
        })
        .on("click", reset)
        .on("mouseover", function (d) {
            var html = "";
            html += "<div class=\"tooltip_kv\">";
            html += "<span class=\"tooltip_key\">";
            html += "<span class=\"tooltip_walmart\">WalMart Info</span>";
            html += "<br/>";
            html += "Name: " + d.name;
            html += "<br/>";
            html += "Country: " + d.country;
            html += "<br/>";
            html += "StreetAddress: " + d.streetAddress;
            html += "<br/>";
            html += "City: " + d.city;
            html += "<br/>";
            html += "StateProvCode: " + d.stateProvCode;
            html += "<br/>";
            html += "Zip: " + d.zip;
            html += "<br/>";
            html += "PhoneNumber: " + d.phoneNumber;
            html += "<br/>";
            html += "SundayOpen: " + d.sundayOpen;
            html += "<br/>";
            html += "Timezone: " + d.timezone;
            html += "</span>";
            html += "<span class=\"tooltip_value\">";
            html += "";
            html += "</span>";
            html += "</div>";

            $("#tooltip-container").html(html);
            $(this).attr("fill-opacity", "1.0");
            $("#tooltip-container").show();

            var coordinates = d3.mouse(this);

            var map_width = $('.georgia-viz-svg')[0].getBoundingClientRect().width;
            if (d3.event.layerX < map_width / 2) {
                d3.select("#tooltip-container")
                    .style("top", (d3.event.layerY + 15) + "px")
                    .style("left", (d3.event.layerX + 15) + "px");
            } else {
                var tooltip_width = $("#tooltip-container").width();
                d3.select("#tooltip-container")
                    .style("top", (d3.event.layerY + 15) + "px")
                    .style("left", (d3.event.layerX - tooltip_width - 30) + "px");
            }
        })
        .on("mouseout", function () {
            $(this).attr("fill-opacity", "1.0");
            $("#tooltip-container").hide();
        });
}

function colorRange(score) {
    var color = "#fff";
    if (0 < score && score <= 400) {
        color = COLOR_1;
    } else if (400 < score && score <= 800) {
        color = COLOR_2;
    }
    else if (800 < score && score <= 1200) {
        color = COLOR_3;
    }
    else if (1200 < score && score <= 1600) {
        color = COLOR_4;
    }
    else if (1600 < score && score <= 2000) {
        color = COLOR_5;
    }
    else if (2000 < score && score <= 2400) {
        color = COLOR_6;
    }
    else if (2400 < score && score <= 2800) {
        color = COLOR_7;
    }
    else if (2800 < score && score <= 3200) {
        color = COLOR_8;
    }
    else if (3200 < score && score <= 3600) {
        color = COLOR_9;
    }
    else if (3600 < score && score <= 4000) {
        color = COLOR_10;
    }

    return color;
}

function colorGeneratorbyMinMax(data) {
    var lowColor = '#44A4AA';
    var highColor = '#F05D5D';
    var dataArray = [];
    for (var d = 0; d < data.length; d++) {
        dataArray.push(parseFloat(data[d].CountyScore))
    }
    var minVal = d3.min(dataArray)
    var maxVal = d3.max(dataArray)
    var ramp = d3.scaleLinear().domain([minVal, maxVal]).range([lowColor, highColor]);

    return ramp;
}

function clicked(d, instance) {
    if (d3.select('.background').node() === instance) return reset();

    if (active.node() === instance) return reset();

    active.classed("active", false);
    active = d3.select(instance).classed("active", true);

    var bounds = path.bounds(d),
        dx = bounds[1][0] - bounds[0][0],
        dy = bounds[1][1] - bounds[0][1],
        x = (bounds[0][0] + bounds[1][0]) / 2,
        y = (bounds[0][1] + bounds[1][1]) / 2,
        scale = .9 / Math.max(dx / width, dy / height),
        scale = .9 / Math.max(dx / width, dy / height),
        translate = [width / 2 - scale * x, height / 2 - scale * y];

    g.transition()
        .duration(750)
        .style("stroke-width", 1.5 / scale + "px")
        .style("fill", "#000")
        .attr("transform", "translate(" + translate + ")scale(" + scale + ")");


    if (cityData.length != 0) {
        zoomWalmartMark(d);
    }

}

function reset() {
    active.classed("active", false);
    active = d3.select(null);
    $('.city-marked').css("display", "none");

    g.transition()
        .delay(100)
        .duration(550)
        .style("stroke-width", "1.5px")
        .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')')


    // georgia centered map
    var states = topojson.feature(usMapData, usMapData.objects.states).features;
    var georgia = states.filter(function (d) {
        return d.id === STATE_FIPS; //Georgia
    });
    centeredMap(georgia[0]);
}

function centeredMap(d) {
    var x, y, k;

    if (d && centered !== d) {
        var centroid = path.centroid(d);
        x = centroid[0] + CENTERED_X;
        y = centroid[1] + CENTERED_Y;
        k = 5.9;
        centered = d;
    } else {
        x = width / 2;
        y = height / 2;
        k = 1;
        centered = null;
    }

    g.selectAll("path.state-boundary")
        .classed("active", centered && function (d) { return d === centered; });

    g.transition()
        .duration(450)
        .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")scale(" + k + ")translate(" + -x + "," + -y + ")")
        .style("stroke-width", 1.5 / k + "px");

    setTimeout(function () {
        if(!zoomable) {
            walMartMark();
        }
    }, 500);
}

function toogleZoom() {
    $(".toogle-switch").click(function (e) {
        zoomable = e.target.checked;
        mainMapDraw(usMapData, cityData, usCountiesData);
    })
}

// get url argument
function getUrlVars() {
    // example var currentState = getUrlVars()["state"];
    var vars = {};
    var parts = window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function(m,key,value) {
        vars[key] = value;
    });
    return vars;
}

// initial state config
function initStateConfig(state) {
    STATE_NAME = STATE_CONFIGURATIONS[state].state_name;
    SPECIFIC_STATE_INFO = STATE_CONFIGURATIONS[state].specific_state_info;
    STATE_FIPS = STATE_CONFIGURATIONS[state].state_fips;
    MAP_RATIO = STATE_CONFIGURATIONS[state].map_ratio;
    CENTERED_X = STATE_CONFIGURATIONS[state].centered_x;
    CENTERED_Y = STATE_CONFIGURATIONS[state].centered_y;
}

$(document).ready(function() {
    var route = location.href.toString();
    var state = route.split('?state=')[1];
    if (state) {
        $('.select-state select').val(state);
    }
})