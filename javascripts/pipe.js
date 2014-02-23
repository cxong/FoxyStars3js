// Pipes are big vertical structures that move from way in front of the camera
// towards the camera. There are gaps in the pipes at random places,
// and represent obstacles for the fighter to fly through.
// There is a set of pipes per vertical lane, each with its gap in a
// different position.
// The PipeMaker is a helper class for creating and tracking the pipes, so that
// pipes occur at regular intervals and are removed once they move past the
// fighter.

// Helper function for getting X position for a lane index
function getLaneX( lane ) {
  return ( lane - ( maxLane / 2 ) ) * laneSizeTotal / numLanes;
}

var Pipe = function( width, height, hasOpenSegment ) {
  // Number of segments where the pipe opening could be
  var numSegments = 5;

  // The segment index where there will be a gap
  if ( hasOpenSegment ) {
    this.openSegment = Math.floor( Math.random() * ( numSegments - 2 ) + 1 );
  } else {
    this.openSegment = -1;
  }

  // Meshes for the pipe, one per segment (except for the gap)
  this.width = width;
  this.height = height / numSegments;
  var geometry = new THREE.CubeGeometry( this.width, this.height, 1 );
  var matMap = THREE.ImageUtils.loadTexture( "seamless_brick-015-512x512.png" );
  var material = new THREE.MeshBasicMaterial({
    map : matMap
  });
  this.meshes = [];
  for ( var i = 0; i < numSegments; i++ ) {
    if ( i == this.openSegment ) {
      continue;
    }
    var mesh = new THREE.Mesh( geometry.clone(), material.clone() );
    mesh.position.y = -height / 2 + height / numSegments / 2 + i * height / numSegments;
    this.meshes.push( mesh );
  }

  // Modify X and Z positions for the pipes
  // The Pipe object encompasses multiple sections that are moved together
  this.x = 0;
  this.setX = function( x ) {
    this.x = x;
    for ( var i = 0; i < this.meshes.length; i++ ) {
      var mesh = this.meshes[i];
      mesh.position.x = x;
    }
  };
  this.z = 0;
  this.lastZ = 0;
  this.setZ = function( z ) {
    this.lastZ = this.z;
    this.z = z;
    for ( var i = 0; i < this.meshes.length; i++ ) {
      var mesh = this.meshes[i];
      mesh.position.z = z;
    }
  };
  
  // For all the pipe sections in this pipe, find if any
  // collides with the fighter's position
  // (regardless of Z position)
  this.isFighterCollides = function( position ) {
    for ( var i = 0; i < this.meshes.length; i++ ) {
      var mesh = this.meshes[i];
      if (mesh.position.x - this.width / 2 <= position.x &&
          mesh.position.x + this.width / 2 >= position.x &&
          mesh.position.y - this.height / 2 <= position.y &&
          mesh.position.y + this.height / 2 >= position.y) {
        return true;
      }
    }
    return false;
  };
};

var PipeMaker = function( numPipes, numLanes, laneSizeTotal, heightTotal, speed ) {
  // Colleciton of pipes: note that there is one per lane!
  this.pipes = [];

  // The Z position of the farthest pipes. This determines whether we add another pipe
  this.lastPipeZ = 0;

  this.numLanes = numLanes;

  // Number of pipe collections, rather than pipes. Pipes is this times numLanes
  this.numPipes = numPipes;

  this.laneSizeTotal = laneSizeTotal;
  this.heightTotal = heightTotal;

  // Z position where new pipes appear
  this.zStart = -10;

  // Z position where pipes are removed
  this.zEnd = 0.5;

  // When the lastPipeZ exceeds this value, we need to place another pipe
  // This is calculated so that we have pipes spaced at equal intervals
  this.addPipeThresholdZ = this.zStart - ( this.zStart / this.numPipes );

  this.addPipe = function( scene ) {
    // Add normal middle-lanes, ones with open segments
    // Also add a no-open-segment at the left and right
    for ( var i = 0; i < this.numLanes; i++ ) {
    var width = this.laneSizeTotal / this.numLanes;
      var hasOpenSegment = i !== 0 && i != this.numLanes - 1;
      var pipe = new Pipe( width, this.heightTotal, hasOpenSegment );
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

  // Move every pipe forward
  this.movePipes = function() {
    this.lastPipeZ = this.zEnd;
    for ( var i = 0; i < this.pipes.length; i++ ) {
      var pipe = this.pipes[i];
      pipe.setZ( pipe.z + speed );
      this.lastPipeZ = Math.min( this.lastPipeZ, pipe.z );
    }
  };

  // Move pipes, and add if necessary
  this.update = function( scene ) {
    //console.log( this.pipes.length + ", " + this.lastPipeZ + ", " + this.addPipeThresholdZ );
    if ( this.pipes.length < this.numPipes * this.numLanes &&
        this.lastPipeZ > this.addPipeThresholdZ ) {
      this.addPipe( scene );
      console.log( "add" );
    }
    this.movePipes();
  };
  
  // Check if any pipes have moved past the position's Z value
  // since last being moved
  this.hasPipesPassed = function( position ) {
    for ( var i = 0; i < this.pipes.length; i++ ) {
      var pipe = this.pipes[i];
      if ( pipe.lastZ < position.z && pipe.z >= position.z ) {
        return true;
      }
    }
    return false;
  }
  
  // For all the pipes that the fighter has flied past
  // (denoted by z arg), find if any collides with the
  // fighter's position
  this.isFighterCollides = function( position ) {
    for ( var i = 0; i < this.pipes.length; i++ ) {
      var pipe = this.pipes[i];
      if ( pipe.lastZ < position.z && pipe.z >= position.z ) {
        if ( pipe.isFighterCollides( position ) ) {
          return true;
        }
      }
    }
    return false;
  }

  // Remove pipes that are past the fighter
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
  
  this.reset = function( scene ) {
    // Remove all pipes
    for ( var i = this.pipes.length - 1; i >= 0; i-- ) {
      var pipe = this.pipes[ i ];
      for ( var j = 0; j < pipe.meshes.length; j++ ) {
        var pipeMesh = pipe.meshes[j];
        scene.remove( pipeMesh );
      }
    }
    this.pipes = [];
    this.lastPipeZ = 0;
  }
};
