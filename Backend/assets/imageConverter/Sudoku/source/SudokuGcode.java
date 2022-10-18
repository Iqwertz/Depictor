import processing.core.*; 
import processing.data.*; 
import processing.event.*; 
import processing.opengl.*; 

import de.sfuhrm.sudoku.*; 
import de.sfuhrm.sudoku.output.*; 

import java.util.HashMap; 
import java.util.ArrayList; 
import java.io.File; 
import java.io.BufferedReader; 
import java.io.PrintWriter; 
import java.io.InputStream; 
import java.io.OutputStream; 
import java.io.IOException; 

public class SudokuGcode extends PApplet {

  //https://github.com/sfuhrm/sudoku


///////////////////////////////////////////////////////////////////////////////////////////////////////
// SudokuGcode
// Generates gcode to draw a sudoku. The Sudoku is generated with the Sudoku Lib by sfuhrm
// Can be run standalone however it is created to be a module for Depictor - therefore no gui
// The svg can be generated with the solution by setting generateSvgSolution to true
// Generated files are in the "output" folder
// Following files are generated:
//   gcode.nc
//   image.svg
//   preview.png
//
// Julius Hussl, iqwertz.github.io, <juliushussl@gmail.com>
//
// Sudoku Lib:  https://github.com/sfuhrm/sudoku
// Depictor: https://github.com/Iqwertz/Depictor
///////////////////////////////////////////////////////////////////////////////////////////////////////

/////////////Settings////////////
int gridSize = 9;  //Number of rows and cols in the grid (currently only 9 works, because the sudoku generater can only generate 9x9 sudokus)
int gridDimension = 500;  //Width and Height of the grid
boolean generateSvgSolution = true;  //Should the generated SVG include the solution?

////////////Programm Vars////////////
final String settings_path = "settings.json";  //path to the settings file (an external settings file is used to be compatible with Depictor)

int pathCount = 0;  //elements in the paths array
continuesLine[] paths = new continuesLine[5000]; //all paths of the sudoku (without solution)

int solutionPathCount = 0; //elements in the solution Paths array
continuesLine[] solutionPaths = new continuesLine[5000];  //all paths for the solution

Riddle sudoku;  //Var holding the generated Sudoku

//Printers for output files
PrintWriter OUTPUT; 
PrintWriter JSON;

public void setup() {
  
  background(255);

  setSettings(); //set settings from the settings.json

  float cellSize = gridDimension/gridSize;

  //generate Row lines
  for (int i = 0; i<=gridSize; i++) {
    continuesLine row;
    if (i%2==0) { //all uneven rows are reversed to minimize travel paths
      row = new continuesLine(i*cellSize, 0);
      row.add(i*cellSize, gridSize*cellSize);
    } else {
      row = new continuesLine(i*cellSize, gridSize*cellSize);
      row.add(i*cellSize, 0);
    }

    paths[pathCount] = row;
    pathCount++;
  }

  //generate Column lines
  for (int i = 0; i<=gridSize; i++) {
    continuesLine row;
    if (i%2==0) { //all uneven columns are reversed to minimze travel paths
      row = new continuesLine(0, i*cellSize);
      row.add(gridSize*cellSize, i*cellSize);
    } else {
      row = new continuesLine(gridSize*cellSize, i*cellSize);
      row.add(0, i*cellSize);
    }

    paths[pathCount] = row;
    pathCount++;
  }

  generateSudoku();
  addSudokuNumbers();
  generateGcode(paths, pathCount);
  if (generateSvgSolution) {
    generateSudokuSolutionPath();
    generateSolvedSVG(paths, pathCount, solutionPaths, solutionPathCount);
  } else {
    generateSVG(paths, pathCount);
  }
  generateImage(paths, pathCount);
}

public void setSettings() {  //Checkis if a settings file exists and updates settings if
  File f = dataFile(settings_path);
  if (f.isFile()) {
    JSONObject json = loadJSONObject(settings_path);
    gridDimension = json.getInt("gridSize");
    generateSvgSolution = json.getBoolean("generateSvgSolution");
  }
}

public void draw() {
  exit();
}


//class representing a 2d float point
class floatPoint {
  float x, y;
  
  floatPoint(float x_, float y_) {
    x = x_;
    y = y_;
  }
  
  public void uniformScale(float factor){ //scales the point position by a given factor
    x=x*factor;
    y=y*factor;
  }
  
