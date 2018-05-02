$(document).on('click', function(event){
    let b = sldkfj;
});

window.onerror = function(message, source, lineno, colno, error){
    let re = /https?:\/\/([^\/]*)\/(.*)/;

    let data = {
        'error': message,
        'source': re.exec(source)[2],
        'position': lineno + ',' + colno,
        'stack': error.stack
    };

    $.post('http://localhost:5000/error', data, function(resp){});
};