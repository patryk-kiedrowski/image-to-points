const wrapper = document.getElementById('wrapper');
document.addEventListener('mousemove', handleMove);

let myMouseX = 0;
let myMouseY = 0;
let img;
let i = 0;
let j = 0;
let pixels = [];
let points = [];
let mouse;
let zeroVector;
let inverseScaleUp;

const fpsCounter = document.querySelector('#fps');
const inputs = {
  'scaleUp': document.querySelector('#scaleUp'),
  'brightnessThreshold': document.querySelector('#brightnessThreshold'),
  'probability': document.querySelector('#probability'),
  'pointSize': document.querySelector('#pointSize'),
  'customFrameRate': document.querySelector('#customFrameRate'),
  'mouseDistanceForInteraction': document.querySelector('#mouseDistanceForInteraction'),
  'pointColor': document.querySelector('#pointColor'),
  'file': document.querySelector('#file'),
  'apply-changes': document.querySelector('#apply-changes'),
};

// settings variables
let scaleUp = 1;
let brightnessThreshold = 40;
let pointSize = 2.5;
let customFrameRate = 30;
let mouseDistanceForInteraction = 50;
let pointColor = { 'r': 9, 'g': 133, 'b': 175 };
let probability = 30;

function handleMove(event) {
  myMouseX = Math.floor(event.clientX);
  myMouseY = Math.floor(event.clientY);
}

function hexToRGB(hex) {
  return {
    r: parseInt(hex.slice(1, 3), 16),
    g: parseInt(hex.slice(3, 5), 16),
    b: parseInt(hex.slice(5, 7), 16)
  }
}

function setValues() {
  inputs['scaleUp'].value = scaleUp;
  inputs['brightnessThreshold'].value = brightnessThreshold;
  inputs['probability'].value = probability;
  inputs['pointSize'].value = pointSize;
  inputs['customFrameRate'].value = customFrameRate;
  inputs['mouseDistanceForInteraction'].value = mouseDistanceForInteraction;
  inputs['pointColor'].value = pointColor;
}

function addListeners() {
  inputs['scaleUp'].addEventListener('input', event => scaleUp = event.target.value);
  inputs['brightnessThreshold'].addEventListener('input', event => brightnessThreshold = event.target.value);
  inputs['probability'].addEventListener('input', event => probability = event.target.value);
  inputs['pointSize'].addEventListener('input', event => pointSize = event.target.value);
  inputs['customFrameRate'].addEventListener('input', event => customFrameRate = event.target.value);
  inputs['mouseDistanceForInteraction'].addEventListener('input', event => mouseDistanceForInteraction = event.target.value);
  inputs['pointColor'].addEventListener('input', event => pointColor = hexToRGB(event.target.value));
  inputs['apply-changes'].addEventListener('click', event => {
    setup();
  });
}

function preload() {
  img = loadImage('bird-alt.png');
  addListeners();
}

function setup() {
  console.log(img);
  setValues();
  console.log({'scaleUp': scaleUp, 'brightnessThreshold': brightnessThreshold, 'pointSize': pointSize});
  points = [];
  zeroVector = createVector(0, 0);
  scaleUp = Math.round((window.innerHeight / img.height) * 100) / 100;
  inverseScaleUp = Math.round((1 / scaleUp) * 100) / 100;

  createCanvas(img.width * scaleUp, img.height * scaleUp);
  frameRate(customFrameRate);
  background(0);
  scale(1);

  img.loadPixels();

  for (let i = 0; i < img.pixels.length; i += 4) {
    // holds the average value from all of the channels (R, G, B) for the current pixel
    const avg = (img.pixels[i] + img.pixels[i+1] + img.pixels[i+2]) / 3;
    const newCondition = Math.floor(Math.random() * probability);

    // clears out all the values of the current pixel
    img.pixels[i] = img.pixels[i + 1] = img.pixels[i + 2] = img.pixels[i + 3] = 0;

    // the condition determines how many pixels make it through to the final array of objects,
    // clears out the red and green channels (unnecessarily, probably), sets the blue channel to full saturation
    // and saves the average of channels to the alpha channel of the pixel
      if (newCondition === 0) {
      img.pixels[i] = 0;
      img.pixels[i + 1] = 0;
      img.pixels[i + 2] = 255;
      img.pixels[i + 3] = avg;

      // limits the amount of objects created by filtering out pixels that are too dim to be noticeable
      if (avg >= brightnessThreshold) {
        points.push(
          new Point(
            Math.floor((i / 4) % img.width), // x
            Math.floor((i / 4) / img.width), // y
            avg, // opacity
            Math.random() - 0.5, // dx
            Math.random() - 0.5, // dy
            Math.floor((i / 4) % img.width), // orgX
            Math.floor((i / 4) / img.width), // orgY
          )
        );
      }
    }
  }

  img.updatePixels();
  console.log(points.length);
  scale(scaleUp);
}

