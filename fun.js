/*
* used distanceBetweenStops
*/
function sortStopsList(rootData) {
    const geometryArray = rootData['geometry']['coordinates']; //array of array
    var route_stops = rootData['properties']['route_stops']; //array of list

    //find the first and last stops (showing in route_long_name)
    var route_long_name = rootData['properties']['route_long_name'];
    var storeStops = [];
    var closeToFirst = 10000; // check who is the closed to first coordinates - mean is first stop.

    /*
    for (i=0;i<route_stops.length;i++){
        stopName = route_stops[i]['stop']['stop_name'];
        
        if (route_long_name.includes(stopName)){
            disM = distance_M_BetweenStops(route_stops[i]['stop']['geometry']['coordinates'],geometryArray[0]);
            if (disM<closeToFirst){
                storeStops.splice(0,0,route_stops[i]); //first stop in 0 index
                closeToFirst=disM
            } else{
                storeStops.push(route_stops[i]);
            }
            route_stops.splice(i, 1); // remove the stop from the list
        }
    }
    */



    //put stop inside the line

    //make new list
    var geometryArray_withChange = rootData['geometry']['coordinates']; //array of array

    for (stopIndex = 0; stopIndex < route_stops.length; stopIndex++) {

        var lowDistance = 30000, lowDistance2 = 30000;
        var lowDistance_index = null, lowDistance_2_index = null;

        for (geoIndex in geometryArray) {

            secend_Location = route_stops[stopIndex]['stop']['geometry']['coordinates'];
            distanceM = distance_M_BetweenStops(geometryArray[geoIndex], secend_Location);

            //get the two geometry closest to stop
            if (distanceM < lowDistance) {
                lowDistance = distanceM;
                lowDistance_index = geoIndex;
            }
            else if (distanceM < lowDistance2) {
                lowDistance2 = distanceM;
                lowDistance_2_index = geoIndex;
            }
        }
        if (lowDistance2 < lowDistance) {
            lowDistance_index = lowDistance_2_index;
        }
        console.log('Put stop in ' + lowDistance_index);
        geometryArray_withChange.splice(lowDistance_index, 0, route_stops[stopIndex]);

    }

    for (n = 0; n < geometryArray_withChange.length; n++) {
        storeStops.splice(n + 1, 0, geometryArray_withChange[n]);//all in one place sorted
    }

    //console.log(storeStops);
    return storeStops;

}

function download(content, fileName, contentType) {
    var a = document.createElement("a");
    var file = new Blob([content], { type: contentType });
    a.href = URL.createObjectURL(file);
    a.download = fileName;
    a.click();
}


function distance_M_BetweenStops(startStop, endStop) {
    // use this method https://www.movable-type.co.uk/scripts/latlong.html

    const R = 6371e3; // metres
    const φ1 = startStop[1] * Math.PI / 180; // φ, λ in radians
    const φ2 = endStop[1] * Math.PI / 180;
    const Δφ = (endStop[1] - startStop[1]) * Math.PI / 180;
    const Δλ = (endStop[0] - startStop[0]) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
        Math.cos(φ1) * Math.cos(φ2) *
        Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    const d = R * c; // in metres

    return d;
}


/*
* Get:
* Return:
*/
function distanceBetweenStops(startStop, endStop) {
    return distance_M_BetweenStops(startStop, endStop);
    /*x = startStop[0] - endStop[0];
    y = startStop[1] - endStop[1];
    return Math.sqrt(x*x+y*y);*/
}

function get_R_L_by_cBus(cBus) {
    var side;

    //reset to possitive number
    if (cBus < 0) {
        cBus += 360;
    }

    // in right side
    if (cBus < 180) {

        // diff littel then 7, will not count
        if (Math.abs(cBus - 180) < 7) {
            side = null;
        }
        else {
            side = "Right";
        }
    }
    // in left side
    else {

        // diff littel then 7, will not count
        cBus -= 180; // for abs value
        if (Math.abs(cBus - 180) < 7) {
            side = null;
        }
        else {
            side = "Left";
        }
    }

    return side;
}



