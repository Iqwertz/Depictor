void generateGcode(continuesLine[] gcodePaths, int pathsLineCount) {  //generates the gcode file from a given path array.
  String gname = "output/gcode.nc";
  OUTPUT = createWriter(sketchPath("") + gname);

  OUTPUT.println(startGcode);

  continuesLine[] transformedPaths = transform(gcodePaths, pathsLineCount, rotation, invert);

  for (int i=0; i<pathsLineCount; i++) {
    continuesLine conLine = transformedPaths[i];

    OUTPUT.println("G01 X" + conLine.points[0].x + " Y" + conLine.points[0].y);
    OUTPUT.println(penDownCommand);
    for (int j=1; j<conLine.pointCount; j++) {
      OUTPUT.println("G01 X" + conLine.points[j].x + " Y" + conLine.points[j].y);
    }
    OUTPUT.println(penUpCommand);
  }

  OUTPUT.println(endGcode);
  OUTPUT.flush();
  OUTPUT.close();

  println("Saved Gcode");
}

continuesLine[] transform(continuesLine[] _lines, int _linesSize, String _rotate, boolean _invert) {

  float middle = gridDimension/2;

  if (_invert) {

    println("inverting");
    for (int i=0; i<_linesSize; i++) {
      continuesLine line = _lines[i];
      for (int j=0; j<line.pointCount; j++) {
        _lines[i].points[j].x = middle + (middle - line.points[j].x);
      }
    }
  }


  for (int i=0; i<_linesSize; i++) {
    continuesLine line = _lines[i];
    for (int j=0; j<line.pointCount; j++) {
      _lines[i].points[j].x = middle + (middle - line.points[j].x);

      float a = 0; //temp var

      switch (_rotate) {
      case "left":
        a = line.points[j].x;
        _lines[i].points[j].x = middle*2 - line.points[j].y;
        _lines[i].points[j].y = a;
        break;
      case "down":
        a = line.points[j].x;
        _lines[i].points[j].x = middle*2 - line.points[j].y;
        _lines[i].points[j].y = a;

        a = line.points[j].x;
        _lines[i].points[j].x = middle*2 - line.points[j].y;
        _lines[i].points[j].y = a;
        break;
      case "right":
        a = line.points[j].x;
        _lines[i].points[j].x = middle*2 - line.points[j].y;
        _lines[i].points[j].y = a;

        a = line.points[j].x;
        _lines[i].points[j].x = middle*2 - line.points[j].y;
        _lines[i].points[j].y = a;

        a = line.points[j].x;
        _lines[i].points[j].x = middle*2 - line.points[j].y;
        _lines[i].points[j].y = a;
        break;
      }
    }
  }

  return _lines;
}
