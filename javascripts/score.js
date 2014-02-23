var Score = function() {
  this.value = 0;
  this.scoreText = document.createElement('div');
  this.scoreText.style.position = 'fixed';
  this.scoreText.style.top = 1 + "%";
  this.scoreText.style.left = 1 + "%";
  this.scoreText.style.fontFamily = 'Sans-serif';
  this.scoreText.style.color = 'DarkSlateGray';
  this.scoreText.style.fontSize = "24px";
  document.body.appendChild( this.scoreText );
  
  this.change = function( delta ) {
    this.value += delta;
	this.set( this.value );
  };
  this.set = function( value ) {
    this.value = value;
    this.scoreText.innerHTML = "Score: " + this.value;
  };
  this.set( 0 );
};
var score = new Score();

var HighScore = function() {
  this.value = getHighScore();
  this.scoreText = document.createElement('div');
  this.scoreText.style.position = 'fixed';
  this.scoreText.style.top = 5 + "%";
  this.scoreText.style.left = 1 + "%";
  //this.scoreText.
  this.scoreText.style.fontFamily = 'Sans-serif';
  this.scoreText.style.color = 'DarkSlateGray';
  this.scoreText.style.fontSize = "24px";
  document.body.appendChild( this.scoreText );
  
  this.set = function( value ) {
    this.value = value;
    this.scoreText.innerHTML = "High: " + this.value;
	document.cookie="highScore=" + this.value +";expires=Thu, 18 Dec 2114 12:00:00 GMT;path=/;domain=" + document.location.hostname;
  };
  
  this.set( getHighScore() );
};

function getHighScore() {
	var cookies = document.cookie.split(";");
	var hs = 0;
	for (var i = 0;i < cookies.length; ++i) {
		var cookie = {name:cookies[i].split("=")[0], value:cookies[i].split("=")[1]};
		if (cookie.name == "highScore") {
			hs = cookie.value;
		}
	}
	return hs;
}

var highScore = new HighScore();