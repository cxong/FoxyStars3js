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

// Ground
var groundMaterial = new THREE.MeshBasicMaterial({
  color : 0xaa9933
});
var groundGeom = new THREE.PlaneGeometry(2000, 2000);
var ground = new THREE.Mesh( groundGeom, groundMaterial );
ground.rotation.x = -90;
ground.position.y = -5;
scene.add( ground );

// Plane properties
var geometry = new THREE.CubeGeometry(1, 1, 1);
var material = new THREE.MeshBasicMaterial({
  color : 0x00ff00
});
var cube = new THREE.Mesh(geometry, material);
scene.add(cube);
var fighter = {
  mesh : cube,
  
  // Current X position lane (0 = leftmost)
  lane : 0,
  
  // Last X position, for moving to a new lane
  // Fighter transitions from xLast to new lane X
  xLast : 0,
  
  // Index of rightmost X position lane
  // Total number of lanes is maxLane + 1
  maxLane : 1,

  // Total width of all lanes, rightmost - leftmost
  laneSizeTotal : 8.0,
  
  // Counter for lerping X position
  transitionCounter : 0,
  
  // Number of frames for lerping X position
  transitionCounterMax : 30,
  
  // Helper function for getting X position for a lane index
  getLaneX : function( lane ) {
    return ( lane - ( this.maxLane / 2 ) ) * this.laneSizeTotal / ( this.maxLane + 1 );
  },
  
  // Start lerping the fighter from its current X position to a new lane
  flap : function( xDir ) {
    this.xLast = this.mesh.position.x;
    this.lane = THREE.Math.clamp( this.lane + xDir, 0, this.maxLane );
    this.transitionCounter = this.transitionCounterMax;
    console.log("flap " + this.mesh.position.x);
  },
  
  // lerp and others
  update : function () {
    // lerping X position
    this.transitionCounter = Math.max( this.transitionCounter - 1, 0 );
    var laneX = this.getLaneX( this.lane );
    var laneWeight = ( this.transitionCounterMax - this.transitionCounter ) / this.transitionCounterMax;
    var lastXWeight = 1.0 - laneWeight;
    this.mesh.position.x = laneWeight * laneX + lastXWeight * this.xLast;
  }
};

camera.position.z = 5;

// Mouse
document.addEventListener( 'mousemove', onDocumentMouseMove, false );

// Keyboard
var keysPressed = {};
document.addEventListener("keydown", onDocumentKeyDown, false);

// Render loop
function render() {
  requestAnimationFrame(render);

  if ( keysPressed.left ) {
    fighter.flap(-1);
  } else if ( keysPressed.right ) {
    fighter.flap(1);
  }
  keysPressed = {};
  fighter.update();
  
  renderer.render(scene, camera);
}

function onDocumentMouseMove( event )
{
  // normalise mouse coordinates
  var mouse = {
    x : ( event.clientX / window.innerWidth ) * 2 - 1,
    y : -( event.clientY / window.innerHeight ) * 2 + 1  // screen to world!
  };
  
  // project mouse onto imaginary plane, to get crosshair position
  var vector = new THREE.Vector3( mouse.x, mouse.y, 1 );
  projector.unprojectVector( vector, camera );
  // Note: weirdness with projection means we're unable to change mouse plane,
  // instead we change camera position
  var cameraPosition = new THREE.Vector3( camera.position.x, camera.position.y, 10 );
  var ray = new THREE.Raycaster( cameraPosition, vector.sub( cameraPosition ).normalize() );
  var mousePlaneGeom = new THREE.PlaneGeometry(1000, 1000);
  var mousePlane = new THREE.Mesh( mousePlaneGeom, new THREE.MeshBasicMaterial() );
  var intersect = ray.intersectObject( mousePlane );
  if ( intersect.length > 0 ) {
    flyTarget = intersect[ 0 ].point;
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