System.Gadget.settingsUI       = "/settings.html";
System.Gadget.onSettingsClosed = SettingsClosed;

var 
    LOGIN_URL = "https://www.google.com/accounts/ClientLogin",
    authToken,
    pauseTime      = 0,
    startTime,
    stopTime,
    timer,
    timerRunning   = 0,
    token,
    xmlHttp        = new XMLHttpRequest(),
    startButton    = document.getElementById('start'),
    stopButton     = document.getElementById('stop'),
    cancelButton   = document.getElementById('cancel'),
    calendarInput  = document.getElementById('calendar'),
    taskInput      = document.getElementById('task');
    


function SettingsClosed(event) {
    if( event.closeAction == event.Action.commit ) {
        startAuth();
    }
}

function getPropertyFrom(body, key) {
    var sub1 = body.substring(body.indexOf(key + "=") + key.length + 1);
    
    return sub1.substring(0, sub1.indexOf("\n"));
}