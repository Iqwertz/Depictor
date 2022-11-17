
//class representing a continues Line. Continues meaning without a penlift in between.
class continuesLine {
  int pointCount = 0;
  
  floatPoint[] points = new floatPoint[1000];
  
  continuesLine(float x1_, float y1_) {
    points[pointCount] = new floatPoint(x1_, y1_);
    pointCount++;
  }
  
  void add(float x1_, float y1_){ //add a point to the line
     points[pointCount] = new floatPoint(x1_, y1_);
     pointCount++;
  }
  
  void scale(float factor){  //scale all points in the line
     for(int i=0; i<pointCount; i++){
      points[i].uniformScale(factor); 
     }
  }
  
  void translate(float x, float y){ //translate all points in the line
       for(int i=0; i<pointCount; i++){
      points[i].translate(x,y); 
     }
  }
  
  ////temp function because I dont want to recalculate the points for the numbers
  void flipY(float h){ //flips the points along the y axis
      for(int i=0; i<pointCount; i++){
      float transform = points[i].y-h/2;
      points[i].update(points[i].x,h/2-transform);
     }
  }
}
