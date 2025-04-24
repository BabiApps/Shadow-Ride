import { Vars } from './vars.js';
import {
    initMap, resetInput, disabledInput, findNearbyStops, getLocation,
    showRoutesListInStop, showStopsListInSelectedRoute, loadHistory, setLocalStorage,
    calculateWhereIsRecommendedToSit, showRouteOnMapFirstToEnd, drewRouteLineOnMap
} from './index.js';
import MarkersIcon from './markersIcon.js';

const select = document.getElementById("dynamicSelect");
const confirmBtn = document.getElementById("dynamicSelectButton");
const div = document.getElementById("dynamicSelectDiv");

const firstStopElement = document.getElementById("firstStop");
const routesInput = document.getElementById("routes");
const endStopElement = document.getElementById("endStop");
const loadingOverlay = document.getElementById("loadingOverlay");

document.getElementById('body').onload = () => {
    initMap();
    loadHistory();
};

document.getElementById("historylist").addEventListener("change", function (e) {
    removeAllLayers();
    disabledInput("firstStop")
    disabledInput("routes")
    disabledInput("endStop")

    const elem = document.getElementById("historylist");
    const selected = JSON.parse(elem.options[elem.selectedIndex].dataset.value);
    firstStopElement.value = selected.firstStop;
    routesInput.value = selected.route_short_name;
    endStopElement.value = selected.endStop;
    Vars.lineFromFirstStopToEndStop = selected.line;
    drewRouteLineOnMap();

    Vars.firstStopMarker = L.featureGroup().addTo(Vars.map);
    let firstStopMarker = new L.Marker([
        selected.line[0][1],
        selected.line[0][0]
    ], { icon: MarkersIcon.getOnBus }).bindPopup(selected.firstStop);
    Vars.firstStopMarker.addLayer(firstStopMarker);

    Vars.endStopMarker = L.featureGroup().addTo(Vars.map);
    let endStopMarker = new L.Marker([
        selected.line[selected.line.length - 1][1],
        selected.line[selected.line.length - 1][0]
    ], { icon: MarkersIcon.getOffBus }).bindPopup(selected.endStop);
    Vars.endStopMarker.addLayer(endStopMarker);
});

document.getElementById("getMyLocationButton").addEventListener('click', () => {
    getLocation();
});

document.getElementById("findNearbyStopsButton").addEventListener('click', () => {
    onChange_firstStop();
    resetInput('firstStop');
    Vars.nearbyStop = [];
    Vars.stopMarkers ? Vars.map.removeLayer(Vars.stopMarkers) : null;

    loadingOverlay.classList.remove("hidden");
    findNearbyStops().finally(() => {
        loadingOverlay.classList.add("hidden");
    });
});

document.getElementById("currentTimeButton").addEventListener('click', () => {
    document.getElementById("selectTime").value = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
});

// Reset buttons
document.getElementById("resetFirstStop").addEventListener('click', () => {
    resetInput('firstStop');
    Vars.selectedStop = null;
});

document.getElementById("resetRoutes").addEventListener('click', () => {
    resetInput('routes');
    Vars.selectedRoute = null;
});

document.getElementById("resetEndStop").addEventListener('click', () => {
    resetInput('endStop');
    Vars.selectedStopOnSelectedRoute = null;
});


// Selection buttons
function selectFirstStop() {
    onChange_firstStop();

    Vars.stopMarkers ? Vars.map.removeLayer(Vars.stopMarkers) : null;

    // get the selected stop
    let selectedStop = firstStopElement.value;
    Vars.selectedStop = Vars.nearbyStop.find(stop => `${stop.properties.stop_name} [${stop.properties.stop_code}]` === selectedStop);

    if (Vars.selectedStop == null) {
        return alert("יש לבחור תחנה קרובה");
    }

    // add first stop marker
    if (Vars.firstStopMarker != null) {
        Vars.map.removeLayer(Vars.firstStopMarker);
    }
    Vars.firstStopMarker = L.featureGroup().addTo(Vars.map);
    let firstStopMarker = new L.Marker([
        Vars.selectedStop.geometry.coordinates[1],
        Vars.selectedStop.geometry.coordinates[0]
    ], { icon: MarkersIcon.getOnBus }).bindPopup(Vars.selectedStop.properties.stop_name);
    Vars.firstStopMarker.addLayer(firstStopMarker);

    loadingOverlay.classList.remove("hidden");
    showRoutesListInStop().finally(() => {
        loadingOverlay.classList.add("hidden");
    });
}

