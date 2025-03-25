import transitland from './transitland.js';
import { whereIsRecommendedToSit } from './fun.js';

const search_caches = getLocalStorage();
//console.log(search_caches)
for (const key of Object.keys(search_caches)) {
  let historylist = document.getElementById("historylist");
  var option = document.createElement("option");
  option.text = key;
  historylist.add(option)
}
//setLocalStorage(search_caches)

//globle varible
var dataFile = [];
var stopsData = [];
var stops_firstToEnd = [];
var rootAllFirstStopsID = [];
var rootAllNearbyStopsLocation = [];
var sortStops = []; // without geomrtry on road/line
var stopsWithLine;
var getOn;

var nearbyStopMarker = L.featureGroup().addTo(map);
var On_OffRoute = L.featureGroup().addTo(map);
var stopOnRoute = L.featureGroup().addTo(map);
// https://stackoverflow.com/a/39968118

var busGetOn = L.icon({
  iconUrl: 'icons8-get-on-bus-100.png',
  iconSize: [25, 25], // size of the icon
});
var busGetOff = L.icon({
  iconUrl: 'icons8-get-off-bus-100.png',
  iconSize: [25, 25], // size of the icon
});

$('.hidekeyboard').on('focus', function () {
  $(this).trigger('blur');
});





/**
 * get trip times, and print msg to user
*/
function calculatePerFullRoute() {
  whereIsRecommendedToSit(stops_firstToEnd);
}

async function routes(data) {
  //console.log(data)
  var routeList = [];
  if (data['route_stops'] == null) {
    let idStop = data.id;
    let dataJSON = await transitland.getByStopID(idStop);
    console.log(dataJSON)
    data['route_stops'] = dataJSON.features[0]?.properties?.route_stops
  }
  for (let i = 0; i < data['route_stops']?.length; i++) {
    routeList.push(data["route_stops"][i]["route"]);
  }
  console.log(routeList)
  return routeList;
}

function showRoutesListInStop() {

  document.getElementById('list_StopsInRoute').innerHTML = ""
  document.getElementById('button_startCalc').innerHTML = ""
  document.getElementById('showAnswer').innerHTML = ""

  // reset old layer
  map.removeLayer(nearbyStopMarker);
  map.removeLayer(On_OffRoute);
  map.removeLayer(stopOnRoute);
  //nearbyStopMarker = L.featureGroup({}).addTo(map);
  On_OffRoute = L.featureGroup({}).addTo(map);
  stopOnRoute = L.featureGroup({}).addTo(map);

  var element_input = document.getElementById('stops');
  var element_datalist = document.getElementById('stops1');
  var opSelected = element_datalist.querySelector(`[value="${element_input.value}"]`);
  var val = opSelected.getAttribute('data-value');

  // show on map the start stop
  if (getOn != null) {
    //map.removeLayer(oldMarker);
    getOn.setLatLng(rootAllNearbyStopsLocation[val]).update();  // Updates your defined marker position
  } else {
    getOn = new L.Marker(rootAllNearbyStopsLocation[val], { icon: busGetOn }).bindPopup(element_input.value);
    getOn.addTo(map);
  }
  map.setView(rootAllNearbyStopsLocation[val]);


  var x = `<label for="routes">בחר קו: <input id="routes" list="routes1" inputmode=“none”  autocomplete="off"  onChange="showStopsListInRoute()"> <button class="resetbutton" onclick="document.getElementById('routes').value=''">אפס</button></label>
          <datalist name="routes" id="routes1">
          <option value="" selected disabled hidden>בחר קו</option>`;
  //    class="hidekeyboard" onfocus="blur()"inputmode=“none” onfocus="this.value=''" 


  var n = 0;
  while (n < dataFile[val].length) {
    // split long name
    route_long_name = dataFile[val][n]["route_long_name"];
    //console.log(route_long_name);
    end = route_long_name.slice(route_long_name.indexOf(">") + 1, route_long_name.indexOf('#') - 2);
    first = route_long_name.slice(0, route_long_name.indexOf('<'));
    routeNumber = route_long_name.slice(route_long_name.indexOf('#') - 1);

    x += `<option data-value="${dataFile[val][n]["id"]}" value="קו ${dataFile[val][n]["route_short_name"]}, מסלול ${routeNumber}">מ:${first}, לכיוון: ${end}</option>`;
    n++
  }
  x += `</datalist><br>`;
  document.getElementById('listForTest').innerHTML = x;
}

