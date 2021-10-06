/*
*
* used distanceBetweenStops
*
*/
function sortStopsList(rootData){
    const geometryArray = rootData['geometry']['coordinates']; //array of array
    var route_stops = rootData['properties']['route_stops']; //array of list

    //find the first and last stops (showing in route_long_name)
    var route_long_name = rootData['properties']['route_long_name'];
    var storeStops = [];
    var closeToFirst = 10000; // check who is the closed to first coordinates - mean is first stop.
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
    console.log('First - '+storeStops[0]['stop']['stop_name']+',End - '+storeStops[1]['stop']['stop_name']);


    //make new list
    var geometryArray_withChange = rootData['geometry']['coordinates']; //array of array
    
    for(stopIndex = 0; stopIndex< route_stops.length;stopIndex++){

        var lowDistance = 30000, lowDistance2 = 30000;
        var lowDistance_Kay = null, lowDistance2_Kay = null;

        for (geoIndex in geometryArray){
            
            secend_Location =  route_stops[stopIndex]['stop']['geometry']['coordinates'];
            distanceM = distance_M_BetweenStops(geometryArray[geoIndex], secend_Location);

            //get the two geometry closest to stop
            if (distanceM<lowDistance){
                lowDistance = distanceM;
                lowDistance_Kay = geoIndex;
            }
            else if (distanceM<lowDistance2){
                lowDistance2 = distanceM;
                lowDistance2_Kay = geoIndex;
            }
        }
        if (lowDistance2<lowDistance){
            lowDistance_Kay = lowDistance2_Kay;
        }
        console.log('Put stop in '+lowDistance_Kay);
        geometryArray_withChange.splice(lowDistance_Kay,0,route_stops[stopIndex]);

    }

    for (n=0;n<geometryArray_withChange.length;n++){
        storeStops.splice(n+1,0,geometryArray_withChange[n]);//all in one place sorted
    }
    //download(storeStops, 'json.txt', 'text/plain');

    //console.log(storeStops);
    return storeStops;

}
function download(content, fileName, contentType) {
    var a = document.createElement("a");
    var file = new Blob([content], {type: contentType});
    a.href = URL.createObjectURL(file);
    a.download = fileName;
    a.click();
}


function distance_M_BetweenStops(startStop, endStop){
    // use this method https://www.movable-type.co.uk/scripts/latlong.html

    const R = 6371e3; // metres
    const φ1 = startStop[1] * Math.PI/180; // φ, λ in radians
    const φ2 = endStop[1] * Math.PI/180;
    const Δφ = (endStop[1]-startStop[1]) * Math.PI/180;
    const Δλ = (endStop[0]-startStop[0]) * Math.PI/180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    const d = R * c; // in metres
    
    return d;
}


/*
* Get: list of stops in route. -- moved to index.html
* Do: calculate per 2 stop.
* Return: final right/left.
*/

//------------------not in use-------------
function persentPerRoute(stopslist){
    var cBus,persent,persentSide, sum_cBus=0;
    var sumR_cBus=0,sumL_cBus=0;
    for( i=0 ; i<stopslist.length - 1 ; i++){
        cBus = anglePer2stops(stopslist[i],stopslist[i+1]);
        //miss suncalc
        cBus_getSide = get_R_L_by_cBus(cBus);
        
        if (cBus_getSide=="r"){
            sumR_cBus++;
            sum_cBus++;
        }
        if (cBus_getSide=="l"){
            sumL_cBus++;
            sum_cBus--;
        }
    }

    if(sum_cBus>0){
        persent = sumR_cBus/stopslist.length;
        persentSide ="Right";
    }
    else{
        persent = sumL_cBus/stopslist.length;
        persentSide ="Left";
    } 

    return {'persent':persent,'persentSide':persentSide};
}

/*
* Get:
* Return:
*/
function distanceBetweenStops(startStop, endStop){
    return distance_M_BetweenStops(startStop, endStop);
    /*x = startStop[0] - endStop[0];
    y = startStop[1] - endStop[1];
    return Math.sqrt(x*x+y*y);*/
}

function get_R_L_by_cBus(cBus){
    var side;

    //reset to possitive number
    if (cBus<0){
        cBus+=360;
    }

    // in right side
    if (cBus<180){

        // diff littel then 10, will not count
        if(Math.abs(cBus-180)<10){
            side=null;
        } 
        else {
            side = "r";
        }
    }
    // in left side
    else {

        // diff littel then 10, will not count
        cBus-=180; // for abs value
        if(Math.abs(cBus-180)<10){
            side=null;
        } 
        else {
            side = "l";
        }
    }

    return side;
}



/*
* Get: two stops (close to each other) on a bus line.
* Return: the angle (c) of the bus.
*/
function anglePer2stops(startStop, endStop){ 

    //Find the celuis of the bus to Y-axis
    var cBus;
    xDiff = endStop[0] - startStop[0]; //.x is Longitude
    yDIff = endStop[1] - startStop[1]; //.y is Latitude

    if(yDIff==0&&xDiff==0){
        alert('same location!')
        //ERROR: Same location!! TODO:------------
    }
    // Math.atan2 return value in radians.
    cBus = Math.atan2(yDIff,xDiff) * 180 / Math.PI;
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
function xAngle_to_yAngle(xAngle){
    var yAngle=0;
    if (xAngle=>180)
    { yAngle=-(xAngle-90); }
    else
    { yAngle=90+(-xAngle); }
    return yAngle;
}
