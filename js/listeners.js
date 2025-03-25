import { Vars } from './vars.js';
import {
    initMap, resetInput, disabledInput, findNearbyStops, getLocation,
    showRoutesListInStop, showStopsListInSelectedRoute,
    calculateWhereIsRecommendedToSit, showRouteOnMapFirstToEnd
} from './index.js';

document.getElementById('body').onload = () => {
    initMap();
};

document.getElementById("getMyLocationButton").addEventListener('click', () => {
    getLocation();
});

document.getElementById("findNearbyStopsButton").addEventListener('click', () => {
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
    resetInput('routes');
    resetInput('endStop');
    disabledInput('routes');
    disabledInput('endStop');

    // get the selected stop
    let selectedStop = document.getElementById("firstStop").value;
    Vars.selectedStop = Vars.nearbyStop.find(stop => stop.properties.stop_name === selectedStop);


    document.getElementById("loadingOverlay").classList.remove("hidden");
    showRoutesListInStop().finally(() => {
        document.getElementById("loadingOverlay").classList.add("hidden");
    });
});

document.getElementById("routes").addEventListener('change', (e) => {
    resetInput('endStop');
    disabledInput('endStop');

    const selectedRoute = document.getElementById("routes").value;
    Vars.selectedRoute = Vars.routes.find(route => route.properties.route_short_name === selectedRoute);

    // showRouteOnMap();
    document.getElementById("loadingOverlay").classList.remove("hidden");
    showStopsListInSelectedRoute().finally(() => {
        document.getElementById("loadingOverlay").classList.add("hidden");
    });
});

document.getElementById("endStop").addEventListener('change', () => {
    const selectedStop = document.getElementById("endStop").value;
    Vars.selectedStopOnSelectedRoute = Vars.stopsOnSelectedRoute.find(stop => stop.stop_name === selectedStop);

    showRouteOnMapFirstToEnd();
});

document.getElementById("getRouteButton").addEventListener('click', () => {
    calculateWhereIsRecommendedToSit();
});

// Madal
document.getElementById("confirmFinish").addEventListener("click", function () {
    document.getElementById("modal").classList.add("hidden");
});