final float numberWidth = 10.0; //maximum width of the generated numbers

continuesLine getScaledNumber(int number, float width_) { //returns the path for the given number and scales it to the given width
    continuesLine numberLine = getNumberByInt(number);
    float scaleFactor = width_ / numberWidth;
    numberLine.scale(scaleFactor);
    return numberLine;
}

continuesLine getNumberByInt(int number) { //gets the path for a number
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
continuesLine zero() {
    continuesLine line = new continuesLine(4.514592, 9.337609);
    line.add(3.271047, 8.914275);
    line.add(2.424378, 7.670730);
    line.add(2.014273, 5.580517);
    line.add(2.014273, 4.336972);
    line.add(2.424378, 2.246758);
    line.add(3.271047, 0.996599);
    line.add(4.514592, 0.579879);
    line.add(5.348031, 0.579879);
    line.add(6.604805, 0.996599);
    line.add(7.425016, 2.246758);
    line.add(7.848350, 4.336972);
    line.add(7.848350, 5.580517);
    line.add(7.425016, 7.670730);
    line.add(6.604805, 8.914275);
    line.add(5.348031, 9.337609);
    line.add(4.514592, 9.337609);
    line.flipY(numberWidth);
    return line;
}

continuesLine one() {
    continuesLine line = new continuesLine(3.538247, 7.706701);
    line.add(4.358457, 8.116806);
    line.add(5.615231, 9.373580);
    line.add(5.615231, 0.615850);
    line.flipY(numberWidth);
    return line;
}

continuesLine two() {
    continuesLine line = new continuesLine(2.562528, 7.283537);
    line.add(2.562528, 7.706871);
    line.add(2.985862, 8.527082);
    line.add(3.409197, 8.950416);
    line.add(4.229407, 9.373750);
    line.add(5.896286, 9.373750);
    line.add(6.742955, 8.950416);
    line.add(7.153060, 8.527082);
    line.add(7.563166, 7.706871);
    line.add(7.563166, 6.860202);
    line.add(7.153060, 6.039992);
    line.add(6.319621, 4.783218);
    line.add(2.152423, 0.616020);
    line.add(7.986500, 0.616020);
    line.flipY(numberWidth);
    return line;
}

continuesLine three() {
    continuesLine line = new continuesLine(3.135639, 8.235394);
    line.add(3.807683, 8.738104);
    line.add(4.680810, 9.121751);
    line.add(5.381958, 9.121751);
    line.add(6.136022, 8.910083);
    line.add(6.757794, 8.407374);
    line.add(7.048837, 7.745914);
    line.add(7.181129, 6.952162);
    line.add(6.969462, 6.237785);
    line.add(6.255085, 5.695388);
    line.add(5.474562, 5.285283);
    line.add(4.799873, 5.152991);
    line.add(4.297163, 5.152991);
    line.add(4.932165, 5.152991);
    line.add(5.593625, 5.073615);
    line.add(6.255085, 4.822261);
    line.add(6.969462, 4.279863);
    line.add(7.300192, 3.777154);
    line.add(7.432484, 3.195069);
    line.add(7.392796, 2.573297);
    line.add(7.260504, 2.070587);
    line.add(6.850399, 1.489825);
    line.add(6.255085, 1.115439);
    line.add(5.514250, 0.907740);
    line.add(4.720498, 0.907740);
    line.add(3.966433, 1.115439);
    line.add(3.218983, 1.532159);
    line.add(2.761253, 1.951524);
    line.flipY(numberWidth);
    return line;
}

continuesLine four() {
    continuesLine line = new continuesLine(6.042591, 0.626170);
    line.add(6.042591, 9.383900);
    line.add(1.875393, 3.536594);
    line.add(8.132804, 3.536594);
    line.flipY(numberWidth);
    return line;
}

continuesLine five() {
    continuesLine line = new continuesLine(7.153780, 9.314464);
    line.add(2.986582, 9.314464);
    line.add(2.563248, 5.557372);
    line.add(2.986582, 5.980706);
    line.add(4.230127, 6.390811);
    line.add(5.486901, 6.390811);
    line.add(6.743675, 5.980706);
    line.add(7.563886, 5.134037);
    line.add(7.987220, 3.890492);
    line.add(7.987220, 3.057053);
    line.add(7.563886, 1.806893);
    line.add(6.743675, 0.973454);
    line.add(5.486901, 0.556734);
    line.add(4.230127, 0.556734);
    line.add(2.986582, 0.973454);
    line.add(2.563248, 1.390174);
    line.add(2.153143, 2.223613);
    line.flipY(numberWidth);
    return line;
}

continuesLine six() {
    continuesLine line = new continuesLine(7.309286, 8.127126);
    line.add(6.899180, 8.960566);
    line.add(5.642406, 9.383900);
    line.add(4.822196, 9.383900);
    line.add(3.565422, 8.960566);
    line.add(2.731982, 7.717021);
    line.add(2.308648, 5.626808);
    line.add(2.308648, 3.536594);
    line.add(2.731982, 1.876329);
    line.add(3.565422, 1.042890);
    line.add(4.822196, 0.626170);
    line.add(5.232301, 0.626170);
    line.add(6.489075, 1.042890);
    line.add(7.309286, 1.876329);
    line.add(7.732620, 3.126489);
    line.add(7.732620, 3.536594);
    line.add(7.309286, 4.793368);
    line.add(6.489075, 5.626808);
    line.add(5.232301, 6.050142);
    line.add(4.822196, 6.050142);
    line.add(3.565422, 5.626808);
    line.add(2.731982, 4.793368);
    line.add(2.308648, 3.536594);
    line.flipY(numberWidth);
    return line;
}

continuesLine seven() {
    continuesLine line = new continuesLine(2.083703, 9.314464);
    line.add(7.917780, 9.314464);
    line.add(3.750582, 0.556734); 
    line.flipY(numberWidth);
    return line;
}

continuesLine eight() {
    continuesLine line = new continuesLine(4.253267, 9.337609);
    line.add(3.009722, 8.914275);
    line.add(2.586388, 8.080835);
    line.add(2.586388, 7.247396);
    line.add(3.009722, 6.413956);
    line.add(3.843162, 6.003851);
    line.add(5.510041, 5.580517);
    line.add(6.766815, 5.157182);
    line.add(7.587026, 4.336972);
    line.add(8.010360, 3.490303);
    line.add(8.010360, 2.246758);
    line.add(7.587026, 1.413319);
    line.add(7.176920, 0.996599);
    line.add(5.920146, 0.579879);
    line.add(4.253267, 0.579879);
    line.add(3.009722, 0.996599);
    line.add(2.586388, 1.413319);
    line.add(2.176283, 2.246758);
    line.add(2.176283, 3.490303);
    line.add(2.586388, 4.336972);
    line.add(3.433057, 5.157182);
    line.add(4.676602, 5.580517);
    line.add(6.343481, 6.003851);
    line.add(7.176920, 6.413956);
    line.add(7.587026, 7.247396);
    line.add(7.587026, 8.080835);
    line.add(7.176920, 8.914275);
    line.add(5.920146, 9.337609);
    line.add(4.253267, 9.337609);
    line.flipY(numberWidth);
    return line;
}

continuesLine nine() {
    continuesLine line = new continuesLine(7.749045, 6.460247);
    line.add(7.338939, 5.203473);
    line.add(6.505500, 4.383263);
    line.add(5.261955, 3.959928);
    line.add(4.838621, 3.959928);
    line.add(3.595076, 4.383263);
    line.add(2.748407, 5.203473);
    line.add(2.338302, 6.460247);
    line.add(2.338302, 6.870352);
    line.add(2.748407, 8.127126);
    line.add(3.595076, 8.960566);
    line.add(4.838621, 9.383900);
    line.add(5.261955, 9.383900);
    line.add(6.505500, 8.960566);
    line.add(7.338939, 8.127126);
    line.add(7.749045, 6.460247);
    line.add(7.749045, 4.383263);
    line.add(7.338939, 2.293049);
    line.add(6.505500, 1.042890);
    line.add(5.261955, 0.626170);
    line.add(4.415286, 0.626170);
    line.add(3.171741, 1.042890);
    line.add(2.748407, 1.876329);
    line.flipY(numberWidth);
    return line;
}
