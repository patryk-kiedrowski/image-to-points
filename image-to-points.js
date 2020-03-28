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
let offscreenCanvas;

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
let customFrameRate = 40;
let mouseDistanceForInteraction = 50;
let pointColor = { r: 9, g: 133, b: 175 };
let probability = 30;

function handleMove(event) {
  myMouseX = Math.floor(event.clientX);
  myMouseY = Math.floor(event.clientY);
}

/**
 * updates mouse position based on mouse coordinates times 
 * the inverse of scaleUp to level the side effects of scaleUp
 */
function updateMouseVector() {
  mouse = createVector(myMouseX * inverseScaleUp, myMouseY * inverseScaleUp);
}

function hexToRGB(hex) {
  return {
    r: parseInt(hex.slice(1, 3), 16),
    g: parseInt(hex.slice(3, 5), 16),
    b: parseInt(hex.slice(5, 7), 16)
  }
}

function setControlInputs() {
  inputs['scaleUp'].value = scaleUp;
  inputs['brightnessThreshold'].value = brightnessThreshold;
  inputs['probability'].value = 100 - probability;
  inputs['pointSize'].value = pointSize;
  inputs['customFrameRate'].value = customFrameRate;
  inputs['mouseDistanceForInteraction'].value = mouseDistanceForInteraction;
  inputs['pointColor'].value = pointColor;
}

function addListeners() {
  inputs['scaleUp'].addEventListener('input', event => scaleUp = Number(event.target.value));
  inputs['brightnessThreshold'].addEventListener('input', event => brightnessThreshold = Number(event.target.value));
  inputs['probability'].addEventListener('input', event => probability = Number(100 - event.target.value));
  inputs['pointSize'].addEventListener('input', event => pointSize = Number(event.target.value));
  inputs['customFrameRate'].addEventListener('input', event => customFrameRate = Number(event.target.value));
  inputs['mouseDistanceForInteraction'].addEventListener('input', event => Number(mouseDistanceForInteraction = event.target.value));
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
  setControlInputs();
  setInitialValues();

  createMainCanvas();
  createOffscreenCanvas();

  prepareImagePixels();
  analyzeImageAndPreparePoints();
}

function draw() {
  cleanOffscreenCanvas();
  cleanCanvas();
  updateMouseVector();
  updatePoints();
  drawFPS();
  copyFromOffscreenToCanvas();
}

function setInitialValues() {
  points = [];
  zeroVector = createVector(0, 0);
  scaleUp = Math.round((window.innerHeight / img.height) * 100) / 100;
  inverseScaleUp = Math.round((1 / scaleUp) * 100) / 100;
}

function createMainCanvas() {
  createCanvas(img.width * scaleUp, img.height * scaleUp);
  frameRate(customFrameRate);
  background(0);
  scale(scaleUp);
}

function createOffscreenCanvas() {
  offscreenCanvas = createGraphics(img.width * scaleUp, img.height * scaleUp);
  offscreenCanvas.frameRate(customFrameRate);
  offscreenCanvas.background(0);
  offscreenCanvas.scale(scaleUp);
}

function prepareImagePixels() {
  img.loadPixels();
}

function analyzeImageAndPreparePoints() {
  for (let i = 0; i < img.pixels.length; i += 4) {
    const pixel = { 
      r: img.pixels[i],
      g: img.pixels[i + 1],
      b: img.pixels[i + 2],
      a: img.pixels[i + 3]
    }

    const avgOpacity = (pixel.r + pixel.g + pixel.b) / 3;
    const pixelShouldBeIncluded = (Math.floor(Math.random() * probability)) === 0;

    if (pixelShouldBeIncluded) {
      if (avgOpacity >= brightnessThreshold) {
        createPoint(i, avgOpacity);
      }
    }
  }

  console.log(points.length);
}

function createPoint(i, avgOpacity) {
  const x = Math.floor((i / 4) % img.width);
  const y = Math.floor((i / 4) / img.width);
  const dx = Math.random() - 0.5;
  const dy = Math.random() - 0.5;

  points.push(
    new Point(x, y, dx, dy, avgOpacity)
  );
}

function cleanCanvas() {
  fill(0);
  rect(0, 0, img.width * scaleUp, img.height * scaleUp);
  noStroke();
  scale(scaleUp);
}

function cleanOffscreenCanvas() {
  offscreenCanvas.fill(0);
  offscreenCanvas.rect(0, 0, img.width, img.height);
  offscreenCanvas.noStroke();
}

function updatePoints() {
  for (let i = 0; i < points.length; i++) {
    const point = points[i];

    point.behaviors();
    point.draw();
    point.update();
  }
}

function drawFPS() {
  fpsCounter.innerHTML = Math.round(getFrameRate());
  frameRate(customFrameRate);
}

function copyFromOffscreenToCanvas() {
  image(offscreenCanvas, 0, 0, img.width, img.height);
}

class Point {
  constructor(x, y, dx, dy, opacity) {
    this.x = x;
    this.y = y;
    this.dx = dx;
    this.dy = dy;
    this.initialX = x;
    this.initialY = y;
    this.opacity = opacity;

    this.position = createVector(random(img.width), random(img.height));
    this.velocity = createVector(0);
    this.acceleration = createVector(0);
    this.target = createVector(x, y);
    this.maxSpeed = (Math.random() * 40) + 10;
    this.maxForce = 1;
  }

  draw() {
    this.variableOpacity();
  }

  variableOpacity() {
    offscreenCanvas.fill(pointColor.r, pointColor.g, pointColor.b, this.opacity);
    offscreenCanvas.ellipse(this.position.x, this.position.y, pointSize, pointSize);
  }
  
  variableSize() {
    offscreenCanvas.fill(pointColor.r, pointColor.g, pointColor.b, 255);
    offscreenCanvas.ellipse(this.position.x, this.position.y, 5 * this.opacity / 255, 5 * this.opacity / 255);
  }

  variableOpacityAndSize() {
    offscreenCanvas.fill(pointColor.r, pointColor.g, pointColor.b, this.opacity);
    offscreenCanvas.ellipse(this.position.x, this.position.y, 5 * this.opacity / 255, 5 * this.opacity / 255);
  }

  update() {
    this.position.add(this.velocity);
    this.velocity.add(this.acceleration);
    
    // clears accelaration
    this.acceleration.mult(0);
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
    this.acceleration.add(force);
  }

  arrive(target) {
    const desiredLocation = p5.Vector.sub(target, this.position);
    const distance = desiredLocation.mag();
    let speed = this.maxSpeed * (distance / img.width);

    if (distance < 1) {
      speed = map(distance, 0, 1, 0, speed);
    }

    desiredLocation.setMag(speed);

    const steer = p5.Vector.sub(desiredLocation, this.velocity);
    steer.limit(this.maxForce);
    
    return steer;
  }

  seek(target) {
    const desiredLocation = p5.Vector.sub(target, this.position);
    desiredLocation.setMag(speed);

    const steer = p5.Vector.sub(desiredLocation, this.velocity);
    steer.limit(this.maxForce);
    
    return steer;
  }

  flee(target) {
    const desiredLocation = p5.Vector.sub(target, this.position);
    const distance = desiredLocation.mag() + ((Math.random() * 10) - 10);

    if (distance < mouseDistanceForInteraction) {
      desiredLocation.setMag(this.maxSpeed);
      desiredLocation.mult(-1);

      const steer = p5.Vector.sub(desiredLocation, this.velocity);
      steer.limit(this.maxForce);
      
      return steer;
    } else {
      return zeroVector;
    }
  }
}