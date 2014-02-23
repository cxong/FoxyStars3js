var Splash = function( path, width, height ) {
  this.scene = new THREE.Scene();
  var aspectRatio = window.innerWidth / window.innerHeight;
  var near = 0.1;
  var far = 1000;
  var cameraScale = 15;
  this.camera = new THREE.OrthographicCamera(
    cameraScale * aspectRatio / - 2, cameraScale * aspectRatio / 2,
    cameraScale / 2, cameraScale / - 2, near, far );
  this.camera.position.z = 5;
  var matMap = THREE.ImageUtils.loadTexture( path );
  var material = new THREE.MeshBasicMaterial({
    map : matMap,
    transparent : true,
    opacity : 0.5
  });
  var geometry = new THREE.PlaneGeometry( width * 0.03, height * 0.03 );
  this.mesh = new THREE.Mesh( geometry, material );
  this.scene.add( this.mesh );
  
  this.render = function( renderer ) {
    renderer.render( this.scene, this.camera );
  };
};