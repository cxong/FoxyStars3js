// Helper function for getting X position for a lane index
function getLaneX( lane ) {
  return ( lane - ( maxLane / 2 ) ) * laneSizeTotal / numLanes;
}

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
  this.meshes = [];
  for ( var i = 0; i < numSegments; i++ ) {
    if ( i == this.openSegment ) {
      continue;
    }
    var mesh = new THREE.Mesh( geometry.clone(), wireframeMaterial.clone() );
    mesh.position.y = -height / 2 + height / numSegments / 2 + i * height / numSegments;
    this.meshes.push( mesh );
    mesh = new THREE.Mesh( geometry.clone(), material.clone() );
    mesh.position.y = -height / 2 + height / numSegments / 2 + i * height / numSegments;
    this.meshes.push( mesh );
  }

  this.x = 0;
  this.setX = function( x ) {
    this.x = x;
    this.meshes.forEach(function(mesh) {
      mesh.position.x = x;
    });
  };
  this.z = 0;
  this.setZ = function( z ) {
    this.z = z;
    this.meshes.forEach(function(mesh) {
      mesh.position.z = z;
    });
  };
};

var PipeMaker = function( numPipes, numLanes, laneSizeTotal, heightTotal ) {
  this.pipes = [];
  this.lastPipeZ = 0;
  this.numLanes = numLanes;
  this.numPipes = numPipes;
  this.laneSizeTotal = laneSizeTotal;
  this.heightTotal = heightTotal;
  this.zStart = -15;
  this.zEnd = 0.5;
  this.addPipeThresholdZ = this.zStart - ( this.zStart / this.numPipes );
  
  this.addPipe = function( scene ) {
    for ( var i = 0; i < this.numLanes; i++ ) {
      var pipe = new Pipe( this.laneSizeTotal / this.numLanes, this.heightTotal );
      pipe.setX( getLaneX( i ) );
      pipe.setZ( this.zStart );
      this.lastPipeZ = pipe.z;
      for ( var j = 0; j < pipe.meshes.length; j++ ) {
        var pipeMesh = pipe.meshes[j];
        scene.add( pipeMesh );
      }
      this.pipes.push( pipe );
    }
  };
  
  this.movePipes = function() {
    this.lastPipeZ = this.zEnd;
    for ( var i = 0; i < this.pipes.length; i++ ) {
      var pipe = this.pipes[i];
      pipe.setZ( pipe.z + 0.1 );
      this.lastPipeZ = Math.min( this.lastPipeZ, pipe.z );
    }
  };
  
  this.update = function( scene ) {
    //console.log( this.pipes.length + ", " + this.lastPipeZ + ", " + this.addPipeThresholdZ );
    if ( this.pipes.length < this.numPipes * this.numLanes &&
        this.lastPipeZ > this.addPipeThresholdZ ) {
      this.addPipe( scene );
      console.log( "add" );
    }
    this.movePipes();
  };
  
  this.destroyCompletePipes = function( scene ) {
    // Remove pipes that have gone past the player
    for ( var i = this.pipes.length - 1; i >= 0; i-- ) {
      var pipe = this.pipes[ i ];
      if ( pipe.z > this.zEnd ) {
        for ( var j = 0; j < pipe.meshes.length; j++ ) {
          var pipeMesh = pipe.meshes[j];
          scene.remove( pipeMesh );
        }
        this.pipes.splice( i );
      }
    }
    if ( this.pipes.length === 0 ) {
      this.lastPipeZ = this.zEnd;
    }
  };
};