function draw() {
  // updates mouse position based on mouse coordinates times the inverse of scaleUp to level the side effects of scaleUp
  mouse = createVector(myMouseX * inverseScaleUp, myMouseY * inverseScaleUp);

  fill(0);
  rect(0, 0, img.width * scaleUp, img.height * scaleUp);
  noStroke();
  scale(scaleUp);

  for (let i = 0; i < points.length; i++) {
    const point = points[i];

    point.behaviors();
    point.draw();
    point.update();
  }

  fpsCounter.innerHTML = Math.round(frameRate());
  // frameRate(customFrameRate * 10);
}

class Point {
  constructor(x, y, opacity, dx, dy, orgX, orgY) {
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
    this.maxSpeed = (Math.random() * 40) + 10;
    this.maxForce = 1;
    // END-VECTOR VARIABLES
  }

  draw() {
    fill(pointColor['r'], pointColor['g'], pointColor['b'], this.opacity);
    ellipse(this.pos.x, this.pos.y, pointSize, pointSize); // VECTOR DRAW
  }

  // VECTOR METHODS
  update() {
    this.pos.add(this.vel);
    this.vel.add(this.acc);
    
    // clears accelaration by multiplying it by 0
    this.acc.mult(0);
  }

  behaviors() {
    const arrive = this.arrive(this.target);
    const flee = this.flee(mouse);
    
    arrive.mult(1);
    flee.mult(10);

    this.applyForce(arrive);
    this.applyForce(flee);
  }

  applyForce(force) {
    this.acc.add(force);
  }

  arrive(target) {
    // sub = subtract
    const desiredLocation = p5.Vector.sub(target, this.pos);
    const distance = desiredLocation.mag(); // magnitude means how far away the vector is
    let speed = this.maxSpeed * (distance / img.width);

    if (distance < 1) {
      speed = map(distance, 0, 1, 0, speed);
    }

    desiredLocation.setMag(speed);

    const steer = p5.Vector.sub(desiredLocation, this.vel);
    steer.limit(this.maxForce);
    
    return steer;
  }

  seek(target) {
    // sub = subtract
    const desiredLocation = p5.Vector.sub(target, this.pos);
    desiredLocation.setMag(speed);

    const steer = p5.Vector.sub(desiredLocation, this.vel);
    steer.limit(this.maxForce);
    
    return steer;
  }

  flee(target) {
    // sub = subtract
    const desiredLocation = p5.Vector.sub(target, this.pos);
    const distance = desiredLocation.mag() + ((Math.random() * 10) - 10);

    // applies force only if mouse is close enough to the target
    if (distance < mouseDistanceForInteraction) {
      desiredLocation.setMag(this.maxSpeed);
      desiredLocation.mult(-1);

      const steer = p5.Vector.sub(desiredLocation, this.vel);
      steer.limit(this.maxForce);
      
      return steer;
    } else {
      return zeroVector;
    }
  }
  // END-VECTOR METHODS
}