  public void translate(float x_, float y_){  //translates the point by the given values
   x+=x_;
   y+=y_;
  }
  
  public void update(float x_, float y_) {  //updates position of the point
    x = x_;
    y = y_;
  }
}
public void generateGcode(continuesLine[] gcodePaths, int pathsLineCount) {  //generates the gcode file from a given path array.
  String gname = "output/gcode.nc";
  OUTPUT = createWriter(sketchPath("") + gname);

  for (int i=0; i<pathsLineCount; i++) {
    continuesLine conLine = gcodePaths[i];

    OUTPUT.println("G01 X" + conLine.points[0].x + " Y" + conLine.points[0].y);
    OUTPUT.println("M03S300");
    for (int j=1; j<conLine.pointCount; j++) {
      OUTPUT.println("G01 X" + conLine.points[j].x + " Y" + conLine.points[j].y);
    }
    OUTPUT.println("M05");
  }

  OUTPUT.flush();
  OUTPUT.close();
  
  println("Saved Gcode");
}
public void generateImage(continuesLine[] gcodePaths, int pathsLineCount) {  //generates a image from the given paths array

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

//class representing a continues Line. Continues meaning without a penlift in between.
class continuesLine {
  int pointCount = 0;
  
  floatPoint[] points = new floatPoint[1000];
  
  continuesLine(float x1_, float y1_) {
    points[pointCount] = new floatPoint(x1_, y1_);
    pointCount++;
  }
  
  public void add(float x1_, float y1_){ //add a point to the line
     points[pointCount] = new floatPoint(x1_, y1_);
     pointCount++;
  }
  
  public void scale(float factor){  //scale all points in the line
     for(int i=0; i<pointCount; i++){
      points[i].uniformScale(factor); 
     }
  }
  
  public void translate(float x, float y){ //translate all points in the line
       for(int i=0; i<pointCount; i++){
      points[i].translate(x,y); 
     }
  }
  
  ////temp function because I dont want to recalculate the points for the numbers
  public void flipY(float h){ //flips the points along the y axis
      for(int i=0; i<pointCount; i++){
      float transform = points[i].y-h/2;
      points[i].update(points[i].x,h/2-transform);
     }
  }
}
final float numberWidth = 10.0f; //maximum width of the generated numbers

public continuesLine getScaledNumber(int number, float width_) { //returns the path for the given number and scales it to the given width
    continuesLine numberLine = getNumberByInt(number);
    float scaleFactor = width_ / numberWidth;
    numberLine.scale(scaleFactor);
    return numberLine;
}

public continuesLine getNumberByInt(int number) { //gets the path for a number
    continuesLine numberLine;
    switch(number) {
        case 1:
            numberLine = one();
            break;
        case 2:
            numberLine = two();
            break;
        case 3:
            numberLine = three();
            break;
        case 4:
            numberLine = four();
            break;
        case 5:
            numberLine = five();
            break;
        case 6:
            numberLine = six();
            break;
        case 7:
            numberLine = seven();
            break;
        case 8:
            numberLine = eight();
            break;
        case 9:
            numberLine = nine();
            break;
        default:
        numberLine = zero();
        break;
    }
    
    return numberLine;
}


/////////////////////////////////////////////////////////////////////////////////////////////////////
//The following 10 fucntions store the paths for each number. The numbers where generated with a inkscape plugins and vscode search and replace//
public continuesLine zero() {
    continuesLine line = new continuesLine(4.514592f, 9.337609f);
    line.add(3.271047f, 8.914275f);
    line.add(2.424378f, 7.670730f);
    line.add(2.014273f, 5.580517f);
    line.add(2.014273f, 4.336972f);
    line.add(2.424378f, 2.246758f);
    line.add(3.271047f, 0.996599f);
    line.add(4.514592f, 0.579879f);
    line.add(5.348031f, 0.579879f);
    line.add(6.604805f, 0.996599f);
    line.add(7.425016f, 2.246758f);
    line.add(7.848350f, 4.336972f);
    line.add(7.848350f, 5.580517f);
    line.add(7.425016f, 7.670730f);
    line.add(6.604805f, 8.914275f);
    line.add(5.348031f, 9.337609f);
    line.add(4.514592f, 9.337609f);
    line.flipY(numberWidth);
    return line;
}

public continuesLine one() {
    continuesLine line = new continuesLine(3.538247f, 7.706701f);
    line.add(4.358457f, 8.116806f);
    line.add(5.615231f, 9.373580f);
    line.add(5.615231f, 0.615850f);
    line.flipY(numberWidth);
    return line;
}

public continuesLine two() {
    continuesLine line = new continuesLine(2.562528f, 7.283537f);
    line.add(2.562528f, 7.706871f);
    line.add(2.985862f, 8.527082f);
    line.add(3.409197f, 8.950416f);
    line.add(4.229407f, 9.373750f);
    line.add(5.896286f, 9.373750f);
    line.add(6.742955f, 8.950416f);
    line.add(7.153060f, 8.527082f);
    line.add(7.563166f, 7.706871f);
    line.add(7.563166f, 6.860202f);
    line.add(7.153060f, 6.039992f);
    line.add(6.319621f, 4.783218f);
    line.add(2.152423f, 0.616020f);
    line.add(7.986500f, 0.616020f);
    line.flipY(numberWidth);
    return line;
}

public continuesLine three() {
    continuesLine line = new continuesLine(3.135639f, 8.235394f);
    line.add(3.807683f, 8.738104f);
    line.add(4.680810f, 9.121751f);
    line.add(5.381958f, 9.121751f);
    line.add(6.136022f, 8.910083f);
    line.add(6.757794f, 8.407374f);
    line.add(7.048837f, 7.745914f);
    line.add(7.181129f, 6.952162f);
    line.add(6.969462f, 6.237785f);
    line.add(6.255085f, 5.695388f);
    line.add(5.474562f, 5.285283f);
    line.add(4.799873f, 5.152991f);
    line.add(4.297163f, 5.152991f);
    line.add(4.932165f, 5.152991f);
    line.add(5.593625f, 5.073615f);
    line.add(6.255085f, 4.822261f);
    line.add(6.969462f, 4.279863f);
    line.add(7.300192f, 3.777154f);
    line.add(7.432484f, 3.195069f);
    line.add(7.392796f, 2.573297f);
    line.add(7.260504f, 2.070587f);
    line.add(6.850399f, 1.489825f);
    line.add(6.255085f, 1.115439f);
    line.add(5.514250f, 0.907740f);
    line.add(4.720498f, 0.907740f);
    line.add(3.966433f, 1.115439f);
    line.add(3.218983f, 1.532159f);
    line.add(2.761253f, 1.951524f);
    line.flipY(numberWidth);
    return line;
}

public continuesLine four() {
    continuesLine line = new continuesLine(6.042591f, 0.626170f);
    line.add(6.042591f, 9.383900f);
    line.add(1.875393f, 3.536594f);
    line.add(8.132804f, 3.536594f);
    line.flipY(numberWidth);
    return line;
}

public continuesLine five() {
    continuesLine line = new continuesLine(7.153780f, 9.314464f);
    line.add(2.986582f, 9.314464f);
    line.add(2.563248f, 5.557372f);
    line.add(2.986582f, 5.980706f);
    line.add(4.230127f, 6.390811f);
    line.add(5.486901f, 6.390811f);
    line.add(6.743675f, 5.980706f);
    line.add(7.563886f, 5.134037f);
    line.add(7.987220f, 3.890492f);
    line.add(7.987220f, 3.057053f);
    line.add(7.563886f, 1.806893f);
    line.add(6.743675f, 0.973454f);
    line.add(5.486901f, 0.556734f);
    line.add(4.230127f, 0.556734f);
    line.add(2.986582f, 0.973454f);
    line.add(2.563248f, 1.390174f);
    line.add(2.153143f, 2.223613f);
    line.flipY(numberWidth);
    return line;
}

public continuesLine six() {
    continuesLine line = new continuesLine(7.309286f, 8.127126f);
    line.add(6.899180f, 8.960566f);
    line.add(5.642406f, 9.383900f);
    line.add(4.822196f, 9.383900f);
    line.add(3.565422f, 8.960566f);
    line.add(2.731982f, 7.717021f);
    line.add(2.308648f, 5.626808f);
    line.add(2.308648f, 3.536594f);
    line.add(2.731982f, 1.876329f);
    line.add(3.565422f, 1.042890f);
    line.add(4.822196f, 0.626170f);
    line.add(5.232301f, 0.626170f);
    line.add(6.489075f, 1.042890f);
    line.add(7.309286f, 1.876329f);
    line.add(7.732620f, 3.126489f);
    line.add(7.732620f, 3.536594f);
    line.add(7.309286f, 4.793368f);
    line.add(6.489075f, 5.626808f);
    line.add(5.232301f, 6.050142f);
    line.add(4.822196f, 6.050142f);
    line.add(3.565422f, 5.626808f);
    line.add(2.731982f, 4.793368f);
    line.add(2.308648f, 3.536594f);
    line.flipY(numberWidth);
    return line;
}

public continuesLine seven() {
    continuesLine line = new continuesLine(2.083703f, 9.314464f);
    line.add(7.917780f, 9.314464f);
    line.add(3.750582f, 0.556734f); 
    line.flipY(numberWidth);
    return line;
}

public continuesLine eight() {
    continuesLine line = new continuesLine(4.253267f, 9.337609f);
    line.add(3.009722f, 8.914275f);
    line.add(2.586388f, 8.080835f);
    line.add(2.586388f, 7.247396f);
    line.add(3.009722f, 6.413956f);
    line.add(3.843162f, 6.003851f);
    line.add(5.510041f, 5.580517f);
    line.add(6.766815f, 5.157182f);
    line.add(7.587026f, 4.336972f);
    line.add(8.010360f, 3.490303f);
    line.add(8.010360f, 2.246758f);
    line.add(7.587026f, 1.413319f);
    line.add(7.176920f, 0.996599f);
    line.add(5.920146f, 0.579879f);
    line.add(4.253267f, 0.579879f);
    line.add(3.009722f, 0.996599f);
    line.add(2.586388f, 1.413319f);
    line.add(2.176283f, 2.246758f);
    line.add(2.176283f, 3.490303f);
    line.add(2.586388f, 4.336972f);
    line.add(3.433057f, 5.157182f);
    line.add(4.676602f, 5.580517f);
    line.add(6.343481f, 6.003851f);
    line.add(7.176920f, 6.413956f);
    line.add(7.587026f, 7.247396f);
    line.add(7.587026f, 8.080835f);
    line.add(7.176920f, 8.914275f);
    line.add(5.920146f, 9.337609f);
    line.add(4.253267f, 9.337609f);
    line.flipY(numberWidth);
    return line;
}

public continuesLine nine() {
    continuesLine line = new continuesLine(7.749045f, 6.460247f);
    line.add(7.338939f, 5.203473f);
    line.add(6.505500f, 4.383263f);
    line.add(5.261955f, 3.959928f);
    line.add(4.838621f, 3.959928f);
    line.add(3.595076f, 4.383263f);
    line.add(2.748407f, 5.203473f);
    line.add(2.338302f, 6.460247f);
    line.add(2.338302f, 6.870352f);
    line.add(2.748407f, 8.127126f);
    line.add(3.595076f, 8.960566f);
    line.add(4.838621f, 9.383900f);
    line.add(5.261955f, 9.383900f);
    line.add(6.505500f, 8.960566f);
    line.add(7.338939f, 8.127126f);
    line.add(7.749045f, 6.460247f);
    line.add(7.749045f, 4.383263f);
    line.add(7.338939f, 2.293049f);
    line.add(6.505500f, 1.042890f);
    line.add(5.261955f, 0.626170f);
    line.add(4.415286f, 0.626170f);
    line.add(3.171741f, 1.042890f);
    line.add(2.748407f, 1.876329f);
    line.flipY(numberWidth);
    return line;
}
public void generateSudoku() { //generates the Sudoku with the Sudoku Lib
  GameMatrix matrix = Creator.createFull();
  sudoku = Creator.createRiddle(matrix); 
}

public void addSudokuNumbers() {  //transforms the generated sudoku to paths and adds them to the global paths array
  float cellSize = gridDimension/gridSize;

  for (int i=0; i<gridSize; i++) {
    for (int j=0; j<gridSize; j++) {
      if (sudoku.get(i, j)!=0) {
        continuesLine numberLine = getScaledNumber(sudoku.get(i, j), cellSize);
        numberLine.translate(i*cellSize, j*cellSize);

        paths[pathCount] = numberLine;
        pathCount++;
      }
    }
  }
}

public void generateSudokuSolutionPath() {   //generates the Sudoku solution and adds it to solution paths array

  Solver solver = new Solver(sudoku);
  GameMatrix solution = solver.solve().get(0);

  float cellSize = gridDimension/gridSize;

  for (int i=0; i<gridSize; i++) {
    for (int j=0; j<gridSize; j++) {
      if (sudoku.get(i, j)==0) {
        continuesLine numberLine = getScaledNumber(solution.get(i, j), cellSize);
        numberLine.translate(i*cellSize, j*cellSize);

        solutionPaths[solutionPathCount] = numberLine;
        solutionPathCount++;
      }
    }
  }
}
public void generateSVG(continuesLine[] gcodePaths, int pathsLineCount) { //generates a svg from the given path array
  String gname = "output/image.svg";
  OUTPUT = createWriter(sketchPath("") + gname);
  OUTPUT.println("<?xml version=\"1.0\" encoding=\"UTF-8\" ?>");
  OUTPUT.println("<svg width=\"" + gridDimension + "mm\" height=\"" + gridDimension + "mm\" xmlns=\"http://www.w3.org/2000/svg\" version=\"1.1\">");
  OUTPUT.println("<g id=\"0\">");
  for (int i=0; i<pathsLineCount; i++) {

    OUTPUT.println("<polyline fill=\"none\" stroke=\"#000000\" stroke-width=\"1.0\" stroke-opacity=\"1\" points=\"");
    continuesLine conLine = gcodePaths[i];
    for (int j=0; j<conLine.pointCount; j++) {
      String buf = svg_format(conLine.points[j].x) + "," + svg_format(conLine.points[j].y);
      OUTPUT.println(buf);
    }
    OUTPUT.println("\" />");
  }

  OUTPUT.println("</g>");
  OUTPUT.println("</svg>");
  OUTPUT.flush();
  OUTPUT.close();
  println("SVG created");
}

public void generateSolvedSVG(continuesLine[] riddlePaths, int riddlePathsLineCount, continuesLine[] solutionPaths, int solutionPathsLineCount) {  //generates s solved Sudoku svg by combining the riddle and solution paths into one svg.
  String gname = "output/image.svg";
  OUTPUT = createWriter(sketchPath("") + gname);
  OUTPUT.println("<?xml version=\"1.0\" encoding=\"UTF-8\" ?>");
  OUTPUT.println("<svg width=\"" + gridDimension + "mm\" height=\"" + gridDimension + "mm\" xmlns=\"http://www.w3.org/2000/svg\" version=\"1.1\">");
  OUTPUT.println("<g id=\"0\">");
  for (int i=0; i<riddlePathsLineCount; i++) {
    OUTPUT.println("<polyline fill=\"none\" stroke=\"#000000\" stroke-width=\"1.0\" stroke-opacity=\"1\" points=\"");
    continuesLine conLine = riddlePaths[i];
    for (int j=0; j<conLine.pointCount; j++) {
      String buf = svg_format(conLine.points[j].x) + "," + svg_format(conLine.points[j].y);
      OUTPUT.println(buf);
    }
    OUTPUT.println("\" />");
  }

  for (int i=0; i<solutionPathsLineCount; i++) {
    OUTPUT.println("<polyline fill=\"none\" stroke=\"#ff5050\" stroke-width=\"1.0\" stroke-opacity=\"1\" points=\"");
    continuesLine conLine = solutionPaths[i];
    for (int j=0; j<conLine.pointCount; j++) {
      String buf = svg_format(conLine.points[j].x) + "," + svg_format(conLine.points[j].y);
      OUTPUT.println(buf);
    }
    OUTPUT.println("\" />");
  }

  OUTPUT.println("</g>");
  OUTPUT.println("</svg>");
  OUTPUT.flush();
  OUTPUT.close();
  println("SVG created");
}


///////////copied from DrawbotV2///////////
public String svg_format (Float n) {
  final char regional_decimal_separator = ',';
  final char svg_decimal_seperator = '.';

  String s = nf(n, 0, 4);
  s = s.replace(regional_decimal_separator, svg_decimal_seperator);
  return s;
}

  public void settings() {  size(500, 500); }
  static public void main(String[] passedArgs) {
    String[] appletArgs = new String[] { "SudokuGcode" };
    if (passedArgs != null) {
      PApplet.main(concat(appletArgs, passedArgs));
    } else {
      PApplet.main(appletArgs);
    }
  }
}
