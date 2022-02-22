///////////////////////////////////////////////////////////////////////////////////////////////////////
// No, it's not a fancy dancy class like the snot nosed kids are doing these days.
// Now get the hell off my lawn.

///////////////////////////////////////////////////////////////////////////////////////////////////////
void gcode_header() {
    OUTPUT.println("$H");
    OUTPUT.println("G92X0Y0Z0");
    OUTPUT.println("F2000");
    OUTPUT.println("G21");
    OUTPUT.println("G90");
    OUTPUT.println("M05");
}

///////////////////////////////////////////////////////////////////////////////////////////////////////
void gcode_trailer() {
    OUTPUT.println("M05");
    OUTPUT.println("G1 X0 y0");
}
///////////////////////////////////////////////////////////////////////////////////////////////////////
void pen_up() {
    is_pen_down = false;
}

///////////////////////////////////////////////////////////////////////////////////////////////////////
void pen_down() {
    is_pen_down = true;
}

///////////////////////////////////////////////////////////////////////////////////////////////////////
void move_abs(int pen_number, float x, float y) {
    
    d1.addline(pen_number, is_pen_down, old_x, old_y, x, y);
    if (is_pen_down) {
        d1.render_last();
    }
    
    old_x = x;
    old_y = y;
}

///////////////////////////////////////////////////////////////////////////////////////////////////////
String gcode_format(Float n) {
    String s = nf(n, 0, gcode_decimals);
    s = s.replace('.', gcode_decimal_seperator);
    s = s.replace(',', gcode_decimal_seperator);
    return s; 
}

///////////////////////////////////////////////////////////////////////////////////////////////////////
void create_gcode_files(int line_count) {
    boolean is_pen_down;
    int pen_lifts;
    float pen_movement;
    float pen_drawing;
    int   lines_drawn;
    float x;
    float y;
    float distance;
    
    //Loop over all lines for every pen.
    for (int p = 0; p < pen_count; p++) {    
        is_pen_down = false;
        pen_lifts = 2;
        pen_movement = 0;
        pen_drawing = 0;
        lines_drawn = 0;
        x = 0;
        y = 0;
        String gname = "gcode/gcode_" + basefile_selected + ".nc";
        OUTPUT = createWriter(sketchPath("") + gname);
        gcode_header();
        
        for (int i = 1; i < line_count; i++) { 
            if (d1.lines[i].pen_number == p) {
                
                float gcode_scaled_x1 = d1.lines[i].x1 * gcode_scale + gcode_offset_x;
                float gcode_scaled_y1 = d1.lines[i].y1 * gcode_scale + gcode_offset_y;
                float gcode_scaled_x2 = d1.lines[i].x2 * gcode_scale + gcode_offset_x;
                float gcode_scaled_y2 = d1.lines[i].y2 * gcode_scale + gcode_offset_y;
                
                if (flip_gcode_xy) {
                    float temp = gcode_scaled_x1;
                    gcode_scaled_x1 = gcode_scaled_y1;
                    gcode_scaled_y1 = temp;
                    
                    temp = gcode_scaled_x2;
                    gcode_scaled_x2 = gcode_scaled_y2;
                    gcode_scaled_y2 = temp;
                }
                
                distance = sqrt(sq(abs(gcode_scaled_x1 - gcode_scaled_x2)) + sq(abs(gcode_scaled_y1 - gcode_scaled_y2)));
                
                boolean skip = false;
                if (skip_gcode_negative_values) {
                    if (gcode_scaled_x1 < 0 || gcode_scaled_x2 < 0 || gcode_scaled_y1 < 0 || gcode_scaled_y2 < 0) {
                        skip = true;
                    }
                }
                
                if (!skip) {
                    if (x != gcode_scaled_x1 || y != gcode_scaled_y1) {
                        // Oh crap, where the line starts is not where I am, pick up the pen and move there.
                        OUTPUT.println("M05");
                        is_pen_down = false;
                        distance = sqrt(sq(abs(x - gcode_scaled_x1)) + sq(abs(y - gcode_scaled_y1)));
                        String buf = "G1 X" + gcode_format(gcode_scaled_x1) + " Y" + gcode_format(gcode_scaled_y1);
                        OUTPUT.println(buf);
                        x = gcode_scaled_x1;
                        y = gcode_scaled_y1;
                        pen_movement = pen_movement + distance;
                        pen_lifts++;
                    }
                    
                    if (d1.lines[i].pen_down) {
                        if (is_pen_down == false) {
                            OUTPUT.println("M03S300");
                            is_pen_down = true;
                        }
                        pen_drawing = pen_drawing + distance;
                        lines_drawn++;
                    } else {
                        if (is_pen_down == true) {
                            OUTPUT.println("M05");
                            is_pen_down = false;
                            pen_movement = pen_movement + distance;
                            pen_lifts++;
                        }
                    }
                    
                    String buf = "G1 X" + gcode_format(gcode_scaled_x2) + " Y" + gcode_format(gcode_scaled_y2);
                    OUTPUT.println(buf);
                    x = gcode_scaled_x2;
                    y = gcode_scaled_y2;
                    dx.update_limit(gcode_scaled_x2);
                    dy.update_limit(gcode_scaled_y2);
                }
            }
        }
        
        gcode_trailer();
        OUTPUT.flush();
        OUTPUT.close();
        println("gcode created:  " + gname);
    }
}
