let actions = [];

let config = {
    appName: uxTrackingConfig.appName,
    appKey: uxTrackingConfig.appKey,
    backendUrl: uxTrackingConfig.backendUrl,
    cacheSize: uxTrackingConfig.cacheSize ? Math.min(uxTrackingConfig.cacheSize, 50) : 10
};

switch (uxTrackingConfig.sessionType) {
    default:
    case 'localstorage':
        config['session'] = () => getStorageValue('session', uxTrackingConfig.sessionId);
        break;
    case 'cookies':
        cookies = require('js-cookie');
        config['session'] = () => getStorageValue('cookies', uxTrackingConfig.sessionId);
        break;
}

function getStorageValue(type, id) {
    const split = id.split('.');

    let value = '';

    switch (type) {
        case 'cookies':
            value = cookies.get(split[0]);
            break;
        case 'localstorage':
        default:
            value = localStorage.getItem(split[0]);
            break;
    }

    if (split.length === 1) return value;

    try {
        value = JSON.parse(value);
    } catch (e) {
    }

    for (let i = 1; i < split.length; i++) {
        value = value[split[i]]
    }

    return value;
}

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
            if (req.response)
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
                    let actionsNumber;

                    if (url.indexOf(".html") === -1 && !url.startsWith(config.backendUrl)) {
                        parseActions();

                        actions.push({
                            method: 'REQ',
                            type: method,
                            value: this.response,
                            path: window.location.pathname,
                            target: url,
                            timestamp: new Date().getTime(),
                            client: config.appName,
                            session: config.session()
                        });

                        localStorage.setItem("actions", JSON.stringify(actions));
                        actionsNumber = Number(localStorage.getItem("actionNumber"));
                        actionsNumber = actionsNumber + 1;

                        localStorage.setItem("actionNumber", actionsNumber.toString());

                        if (actionsNumber >= config.cacheSize) {
                            sendActions("Reached actions limit", window.location.pathname, "");
                            localStorage.setItem("actionNumber", "0");
                        }


                        // if the request fails, post as error
                        if (this.status < 200 || this.status >= 400) {
                            let data = {
                                error: this.status + ' ' + this.statusText,
                                source: this.responseURL,
                                stack: this.responseText,
                                timestamp: new Date().getTime(),
                                client: config.appName,
                                session: config.session()
                            };
                            postLogs(data, "error");
                            sendActions("Encountered an error", window.location.pathname, "")
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
    if (["BODY", "HTML", "HEADER", "FOOTER", "FORM", "INPUT", "TEXTAREA", "SELECT"].includes(event.target.nodeName)) return;

    setAction(event, event.target.innerText, "click");
});

document.addEventListener('focusout', function (event) {
    if (["SELECT", "INPUT", "TEXTAREA"].includes(event.target.nodeName)) {
        if (event.target.name === 'password') return;

        let value = event.target.value;

        setAction(event, "" + value, "focusout");
    }

});

//Post information about the error with all the actions that happened before the error, clear the actions after it
window.onerror = function (message, source, lineno, colno, error) {

    let re = /https?:\/\/([^\/]*)\/(.*)/;

    if (!source.startsWith(config.backendUrl)) {
        let data = {
            error: message,
            source: re.exec(source) !== null ? re.exec(source)[2] : '',
            position: lineno + ',' + colno,
            stack: error.stack,
            timestamp: new Date().getTime(),
            client: config.appName,
            session: config.session()
        };

        sendActions("Encountered an error", window.location.pathname, "")
        postLogs(data, "error");
    }
};

/*****************************
 *  DATA EXTRACTION FUNCTIONS
 *****************************/

//Set all the variables off the target, create an action of it
function setAction(event, value, actionType) {
    let tree = getDomPath(event.target);
    let actionsNumber;

    parseActions();

    actions.push({
        id: event.target.id,
        class: typeof event.target.className !== 'string' ? '' : event.target.className,
        name: event.target.name,
        value: '' + value,
        timestamp: new Date().getTime(),
        type: event.target.nodeName,
        path: window.location.href,
        tree: tree.join(' > '),
        parent: getParentInfo(event.target),
        method: actionType,
        client: config.appName,
        session: '' + config.session(),
        position: "(" + event.pageX + "," + event.pageY + ")"
    });

    localStorage.setItem("actions", JSON.stringify(actions));

    actionsNumber = Number(localStorage.getItem("actionNumber"));
    actionsNumber = actionsNumber + 1;
    localStorage.setItem("actionNumber", actionsNumber.toString());

    if (actionsNumber >= config.cacheSize) {
        sendActions("Reached actions limit", window.location.pathname, "");
        localStorage.setItem("actionNumber", "0");
    }
}

//Get info about the elements parent
function getParentInfo(target) {

    if (target.parentElement === null) return;

    let targetParent = target.parentElement;

    if (targetParent !== null) {
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
        'actions': localStorage.getItem("actions")
    }, "action");
}

function parseActions() {
    actions = localStorage.getItem("actions") !== null ? JSON.parse(localStorage.getItem("actions")) : [];
}

//Post data to right url
function postLogs(data, url) {
    makePost(config.backendUrl + url, data);

    localStorage.removeItem("actions");
    localStorage.setItem("actionNumber", "0");
}

//Get the full DOM tree of the clicked element
function getDomPath(el) {
    let stack = [];
    while (el.parentNode != null) {
        let sibCount = 0;
        let sibIndex = 0;
        for (let i = 0; i < el.parentNode.childNodes.length; i++) {
            let sib = el.parentNode.childNodes[i];
            if (sib.nodeName == el.nodeName) {
                if (sib === el) {
                    sibIndex = sibCount;
                }
                sibCount++;
            }
        }
        if (el.hasAttribute('id') && el.id != '') {
            stack.unshift(el.nodeName.toLowerCase() + '#' + el.id);
        } else if (sibCount > 1) {
            stack.unshift(el.nodeName.toLowerCase() + ':eq(' + sibIndex + ')');
        } else {
            stack.unshift(el.nodeName.toLowerCase());
        }
        el = el.parentNode;
    }

    return stack.slice(1); // removes the html element
}

