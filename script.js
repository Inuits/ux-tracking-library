let actions = [];
let value;
let backendLink = 'http://localhost:5000/';
let data;

//Get a token on page load
$(document).ready(function () {

    data = {
        name: "sportoffice",
        key: "fea2d9945b592ee9e14c3e3ffdc4cf74"
    };

    $.post(backendLink + "auth", data, function (resp) {
        localStorage.token = resp.access_token;
    }).fail(function (vara, varb, varc) {
    });

    
});

//Set actions on clicks and focusouts
$('html').on('click', function (event) {

    if (event.target.nodeName === "BODY" || event.target.nodeName === "HTML" || event.target.nodeName === "HEADER" || event.target.nodeName === "FOOTER"
        || event.target.nodeName === "FORM" || event.target.nodeName === "INPUT" || event.target.nodeName === "TEXTAREA" || event.target.nodeName === "SELECT") return;


    value = event.target.innerText;

    setAction(event, "click");
});

$('input,textarea,select').on('focusout', function (event) {
    if (event.target.name === 'password') return;

    value = event.target.value;
    setAction(event, "focusout");
});


//Set all the variables off the target, create an action of it
function setAction(event, actionType) {
    actions.push({
        id: event.target.id,
        class: event.target.className,
        name: event.target.name,
        value: value,
        timestamp: new Date().getTime(),
        type: event.target.nodeName,
        path: window.location.pathname,
        parent: getParentInfo(event.target),
        method: actionType,
    });


    //Send actions to database when there are 20
    if ( actions.length >= 20 ){
        sendActions("Reached actions limit", window.location.pathname, "");
    }
}

//Get info about the elements parent
function getParentInfo(target) {

    let targetParent = $(target).parent()[0];

    if (targetParent != null) {
        return {
            'type': targetParent.nodeName.toLowerCase(),
            'id': targetParent.id,
            'class': targetParent.className,
            'name': targetParent.name
        };
    } else {
        return {
            'parent': null
        }
    }

}

//Post information about the request with all the actions that happened before the request, clear the actions after it
$.ajaxSetup({
    beforeSend: function (jqXHR, request) {
        if (!request.url.startsWith(backendLink)) {
            //sendActions(request.type, request.url, request.data)
        } else if (!request.url.includes("auth")) {
            jqXHR.setRequestHeader("Authorization", "Bearer " + localStorage.token);
        }
    }
});

//Fill in data on page load and request intercept
function sendActions(type, url, data) {
    postLogs({
        'actions': JSON.stringify(actions)
    }, "action");
}

//Post information about the error with all the actions that happened before the error, clear the actions after it
window.onerror = function (message, source, lineno, colno, error) {

    let re = /https?:\/\/([^\/]*)\/(.*)/;

    data = {
        'error': message,
        'source': re.exec(source)[2],
        'position': lineno + ',' + colno,
        'stack': error.stack,
        'timestamp': new Date().getTime(),
        'actions': JSON.stringify(actions),
    };

    console.log(data);
    postLogs(data, "error");
};

//Post data to right url
function postLogs(data, url) {
    $.post(backendLink + url, data, function (resp) {
            console.log(resp);
        }
    );

    actions = [];
}
