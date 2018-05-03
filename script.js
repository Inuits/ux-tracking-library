var actions = [];
var value;

$('body').on('click', function (event) {

    if (event.target.nodeName === "INPUT") {
        value = event.target.value;
    } else {
        value = event.target.innerText;
    }

    actions.push("id: "
        + event.target.id + "\nclass: "
        + event.target.className + "\nname: "
        + event.target.name + "\nvalue: "
        + value + "\ntimestamp: "
        + new Date().getTime() + "\ntype:"
        + event.target.nodeName + "\npath:"
        + window.location.pathname + "\n\n");
});

setTimeout(function waitaMinute() {
    addlert("Dit is een error");
}, 5000);

setTimeout(function waitaMinute() {
    addlert("Dit is een error");
}, 15000);

window.onerror = function (message, source, lineno, colno, error) {

    console.log("Actions happened so far:\n" + actions);

    let re = /https?:\/\/([^\/]*)\/(.*)/;

    let data = {
        'error': message,
        'source': re.exec(source)[2],
        'position': lineno + ',' + colno,
        'stack': error.stack,
        'actions': actions
    };

    $.post('http://localhost:1234/error', data, function(resp){});

    actions = [];
    console.log("Actions after error:\n" + actions);
};