// const input = document.getElementById('file');
const wrapper = document.getElementById('wrapper');
// var file;
// var output = [];
// input.addEventListener('change', handleFile, false);

document.addEventListener('mousemove', handleMove);

myMouseX = 0;
myMouseY = 0;

var img;
var i = 0;
var j = 0;
var pixels = [];
var points = [];
var dividers = [7, 11, 13, 17, 19, 21];
var odd = false;
var mouse;
var zeroVector;
var inverseScaleUp;

var scaleUp = 1;
var brightnessThreshold = 40;
var pointSize = 1.5;
var customFrameRate = 24;
var mouseDistanceForInteraction = 25;

function findClosest(number) {
  smallestDifference = dividers[0];
  closestIndex = 0;

  for (let i = 1; i < dividers.length; i++) {
    if (Math.abs(dividers[i] - number) < smallestDifference) {
      smallestDifference = Math.abs(dividers[i] - number);
      closestIndex = i;
    }
  }

  return dividers[closestIndex];
}

function handleMove(event) {
  myMouseX = Math.floor(event.clientX);
  myMouseY = Math.floor(event.clientY);
  // console.log(myMouseX);
}

function preload() {
  // img = loadImage('https://i.imgur.com/3MpVe8x.png'); // małe, kwadrat
  // img = loadImage('https://i.imgur.com/np2NXQD.png'); // normalne
  // img = loadImage('https://i.imgur.com/BDW7ehb.png'); 
  // img = loadImage('https://i.imgur.com/QFPCSue.png'); // 160px
  // img = loadImage('https://i.imgur.com/6h2SzGk.png'); // 250px
  // img = loadImage('https://i.imgur.com/p05qINk.jpg'); // truck
  // img = loadImage('https://i.imgur.com/OMPpprw.png'); // 8:9 / 3

  // img = loadImage('https://i.imgur.com/AtuSj2i.png'); // test circle

  // img = loadImage('https://i.imgur.com/b7nWMtA.png'); // 9:8 / 3 WORKS WITHOUT LIVE-SERVER

  // img = loadImage('imgur-face.png'); // 9: 8 / 3 WORKS WITH LIVE-SERVER
  img = loadImage('pika.png');
}

function setup() {
  zeroVector = createVector(0, 0);
  scaleUp = Math.round((window.innerHeight / img.height) * 100) / 100;
  inverseScaleUp = Math.round((1 / scaleUp) * 100) / 100;
  console.log(inverseScaleUp);
  createCanvas(img.width * scaleUp, img.height * scaleUp);
  frameRate(customFrameRate);
  background(0);
  scale(1);
  img.loadPixels();
  condition = findClosest(Math.round((img.width * img.height) / 10000));

  for (let i = 0; i < img.pixels.length; i += 4) {
    // holds the average value from all of the channels (R, G, B) for the current pixel
    const avg = (img.pixels[i] + img.pixels[i+1] + img.pixels[i+2]) / 3;
    const newCondition = Math.floor(Math.random() * 30);

    // clears out all the values of the current pixel
    img.pixels[i] = img.pixels[i + 1] = img.pixels[i + 2] = img.pixels[i + 3] = 0;

    // the condition determines how many pixels make it through to the final array of objects,
    // clears out the red and green channels (unnecessarily, probably), sets the blue channel to full saturation
    // and saves the average of channels to the alpha channel of the pixel
    // if (i % 11 === 0) {
      if (newCondition === 0) {
      img.pixels[i] = img.pixels[i + 1] = 0;
      img.pixels[i + 2] = 255;
      img.pixels[i + 3] = avg;

      // limits the amount of objects created by filtering out pixels that are too dim to be noticeable
      if (avg >= brightnessThreshold) {
        points.push(
          new Point(
            Math.floor((i / 4) % img.width), // x
            Math.floor((i / 4) / img.width), // y
            // Math.floor(Math.random() * img.width), // x
            // Math.floor(Math.random() * img.height), // y
            avg, // opacity
            Math.random() - 0.5, // dx
            Math.random() - 0.5, // dy
            // Math.round(Math.random() * 5 + 1), // dx
            // Math.round(Math.random() * 5 + 1), // dy
            Math.floor((i / 4) % img.width), // orgX
            Math.floor((i / 4) / img.width), // orgY
          )
        );
      }
    }
  }

  // console.log(points);
  img.updatePixels();

  scale(scaleUp);
}

