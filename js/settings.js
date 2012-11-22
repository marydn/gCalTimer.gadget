/* 
    Document   : settings
    Created on : 21/11/2012, 09:49:15 AM
    Author     : Mary De Nóbrega <denobrega.mary@gmail.com>
    URL        : http://marydenobrega.com/
    Description:
        Handle Auth for Google Calendar.
*/

var 
    LOGIN_URL = "https://www.google.com/accounts/ClientLogin",
    authToken,
    token,
    xmlHttp;
    
var
    gadget   = System.Gadget,
    settings = gadget.Settings;

gadget.onSettingsClosing = SettingsClosing;


if( settings.readString("gMail") != '' && settings.readString("gPassword") != '' ) {
    gMail.value     = settings.readString("gMail");
    gPassword.value = settings.readString("gPassword");
    var gCalList    = settings.readString("gCalList");
    
    if (gCalList != '') {
        gCalList = gCalList.split(',');
        
        if(gCalList.length>0) {
            var temp = '';
            var temp_selected = false;
            for(k = 0; k <gCalList.length; k++) {
                temp = gCalList[k].split('::');
                document.getElementById('comboList').options[k] = new Option(temp[0], temp[1]);
                document.getElementById('comboList').value = settings.read("gCalURL");
            }
        }
    }
}

function startAuth(mode) {
    settings.writeString("gMail", gMail.value);
    settings.writeString("gPassword", gPassword.value);

    if(settings.readString("gMail") != '' && settings.readString("gPassword") != '') {
        
        auth(settings.readString("gMail"), settings.readString("gPassword"), mode);
        
    } else {
        setStatus('Please edit settings.');
    }
}

function auth(emailAddress, password, mode) {
    setStatus("Connecting...");
    
    xmlHttp = new XMLHttpRequest();

    var postData =
        "accountType=HOSTED_OR_GOOGLE" +
        "&Email=" + emailAddress +
        "&Passwd=" + password +
        "&service=cl" +
        "&source=MaryDeNobrega-gCalTasks-1.0";

    xmlHttp.open("POST", LOGIN_URL, false);
    xmlHttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    xmlHttp.send(postData);
    
    msg(xmlHttp.status);
    
    if ( xmlHttp.status == 200 ) {
        setStatus("Connected.");
        
        authToken = getPropertyFrom(xmlHttp.responseText, "Auth");
        
        msg('Response: ' + xmlHttp.responseText);
        
        if( mode == 'list' ) {
            RetrieveCalendars();
        }
        
        return true;
        
    } else if (xmlHttp.status == 403) {
        setStatus('<span style="color:#ff0000">Login failed: check e-mail/password</span>');
        
        return false;
        
    } else {
        msg("HTTP " + xmlHttp.status + " " + xmlHttp.statusText + ": " + getPropertyFrom(xmlHttp.responseText, "Error"));
        
        return false;
    }
}

function RetrieveCalendars() {
    msg('Sending request...');
    
    var calendarDoc = makeAuthRequest('http://www.google.com/calendar/feeds/default/allcalendars/full');
    
    msg('Parsing...');
    
    var calendarList = calendarDoc.selectNodes('/feed/entry');
    var gCalList = '';
    
    for ( i = 0; i < calendarList.length; i++ ) {
        
        document.getElementById('comboList').options[i] = new Option(
            calendarList[i].selectSingleNode('title').childNodes[0].nodeValue, 
            calendarList[i].selectSingleNode('id').childNodes[0].nodeValue.replace('http://www.google.com/calendar/feeds/default/allcalendars/full/','')
        );
            
        gCalList += calendarList[i].selectSingleNode('title').childNodes[0].nodeValue + '::' + calendarList[i].selectSingleNode('id').childNodes[0].nodeValue.replace('http://www.google.com/calendar/feeds/default/allcalendars/full/', '') + ',';
    }
    
    settings.writeString("gCalList", gCalList.substring(0, gCalList.length-1));
}

function makeAuthRequest(url) {
    xmlHttp.open("GET", url, false);
    xmlHttp.setRequestHeader("Authorization", "GoogleLogin auth=" + authToken);
    xmlHttp.send(null);
    xmlHttp.open("GET", url, false);
    xmlHttp.setRequestHeader("Authorization", "GoogleLogin auth=" + authToken);
    xmlHttp.send(null);
    
    if (xmlHttp.status == 200) {
        msg('xml caricato (esito:' + xmlHttp.status + ')');
        msg('risultato: ' + xmlHttp.responseText);
        
        doc = new ActiveXObject("Microsoft.XMLDOM");
        doc.async="false";
        doc.loadXML(xmlHttp.responseText);
        
        return doc;
    } else {
        setStatus('Error while retrieving calendars. (code '+ xmlHttp.status + '). Please retry.');
        
        return false;
    }
}

function SettingsClosing(event) {
    
    if (event.closeAction == event.Action.commit) {
        settings.writeString("gMail", gMail.value);
        settings.writeString("gPassword", gPassword.value);
        select_id = document.getElementById("comboList");
        settings.writeString("gCalURL", select_id.value);
        settings.writeString("gCalText", select_id.options[select_id.selectedIndex].text);
    }
    
    event.cancel = false;
}



function getPropertyFrom(body, key) {
    var sub1 = body.substring(body.indexOf(key + "=") + key.length + 1);

    return sub1.substring(0, sub1.indexOf("\n"));
}

/**
 * Set messages for user.
 */
function setStatus(text) {
    document.getElementById('status').innerHTML = text;
}




/**
 * Set messages for debugging.
 */
function msg(text) {
    document.getElementById('debug').innerText = text;
}