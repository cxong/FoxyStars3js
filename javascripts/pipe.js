var Pipe = function( width, height ) {
  // Number of segments where the pipe opening could be
  var numSegments = 4;

  this.openSegment = Math.floor( Math.random() * numSegments );
  
  var geometry = new THREE.CubeGeometry( width, height / numSegments, 1 );
  var material = new THREE.MeshBasicMaterial({
    color : 0x00cc00
  });
  var wireframeMaterial = new THREE.MeshBasicMaterial( {
    color: 0x000000, wireframe: true, transparent: true
  } );
  this.meshes = new Array();
  for ( var i = 0; i < numSegments; i++ ) {
    if ( i == this.openSegment ) {
      continue;
    }
    var mesh = new THREE.Mesh( geometry.clone(), material.clone() );
    mesh.position.y = -height / 2 + height / numSegments / 2 + i * height / numSegments;
    this.meshes.push( mesh );
    mesh = new THREE.Mesh( geometry.clone(), wireframeMaterial.clone() );
    mesh.position.y = -height / 2 + height / numSegments / 2 + i * height / numSegments;
    this.meshes.push( mesh );
  }

  this.x = 0;
  this.setX = function( x ) {
    this.x = x;
    this.meshes.forEach(function(mesh) {
      mesh.position.x = x;
    });
  }
  this.z = 0;
  this.setZ = function( z ) {
    this.z = z;
    this.meshes.forEach(function(mesh) {
      mesh.position.z = z;
    });
  }
}