/*
* Get: two stops (close to each other) on a bus line.
* Return: the angle (c) of the bus.
*/
function anglePer2stops(startStop, endStop) {

    //Find the celuis of the bus to Y-axis
    var cBus;
    xDiff = endStop[0] - startStop[0]; //.x is Longitude
    yDIff = endStop[1] - startStop[1]; //.y is Latitude

    if (yDIff == 0 && xDiff == 0) {
        alert('same location!')
        //ERROR: Same location!! TODO:------------
    }
    // Math.atan2 return value in radians.
    cBus = Math.atan2(yDIff, xDiff) * 180 / Math.PI;
    // cBus has celius to X-axis, so we need to convert it.
    cBus = xAngle_to_yAngle(cBus);

    //check if xDiff is nagtiv.
    //check if XDiff is equale (yDiff is the angle)
    return cBus;
}



/*
* Get the angle (c) between bus and the X-axis
* Return the angle (c) between bus and the Y-axis
*/
function xAngle_to_yAngle(xAngle) {
    var yAngle = 0;
    if (xAngle => 180) { yAngle = -(xAngle - 90); }
    else { yAngle = 90 + (-xAngle); }
    return yAngle;
}


//###########################################################################################################
//traslate idea (with change)- https://www.codeproject.com/Tips/1165561/How-to-Create-a-Multilingual-Application-using-Jav

function Translate() {
    //initialization
    this.init = function (attribute, lng, data) {
        this.attribute = attribute;
        this.lng = lng;
        this.LngObject = data;
    }
    //translate 
    this.process = function () {
        _self = this;
        var allDom = document.getElementsByTagName("*");

        for (var i = 0; i < allDom.length; i++) {
            var elem = allDom[i];
            var key = elem.getAttribute(_self.attribute);

            if (key != null) {
                console.log(key);
                elem.innerHTML = this.LngObject[this.lng][key];
            }
        }

    }
}

/**
 * @param {JSON} rootData ["features"][0]
 * @param - only for Trip info
 * @returns {Array} stops inside the line
 */
function insertStopsToBusLine(rootData) {
    /** array of location (each one contain array with geometry) */
    let lineGeometry = rootData['geometry']['coordinates'];
    // build in code
    let lineGeometry_withstops = rootData['geometry']['coordinates'];

    /** array of TimeStops (with keys: arrival_time, stop etc.), each stop is list */
    let route_stops = rootData['properties']['stop_times'];

    //put stop inside the line
    for (let stopIndex = 0; stopIndex < route_stops.length; stopIndex++) {

        let lowDistance_index = 0;
        let lowDistance = 300000;

        // get the closed point locations to the stop
        let stop_Location = route_stops[stopIndex]['stop']['geometry']['coordinates'];

        for (let geoIndex in lineGeometry) {
            let distanceM = distance_M_BetweenStops(lineGeometry[geoIndex], stop_Location);

            if (distanceM < lowDistance) {
                lowDistance = distanceM;
                lowDistance_index = geoIndex;
            }
        }
        //let nameStop = route_stops[stopIndex]['stop']['stop_name'];

        //insert the stop after the closest location
        lineGeometry_withstops.splice(lowDistance_index, 0, route_stops[stopIndex]);
        //console.log('Put the stop ' + nameStop + ' in ' + lowDistance_index);

    }

    return lineGeometry_withstops;
}

function getLocalStorage() {
    let data = localStorage['saved'];
    if (data === undefined) return {};
    return JSON.parse(data);
}
function setLocalStorage(data) {
    localStorage['saved'] = JSON.stringify(data);
}

/**
 * @param {*} rootData ["features"][0]
 * @param - only for Route info
 * @returns stops inside the line
 */
function sortStopsByLine(rootData) {
    /** array of location (each one contain array with geometry) */
    let lineGeometry = rootData['geometry']['coordinates'][0];
    //build in code
    let lineGeometry_withstops = rootData['geometry']['coordinates'][0];

    /** array of list (only with one key - 'stop'), each stop is list */
    let route_stops = rootData['properties']['route_stops'];

    //put each stop inside the line
    for (let stopIndex = 0; stopIndex < route_stops.length; stopIndex++) {

        let lowDistance = 300000;
        let lowDistance_index = 0;

        // get the closed point locations to the stop
        let stop_Location = route_stops[stopIndex]['stop']['geometry']['coordinates'];

        for (let geoIndex in lineGeometry) {
            let distanceM = distance_M_BetweenStops(lineGeometry[geoIndex], stop_Location);

            if (distanceM < lowDistance) {
                lowDistance = distanceM;
                lowDistance_index = geoIndex;
            }
        }
        let nameStop = route_stops[stopIndex]['stop']['stop_name'];

        //insert the stop after the closest location
        lineGeometry_withstops.splice(lowDistance_index, 0, route_stops[stopIndex]);
        console.log('Put the stop ' + nameStop + ' in ' + lowDistance_index);

    }

    return lineGeometry_withstops;
}


