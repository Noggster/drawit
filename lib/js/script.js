$(function(){

    // This demo depends on the canvas element
    if(!('getContext' in document.createElement('canvas'))){
        alert('Sorry, it looks like your browser does not support canvas!');
        return false;
    }

    // The URL of your web server (the port is set in app.js)
    var url = 'http://192.168.111.149:1337';

    var doc = $(document),
        win = $(window),
        canvas = $('#paper'),
        ctx = canvas[0].getContext('2d'),
        instructions = $('#instructions');

    window.color = '#000000';

    var the_word;

    // Generate an unique ID
    var id = Math.round($.now()*Math.random());

    // A flag for drawing activity
    var drawing = false;

    var currentUser;

    var clients = {};
    var cursors = {};

    var socket = io.connect(url);

    socket.on('new_word', function(msg) {

        var counter = 60;

        $('.word-hint').show();
        $('.word-hint h1').text(msg);
        $('.timer').text(counter);

        $('.game-on').hide();

        var counterInterval = setInterval(function() {
            counter--;
            $('.timer').text(counter);

            if(counter == 0) {
                $('.word-hint').hide();
                ctx.clearRect(0, 0, canvas.width(), canvas.height());

                counter = 60;
                
                $('.game-on').hide();

                clearInterval(counterInterval);
            }

        }, 1000);
    });

    socket.on('the_word', function(word) {
        the_word = word;

        $('.game-on').show();
    });

    socket.on('user_connected', function(data) {

        console.log(data + ' connected');

        
        var scoreboard = $('<li/>', {
            text: 'guest-' + data,
            id: 'u' + data
        }).appendTo($('.users ul'));

        $('<span/>', {
            'class' : 'points',
            text : ' - ' + 0
        }).appendTo(scoreboard);

        currentUser = data;
    });

    socket.on('user_disconnected', function(data) {

        console.log(data + ' disconnected');

        $('li#u' + data).remove();
    });

    socket.on('moving', function (data) {

        if(!(data.id in clients)){
            // a new user has come online. create a cursor for them
            cursors[data.id] = $('<div class="cursor">').appendTo('#cursors');
        }

        // Move the mouse pointer
        cursors[data.id].css({
            'left' : data.x,
            'top' : data.y
        });

        // Is the user drawing?
        if(data.drawing && clients[data.id]){

            // Draw a line on the canvas. clients[data.id] holds
            // the previous position of this user's mouse pointer

            drawLine(clients[data.id].x, clients[data.id].y, data.x, data.y);
        }

        // Saving the current client state
        clients[data.id] = data;
        clients[data.id].updated = $.now();
    });

    var prev = {};

    canvas.on('mousedown',function(e){
        e.preventDefault();
        drawing = true;
        prev.x = e.pageX;
        prev.y = e.pageY;

        // Hide the instructions
        instructions.fadeOut();
    });

    doc.bind('mouseup mouseleave',function(){
        drawing = false;
    });

    var lastEmit = $.now();

    doc.on('mousemove',function(e){
        if($.now() - lastEmit > 30){
            socket.emit('mousemove',{
                'x': e.pageX,
                'y': e.pageY,
                'drawing': drawing,
                'id': id
            });
            lastEmit = $.now();
        }

        // Draw a line for the current user's movement, as it is
        // not received in the socket.on('moving') event above

        if(drawing){

            drawLine(prev.x, prev.y, e.pageX, e.pageY);

            prev.x = e.pageX;
            prev.y = e.pageY;
        }
    });

    // Remove inactive clients after 300 seconds of inactivity
    setInterval(function(){

        for(ident in clients){
            if($.now() - clients[ident].updated > 300000){

                // Last update was more than 10 seconds ago.
                // This user has probably closed the page

                cursors[ident].remove();
                delete clients[ident];
                delete cursors[ident];
            }
        }

    }, 300000);

    $('.controls ul li').on('click', function() {
        var $this = $(this);

        window.color = $this.css('background-color');
    });

    function drawLine(fromx, fromy, tox, toy){
        ctx.moveTo(fromx, fromy);
        ctx.lineTo(tox, toy);
        ctx.strokeStyle = color;
        ctx.stroke();
    }

    $('.submit-guess').on('click', function(e) {
        var guess = $('.the-guess').val();

        if(guess == the_word) {
            alert('yay u won!');
        }

        e.preventDefault();
    });
});