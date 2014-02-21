var scene = new THREE.Scene();
var projector = new THREE.Projector();
var flyTarget = new THREE.Vector3();


// Set up camera
var fov = 60;
var aspectRatio = window.innerWidth / window.innerHeight;
var near = 0.1;
var far = 1000;
var camera = new THREE.PerspectiveCamera(fov, aspectRatio, near, far);

var renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Set up scene and objects
var loc = window.location.href;
loc = loc.substring(0, loc.lastIndexOf('/')) + '/';

// Skybox
var directions = ["xpos", "xneg", "ypos", "yneg", "zpos", "zneg"];
var materialArray = [];
for (var i = 0; i < 6; i++) {
  materialArray.push( new THREE.MeshBasicMaterial({
    map: THREE.ImageUtils.loadTexture( loc + directions[i] + ".png" ),
    side: THREE.BackSide
  }));
}
var skyMaterial = new THREE.MeshFaceMaterial( materialArray );
var skyGeometry = new THREE.CubeGeometry( 900, 900, 900 );
var skyBox = new THREE.Mesh( skyGeometry, skyMaterial );
scene.add( skyBox );

// Controls overlay
var overlayMaterial = new THREE.MeshBasicMaterial({
  map: THREE.ImageUtils.loadTexture( loc + "controls_overlay.png" ),
  transparent: true, opacity: 0.5
});
var overlayGeometry = new THREE.PlaneGeometry( 800 / 96, 480 / 96 );
var overlay = new THREE.Mesh( overlayGeometry, overlayMaterial );
scene.add( overlay );

// Game properties

// Ground
var groundMaterial = new THREE.MeshBasicMaterial({
  color : 0xaa9933
});
var groundGeom = new THREE.PlaneGeometry(2000, 2000);
var ground = new THREE.Mesh( groundGeom, groundMaterial );
ground.rotation.x = -90 * ( Math.PI / 180 );
ground.position.y = -3;
scene.add( ground );

var skyY = 3;

// Index of rightmost X position lane
// Total number of lanes is maxLane + 1
var maxLane = 4;
var numLanes = maxLane + 1;

// Total width of all lanes, rightmost - leftmost
var laneSizeTotal = 8.0;

var gravity = -0.008;

// Score
function Score() {
  this.value = 0;
  this.scoreText = document.createElement('div');
  this.scoreText.style.position = 'absolute';
  this.scoreText.style.width = 100;
  this.scoreText.style.height = 100;
  this.scoreText.innerHTML = this.value;
  this.scoreText.style.top = 200 + 'px';
  this.scoreText.style.left = 200 + 'px';
  document.body.appendChild( this.scoreText );
  
  this.change = function( delta ) {
    this.value += delta;
    this.scoreText.innerHTML = this.value;
  }
  this.set = function( value ) {
    this.value = value;
    this.scoreText.innerHTML = this.value;
  }
}
var score = new Score();

// Plane properties
var geometry = new THREE.CubeGeometry(0.5, 0.5, 0.5);
var material = new THREE.MeshBasicMaterial({
  color : 0xffaa66
});
var cube = new THREE.Mesh(geometry, material);
scene.add(cube);
var fighter = {
  mesh : cube,
  
  // y-velocity
  velY : 0,
  
  // Current X position lane (0 = leftmost)
  lane : 0,
  
  // Last X position, for moving to a new lane
  // Fighter transitions from xLast to new lane X
  xLast : 0,

  // Counter for lerping X position
  transitionCounter : 0,
  
  // Number of frames for lerping X position
  transitionCounterMax : 30,

  flapStrength : 0.14,
  
  // Start lerping the fighter from its current X position to a new lane
  flap : function( xDir ) {
    // Move to new lane
    this.xLast = this.mesh.position.x;
    this.lane = THREE.Math.clamp( this.lane + xDir, 0, maxLane );
    this.transitionCounter = this.transitionCounterMax;
    
    // flap upwards
    this.velY = this.flapStrength;
    
    flapSound.play();
    console.log("flap " + this.mesh.position.x);
  },
  
  // lerp and others
  update : function () {
    // lerping X position
    this.transitionCounter = Math.max( this.transitionCounter - 1, 0 );
    var laneX = getLaneX( this.lane );
    var laneWeight = ( this.transitionCounterMax - this.transitionCounter ) / this.transitionCounterMax;
    var lastXWeight = 1.0 - laneWeight;
    this.mesh.position.x = laneWeight * laneX + lastXWeight * this.xLast;
    
    // gravity
    this.mesh.position.y += this.velY;
    if ( this.mesh.position.y > skyY ) {
      // hit sky; just block off
      this.mesh.position.y = skyY;
      this.velY = 0;
    }
    this.velY += gravity;
  },
  
  reset : function() {
    this.mesh.position = new THREE.Vector3( 0, 0, 0 );
    this.velY = 0;
    this.lane = 0;
    this.xLast = 0;
    this.transitionCounter = 0;
  }
};

// Pipes
var pipes = new PipeMaker( 1, numLanes, laneSizeTotal, skyY - ground.position.y );

camera.position.z = 5;

// Mouse
document.addEventListener( 'mousedown', onDocumentMouseDown, false );

// Keyboard
var keysPressed = {};
document.addEventListener("keydown", onDocumentKeyDown, false);

// Sound
var Sound = function ( source ) {
  var audio = document.createElement( 'audio' );
  var aSource = document.createElement( 'source' );
  aSource.src = source;
  audio.appendChild( aSource );
  this.play = function () {
    audio.play();
  }
}
var flapSound = new Sound( 'sounds/phaseJump2.mp3' );
var passSound = new Sound( 'sounds/powerUp2.mp3' );
var dieSound = new Sound( 'sounds/spaceTrash4.mp3' );

// Reset everything
function reset() {
  pipes.reset( scene );
  fighter.reset();
  score.set( 0 );
}

// Render loop
function render() {
  requestAnimationFrame(render);
  
  pipes.update( scene );

  if ( keysPressed.left ) {
    fighter.flap(-1);
  } else if ( keysPressed.right ) {
    fighter.flap(1);
  }
  keysPressed = {};
  fighter.update();
  
  // Check ground collision
  if ( fighter.mesh.position.y < ground.position.y ) {
    reset();
    dieSound.play();
  }
  
  if ( pipes.hasPipesPassed( fighter.mesh.position ) ) {
    // A set of pipes has passed the figher; check if the figher flew through it
    if ( pipes.isFighterCollides( fighter.mesh.position ) ) {
      // We've hit a pipe; TODO: die
      reset();
      dieSound.play();
    } else {
      // Flew through pipes, success!
      score.change( 1 );
      passSound.play();
    }
    console.log( "Score: " + score );
  }
  
  pipes.destroyCompletePipes( scene );
  
  renderer.render(scene, camera);
}

function onDocumentMouseDown( event ) {
  var x = ( event.clientX / window.innerWidth ) * 2 - 1;
  //var y = - ( event.clientY / window.innerHeight ) * 2 + 1;
  if ( x < 0 ) {
    keysPressed.left = true;
  } else if ( x > 0 ) {
    keysPressed.right = true;
  }
}
function onDocumentKeyDown( event ) {
  var keyCode = event.which;
  if ( keyCode == 37 ) {  // left
    keysPressed.left = true;
  } else if ( keyCode == 39 ) { // right
    keysPressed.right = true;
  }
}

render();