/**
 * #######################################
*/

function showStopsListInRoute() {

  stops_firstToEnd = [];

  document.getElementById('list_StopsInRoute').innerHTML = "";
  document.getElementById('button_startCalc').innerHTML = "";
  document.getElementById('showAnswer').innerHTML = "";

  // reset old layer
  map.removeLayer(nearbyStopMarker);
  map.removeLayer(On_OffRoute);
  map.removeLayer(stopOnRoute);
  nearbyStopMarker = L.featureGroup().addTo(map);
  On_OffRoute = L.featureGroup().addTo(map);
  stopOnRoute = L.featureGroup().addTo(map);

  var element_input = document.getElementById('routes');
  var element_datalist = document.getElementById('routes1');
  var opSelected = element_datalist.querySelector(`[value="${element_input.value}"]`);
  let idOfRoute = "";
  try {
    idOfRoute = opSelected.getAttribute('data-value');
  } catch {
    alert("מספר הקו לא תקין")
  }

  var element_input = document.getElementById('stops');
  var element_datalist = document.getElementById('stops1');
  var opSelected = element_datalist.querySelector(`[value="${element_input.value}"]`);
  var tempValue1 = "";
  try {
    tempValue1 = opSelected.getAttribute('data-value');
  } catch {
    alert("תחנת המוצא לא תקינה")
  }
  let firstStopID = rootAllFirstStopsID[tempValue1];

  var linkRoute = `https://transit.land/api/v2/rest/routes/${idOfRoute}?apikey=iMDAuMorfb5YN90M8fmjiswA5okKN0zX&format=geojson`;
  console.log('linkRoute ' + linkRoute);

  var urlTrip = `https://transit.land/api/v2/rest/routes/${idOfRoute}/trips?apikey=iMDAuMorfb5YN90M8fmjiswA5okKN0zX&format=geojson`
  console.log('urlTrip ' + urlTrip);

  document.getElementById('list_StopsInRoute').innerHTML = "מעבד..."
  const trip_XHR = new XMLHttpRequest();
  trip_XHR.open("GET", urlTrip, true);
  trip_XHR.onload = function () {
    if (this.status !== 200) {
      return useRouteInfo();
    }

    let tripObj = JSON.parse(this.responseText);

    if (tripObj["features"][0] === undefined) {
      // no data
      useRouteInfo();
      return
    }
    stopsWithLine = insertStopsToBusLine(tripObj["features"][0]);
    let eStop_str = makeStr_eStop(stopsWithLine, firstStopID);

    document.getElementById('list_StopsInRoute').innerHTML = eStop_str;
  }
  trip_XHR.send();

  /*############################################
          if tripURL didnt give info
  #############################################*/
  function useRouteInfo() {

    const xhr = new XMLHttpRequest();
    xhr.open("GET", linkRoute, true);

    xhr.onload = function () {
      if (this.status !== 200) {
        return alert("שגיאה! לא מצליח לגשת לנתוני השרת");
      }

      let routeObj = JSON.parse(this.responseText);
      if (routeObj["features"][0] === undefined) {
        // no data
        alert("שגיאה! השרת החזיר נתון ריק");
        return
      }
      let stopsWithLine = sortStopsByLine(routeObj["features"][0]);
      let eStop_str = makeStr_eStop(stopsWithLine, firstStopID);

      document.getElementById('list_StopsInRoute').innerHTML = eStop_str;
    }
    // At last send the request
    xhr.send();
  }

}