/**
 * 
 * @param {*} stopsWithLine -(array) stops inside the bus line
 * @param firstStopID - ID of user's stop
 * @returns eStop_str to build datalist in HTML
 */
function makeStr_eStop(stopsWithLine, firstStopID) {
    let stopInRoute = L.icon({
        iconUrl: 'icons8-marker-48inRoute.png',
        iconSize: [14, 14], // size of the icon
    });

    let eStop_str = `<label for="endstops">בחר תחנת יעד: <input autocomplete="off" id="eStop"  list="eStop1" onChange="showButtonForCalc()"> <button class="resetbutton" onclick="document.getElementById('eStop').value=''">אפס</button></label>
                      <datalist name="eStop" id="eStop1">
                        <option value="" selected disabled hidden>בחר תחנת ירידה</option>`;
    // onfocus="this.value=''" inputmode=“none” onfocus="blur()"

    let countStops = 0;
    /** first user stop index in sortStops */
    let firstUserStop_index = 0;
    /** first user stop index in stopsWithLine */
    let firstUserStopWithLine_index = 0;

    //globle var
    sortStops = [];
    for (i = 0; i < stopsWithLine.length; i++) {
        if ('stop' in stopsWithLine[i]) {
            // storing list of stops only (sorted)
            sortStops.push(stopsWithLine[i]);
            countStops++;

            // find user's first stop
            if (stopsWithLine[i]['stop']['id'] === firstStopID) {
                firstUserStop_index = countStops;
                firstUserStopWithLine_index = i;
            }
        }
    }

    // short the list from the user's first stop
    sortStops.splice(0, firstUserStop_index - 1); // the (-1) for showing in the list the first stop
    stopsWithLine.splice(0, firstUserStopWithLine_index);

    // show the line from the selected stop to the end stop on the map
    let previusCoordinates = null;
    for (let index in stopsWithLine) {
        if ('stop' in stopsWithLine[index]) {
            continue;
        }
        let coordinates = [stopsWithLine[index][1], stopsWithLine[index][0]];
        if (index < stopsWithLine.length - 1) {
            if (previusCoordinates != null) {
                let line = new L.polyline([previusCoordinates, coordinates]);
                stopOnRoute.addLayer(line);
            }
            previusCoordinates = coordinates;
        }
    }

    // make datalist of stops in the selected route and deploy it to user
    for (let index in sortStops) {
        let thisStop = sortStops[index]["stop"];
        eStop_str += `<option data-value="${thisStop["id"]}" value="${thisStop["stop_name"]}">`;

        // show marker on the map
        let stop_coordinates = [thisStop['geometry']['coordinates'][1], thisStop['geometry']['coordinates'][0]];
        let marker = new L.Marker(stop_coordinates, { icon: stopInRoute }).bindPopup(thisStop['stop_name']);

        stopOnRoute.addLayer(marker);
    }
    eStop_str += `</datalist><br>`;

    map.fitBounds(stopOnRoute.getBounds());
    return eStop_str;
}

function getCurrentTime() {
    let date = new Date();

    let day = date.getDate(),
        month = date.getMonth() + 1, // month start at 0
        year = date.getFullYear(),
        hour = date.getHours(),
        min = date.getMinutes();

    month = (month < 10 ? "0" : "") + month;
    day = (day < 10 ? "0" : "") + day;
    hour = (hour < 10 ? "0" : "") + hour;
    min = (min < 10 ? "0" : "") + min;

    let today = `${year}-${month}-${day}`;
    let displayTime = `${hour}:${min}`;

    return [today, displayTime]
}

function saveSearch(array) {
    let firstStopName = document.getElementById('stops');
    let routeName = document.getElementById('routes');
    let endStopName = document.getElementById('eStop');
    let historyName;
    try {
        historyName = `מ${firstStopName.value} ל${endStopName.value} ב${routeName.value}`;
    } catch (error) {
        console.log("Cant save history, firstStopName / routeName / endStopName - does not have value");
        //console.error(error);
        return;
    }

    let local = getLocalStorage();
    local[historyName] = array;
    setLocalStorage(local);
}