let firstStopTimeout = null;
firstStopElement.addEventListener("blur", handleFirstStopEvent);
firstStopElement.addEventListener("change", handleFirstStopEvent);
firstStopElement.addEventListener("keypress", () => Vars.selectedStop = null);

/** @param {Event} event */
function handleFirstStopEvent(event) {
    if (event.type === "change") {
        // the default behavior is "blur" event, if "blur" event triggered too it will clear the timeout
        firstStopTimeout = setTimeout(() => {
            selectFirstStop();
        }, 150);
        return;
    }
    if (event.type === "blur") {
        // if the user selected a stop from the list, we don't want to trigger the blur event
        if (Vars.selectedStop != null)
            return;

        const userInput = firstStopElement.value?.trim();
        if (!userInput) return;

        const allOptions = Array.from(document.querySelectorAll("#firstStopList option"));
        const matchingStop = allOptions.filter(opt => opt.value.includes(userInput));

        if (matchingStop.length === 0) return;

        if (matchingStop.length === 1) {
            firstStopElement.value = matchingStop[0].value;
            selectFirstStop();
            return;
        }

        // multiple options: show selection dialog
        select.innerHTML = "";
        matchingStop.forEach(option => {
            const opt = document.createElement("option");
            opt.value = option.value;
            opt.textContent = option.value;
            select.appendChild(opt);
        });

        div.classList.remove("hidden");

        confirmBtn.onclick = () => {
            firstStopElement.value = select.value;
            div.classList.add("hidden");
            selectFirstStop();
        };

        if (firstStopTimeout) {
            clearTimeout(firstStopTimeout);
            firstStopTimeout = null;
        }
    }
}

let routeInputTimeout = null;
routesInput.addEventListener("change", handleRouteEvent);
routesInput.addEventListener("blur", handleRouteEvent);
routesInput.addEventListener("keypress", () => Vars.selectedRoute = null);

/** @param {Event} event */
function handleRouteEvent(event) {
    if (event.type === "change") {
        // the default behavior is "blur" event, if "blur" event triggered too it will clear the timeout
        routeInputTimeout = setTimeout(() => {
            selectRoute();
        }, 150);
        return;
    }

    if (event.type === "blur") {
        // if the user selected a route from the list, we don't want to trigger the blur event
        if (Vars.selectedRoute != null)
            return;

        const userInput = routesInput.value?.trim();
        if (!userInput) return;

        const allOptions = Array.from(document.querySelectorAll("#routesList option"));
        const matchingRoute = allOptions.filter(opt =>
            opt.value.includes(userInput)
        );

        if (matchingRoute.length === 0) return;

        if (matchingRoute.length === 1) {
            routesInput.value = matchingRoute[0].value;
            selectRoute();
            return;
        }

        // multiple matches – show selection
        select.innerHTML = "";
        matchingRoute.forEach(option => {
            const opt = document.createElement("option");
            opt.value = option.value;
            opt.textContent = option.value;
            select.appendChild(opt);
        });

        div.classList.remove("hidden");

        confirmBtn.onclick = () => {
            routesInput.value = select.value;
            div.classList.add("hidden");
            selectRoute();
        };

        if (routeInputTimeout) {
            clearTimeout(routeInputTimeout);
            routeInputTimeout = null;
        }
    }
}

function selectRoute() {
    onChange_route();

    const selectedRoute = routesInput.value;
    Vars.selectedRoute = Vars.routes.find(route => `קו ${route.properties.route_short_name}, לכיוון ${route.properties.route_long_name.slice(
        route.properties.route_long_name.indexOf('>') + 1,
        route.properties.route_long_name.indexOf('#') - 2
    )}` === selectedRoute);

    loadingOverlay.classList.remove("hidden");
    showStopsListInSelectedRoute().finally(() => {
        loadingOverlay.classList.add("hidden");
    });
}

let endStopInputTimeout = null;
endStopElement.addEventListener('change', handleEndStopEvent);
endStopElement.addEventListener('blur', handleEndStopEvent);
endStopElement.addEventListener('keypress', () => Vars.selectedStopOnSelectedRoute = null);

