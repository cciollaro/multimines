var main;
var lastX = -1;
var lastY = -1;
var dragging = false;

function drawSquares()
{
    var g = this.getContext("2d");
    clear(g);
    
    //  gradientify(g);     // uncomment for fun!
    
    for (var x=0; x<this.contents.values.length; x++)
    {
        if (this.contents.active[x])
            g.fillStyle="blue";
        else
            g.fillStyle="red";
        
        g.fillRect(x*30,x*30,30,30); // x, y, width, height
        
        g.fillStyle="white";
        g.font="30px Arial";
        
        var off = 7;
        
        if (this.contents.values[x].length > 1)
        {
            g.font="20px Arial";
            off = 0;
        }
        
        g.fillText(this.contents.values[x], x*30+off, x*30+25)
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
    
    // create arrays of data
    var values = [1,2,3,4,5,6,7,"fish",9];
    var active = [false, false, false, false, false, false, false, false, false];
    
    main.contents = {};
    
    main.contents.values = values;
    main.contents.active = active;
    
    main.repaint = drawSquares;
    main.repaint();
    
    main.addEventListener("mousedown", startDrag);
    main.addEventListener("mousemove", fireClick);
    main.addEventListener("mouseup", endDrag);
    main.addEventListener("mouseout", endDrag);
    
    
}

function clear(g)
{
    g.clearRect(0, 0, main.width, main.height);
}

function fireClick(event)
{
    if (dragging)
    {
        var x = event.x;
        var y = event.y;
        
        x -= main.offsetLeft;
        y -= main.offsetTop;
        
        x = Math.ceil(x/30);
        y = Math.ceil(y/30);
        
        if (x == y)
        {
            main.contents.active[x-1] = !main.contents.active[x-1];
        }
        
        lastX = x;
        lastY = y;
        main.repaint();
        
        console.log("got click at ("+x+","+y+")");
        //connect to the server here
    }
}

function startDrag(event)
{
    dragging = true;
    fireClick(event);
}

function endDrag(event)
{
    dragging = false;
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