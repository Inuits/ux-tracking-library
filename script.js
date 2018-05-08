let actions = [];
let value;
let backendLink = 'http://127.0.0.1:5000/';

$('html').on('click', function (event) {

    if (event.target.nodeName === "BODY" || event.target.nodeName === "HTML" || event.target.nodeName === "HEADER" || event.target.nodeName === "FOOTER"
        || event.target.nodeName === "FORM" || event.target.nodeName === "INPUT" || event.target.nodeName === "TEXTAREA" || event.target.nodeName === "SELECT") return;


    value = event.target.innerText;
    let actionType = "click";
    setAction(event, actionType);
});

$('input,textarea,select').on('focusout', function (event) {
    if (event.target.name === 'password') return;

    value = event.target.value;
    let actionType = "focusout";
    setAction(event, actionType);
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
        //parent: getParentInfo(event.target),
        method: actionType,
    });

    console.log(JSON.stringify(actions));
}

//Get info about the elements parent
function getParentInfo(target) {
    return {
        'type': target.nodeName.toLowerCase(),
        'id': target.id,
        'class': target.className,
        'name': target.name,
    };
}

//Throw an error after 5 and after 15 seconds in the application
setTimeout(function () {
    addlert("Dit is een error");
}, 5000);
setTimeout(function () {
    addlert("Dit is een error");
}, 15000);

//Post information about the request with all the actions that happened before the request, clear the actions after it
/*$.ajaxSetup({
    beforeSend: function(jqXHR, request){
        let data;

        data = {
            'type': request.type,
            'url': request.url,
            'data': request.data,
            'actions': actions,
            'timestamp': new Date().getTime()
        };

        if (!request.url.startsWith(backendLink)) {
            $.post(backendLink + "action", data, function (resp) {
                console.log(resp)
            }, function (var1, var2, var3) {
                console.log(var3);
            });
        }

        actions = [];
    }
});*/

//Post information about the error with all the actions that happened before the error, clear the actions after it
window.onerror = function (message, source, lineno, colno, error) {

    console.log("Actions happened so far:\n" + actions);

    let re = /https?:\/\/([^\/]*)\/(.*)/;

    let data;

    if (actions.length === 0) {
        return;
    } else {
        data = {
            'error': message,
            'source': re.exec(source)[2],
            'position': lineno + ',' + colno,
            'stack': error.stack,
            'actions': JSON.stringify(actions),
        };

        console.log(data);

        $.post(backendLink + 'error', data, function (resp) {
            console.log(resp)
        });
    }

    //console.log("data:" + JSON.stringify(data));

    actions = [];
};
