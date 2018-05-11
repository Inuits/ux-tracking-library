let actions = [];
let value;
let backendLink = 'http://localhost:5000/';
let data;

//Get a token on page load
$(document).ready(function () {

    data = {
        name: "sportoffice",
        key: "aslkjhfadsljhyoiubyhr"
    };

    $.post(backendLink + "auth", data, function (resp) {
        localStorage.token = resp.access_token;
    }).fail(function (vara, varb, varc) {
        console.log(varc);
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
}

//Get info about the elements parent
function getParentInfo(target) {

    let targetParent = $(target).parent()[0];

    return {
        'type': targetParent.nodeName.toLowerCase(),
        'id': targetParent.id,
        'class': targetParent.className,
        'name': targetParent.name
    };
}

//Throw an error after 5 and after 15 seconds in the application
setTimeout(function () {
    addlert("Dit is een error");
}, 5000);
setTimeout(function () {
    cbonsoloe.log("Dit is een error");
}, 15000);

//Post information about the request with all the actions that happened before the request, clear the actions after it
$.ajaxSetup({
    beforeSend: function (jqXHR, request) {
        if (!request.url.startsWith(backendLink)) {
            sendActions(request.type, request.url, request.data)
        } else if (!request.url.includes("auth")) {
            jqXHR.setRequestHeader("Authorization", "Bearer " + localStorage.token);
        }
    }
});

//Fill in data on page load and request intercept
function sendActions(type, url, data) {
    postData = {
        'type': type,
        'url': url,
        'data': data,
        'actions': actions,
        'timestamp': new Date().getTime()
    };

    postLogs(postData, "action");
}

//Post information about the error with all the actions that happened before the error, clear the actions after it
window.onerror = function (message, source, lineno, colno, error) {

    let re = /https?:\/\/([^\/]*)\/(.*)/;

    message = Math.random().toString(36).substring(7);

    data = {
        'error': message,
        'source': re.exec(source)[2],
        'position': lineno + ',' + colno,
        'stack': error.stack,
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
