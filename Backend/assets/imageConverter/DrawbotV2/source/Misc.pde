///////////////////////////////////////////////////////////////////////////////////////////////////////
// A class to check the upper and lower limits of a value
class Limit {
  float min = 2147483647;
  float max = -2147483648;
  
  Limit() { }
  
  void update_limit(float value_) {
    if (value_ < min) { min = value_; }
    if (value_ > max) { max = value_; }
  }
}

///////////////////////////////////////////////////////////////////////////////////////////////////////
// Experimental, mark coordinates of mouse locations to console.
// Useful for locating vanishing points etc.
// Currently works correctly with screen_scale, translation and rotation.
void mouse_point() {
  
  print("Mouse point: ");
  switch(screen_rotate) {
    case 0: 
      println(  (mouseX/screen_scale - mx) + ", " +  (mouseY/screen_scale - my) );
      break;
    case 1: 
      println(  (mouseY/screen_scale - my) + ", " + -(mouseX/screen_scale - mx) );
      break;
    case 2: 
      println( -(mouseX/screen_scale - mx) + ", " + -(mouseY/screen_scale - my) );
      break;
    case 3: 
      println( -(mouseY/screen_scale - my) + ", " +  (mouseX/screen_scale - mx) );
      break;
   }
}
  
///////////////////////////////////////////////////////////////////////////////////////////////////////
