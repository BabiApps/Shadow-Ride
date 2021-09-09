//מקבלת שתי תחנות\מיקומים על מסלול האוטובוס
//מחזירה את ההפרש המעלות בין האוטובוס לשמש, ובאיזה צד השמש
function per2stops(startStop, endStop){
    
    //Find the m of the bus
    var mBus=1;
    var cBus;
    xDiff = endStop.x - startStop.x; //.x is Longitude
    yDIff = endStop.y - startStop.y; //.y is Latitude

    if (xDiff>0){
        mBus=yDIff/xDiff;

    } else if (xDiff<0){


    }
    //If the longitude are the same (xDiff=0)
    //the cBus is according to yDiff (0 or 180)
    else if (xDiff==0){ 
        if (yDIff>0){
            cBus=0;
        } else if (yDIff<0){
            cBus=180;
        } else{ //yDiff ==0
            //ERROR: Same location!! --------------------
        }
    }

    //Find the celius of the bus (per X Line)
    cBus_x = Math.atan(mBus) * 180 / Math.PI; // Math.atan return value in radians.
    cBus = xAngle_to_yAngle(cBus_x);


    var a='lo_shave_whatsapp';
    if (a == "whatsapp")
        a='no problom';
    console.log(a);

    return {celius:a,side:"Left"};
}

/*
* Get the angle between bus and the X line
* Return the angle between bus and the Y line
*/
function xAngle_to_yAngle(xAngle){

    yAngle=xAngle-90; //TODO check the formula --------------

    return yAngle;
}
