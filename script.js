jsyaml = require('js-yaml');
cookes = require('js-cookie');

let actions = [];
let config = uxTrackingConfig;

onReady();

// is called right after config is loaded
function onReady() {
    let data = {
        name: config.appName,
        key: config.appKey
    };

    makePost(config.backendUrl + 'auth', data, function (resp) {
        localStorage.setItem('token', resp['access_token']);
    });

    addHttpInterceptor();

    document.addEventListener('error', function () {
        alert('bruuuuuuuuh');

        return true;
    });

    let originalConsoleLog = console.log;
    console.log = function () {
        args = [];
        args.push('[ux-tracking] ');
        // Note: arguments is part of the prototype
        for (let i = 0; i < arguments.length; i++) {
            args.push(arguments[i]);
        }
        originalConsoleLog.apply(console, args);
    };
}


function makeGet(url) {
    let req = new XMLHttpRequest();

    req.open(url);
    req.send();
}

function makePost(url, data, onDone = function () {
}) {
    let fd = new FormData();

    for (let key in data) {
        fd.append(key, data[key]);
    }


    let req = new XMLHttpRequest();

    req.onreadystatechange = function () {

        if (req.readyState === 4) {
            onDone(JSON.parse(req.response));
        }

    };

    req.open('POST', url);
    req.send(fd);
}


/*****************************
 *  REGISTERING FUNCTIONS
 *****************************/

function addHttpInterceptor() {
    (function (open) {
        XMLHttpRequest.prototype.open = function (method, url, async, user, password) {

            this.addEventListener("readystatechange", function () {

                if (this.readyState === 4) { //COMPLETE

                    if (url.indexOf(".html") === -1 && url.indexOf(config.backendUrl) === -1) {
                        actions.push({
                            method: 'REQ',
                            type: method,
                            value: this.response,
                            path: window.location.pathname,
                            target: url,
                            timestamp: new Date().getTime(),
                            client: config.appName
                        });


                        // if the request fails, post as error
                        if (this.status < 200 || this.status >= 400) {
                            let data = {
                                'error': this.status + ' ' + this.statusText,
                                'source': this.responseURL,
                                'stack': this.responseText,
                                'timestamp': new Date().getTime(),
                                'actions': JSON.stringify(actions),
                                client: config.appName
                            };
                            postLogs(data, "error");
                        }
                    }


                }
            }, false);


            open.apply(this, arguments);
            if (url.startsWith(config.backendUrl)) {
                this.setRequestHeader('Authorization', 'Bearer ' + localStorage.token);
            }
        }
    })(XMLHttpRequest.prototype.open);
}

//Set actions on clicks and focusouts
document.addEventListener('click', function (event) {
    if (["BODY", "HTML", "HEADER", "FOOTER", "FORM", "INPUT", "TEXTAREA", "SELECT"].indexOf(event.target) > -1) return;

    setAction(event, event.target.innerText, "click");
});

document.addEventListener('focusout', function (event) {
    if (event.target.name === 'password') return;

    setAction(event, event.target.value, "focusout");
});

//Post information about the error with all the actions that happened before the error, clear the actions after it
window.onerror = function (message, source, lineno, colno, error) {

    let re = /https?:\/\/([^\/]*)\/(.*)/;

    alert('ERROR');

    let data = {
        'error': message,
        'source': re.exec(source)[2],
        'position': lineno + ',' + colno,
        'stack': error.stack,
        'timestamp': new Date().getTime(),
        'actions': JSON.stringify(actions),
    };
    postLogs(data, "error");

    return true;
};


/*****************************
 *  DATA EXTRACTION FUNCTIONS
 *****************************/

//Set all the variables off the target, create an action of it
// TODO: put action 'cache' in localstorage in stead of global variable
function setAction(event, value, actionType) {
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
        client: config.appName,
        session: cookes.get('currentUsername'),
        position: "(" + event.pageX + "," + event.pageY + ")"
    });


    //Send actions to database when there are 20
    if (actions.length >= 10) {
        sendActions("Reached actions limit", window.location.pathname, "");
    }
}

//Get info about the elements parent
function getParentInfo(target) {

    let targetParent = target.parentNode[0];

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

//Fill in data on page load and request intercept
function sendActions(type, url, data) {
    postLogs({
        'actions': JSON.stringify(actions)
    }, "action");
}

//Post data to right url
function postLogs(data, url) {
    data['client'] = config.appName;
    data['session'] = cookes.get('currentUsername');

    makePost(config.backendUrl + url, data);

    actions = [];
}
