import { Vars } from './vars.js';
import transitland from './transitland.js';
import { datesFunctions } from './dateFunctions.js';
import MarkersIcon from './markersIcon.js';

function getLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(showPosition);
    } else {
        alert("Geolocation is not supported by this browser.");
    }
}

function showPosition(position) {
    Vars.map.setView([position.coords.latitude, position.coords.longitude], 14);
    Vars.location.lat = position.coords.latitude;
    Vars.location.lon = position.coords.longitude;

    if (Vars.pickMarker != null) {
        Vars.pickMarker.setLatLng([position.coords.latitude, position.coords.longitude]);
    } else {
        Vars.pickMarker = new L.marker([position.coords.latitude, position.coords.longitude]);
        Vars.pickMarker.addTo(Vars.map);
    }
}

function initMap() {
    let element = document.getElementById('mapView');
    Vars.map = L.map(element).setView([32.83325770280918, 35.79960352932844], 14);
    L.tileLayer('https://{s}.tile.osm.org/{z}/{x}/{y}.png').addTo(Vars.map);


    Vars.map.on('click', function (e) {
        if (Vars.pickMarker != null) {
            Vars.pickMarker.setLatLng(e.latlng).update();
        } else {
            Vars.pickMarker = new L.marker(e.latlng);
            Vars.pickMarker.addTo(Vars.map);
        }

        Vars.location.lat = e.latlng['lat'];
        Vars.location.lon = e.latlng['lng'];
    });

    getLocation();
}

function loadHistory() {
    const savedHistory = getLocalStorage();
    const historyList = document.getElementById("historylist");
    savedHistory.forEach((entry, index) => {
        const option = document.createElement("option");
        option.value = index;
        option.textContent = `${entry.route_short_name} - ${entry.firstStop} - ${entry.endStop}`;
        option.dataset.value = JSON.stringify(entry);
        historyList.appendChild(option);
    });
}

function resetInput(inputId) {
    const input = document.getElementById(inputId);
    input.value = '';
}

function enableInput(inputId) {
    const input = document.getElementById(inputId);
    input.classList.remove('bg-gray-300', 'text-gray-500', 'cursor-not-allowed');
    input.classList.add('bg-white', 'text-black');
}

function disabledInput(inputId) {
    const input = document.getElementById(inputId);
    input.classList.add('bg-gray-300', 'text-gray-500', 'cursor-not-allowed');
    input.classList.remove('bg-white', 'text-black');
}

async function findNearbyStops() {
    const nearByStops = await transitland.nearByStops(Vars.location);

    if (nearByStops.features.length === 0) {
        alert("No stops found near you, please select another location.");
        return;
    }

    let firstStopList = document.getElementById("firstStopList");
    firstStopList.replaceChildren();

    Vars.stopMarkers = L.featureGroup().addTo(Vars.map);
    Vars.nearbyStop = [];

    for (let stop of nearByStops.features) {

        let option = document.createElement("option");
        option.value = stop.properties.stop_name;
        option.dataset.value = stop.properties.stop_code;
        option.dataset.id = stop.properties.id;
        option.dataset.location = stop.geometry.coordinates;
        firstStopList.appendChild(option);

        Vars.nearbyStop.push(stop);

        let marker = new L.Marker([
            stop.geometry.coordinates[1],
            stop.geometry.coordinates[0]
        ], { icon: MarkersIcon.nearbyIcon }).bindPopup(stop.properties.stop_name);
        Vars.stopMarkers.addLayer(marker);
    }
    enableInput('firstStop');
    Vars.map.fitBounds(Vars.stopMarkers.getBounds());

    // for Mobile scroll to the next section
    let userSelectionView = document.getElementById("userSelectionView");
    userSelectionView.scrollIntoView({
        behavior: "smooth",
        block: "end",
        inline: "nearest"
    });
};

async function showRoutesListInStop() {
    let routesList = document.getElementById("routesList");
    routesList.replaceChildren();

    const routes = await transitland.getRoutesByLocation({
        lat: Vars.selectedStop.geometry.coordinates[1],
        lon: Vars.selectedStop.geometry.coordinates[0],
        radius: 5
    });

    Vars.routes = [];

    for (let route of routes.features) {
        let option = document.createElement("option");
        option.value = route.properties.route_short_name;
        option.textContent =
            "קו " + route.properties.route_short_name
            + ", מ: " + route.properties.route_long_name.slice(0, route.properties.route_long_name.indexOf('<'))
            + ", ל: " + route.properties.route_long_name.slice(route.properties.route_long_name.indexOf('>') + 1, route.properties.route_long_name.indexOf('#') - 2);
        routesList.appendChild(option);

        Vars.routes.push(route);
    }

    enableInput('routes');
}

