import { Vars } from './vars.js';
import {
    initMap, resetInput, disabledInput, findNearbyStops, getLocation,
    showRoutesListInStop, showStopsListInSelectedRoute, loadHistory, setLocalStorage,
    calculateWhereIsRecommendedToSit, showRouteOnMapFirstToEnd, drewRouteLineOnMap
} from './index.js';
import MarkersIcon from './markersIcon.js';


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
    document.getElementById("firstStop").value = selected.firstStop;
    document.getElementById("routes").value = selected.route_short_name;
    document.getElementById("endStop").value = selected.endStop;
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

    document.getElementById("loadingOverlay").classList.remove("hidden");
    findNearbyStops().finally(() => {
        document.getElementById("loadingOverlay").classList.add("hidden");
    });
});


// Reset buttons
document.getElementById("resetFirstStop").addEventListener('click', () => {
    resetInput('firstStop');
});

document.getElementById("resetRoutes").addEventListener('click', () => {
    resetInput('routes');
});

document.getElementById("resetEndStop").addEventListener('click', () => {
    resetInput('endStop');
});


// Selection buttons
document.getElementById("firstStop").addEventListener('change', () => {
    onChange_firstStop();

    Vars.stopMarkers ? Vars.map.removeLayer(Vars.stopMarkers) : null;

    // get the selected stop
    let selectedStop = document.getElementById("firstStop").value;
    Vars.selectedStop = Vars.nearbyStop.find(stop => stop.properties.stop_name === selectedStop);

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

    document.getElementById("loadingOverlay").classList.remove("hidden");
    showRoutesListInStop().finally(() => {
        document.getElementById("loadingOverlay").classList.add("hidden");
    });
});

document.getElementById("routes").addEventListener('change', (e) => {
    onChange_route();

    const selectedRoute = document.getElementById("routes").value;
    Vars.selectedRoute = Vars.routes.find(route => route.properties.route_short_name === selectedRoute);

    document.getElementById("loadingOverlay").classList.remove("hidden");
    showStopsListInSelectedRoute().finally(() => {
        document.getElementById("loadingOverlay").classList.add("hidden");
    });
});

document.getElementById("endStop").addEventListener('change', () => {
    onChange_endStop();

    const selectedStop = document.getElementById("endStop").value;
    Vars.selectedStopOnSelectedRoute = Vars.stopsOnSelectedRoute.find(stop => stop.stop_name === selectedStop);

    showRouteOnMapFirstToEnd();
});

document.getElementById("getRouteButton").addEventListener('click', () => {
    // check all fields are setted
    if (!(document.getElementById("firstStop").value &&
        document.getElementById("routes").value &&
        document.getElementById("endStop").value
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

window.addEventListener("error", function (event) {
    this.alert("חלה שגיאה! יש לנסות שוב");
    window.location.href = window.location.href;
});
