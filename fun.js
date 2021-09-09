/*
* Get: two stops (close to each other) on a bus line.
* Return: the remainder between bus and sun, and on which side the sun.
*
* Future: receive time
*/
function per2stops(startStop, endStop){ 
    
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



    //for checking...
    var a='lo_shave_whatsapp';
    if (a == "whatsapp")
        a='no problom';
    console.log(a);

    return {celius:a,side:cBus};
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