// show button
// show on map start\end stops
// short the list
function showButtonForCalc() {
  document.getElementById('button_startCalc').innerHTML =
    `<div hidden><input  id="date" type="date" name="task_date" /> :תאריך<br></div>` + // the date is hidden (not needed)
    `<input id="time" type="time" name="task_time" /> :שעה
    <br>
    <br>
    <button class="w3-btn w3-blue w3-hover-light-grey" onclick="calculatePerFullRoute()">התחל לחשב</button>
    <br>`;

  // set time on the timeInput
  let timeToShow = getCurrentTime()
  document.getElementById('date').value = timeToShow[0];
  document.getElementById("time").value = timeToShow[1];

  // remove old route
  map.removeLayer(On_OffRoute); // when reselected
  map.removeLayer(stopOnRoute); // all the stops from the user's first stop
  On_OffRoute = L.featureGroup().addTo(map);

  // find user's exit stop
  var element_input = document.getElementById('eStop');
  var element_datalist = document.getElementById('eStop1');
  var opSelected = element_datalist.querySelector(`[value="${element_input.value}"]`);
  let lastStopID = opSelected.getAttribute('data-value');

  // make new list with all stop from where the user get on the bus to end stop
  // and show marker for end stop
  stops_firstToEnd = [];
  var previusCoordinates = null;

  for (stopindex in stopsWithLine) {
    stops_firstToEnd.push(stopsWithLine[stopindex]);

    // show eStop marker
    // stop when find the eStop
    if ('stop' in stopsWithLine[stopindex]) {
      //console.log(stopsWithLine[stopindex]['stop'])
      if (stopsWithLine[stopindex]['stop']['id'] == lastStopID) {
        var eStopLocation = stopsWithLine[stopindex]["stop"]["geometry"]["coordinates"];
        coordinates = [eStopLocation[1], eStopLocation[0]];
        let eStop_Marker = new L.Marker(coordinates, { icon: busGetOff }).bindPopup(stopsWithLine[stopindex]["stop"]['stop_name']);
        On_OffRoute.addLayer(eStop_Marker);
        break; // stop pushing when end-stop founded
      }
    }
    // show the line
    else {
      coordinates = [stopsWithLine[stopindex][1], stopsWithLine[stopindex][0]];
      if (previusCoordinates != null && stopindex < stopsWithLine.length - 1) {
        let line = new L.polyline([previusCoordinates, coordinates]);
        On_OffRoute.addLayer(line);
      }
      previusCoordinates = coordinates;
    }
  }

  map.fitBounds(On_OffRoute.getBounds());

}

