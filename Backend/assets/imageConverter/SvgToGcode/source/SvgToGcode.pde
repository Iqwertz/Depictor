import geomerative.*;

PrintWriter OUTPUT;

RShape grp;
RPoint[][] pointPaths;

String fileName = "../input/image.svg"; // Name of the file you want to convert, as to be in the same directory
String outputFile = "output/gcode.nc";
String outputImage = "output/preview.png";
String settingsPath = "settings.json";

String penUp= "M05"; // Command to control the pen, it change beetween differents firmware
String penDown = "M03 S20";// This settings was made for my custom CNC Drawing machine
float[] xcoord = { 0, 100};// These variables define the minimum and maximum position of each axis for your output GCode 
float[] ycoord = { 0, 100};// These settings also change between your configuration
int floatingPoints = 2;
float segmentationAccuracy = 1;

float xmag, ymag, newYmag, newXmag = 0;
float z = 0;

void setup() {
  size(450, 600);
  // VERY IMPORTANT: Allways initialize the library before using it
  setSettings();

  println("loading SVG");
  RG.init(this);
  RG.ignoreStyles(true);

  RG.setPolygonizer(RG.UNIFORMSTEP);
  RG.setPolygonizerStep(segmentationAccuracy);

  grp = RG.loadShape(fileName);
  grp.centerIn(g, 100, 1, 1);
  //grp.rotate(PI/2,grp.getCenter());


  pointPaths = grp.getPointsInPaths();

  println("Shape loaded");

  translate(width/2, height/2);
  background(255);
  stroke(0);
  noFill();

  OUTPUT = createWriter(sketchPath("") + outputFile);

  for (int i = 0; i<pointPaths.length; i++) {
    if (pointPaths[i] != null) {
      beginShape();
      for (int j = 0; j<pointPaths[i].length; j++) {
        vertex(pointPaths[i][j].x, pointPaths[i][j].y);

        if (!Float.isNaN(pointPaths[i][j].y) && !Float.isNaN(pointPaths[i][j].x)) {
          float xmaped = map(pointPaths[i][j].x, -200, 200, xcoord[1], xcoord[0]);
          float ymaped = map(pointPaths[i][j].y, -200, 200, ycoord[0], ycoord[1]);

          if (j == 1) {
            OUTPUT.println(penDown);
          }

          String gcodeLine = "G1X"+nf(ymaped, 0, floatingPoints) +"Y"+nf(xmaped, 0, floatingPoints);  //x and y switched to match preview
          gcodeLine = gcodeLine.replace(',', '.');
          OUTPUT.println(gcodeLine);
        } else {
          println(pointPaths[i][j]);
        }
      }
      endShape();
    }
    OUTPUT.println(penUp);
  }
  OUTPUT.flush();
  OUTPUT.close();

  save(outputImage);

  println("finished");
  noLoop();
}

void draw() {  
  exit();
}

void setSettings() { 
  JSONObject json = loadJSONObject(settingsPath);
  floatingPoints = json.getInt("floatingPoints");
  segmentationAccuracy = json.getFloat("segmentationAccuracy");
}
