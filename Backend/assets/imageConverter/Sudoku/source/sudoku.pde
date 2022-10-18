void generateSudoku() { //generates the Sudoku with the Sudoku Lib
  GameMatrix matrix = Creator.createFull();
  sudoku = Creator.createRiddle(matrix); 
}

void addSudokuNumbers() {  //transforms the generated sudoku to paths and adds them to the global paths array
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

void generateSudokuSolutionPath() {   //generates the Sudoku solution and adds it to solution paths array

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
