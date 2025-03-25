const apiKey = "iMDAuMorfb5YN90M8fmjiswA5okKN0zX";
const baseUrl = "https://transit.land/api/v2/rest"

/**
 * Get the stops near a location
 * @param {{lat: number, lon: number, radius: number}} param0
 * @returns {Promise<{ type: string, features: Array<{ 
 *      geometry: { coordinates: Array<number>, type: string }, 
 *      properties: { feed_version: { 
 *              feed: { id: number, onestop_id: string }, 
 *              fetched_at: string, id: number, sha1: string 
 *      }, id: number, level: null, location_type: number, onestop_id: string, parent: null, 
 *      place: { adm0_iso: string, adm0_name: string, adm1_iso: string, adm1_name: string }, 
 *      platform_code: null, stop_code: string, stop_desc: string, stop_id: string, 
 *      stop_name: string, stop_timezone: string, stop_url: string, tts_stop_name: null, 
 *      wheelchair_boarding: number, zone_id: string }
 *  , type: string }>}>}
 */
async function nearByStops({ lat, lon, radius }) {
    const response = await fetch(baseUrl + "/stops?apikey=" + apiKey
        + "&feed_onestop_id=f-sv-גלים~מועצהאזוריתגולן~אפיקים~דןצפון~דןבדרום~דןבארשבע~ירושלים"
        + "&lat=" + lat + "&lon=" + lon + "&radius=" + radius
        + "&format=geojson");
    return await response.json();
}

async function getByStopID(stopID) {
    const response = await fetch(baseUrl + "/stops/" + stopID + "?apikey=" + apiKey
        + "&feed_onestop_id=f-sv-גלים~מועצהאזוריתגולן~אפיקים~דןצפון~דןבדרום~דןבארשבע~ירושלים"
        + "&format=geojson");
    return await response.json();
}

/**
 * Get the routes near a location
 * @param {number} routeID
 * @returns {Promise<{ type: string, features: Array<{
 *      geometry: { coordinates: Array<Array<number>>, type: string },
 *      properties: { agency: { agency_id: string, agency_name: string, id: number, onestop_id: string },
 *      continuous_drop_off: null, continuous_pickup: null, feed_version: { feed: { id: number, onestop_id: string },
 *      fetched_at: string, id: number, sha1: string }, id: number, onestop_id: string, route_color: string,
 *      route_desc: string, route_id: string, route_long_name: string, route_short_name: string, route_sort_order: number,
 *      route_stops: Array<{ stop: { geometry: { coordinates: Array<number>, type: string }, id: number, stop_id: string, stop_name: string } }>,
 *      route_text_color: string, route_type: number, route_url: string } 
 *  }>}>}
 */
async function getRoutesByID(routeID) {
    const response = await fetch(baseUrl + "/routes/" + routeID
        + "?apikey=" + apiKey
        + "&feed_onestop_id=f-sv-גלים~מועצהאזוריתגולן~אפיקים~דןצפון~דןבדרום~דןבארשבע~ירושלים&format=geojson"
    );
    return await response.json();
}

/**
 * Gets the routes near a specified geographic location.
 * 
 * @param {{ lat: number, lon: number, radius: number }} param - The parameters for the API request.
 * @returns {Promise<{ type: string, features: Array<{ geometry: 
 *              { coordinates: Array<Array<number>>, type: string }, 
 *              properties: { agency: {   agency_id: string,   agency_name: string,   id: number,   onestop_id: string }, 
 *              continuous_drop_off: null, continuous_pickup: null, feed_version: { feed: {   id: number,   onestop_id: string }, fetched_at: string, id: number,sha1: string }, 
 *              id: number, onestop_id: string, route_color: string, route_desc: string, route_id: string, route_long_name: string, route_short_name: string, route_sort_order: number, route_stops: Array<{ 
 *              stop: { geometry: {   coordinates: Array<number>,   type: string }, id: number, stop_id: string, stop_name: string } }>, 
 *              route_text_color: string, route_type: number, route_url: string } }> }>}
 */
async function getRoutesByLocation({ lat, lon, radius }) {
    const response = await fetch(baseUrl + "/routes?apikey=" + apiKey
        + "&feed_onestop_id=f-sv-גלים~מועצהאזוריתגולן~אפיקים~דןצפון~דןבדרום~דןבארשבע~ירושלים"
        + "&lat=" + lat + "&lon=" + lon + "&radius=" + radius
        + "&format=geojson");
    return await response.json();
}


/**
 * Get the routes near a location
 * @param {{lat: number, lon: number, radius: number}} param0
 * @returns {Promise< { type: string, features: Array<{
 *      geometry: { coordinates: Array<Array<number>>, type: string },
 *      properties: { bikes_allowed: number, block_id: string, 
 *          calendar: { added_dates: Array<string>, end_date: string, friday: number, monday: number, 
 *                  removed_dates: Array<string>, saturday: number, service_id: string, start_date: string, 
 *                  sunday: number, thursday: number, tuesday: number, wednesday: number }, 
 *          direction_id: number, feed_version: { feed: { id: number, onestop_id: string }, fetched_at: string, sha1: string }, 
 *          frequencies: Array<{}>, id: number, shape: { generated: boolean, shape_id: string }, stop_pattern_id: number, 
 *          trip_headsign: string, trip_id: string, trip_short_name: string, wheelchair_accessible: number }, 
 *      type: string }>, meta: { after: number, next: string }, type: string 
 * }>}
 */
async function getRoutesTripsByID(routeID) {
    const response = await fetch(baseUrl + "/routes/" + routeID + "/trips?apikey=" + apiKey + "&format=geojson");
    return await response.json();
}

export default {
    nearByStops,
    getRoutesByID,
    getRoutesByLocation,
    getByStopID,
    getRoutesTripsByID
};