async function findNearStops() {
  //show section
  document.getElementById('section2').style.display = 'block';

  //clear
  document.getElementById('listForTest').innerHTML = ""
  document.getElementById('list_StopsInRoute').innerHTML = ""
  document.getElementById('button_startCalc').innerHTML = ""
  document.getElementById('showAnswer').innerHTML = ""


  // reset old layer
  try {
    map.removeLayer(nearbyStopMarker);
    map.removeLayer(On_OffRoute);
    map.removeLayer(stopOnRoute);
    nearbyStopMarker = L.featureGroup().addTo(map);
    On_OffRoute = L.featureGroup().addTo(map);
    stopOnRoute = L.featureGroup().addTo(map);
  } catch (error) {

  }


  if (getOn != null) {
    map.removeLayer(getOn);
    getOn = null;
  }

  // reset old data files
  dataFile = [];
  stopsData = [];
  stops_firstToEnd = [];
  rootAllFirstStopsID = [];
  rootAllNearbyStopsLocation = [];
  sortStops = [];

  var lat = document.getElementById('lat').value;
  var lon = document.getElementById('lon').value;
  var radius = document.getElementById('radius').value * 10;

  const obj = await transitland.nearByStops({
    lat, lon, radius
  })

  // Getting the ul element
  let list = document.getElementById("list");
  var str = `<label for="stops"><label type="text">בחר תחנת מוצא: </label><input list="stops1" id="stops" onChange="showRoutesListInStop()"> <button class="resetbutton" onclick="document.getElementById('stops').value=''">אפס</button></label>
                      <datalist name="stops" id="stops1">
                        <option value="" selected disabled hidden>בחר תחנת עלייה</option>`; //onfocus="this.value=''" inputmode=“none” autocomplete="off"

  // check if works - class="hidekeyboard" intead  inputmode=“none” onfocus="this.value=''" class="hidekeyboard"onfocus="blur()" 

  var stop_code = [];
  var stop_names = [];
  let stop_name_counter = 1

  // var nearbyIcon = L.icon({
  //     iconUrl: 'icons8-bus-48.png',
  //     iconSize: [20, 20], // size of the icon
  // });


  //console.log('stops near by: ' + obj['features'].length);
  var n = 0;
  while (n < obj['features'].length) {
    let data = obj['features'][n]['properties'];
    let coordinates = [obj['features'][n]['geometry']['coordinates'][1], obj['features'][n]['geometry']['coordinates'][0]];
    //console.log(coordinates)

    // when the stop already in the list (רציפים)
    if (stop_code.includes(data["stop_code"])) {
      //console.log("exist - " + data["stop_code"]);
    }
    else {

      //if the same name shown couple of time but in diffrent stops
      let stop_name_temp = data['stop_name']
      if (stop_names.includes(stop_name_temp)) {
        stop_name_temp += ` #${stop_name_counter}`
        stop_name_counter++
      }

      str += `<option data-value=${data['stop_code']} value="${stop_name_temp}">${data['stop_code']}</option>`;
      rootAllFirstStopsID[data['stop_code']] = data['id'];

      stop_code.push(data["stop_code"]);
      stop_names.push(stop_name_temp)
      //console.log(stop_name_temp);


      rootAllNearbyStopsLocation[data['stop_code']] = coordinates;

      // var marker = new L.Marker(coordinates, { icon: nearbyIcon }).bindPopup(data['stop_name']);
      // nearbyStopMarker.addLayer(marker);
    }

    if (dataFile[data['stop_code']] == null) {
      dataFile[data['stop_code']] = [];
    }
    dataFile[data['stop_code']] = [...dataFile[data['stop_code']], ...await routes(data)]; //n+1 is the kay, value is the return array

    n++;
  }

  str += `</datalist><br>`;


  if (n != 0) {
    //map.fitBounds(nearbyStopMarker.getBounds());
    document.getElementById('collapse_head').innerHTML = 'תחנות קרובות:';
    list.innerHTML = str;
  }
  else {
    alert("אין תחנות באיזור!\nנסה להגדיל ידנית את הטווח חיפוש.")
  }




  var section2 = document.getElementById("section2");
  section2.scrollIntoView({
    behavior: "smooth",
    block: "end",
    inline: "nearest"
  });

};

function historyGotSelected() {
  let historylist = document.getElementById("historylist");
  let historylist_value = historylist.value;
  console.log(historylist_value);
  let arrayRouteInfo = search_caches[historylist_value];
  whereIsRecommendedToSit(arrayRouteInfo);
}


// ###################################################################
// Script for Sidebar, Tabs, Accordions, Progress bars and slideshows
// ###################################################################

function loadTranslate() {
  var LngObject = JSON.parse(data); // from "languages.js"
  var translate = new Translate();
  var currentLng = document.getElementById('lang').value;//'fr'\'en'
  var attributeName = 'data-lang';
  translate.init(attributeName, currentLng, LngObject);
  translate.process();
}

// Source: http://stackoverflow.com/questions/497790
var dates = {
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

function isDayNow(StopLocation, customDate) {

  sunCalcTime = SunCalc.getTimes(/*Date*/ customDate,
                              /*Number*/ StopLocation[0],
                              /*Number*/ StopLocation[1],
                              /*Number (default=0)*/ 0);

  startTime = sunCalcTime['sunriseEnd']
  endTime = sunCalcTime['sunsetStart']

  return dates.inRange(customDate, startTime, endTime);
}

document.getElementById("findNearStopsButton").addEventListener('click', () => {
  findNearStops()
})

document.getElementById("stops").addEventListener('change', () => {
  showRoutesListInStop()
})