/** @param {Event} event */
function handleEndStopEvent(event) {
    if (event.type === "change") {
        // the default behavior is "blur" event, if "blur" event triggered too it will clear the timeout
        endStopInputTimeout = setTimeout(() => {
            selectEndStop();
        }, 150);
        return;
    }

    if (event.type === "blur") {
        // if the user selected a stop from the list, we don't want to trigger the blur event
        if (Vars.selectedStopOnSelectedRoute != null)
            return;

        const userInput = endStopElement.value?.trim();
        if (!userInput) return;

        const allOptions = Array.from(document.querySelectorAll("#endStopList option"));
        const matchingStop = allOptions.filter(opt =>
            opt.value.includes(userInput)
        );

        if (matchingStop.length === 0) return;

        if (matchingStop.length === 1) {
            endStopElement.value = matchingStop[0].value;
            selectEndStop();
            return;
        }

        // multiple matches – show selection
        select.innerHTML = "";
        matchingStop.forEach(option => {
            const opt = document.createElement("option");
            opt.value = option.value;
            opt.textContent = option.value;
            select.appendChild(opt);
        });

        div.classList.remove("hidden");

        confirmBtn.onclick = () => {
            endStopElement.value = select.value;
            div.classList.add("hidden");
            selectEndStop();
        };

        if (endStopInputTimeout) {
            clearTimeout(endStopInputTimeout);
            endStopInputTimeout = null;
        }
    }
}

function selectEndStop() {
    onChange_endStop();

    const selectedStop = endStopElement.value;
    Vars.selectedStopOnSelectedRoute = Vars.stopsOnSelectedRoute.find(stop => `${stop.stop_name} [${stop.stop_id}]` === selectedStop);

    showRouteOnMapFirstToEnd();
}

document.getElementById("getRouteButton").addEventListener('click', () => {
    // check all fields are setted
    if (!(firstStopElement.value &&
        routesInput.value &&
        endStopElement.value
    ))
        return alert("יש לבחור מסלול קודם")

    calculateWhereIsRecommendedToSit();

    // when load from history, selectedStop is null
    if (Vars.selectedStop == null)
        return;

    // save to history
    setLocalStorage(
        {
            route_short_name: Vars.selectedRoute.properties.route_short_name,
            firstStop: Vars.selectedStop.properties.stop_name,
            endStop: Vars.selectedStopOnSelectedRoute.stop_name,
            line: Vars.lineFromFirstStopToEndStop,
            date: Date.now()
        }
    )
});

// Modal
const modal = document.getElementById("modal");
document.getElementById("confirmFinish").addEventListener("click", function () {
    modal.classList.add("hidden");
});

modal.addEventListener("click", function () {
    modal.classList.add("hidden");
});

window.onclick = function (event) {
    if (event.target == modal) {
        modal.classList.add("hidden");
    }
}

// reset values on change
function onChange_endStop() {
    Vars.LayerLineFromFirstStopToEndStop ? Vars.map.removeLayer(Vars.LayerLineFromFirstStopToEndStop) : null;
    Vars.LayerLineFromFirstStop ? Vars.map.removeLayer(Vars.LayerLineFromFirstStop) : null;
    Vars.endStopMarker ? Vars.map.removeLayer(Vars.endStopMarker) : null;

    Vars.lineFromFirstStopToEndStop = null;
    Vars.selectedStopOnSelectedRoute = null;
}
function onChange_route() {
    onChange_endStop();

    resetInput('endStop');
    disabledInput('endStop');

    Vars.nextStopsMarkers ? Vars.map.removeLayer(Vars.nextStopsMarkers) : null;

    Vars.stopsOnSelectedRoute = [];
    Vars.selectedRoute = null;
}
function onChange_firstStop() {
    onChange_route();

    resetInput('routes');
    disabledInput('routes');

    Vars.firstStopMarker ? Vars.map.removeLayer(Vars.firstStopMarker) : null;

    Vars.selectedStop = null;
    Vars.routes = [];
}

function removeAllLayers() {
    const layers = [
        "LayerLineFromFirstStopToEndStop",
        "LayerLineFromFirstStop",
        "firstStopMarker",
        "endStopMarker",
        "stopMarkers",
        "selectedStopOnSelectedRoute"
    ]

    for (let layer of layers) {
        if (Vars[layer])
            Vars.map.removeLayer(Vars[layer])
    }
}