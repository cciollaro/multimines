var main;
var main2;
var lastX = -1;
var lastY = -1;
var dragging = false;

var arr1 = makeInitial();
var arr2 = makeInitial();
            
function makeInitial()
{
    var matrix = [];
        for(var i=0; i<10; i++) {
            matrix[i] = new Array(9);
            for (var j=0; j<10; j++)
            {
                matrix[i][j] = false;
            }
    }
            
   return matrix;

}

function drawSquares()
{
    var g = this.getContext("2d");
    clear(g);
    
    //  gradientify(g);     // uncomment for fun!
    
    for (var x=0; x<this.contents.active.length; x++)
    {
        for (var y=0; y<this.contents.active[0].length; y++)
        {
            if (this.contents.active[x][y] == 0)
                g.fillStyle="blue";
            else if (this.contents.active[x][y] == 1)
                g.fillStyle="red";
            else
                g.fillStyle="green";
            
            g.fillRect(x*30,y*30,30,30); // x, y, width, height
            
            g.fillStyle="white";
            g.font="30px Arial";
            
            var off = 7;
//            
//            if (this.contents.values[x].length > 1)
//            {
//                g.font="20px Arial";
//                off = 0;
//            }
            
//            g.fillText(this.contents.values[x], x*30+off, x*30+25)
        }
    }
    
    g.fillStyle="black";
    g.font="20px Arial";
    g.fillText("we love javascript", 135, 20)
    g.font="15px Arial";
    g.fillText("click a square to mark active", 10, 290)
    
    if (lastX >0 && lastY >0)
    {
        g.font="25px Arial";
        g.fillText("("+lastX+", "+lastY+")", 10, 265)
    }
    
}

function main()
{
    main = document.getElementById("main");
    main2 = document.getElementById("main2");

    
    // create arrays of data
    var values = [1,2,3,4,5,6,7,"fish",9];
    
    active = arr1;
    active2 = arr2;
    
    main.contents = {};
    main2.contents = {};

    $('body').on('contextmenu', '#main', function(e){ fireClick(e);return false; });

    
    main.contents.values = values;
    main.contents.active = active;
    
    main2.contents.values = values;
    main2.contents.active = active2;
    
    main.repaint = drawSquares;
    main.repaint();
    
    main2.repaint = drawSquares;
    main2.repaint();
    
    $('#main').mouseup(fireClick);
    
}

function clear(g)
{
    g.clearRect(0, 0, main.width, main.height);
}

function fireClick(event)
{
    var x = event.offsetX;
    var y = event.offsetY;
    
    x = Math.ceil(x/30);
    y = Math.ceil(y/30);
    
    if (event.which == 1)
    {
        main.contents.active[x-1][y-1] = 1;
        //send flip at x-1, y-1
    }
    else if (event.which == 3)
    {
        main.contents.active[x-1][y-1] = 2;
        //send flag at x-1, y-1
    }
    
    lastX = x;
    lastY = y;
    main.repaint();
}

function gradientify(g)
{
    g.rect(0, 0, main.width, main.height);
    
    // add linear gradient
    var grd = g.createLinearGradient( main.width/2, 0, main.width/2, main.height);
    grd.addColorStop(1, 'cyan');
    grd.addColorStop(0, 'transparent');
    
    g.fillStyle = grd;
    g.fill();
}