async function showStopsListInSelectedRoute() {
    const route = await transitland.getRoutesByID(Vars.selectedRoute.properties.id);

    let stopsList = document.getElementById("endStopList");
    stopsList.replaceChildren();

    Vars.nextStopsMarkers = L.featureGroup().addTo(Vars.map);

    // sort stops by the closest point index
    let nextStops = route.features[0].properties.route_stops;
    const stopsWithDistances = nextStops.map((stop) => {
        const stopCoord = stop.stop.geometry.coordinates;

        // Find the closest route coordinate to this stop
        let minDistance = Infinity;
        let minIndex = -1;

        route.features[0].geometry.coordinates[0].forEach((routeCoord, index) => {
            const distance = distance_M_BetweenStops(routeCoord, stopCoord);
            if (distance < minDistance) {
                minDistance = distance;
                minIndex = index;
            }
        });

        return { ...stop, closestPointIndex: minIndex };
    });
    // updating nextStops to be the sorted stops
    nextStops = stopsWithDistances.sort((a, b) => a.closestPointIndex - b.closestPointIndex);

    // Add <option> elements to the stops list, and show markers on the map
    let firstStopFound = false;
    let firstStopID = Vars.selectedStop.properties.id;
    for (let stop of nextStops) {
        if (firstStopFound) {
            let option = document.createElement("option");
            option.value = stop.stop.stop_name;
            option.textContent = stop.stop.stop_id;
            stopsList.appendChild(option);

            Vars.stopsOnSelectedRoute.push(stop.stop);

            let marker = new L.Marker([
                stop.stop.geometry.coordinates[1],
                stop.stop.geometry.coordinates[0]
            ], { icon: MarkersIcon.nearbyIcon }).bindPopup(stop.stop.stop_name);
            Vars.nextStopsMarkers.addLayer(marker);
        }

        if (stop.stop.id === firstStopID) {
            firstStopFound = true;
        }
    }

    if (Vars.stopsOnSelectedRoute.length === 0) {
        return alert("לא נמצאו תחנות על הקו הנבחר, אנא בחר קו אחר");
    }
    Vars.map.fitBounds(Vars.nextStopsMarkers.getBounds());

    // find the closeset coordinates to the first stop in the route (they not the same)
    let firstStop = Vars.selectedStop.geometry.coordinates;
    let endStop = nextStops[nextStops.length - 1].stop.geometry.coordinates;

    let minDistance = distance_M_BetweenStops(firstStop, endStop);
    let firstUserStop_index = 0;
    for (let coord in route.features[0].geometry.coordinates[0]) {
        let distance = distance_M_BetweenStops(firstStop, route.features[0].geometry.coordinates[0][coord]);
        if (distance < minDistance) {
            minDistance = distance;
            firstUserStop_index = coord;
        }
    }

    Vars.lineFromFirstStop = route.features[0].geometry.coordinates[0].slice(firstUserStop_index, route.features[0].geometry.coordinates[0].length);

    // show the route on the map from the first stop to the end stop
    let routeOnTheMap = L.featureGroup().addTo(Vars.map);
    let previusCoordinates = null;
    for (let coord of Vars.lineFromFirstStop) {
        let coordinates = [coord[1], coord[0]];
        if (previusCoordinates != null) {
            let line = new L.polyline([previusCoordinates, coordinates]);
            routeOnTheMap.addLayer(line);
        }
        previusCoordinates = coordinates;
    }

    Vars.map.fitBounds(routeOnTheMap.getBounds());
    Vars.LayerLineFromFirstStop = routeOnTheMap;

    enableInput('endStop');
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

function showRouteOnMapFirstToEnd() {

    // find the closeset coordinates to the end stop in the route (they not the same)
    let endStop = Vars.selectedStopOnSelectedRoute.geometry.coordinates;
    let firstStop = Vars.selectedStop.geometry.coordinates;
    let minDistance = distance_M_BetweenStops(firstStop, endStop);
    let endUserStop_index = 0;
    for (let coord in Vars.lineFromFirstStop) {
        let distance = distance_M_BetweenStops(Vars.lineFromFirstStop[coord], endStop);
        if (distance < minDistance) {
            minDistance = distance;
            endUserStop_index = coord;
        }
    }

    Vars.lineFromFirstStopToEndStop = Vars.lineFromFirstStop.slice(0, endUserStop_index);

    // remove the old route from the map
    Vars.map.removeLayer(Vars.LayerLineFromFirstStop);

    // show the route on the map from the first stop to the end stop
    drewRouteLineOnMap();

    // remove the old stops marked on the map
    Vars.map.removeLayer(Vars.nextStopsMarkers);
    if (Vars.endStopMarker != null) {
        Vars.map.removeLayer(Vars.endStopMarker);
    }
    Vars.endStopMarker = L.featureGroup().addTo(Vars.map);
    // add end stop marker
    let endStopMarker = new L.Marker([
        Vars.selectedStopOnSelectedRoute.geometry.coordinates[1],
        Vars.selectedStopOnSelectedRoute.geometry.coordinates[0]
    ], { icon: MarkersIcon.getOffBus }).bindPopup(Vars.selectedStopOnSelectedRoute.stop_name);
    Vars.endStopMarker.addLayer(endStopMarker);
}

function drewRouteLineOnMap() {
    let routeOnTheMap = L.featureGroup().addTo(Vars.map);
    let previusCoordinates = null;

    for (let coord of Vars.lineFromFirstStopToEndStop) {
        let coordinates = [coord[1], coord[0]];
        if (previusCoordinates != null) {
            let line = new L.polyline([previusCoordinates, coordinates]);
            routeOnTheMap.addLayer(line);
        }
        previusCoordinates = coordinates;
    }

    Vars.map.fitBounds(routeOnTheMap.getBounds());
    Vars.LayerLineFromFirstStopToEndStop = routeOnTheMap;
}

/**
 * @param {*} location 
 * @param {*} date 
 * @returns {boolean}
 */
function isDayNow(location, date) {
    let sunCalcTime = SunCalc.getTimes(date, location[0], location[1], 0);
    let startTime = sunCalcTime['sunriseEnd']
    let endTime = sunCalcTime['sunsetStart']

    return datesFunctions.inRange(date, startTime, endTime);
}

/*
* Get the angle (c) between bus and the X-axis
* Return the angle (c) between bus and the Y-axis
*/
function xAngle_to_yAngle(xAngle) {
    var yAngle = 0;
    if (xAngle >= 180) { yAngle = -(xAngle - 90); }
    else { yAngle = 90 + (-xAngle); }
    return yAngle;
}

/**
 * Get: two stops (close to each other) on a bus line.
 * @param {number[]} startStop
 * @param {number[]} endStop
 * Return: the angle (c) of the bus.
 */
function anglePer2stops(startStop, endStop) {

    //Find the celuis of the bus to Y-axis
    let cBus, xDiff, yDIff;
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


function get_R_L_by_cBus(cBus) {
    let side;

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

function calculateWhereIsRecommendedToSit() {
    // in case user didnt give info, use system time.
    let dateNow = new Date();
    let userTime = document.getElementById("selectTime")?.value || dateNow.toLocaleTimeString();
    let [hours, minutes, ...ect] = userTime.split(":");

    dateNow.setHours(hours);
    dateNow.setMinutes(minutes);

    let distanceR = 0, distanceL = 0, distanceNull = 0, countNull = 0, sumDistance = 0;
    let percent = 0, percentSide, percentSideNegativ;

    let coloredRouteOnTheMap = L.featureGroup().addTo(Vars.map);
    let coloredLine;
    let previus_crood;
    for (let current_crood of Vars.lineFromFirstStopToEndStop) {
        if (previus_crood == null) {
            previus_crood = current_crood;
            continue;
        }

        if (!isDayNow(current_crood, dateNow)) {
            countNull++;
            coloredLine = new L.polyline(
                [[previus_crood[1], previus_crood[0]],
                [current_crood[1], current_crood[0]]],
                { color: "black" }
            );
            coloredRouteOnTheMap.addLayer(coloredLine);
            previus_crood = current_crood;
            continue;
        }


        let distance_Air = distance_M_BetweenStops(previus_crood, current_crood);
        sumDistance += distance_Air;
        let cBus = anglePer2stops(previus_crood, current_crood);

        let suncalcVar = SunCalc.getPosition(dateNow, previus_crood[0], previus_crood[1]);
        let cSun = suncalcVar['azimuth'] * 180 / Math.PI + 180;

        let diffC = cSun - cBus;
        let cBus_getSide = get_R_L_by_cBus(diffC);
        // TODO: color line in map by side

        if (cBus_getSide == "Right") {
            distanceR += distance_Air;
            coloredLine = new L.polyline(
                [[previus_crood[1], previus_crood[0]],
                [current_crood[1], current_crood[0]]],
                { color: "blue" }
            );
        }
        else if (cBus_getSide == "Left") {
            distanceL += distance_Air;
            coloredLine = new L.polyline(
                [[previus_crood[1], previus_crood[0]],
                [current_crood[1], current_crood[0]]],
                { color: "red" }
            );
        }
        else {
            countNull++;
            distanceNull += distance_Air;
            coloredLine = new L.polyline(
                [[previus_crood[1], previus_crood[0]],
                [current_crood[1], current_crood[0]]],
                { color: "black" }
            );
        }
        coloredRouteOnTheMap.addLayer(coloredLine);

        // save to previus croodinate
        previus_crood = current_crood;

    }

    // conclusion
    console.log(`-------\nSum Meter in Right: ${distanceR}\nSum Meter in Left: ${distanceL}\nSum Meter Undefined: ${distanceNull}\nUndefined: ${countNull}`);

    Vars.map.removeLayer(Vars.LayerLineFromFirstStopToEndStop)
    Vars.LayerLineFromFirstStopToEndStop = coloredRouteOnTheMap;
    Vars.map.fitBounds(coloredRouteOnTheMap.getBounds());

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

    let textToShow1, textToShow2;
    // when more then 90% have no side - sit anywhere :)
    if (countNull > Vars.lineFromFirstStopToEndStop.length * 0.9 || percent === 0) {
        textToShow1 = "חדשות טובות! אתה יכול לשבת איפה שרק תרצה באוטובוס :)";
        textToShow2 = "";
    }
    else {
        textToShow1 = `אוי לא! צד ${infoPercent["percentSide"]} מלא בשמש (כ${infoPercent["percent"]}% מהדרך).\n`;
        textToShow2 = `ולכן אנחנו ממליצים לך לשבת בצד ${infoPercent["percentSideNegativ"]} של האוטובוס :)`;
    }

    console.log(textToShow1 + textToShow2);
    document.getElementById('modalTitle').textContent = textToShow1;
    document.getElementById('modalContent').textContent = textToShow2;
    document.getElementById("modal").classList.remove("hidden");
}

function getLocalStorage() {
    /** @type {Array} */
    let data = JSON.parse(localStorage.getItem('ShadowRide') || []);

    const now = new Date();
    const monthAgo = new Date(now.setMonth(now.getMonth() - 1));
    data = data
        // filter out old records
        .filter((value) => {
            const date = new Date(value.date);
            return date > monthAgo;
        })
        // filter out duplicates
        .filter((value, index, self) =>
            self.findIndex(t => (
                t.route_short_name === value.route_short_name &&
                t.firstStop === value.firstStop
                && t.endStop === value.endStop)
            ) === index)
        // sort by date
        .sort((a, b) => b.date - a.date)
        // get 25 last searchs
        .slice(0, 25);

    localStorage.setItem('ShadowRide', JSON.stringify(data));
    return data;
}

function setLocalStorage(value) {
    try {
        let local = JSON.parse(localStorage.getItem('ShadowRide') || '[]');
        local.push(value);
        localStorage.setItem('ShadowRide', JSON.stringify(local));
        console.log("saved to local storage", local);
    } catch (error) {
        localStorage.setItem('ShadowRide', JSON.stringify([value]));
        console.log("saved to local storage", error);
    }
}


export {
    initMap,
    loadHistory,
    resetInput,
    enableInput,
    disabledInput,
    getLocation,
    findNearbyStops,
    showRoutesListInStop,
    showStopsListInSelectedRoute,
    showRouteOnMapFirstToEnd,
    drewRouteLineOnMap,
    calculateWhereIsRecommendedToSit,
    getLocalStorage,
    setLocalStorage
};