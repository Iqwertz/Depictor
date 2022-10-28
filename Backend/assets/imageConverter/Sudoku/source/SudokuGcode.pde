import de.sfuhrm.sudoku.*;  //https://github.com/sfuhrm/sudoku
import de.sfuhrm.sudoku.output.*;

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

String penUpCommand = "M05";
String penDownCommand = "M03S500";
String startGcode = "";
String endGcode = "";
String rotation = "up";
boolean invert = false; 
////////////Programm Vars////////////
final String settings_path = "../settings.json";  //path to the settings file (an external settings file is used to be compatible with Depictor)

int pathCount = 0;  //elements in the paths array
continuesLine[] paths = new continuesLine[5000]; //all paths of the sudoku (without solution)

int solutionPathCount = 0; //elements in the solution Paths array
continuesLine[] solutionPaths = new continuesLine[5000];  //all paths for the solution

Riddle sudoku;  //Var holding the generated Sudoku

//Printers for output files
PrintWriter OUTPUT; 
PrintWriter JSON;

void setup() {
  size(500, 500);
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
  if (generateSvgSolution) {
    generateSudokuSolutionPath();
    generateSolvedSVG(paths, pathCount, solutionPaths, solutionPathCount);
  } else {
    generateSVG(paths, pathCount);
  }
  generateImage(paths, pathCount);
  generateGcode(paths, pathCount);
}

void setSettings() {  //Checkis if a settings file exists and updates settings if
  File f = dataFile(settings_path);
  if (f.isFile()) {
    JSONObject json = loadJSONObject(settings_path);
    gridDimension = json.getInt("gridSize");
    generateSvgSolution = json.getBoolean("generateSvgSolution");
    rotation = json.getString("selectedRotate");
    invert = json.getBoolean("invert");
    println(invert);
    println(rotation);
  }
}

void draw() {
  exit();
}
