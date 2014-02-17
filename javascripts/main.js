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

// Skybox
var directions = ["xpos", "xneg", "ypos", "yneg", "zpos", "zneg"];
var materialArray = [];
for (var i = 0; i < 6; i++) {
  materialArray.push( new THREE.MeshBasicMaterial({
    map: THREE.ImageUtils.loadTexture( directions[i] + ".png" ),
    side: THREE.BackSide
  }));
}
var skyMaterial = new THREE.MeshFaceMaterial( materialArray );
var skyGeometry = new THREE.CubeGeometry( 900, 900, 900 );
var skyBox = new THREE.Mesh( skyGeometry, skyMaterial );
scene.add( skyBox );

// Game properties

// Ground
var groundMaterial = new THREE.MeshBasicMaterial({
  color : 0xaa9933
});
var groundGeom = new THREE.PlaneGeometry(2000, 2000);
var ground = new THREE.Mesh( groundGeom, groundMaterial );
ground.rotation.x = -90;
ground.position.y = -3;
scene.add( ground );

var skyY = 3;

// Index of rightmost X position lane
// Total number of lanes is maxLane + 1
var maxLane = 2;
var numLanes = maxLane + 1;

// Total width of all lanes, rightmost - leftmost
var laneSizeTotal = 8.0;

var gravity = -0.008;
  
// Helper function for getting X position for a lane index
function getLaneX( lane ) {
  return ( lane - ( maxLane / 2 ) ) * laneSizeTotal / numLanes;
}

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

  flapStrength : 0.16,
  
  // Start lerping the fighter from its current X position to a new lane
  flap : function( xDir ) {
    // Move to new lane
    this.xLast = this.mesh.position.x;
    this.lane = THREE.Math.clamp( this.lane + xDir, 0, maxLane );
    this.transitionCounter = this.transitionCounterMax;
    
    // flap upwards
    this.velY = this.flapStrength;
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
    if ( this.mesh.position.y < ground.position.y ) {
      // TODO: hit ground and die
      this.mesh.position.y = ground.position.y;
      this.velY = 0;
    } else if ( this.mesh.position.y > skyY ) {
      // TODO: hit sky and die
      this.mesh.position.y = skyY;
      this.velY = 0;
    }
    this.velY += gravity;
  }
};

// Pipes
var pipes = [];
function addPipe() {
  for ( var i = 0; i < numLanes; i++ ) {
    var pipe = new Pipe( laneSizeTotal / numLanes, skyY - ground.position.y );
    pipe.setX( getLaneX( i ) );
    pipe.setZ( -15 );
    pipe.meshes.forEach(function(pipeMesh) {
      scene.add( pipeMesh );
    });
    pipes.push( pipe );
  }
}
function movePipes() {
  pipes.forEach(function(pipe) {
    pipe.setZ( pipe.z + 0.1 );
    console.log(pipe.z);
  });
}
function destroyCompletePipes() {
  // Remove pipes that have gone past the player
  for ( var i = pipes.length - 1; i >= 0; i-- ) {
    var pipe = pipes[ i ];
    if ( pipe.z > 0.5 ) {
      pipe.meshes.forEach(function(pipeMesh) {
        scene.remove( pipeMesh );
      });
      pipes.splice( i );
    }
  }
}

camera.position.z = 5;

// Mouse
document.addEventListener( 'mousedown', onDocumentMouseDown, false );

// Keyboard
var keysPressed = {};
document.addEventListener("keydown", onDocumentKeyDown, false);

// Render loop
function render() {
  requestAnimationFrame(render);
  
  if ( pipes.length < 1 ) {
    addPipe();
  }
  movePipes();

  if ( keysPressed.left ) {
    fighter.flap(-1);
  } else if ( keysPressed.right ) {
    fighter.flap(1);
  }
  keysPressed = {};
  fighter.update();
  
  destroyCompletePipes();
  
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