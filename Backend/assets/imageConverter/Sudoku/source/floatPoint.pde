
//class representing a 2d float point
class floatPoint {
  float x, y;
  
  floatPoint(float x_, float y_) {
    x = x_;
    y = y_;
  }
  
  void uniformScale(float factor){ //scales the point position by a given factor
    x=x*factor;
    y=y*factor;
  }
  
  void translate(float x_, float y_){  //translates the point by the given values
   x+=x_;
   y+=y_;
  }
  
  void update(float x_, float y_) {  //updates position of the point
    x = x_;
    y = y_;
  }
}
