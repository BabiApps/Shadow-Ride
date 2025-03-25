export const Vars = {
    map: null,
    /** user pick location on the map */
    pickMarker: null,
    location: {
        lat: null,
        lon: null,
        radius: 150
    },
    /** nearby stops or stops on selected route */ 
    stopMarkers: [],
    firstStopMarker: null,
    endStopMarker: null,
    nearbyStop: [],
    selectedStop: null,
    routes : [],
    selectedRoute: null,
    stopsOnSelectedRoute: [],
    selectedStopOnSelectedRoute: null,
    lineFromFirstStop: null,
    lineFromFirstStopToEndStop: null,
    LayerLineFromFirstStop: null,
    LayerLineFromFirstStopToEndStop: null,
};

