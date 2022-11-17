void generateImage(continuesLine[] gcodePaths, int pathsLineCount) {  //generates a image from the given paths array

  stroke(0,0,0);
  strokeWeight(2);
  for (int i=0; i<pathsLineCount; i++) {
    continuesLine conLine = gcodePaths[i];
    floatPoint lastPoint = conLine.points[0];
    for (int j=1; j<conLine.pointCount; j++) {
      line(lastPoint.x,lastPoint.y,conLine.points[j].x,conLine.points[j].y);
      lastPoint=conLine.points[j];
    }
  }
  save("output/preview.png");
}
