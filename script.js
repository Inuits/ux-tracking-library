jsyaml = require('js-yaml');

let actions = [];
let config = {
    appName: uxTrackingConfig.appName,
    appKey: uxTrackingConfig.appKey,
    backendUrl: uxTrackingConfig.backendUrl
};

switch (uxTrackingConfig.sessionType) {
    case 'localstorage':
        config['session'] = function () {
            return localStorage.getItem(uxTrackingConfig.sessionId)
        };
        break;
    case 'cookies':
    default:
        cookies = require('js-cookie');
        config['session'] = function () {
            return cookies.get(uxTrackingConfig.sessionId);
        };

        break;
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
            if(req.response)
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
                    if (url.indexOf(".html") === -1 && !url.startsWith(config.backendUrl)) {
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


                        // if the request fails, post as error
                        if (this.status < 200 || this.status >= 400) {
                            let data = {
                                error: this.status + ' ' + this.statusText,
                                source: this.responseURL,
                                stack: this.responseText,
                                timestamp: new Date().getTime(),
                                actions: JSON.stringify(actions),
                                client: config.appName,
                                session: config.session()
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
    if (["BODY", "HTML", "HEADER", "FOOTER", "FORM", "INPUT", "TEXTAREA", "SELECT"].includes(event.target.nodeName)) return;

    setAction(event, event.target.innerText, "click");
});

document.addEventListener('focusout', function (event) {
    if (["SELECT", "INPUT", "TEXTAREA"].includes(event.target.nodeName)){
        console.log("focusout action");
        if (event.target.name === 'password') return;

        let value = event.target.value;

        setAction(event, "" + value, "focusout");
    }

});

//Post information about the error with all the actions that happened before the error, clear the actions after it
window.onerror = function (message, source, lineno, colno, error) {

    let re = /https?:\/\/([^\/]*)\/(.*)/;

    if( !source.startsWith(config.backendUrl ) ) {
        console.log("lalalala:" + re.exec(source));
        console.log(error);
        console.log(source);
        let data = {
            error: message,
            source: re.exec(source) !== null ? re.exec(source)[2] : '',
            position: lineno + ',' + colno,
            stack: error.stack,
            timestamp: new Date().getTime(),
            actions: JSON.stringify(actions),
            client: config.appName,
            session: config.session()
        };
        postLogs(data, "error");
    }

    //return true;
};


/*****************************
 *  DATA EXTRACTION FUNCTIONS
 *****************************/

//Set all the variables off the target, create an action of it
// TODO: put action 'cache' in localstorage in stead of global variable
function setAction(event, value, actionType) {
    let tree = getDomPath(event.target);

    actions.push({
        id: event.target.id,
        class: event.target.className,
        name: event.target.name,
        value: '' + value,
        timestamp: new Date().getTime(),
        type: event.target.nodeName,
        path: window.location.pathname,
        tree: tree.join(' > '),
        parent: getParentInfo(event.target),
        method: actionType,
        client: config.appName,
        session: '' + config.session(),
        position: "(" + event.pageX + "," + event.pageY + ")"
    });


    //Send actions to database when there are 20
    if (actions.length >= 10) {
        sendActions("Reached actions limit", window.location.pathname, "");
    }
}

//Get info about the elements parent
function getParentInfo(target) {

    if( target.parentElement === null ) return;

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
        'actions': JSON.stringify(actions)
    }, "action");
}

//Post data to right url
function postLogs(data, url) {
    makePost(config.backendUrl + url, data);

    actions = [];
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

