/* 
    Document   : common
    Created on : 21/11/2012, 09:49:15 AM
    Author     : Mary De Nóbrega <denobrega.mary@gmail.com>
    URL        : http://marydenobrega.com/
    Description:
        Handle Auth for Google Calendar.
*/

/**
 * Authentication.
 */
function startAuth() {
    email    = System.Gadget.Settings.readString("gMail");
    password = System.Gadget.Settings.readString("gPassword");
    gCalURL  = System.Gadget.Settings.readString("gCalURL");
    gCalText = System.Gadget.Settings.readString("gCalText");
    
    if( email == '' || password == '' || gCalURL == '') {
        setStatus('Please edit settings.');
    } else {
        
        setStatus("Login to Google...");

        var postData =
            "accountType=HOSTED_OR_GOOGLE" + 
            "&Email=" + email +
            "&Passwd=" + password +
            "&service=cl" +
            "&source=MaryDeNobrega-gCalTasks-1.0";

        msg("Post string already.");

        xmlHttp.open("POST", LOGIN_URL, false);
        xmlHttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
        xmlHttp.send(postData);

        msg("Request sended.");

        if (xmlHttp.status == 200) {
            setStatus("Connected.");

            authToken = getPropertyFrom(xmlHttp.responseText, "Auth");
            token = authToken;

            msg('Response: ' + xmlHttp.responseText);

            calendarInput.value = gCalText;
            taskInput.disabled = false;

            if(timerRunning != 1) {
                startButton.disabled  = false;
                stopButton.disabled   = true;
                cancelButton.disabled = true;
            } else {
                startButton.disabled  = true;
                stopButton.disabled   = false;
                cancelButton.disabled = false;
            }

            return true;

        } else if (xmlHttp.status == 403) {
            setStatus('<span class="error">Login failed: check e-mail/password</span>');

            taskInput.disabled   = true;
            startButton.disabled  = true;
            stopButton.disabled   = true;
            cancelButton.disabled = true;

            return false;

        } else {
            msg("HTTP " + xmlHttp.status + " " + xmlHttp.statusText + ": " + getPropertyFrom(xmlHttp.responseText, "Error"));

            return false;
        }
    }
}

/**
 * Buttons functions.
 */
function startTimer() {
    if(taskInput.value == '') {
        setStatus('<span class="error">Please, fill task name.</span>');
        
    } else {
        setStatus('Timer started.');
        
        startTime = System.Time.getLocalTime(System.Time.currentTimeZone);
        startButton.disabled  = true;
        stopButton.disabled   = false;
        cancelButton.disabled = false;
        
        if( typeof pauseTime != 'number' || pauseTime == 0 ) {
            timer = setInterval("stopWatch(time(System.Time.getLocalTime(System.Time.currentTimeZone)-startTime))", 1000);
        } else {
            timer = setInterval("stopWatch(time((System.Time.getLocalTime(System.Time.currentTimeZone)-startTime)+pauseTime))", 1000);
        }
        
        timerRunning = 1;
        
        // become start button on pause button
        startButton.value    = "▌▌";
        startButton.title    = "Pause";
        startButton.disabled = false;
    }
}

function pauseTimer() {
    clearInterval(timer);
    timerRunning = 0;
    pauseTime += System.Time.getLocalTime(System.Time.currentTimeZone) - startTime;
    
    startButton.value = "►";
    
    setStatus('Timer paused.');
}

function stopTimer() {
    stopTime = System.Time.getLocalTime(System.Time.currentTimeZone);
    clearInterval(timer);
    timerRunning = 0;
    setStatus('Sending event to Google...');
    url = 'http://www.google.com/calendar/feeds/' + System.Gadget.Settings.readString("gCalURL") + '/private/full';
    makeAuthRequest_xml(url, createXMLevent(startTime, stopTime));
}

function cancelTimer() {
    resetAll();
}

function resetAll() {
    clearInterval(timer);
    
    timerRunning = 0;
    pauseTime    = 0;
    startTime    = 0;
    stopTime     = 0;
    
    taskInput.value       = "";
    startButton.value     = "►";
    startButton.disabled  = false;
    stopButton.disabled   = true;
    cancelButton.disabled = true;
    
    stopWatch('-:--:--:--');
}

/**
 * Time and date formats.
 */
