$.getScript("https://rawgithub.com/mrdoob/three.js/master/build/three.js", function(){

  var scene = new THREE.Scene();
  var projector = new THREE.Projector();
  var flyTarget = new THREE.Vector3();

  // Set up camera
  var fov = 75;
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
    mesh : cube, speed : 0.08, speedMax : 0.5, vel : new THREE.Vector3(), velDecay : 0.07,
    moveTo : function (target) {
      var delta = new THREE.Vector3();
      delta.subVectors( target, this.mesh.position );
      if (delta.length() < 0.1) {
        this.mesh.position = target;
        return;
      }
      target.sub( this.vel );
      delta.subVectors( target, this.mesh.position );
      delta.normalize();
      delta.multiplyScalar( this.speed );
      this.vel.add( delta );
      if (this.vel.length() > this.speedMax) {
        this.vel.normalize();
        this.vel.multiplyScalar( this.speedMax );
      }
    },
    update : function () {
      this.mesh.position.add( this.vel );
      var len = this.vel.length();
      if (len > this.velDecay) {
        len -= this.velDecay;
      } else {
        len = 0;
      }
      this.vel.normalize();
      this.vel.multiplyScalar( len );
    }
  };

  camera.position.z = 5;
  
  // Mouse
  document.addEventListener( 'mousemove', onDocumentMouseMove, false );

  // Render loop
  function render() {
    requestAnimationFrame(render);

    fighter.moveTo( flyTarget );
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

  render();
});