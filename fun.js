/*
* Get: two stops (close to each other) on a bus line.
* Return: the angle (c) of the bus.
*/
function anglePer2stops(startStop, endStop){ 
    //Find the celuis of the bus to Y-axis
    var cBus;
    xDiff = endStop.x - startStop.x; //.x is Longitude
    yDIff = endStop.y - startStop.y; //.y is Latitude

    if(yDIff==0&&xDiff==0){
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
    if (xAngle=>180)
    { yAngle=-(xAngle-90); }
    else
    { yAngle=90+(-xAngle); }
    return yAngle;
}