function draw() {
  // updates mouse position based on mouse coordinates times the inverse of scaleUp to level the side effects of scaleUp
  mouse = createVector(myMouseX * inverseScaleUp, myMouseY * inverseScaleUp);

  fill(0);
  rect(0, 0, img.width * scaleUp, img.height * scaleUp);
  noStroke();
  scale(scaleUp);
  // console.log(Math.floor(frameRate()));

  if (odd) {
    var offset = 1;
  } else {
    var offset = 0;
  }
  odd = !odd;

  for (let i = 0; i < points.length; i++) {
    points[i].behaviors();
    points[i].draw();
    points[i].update();
    // points[i].move();
  }
}



function Point(x, y, opacity, dx, dy, orgX, orgY) {
  // Point class definition
  this.x = x;
  this.y = y;
  this.orgX = orgX;
  this.orgY = orgY;
  this.opacity = opacity;
  this.dx = dx;
  this.dy = dy;

  // VECTOR VARIABLES
  this.pos = createVector(random(img.width), random(img.height));
  this.vel = createVector(0);
  this.acc = createVector(0);
  this.target = createVector(x, y);
  // this.maxSpeed = 1;
  this.maxSpeed = (Math.random() * 2) + 0.2;
  this.maxForce = 1;
  // END-VECTOR VARIABLES

  this.draw = function() {
    fill(9, 133, 175, this.opacity);
    // ellipse(this.x, this.y, pointSize, pointSize); // old draw
    ellipse(this.pos.x, this.pos.y, pointSize, pointSize); // VECTOR DRAW

  }

  this.updateOLD = function() {
    this.x += this.dx / 10;
    this.y += this.dy / 10;

    // if (this.x <= this.orgX && Math.abs(this.x - this.orgX) >= 1) {
    //   this.x += this.dx;
    // }

    // if (this.x >= this.orgX && Math.abs(this.x - this.orgX) >= 1) {
    //   this.x -= this.dx;
    // }

    // if (this.y <= this.orgY && Math.abs(this.y - this.orgY) >= 1) {
    //   this.y += this.dy;
    // }

    // if (this.y >= this.orgY && Math.abs(this.y - this.orgY) >= 1) {
    //   this.y -= this.dy;
    // }
  }

  this.move = function() {
    this.x = this.x + random(-0.1, 0.1);
    this.y = this.y + random(-0.1, 0.1);
  }

  // VECTOR METHODS
  this.update = function() {
    this.pos.add(this.vel);
    this.vel.add(this.acc);
    
    // clears accelaration by multiplying it by 0
    this.acc.mult(0);
  }

  this.behaviors = function() {
    let arrive = this.arrive(this.target);
    let flee = this.flee(mouse);
    
    arrive.mult(1);
    flee.mult(10);

    this.applyForce(arrive);
    this.applyForce(flee);
  }

  this.applyForce = function(force) {
    this.acc.add(force);
  }

  this.arrive = function(target) {
    // sub = subtract
    let desiredLocation = p5.Vector.sub(target, this.pos);
    let distance = desiredLocation.mag(); // magnitude means how far away the vector is
    let speed = this.maxSpeed;

    if (distance < 1) {
      speed = map(distance, 0, 1, 0, speed);
    }

    desiredLocation.setMag(speed);

    let steer = p5.Vector.sub(desiredLocation, this.vel);
    steer.limit(this.maxForce);
    
    return steer;
  }

  this.seek = function(target) {
    // sub = subtract
    let desiredLocation = p5.Vector.sub(target, this.pos);
    desiredLocation.setMag(speed);

    let steer = p5.Vector.sub(desiredLocation, this.vel);
    steer.limit(this.maxForce);
    
    return steer;
  }

  this.flee = function(target) {
    // sub = subtract
    let desiredLocation = p5.Vector.sub(target, this.pos);
    const distance = desiredLocation.mag() + ((Math.random() * 10) - 10);

    // applies force only if mouse is close enough to the target
    if (distance < mouseDistanceForInteraction) {
      desiredLocation.setMag(this.maxSpeed);
      desiredLocation.mult(-1);

      let steer = p5.Vector.sub(desiredLocation, this.vel);
      steer.limit(this.maxForce);
      
      return steer;
    } else {
      return zeroVector;
    }
  }
  // END-VECTOR METHODS
}