/**
 * @param {Array} stops_firstToEnd_withLine
 * can be from trip or from route. 
 * trip have also the key: 'arrival_time'
 */
function whereIsRecommendedToSit(stops_firstToEnd_withLine) {

    /*
     * stops_firstToEnd_withLine
     * can be from trip or from route
     * trip have also the key: 'arrival_time'
    */

    saveSearch(stops_firstToEnd_withLine);


    /* Found the first stop */
    // TODO: maybe have to be the first in stops_firstToEnd_withLine ? (no loop)

    /** @param {Date} - date*/

    for (let index in stops_firstToEnd_withLine) {
        // if one dont have 'arrival_time' not need to run on all
        if ('stop' in stops_firstToEnd_withLine[index]) {

            // Found the first stop arrival_time to compare to
            if ('arrival_time' in stops_firstToEnd_withLine[index]) {
                firstStopTimeInTrip = arrivalTime_to_DateObj(stops_firstToEnd_withLine[index]['arrival_time'])
            }
            break;
        }
    }

    // get the intial time for calculation
    let dateNow = new Date();

    // in case user didnt give info, use system time.
    let userDate = document.getElementById("date")?.value || dateNow.toLocaleDateString();
    let userTime = document.getElementById("time")?.value || dateNow.toLocaleTimeString();

    let [day, month, year] = userDate.split(/[.-]/);
    if (day > 2000){
        let tempDay = year;
        year = day;
        day = tempDay;
    }
    let [hours, minutes, seconds] = userTime.split(":");
    if (seconds === undefined) seconds = 0;

    console.log(year, month, day, hours, minutes, seconds);
    let userFinalDate = new Date(year, Number(month)-1, day, hours, minutes, seconds);

    let customStopTime = new Date(userFinalDate.getTime());
    console.log('User Date: ' + userFinalDate)
    //console.log('User Date: ' + new Date())

    // calculaion itself
    let distanceR = 0, distanceL = 0, distanceNull = 0, countNull = 0, sumDistance = 0;
    let percent = 0, percentSide, percentSideNegativ;

    // new method
    let previus_location;
    for (let index in stops_firstToEnd_withLine) {
        let this_index = stops_firstToEnd_withLine[index];
        let current_location;

        // is stop object
        if ('stop' in this_index) {
            // get location
            current_location = this_index['stop']["geometry"]["coordinates"];

            // get arrival_time (if exist) and update the bus time
            if ('arrival_time' in this_index) {
                let this_StopTime = arrivalTime_to_DateObj(this_index['arrival_time']);
                customStopTime = new Date(userFinalDate.getTime() + (this_StopTime - firstStopTimeInTrip));
                console.log('-------\nThe bus will be in ' + this_index['stop']['stop_name'] + '\nAt: ' + customStopTime);
            }
        }
        // is location object
        else {
            current_location = this_index;
        }

        // check if the sun is out
        // if not skip
        if (!isDayNow(current_location, customStopTime)) {
            countNull++;
            continue;
        }

        // skip the first time
        if (previus_location == null) {
            previus_location = current_location;
            continue;
        }


        let distance_Air = distanceBetweenStops(previus_location, current_location);
        sumDistance += distance_Air;
        let cBus = anglePer2stops(previus_location, current_location);

        let suncalcVar = SunCalc.getPosition(customStopTime, previus_location[0], previus_location[1]);
        let cSun = suncalcVar['azimuth'] * 180 / Math.PI + 180;

        let diffC = cSun - cBus;
        let cBus_getSide = get_R_L_by_cBus(diffC);
        // TODO: color line in map by side

        if (cBus_getSide == "Right") {
            distanceR += distance_Air;
        }
        else if (cBus_getSide == "Left") {
            distanceL += distance_Air;
        }
        else {
            countNull++;
            distanceNull += distance_Air;
        }

        // save to previus location
        previus_location = current_location;

    }
    // conclusion
    console.log(`-------\nSum Meter in Right: ${distanceR}\nSum Meter in Left: ${distanceL}\nSum Meter Undefined: ${distanceNull}\nUndefined: ${countNull}`);

    // find which side have mode sun
    if (distanceR > distanceL) {
        percent = distanceR / sumDistance;
        percentSide = "ימין";
        percentSideNegativ = "שמאל";
    }
    else {
        percent = distanceL / sumDistance;
        percentSide = "שמאל";
        percentSideNegativ = "ימין";
    }
    let infoPercent = { 'percent': Math.round(percent * 100), 'percentSide': percentSide, 'percentSideNegativ': percentSideNegativ };

    // when more then 90% have no side - sit anywhere :)
    if (countNull > stops_firstToEnd_withLine.length * 0.9 || percent === 0) {
        textToShow1 = "חדשות טובות! אתה יכול לשבת איפה שרק תרצה באוטובוס :)";
        textToShow2 = "";
    }
    else {
        textToShow1 = `אוי לא! צד ${infoPercent["percentSide"]} מלא בשמש (כ${infoPercent["percent"]}% מהדרך).\n`;
        textToShow2 = `ולכן אנחנו ממליצים לך לשבת בצד ${infoPercent["percentSideNegativ"]} של האוטובוס :)`;
    }

    // set the texts
    document.getElementById('showAnswer').innerHTML = textToShow1 + textToShow2;
    document.getElementById('modal-body1').innerHTML = textToShow1;
    document.getElementById('modal-body2').innerHTML = textToShow2;

    // deploy the Modal
    document.getElementById('myModal').style.display = "block";
    document.getElementById('myModal').style.zIndex = "2"
}