function formatToGcal(strDate) {
    msg("Date: " + strDate);
    
    var myDate    = new Date(Date.parse(strDate));
    var myYear    = myDate.getFullYear();
    var myMonth   = leadingZero(myDate.getMonth()+1, 2);
    var myDay     = leadingZero(myDate.getDate(), 2);
    var myHours   = leadingZero(myDate.getHours(), 2);
    var myMinutes = leadingZero(myDate.getMinutes(), 2);
    var mySeconds = leadingZero(myDate.getSeconds(), 2);

    var myTimeZone      = myDate.getTimezoneOffset();
    var myTimeZone_sign = (myTimeZone + '').substring(0,1);
    
    if(myTimeZone_sign == '-') {
        myTimeZone_sign = '+';
    } else {
        myTimeZone_sign = '-';
    }
    
    var myTimeZone_hours = myDate.getTimezoneOffset() / 60;
    myTimeZone_hours = float2int(myTimeZone_hours);
    
    if(myTimeZone_hours < 0) {
        myTimeZone_hours = -myTimeZone_hours 
    }
    
    myTimeZone_hours = leadingZero(myTimeZone_hours, 2);
    
    var myTimeZone_minutes = myDate.getTimezoneOffset() % 60;
    
    if(myTimeZone_minutes < 0) {
        myTimeZone_minutes = -myTimeZone_minutes 
    }
    myTimeZone_minutes = leadingZero(myTimeZone_minutes, 2);
    
    // YYYY-MM-DDTHH:MM:SS.000-07:00
    
    formatedTime = myYear + '-' + myMonth + '-' + myDay + 
        'T' + myHours + ':' + myMinutes + ':' + mySeconds + '.000' +
        myTimeZone_sign + myTimeZone_hours + ':' + myTimeZone_minutes;
    
    msg("Formated date: " + formatedTime);
    
    return formatedTime;
}

function float2int(value) {
    return value | 0;
}

function leadingZero(num, count) {
    var numZeropad = num + '';
    
    while(numZeropad.length < count) {
        numZeropad = "0" + numZeropad;
    }
    
    return numZeropad;
}

function two(x) {
    return ((x > 9) ? "" : "0") + x
}

function three(x) {
    return ((x > 99) ? "" : "0")+((x > 9) ? "" : "0") + x
}

function time(ms) {
    var sec = Math.floor(ms/1000)
    ms = ms % 1000
    t = three(ms)

    var min = Math.floor(sec/60)
    sec = sec % 60
    t = two(sec)

    var hr = Math.floor(min/60)
    min = min % 60
    t = two(min) + ":" + t

    var day = Math.floor(hr/60)
    hr = hr % 60
    t = two(hr) + ":" + t
    t = day + ":" + t

    return t
}

/**
 * Request.
 */
function makeAuthRequest_xml(url, xmlDoc) {
    xmlHttp.open("POST", url, false);
    xmlHttp.setRequestHeader("Authorization", "GoogleLogin auth=" + authToken);
    xmlHttp.setRequestHeader("Content-Type", "application/atom+xml");
    xmlHttp.send(xmlDoc);
    
    if(xmlHttp.status==200 || xmlHttp.status==201) {
        setStatus('Event sent successfully.');
        
        resetAll();
    } else {
        setStatus('ERR ' + xmlHttp.status + '. Try to stop again.');
        
        stopButton.disabled   = false;
        startButton.disabled  = true;
        cancelButton.disabled = false;
    }
    
    return {
        responseText : xmlHttp.responseText,
        status       : xmlHttp.status
    }
}

function createXMLevent(time_start, time_end){
    msg('Creating event...');
    
    var xmlData = "<?xml version='1.0' ?>" +
        "<entry xmlns='http://www.w3.org/2005/Atom' xmlns:gd='http://schemas.google.com/g/2005'>" +
        "  <category scheme='http://schemas.google.com/g/2005#kind' term='http://schemas.google.com/g/2005#event'></category>" +
        "  <title type='text'>" + taskInput.value + "</title>" +
        "  <content type='text'>" + taskInput.value + "</content>" +
        "  <gd:transparency value='http://schemas.google.com/g/2005#event.opaque'></gd:transparency>" +
        "  <gd:eventStatus value='http://schemas.google.com/g/2005#event.confirmed'></gd:eventStatus>" +
        //"  <gd:where valueString='Caracas'></gd:where>" +
        "  <gd:when startTime='" + formatToGcal(time_start) + "' endTime='" + formatToGcal(time_end) + "'></gd:when>" +
        "</entry>";

    return xmlData;
}

/**
 * Handle messages.
 */
function msg(string) {
    document.getElementById('debug').innerHTML = string;
}

function setStatus(string) {
    document.getElementById('status').innerHTML = string;
}

function stopWatch(string){
    document.getElementById('watch').innerHTML = string;
}