/**
 * 
 * @param {string} arrival_time - tripTime[numStops]['arrival_time']
 * @returns {Date} arrivalTime_date - as date object
 */
function arrivalTime_to_DateObj(arrival_time) {
    let [hours, minutes, seconds] = arrival_time.split(':');

    let arrivalTime_date = new Date();
    arrivalTime_date.setHours(+hours);
    arrivalTime_date.setMinutes(minutes);
    arrivalTime_date.setSeconds(seconds);

    return arrivalTime_date;
}

/**
 * 
 * @param {*} StopLocation 
 * @param {*} customDate 
 * @returns {boolean}
 */
function isDayNow(StopLocation, customDate) {

    let sunCalcTime = SunCalc.getTimes(/*Date*/ customDate,
                                /*Number*/ StopLocation[0],
                                /*Number*/ StopLocation[1],
                                /*Number (default=0)*/ 0);

    let startTime = sunCalcTime['sunriseEnd']
    let endTime = sunCalcTime['sunsetStart']

    return datesFunctions.inRange(customDate, startTime, endTime);
}

// Source: http://stackoverflow.com/questions/497790
var datesFunctions = {
    convert: function (d) {
        // Converts the date in d to a date-object. The input can be:
        //   a date object: returned without modification
        //  an array      : Interpreted as [year,month,day]. NOTE: month is 0-11.
        //   a number     : Interpreted as number of milliseconds
        //                  since 1 Jan 1970 (a timestamp) 
        //   a string     : Any format supported by the javascript engine, like
        //                  "YYYY/MM/DD", "MM/DD/YYYY", "Jan 31 2009" etc.
        //  an object     : Interpreted as an object with year, month and date
        //                  attributes.  **NOTE** month is 0-11.
        return (
            d.constructor === Date ? d :
                d.constructor === Array ? new Date(d[0], d[1], d[2]) :
                    d.constructor === Number ? new Date(d) :
                        d.constructor === String ? new Date(d) :
                            typeof d === "object" ? new Date(d.year, d.month, d.date) :
                                NaN
        );
    },
    compare: function (a, b) {
        // Compare two dates (could be of any type supported by the convert
        // function above) and returns:
        //  -1 : if a < b
        //   0 : if a = b
        //   1 : if a > b
        // NaN : if a or b is an illegal date
        // NOTE: The code inside isFinite does an assignment (=).
        return (
            isFinite(a = this.convert(a).valueOf()) &&
                isFinite(b = this.convert(b).valueOf()) ?
                (a > b) - (a < b) :
                NaN
        );
    },
    inRange: function (d, start, end) {
        // Checks if date in d is between dates in start and end.
        // Returns a boolean or NaN:
        //    true  : if d is between start and end (inclusive)
        //    false : if d is before start or after end
        //    NaN   : if one or more of the dates is illegal.
        // NOTE: The code inside isFinite does an assignment (=).
        return (
            isFinite(d = this.convert(d).valueOf()) &&
                isFinite(start = this.convert(start).valueOf()) &&
                isFinite(end = this.convert(end).valueOf()) ?
                start <= d && d <= end :
                NaN
        );
    }
}