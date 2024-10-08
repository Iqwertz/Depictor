import processing.core.*; 
import processing.data.*; 
import processing.event.*; 
import processing.opengl.*; 

import java.util.HashMap; 
import java.util.ArrayList; 
import java.io.File; 
import java.io.BufferedReader; 
import java.io.PrintWriter; 
import java.io.InputStream; 
import java.io.OutputStream; 
import java.io.IOException; 

public class Drawbot_image_to_gcode_stripped extends PApplet {

PrintWriter output;

//Modified version for Depictor
///////////////////////////////////////////////////////////////////////////////////////////////////////
// My Drawbot, "Death to Sharpie"
// Jpeg to gcode simplified (kinda sorta works version, v3.75 (beta))
//
// Scott Cooper, Dullbits.com, <scottslongemailaddress@gmail.com>
//
// Open creative GPL source commons with some BSD public GNU foundation stuff sprinkled in...
// If anything here is remotely useable, please give me a shout.
//
// Useful math:    http://members.chello.at/~easyfilter/bresenham.html
// GClip:          https://forum.processing.org/two/discussion/6179/why-does-not-it-run-clipboard
// Dynamic class:  https://processing.org/discourse/beta/num_1262759715.html
///////////////////////////////////////////////////////////////////////////////////////////////////////

// Constants 
float global_gcode_scale = 0.25f; //if 0 scale is auto. calculated
boolean flip_gcode_xy = true;
boolean skip_gcode_negative_values = true;
float   paper_top_to_origin = 9;      //mm, make smaller to move drawing down on paper
float   pen_width = 0.65f;               //mm, determines image_scale, reduce, if solid black areas are speckled with white holes. //0.65
int     pen_count = 1;
char    gcode_decimal_seperator = '.';    
int     gcode_decimals = 2;             // Number of digits right of the decimal point in the gcode files.
int     svg_decimals = 2;               // Number of digits right of the decimal point in the SVG file.
float   grid_scale = 10.0f;              // Use 10.0 for centimeters, 25.4 for inches, and between 444 and 529.2 for cubits.

final float scale_factor = 10;
final float   paper_size_x = 16 * scale_factor;
final float   paper_size_y = 20 * scale_factor;
final float   image_size_x = 28 * 15;
final float   image_size_y = 36 * 15;

final String input_image_path = "../input/image.jpg";
final String settings_path = "settings.json";

// Every good program should have a shit pile of badly named globals.
Class cl = null;
pfm ocl;
int current_pfm = 0;
String[] pfms = {"PFM_original", "PFM_spiral", "PFM_squares"}; 

int     state = 1;
int     pen_selected = 0;
int     current_copic_set = 0;
int     display_line_count;
String  display_mode = "drawing";
PImage  img_orginal;               // The original image
PImage  img_reference;             // After pre_processing, croped, scaled, boarder, etc.  This is what we will try to draw. 
PImage  img;                       // Used during drawing for current brightness levels.  Gets damaged during drawing.
float   gcode_offset_x;
float   gcode_offset_y;
float   gcode_scale;
float   screen_scale;
float   screen_scale_org;
int     screen_rotate = 0;
float   old_x = 0;
float   old_y = 0;
int     mx = 0;
int     my = 0;
int     morgx = 0;
int     morgy = 0;
int     pen_color = 0;
boolean is_pen_down;
boolean is_grid_on = false;
String  path_selected = "";
String  file_selected = "";
String  basefile_selected = "";
int     startTime = 0;
boolean ctrl_down = false;

boolean drawToScreen = true;

Limit   dx, dy;
PrintWriter OUTPUT;
PrintWriter JSON;
botDrawing d1;

float[] pen_distribution = new float[pen_count];

///////////////////////////////////////////////////////////////////////////////////////////////////////
public void setup() {
    setSettings();
    
    output = createWriter("log.txt"); 
    
    frame.setLocation(200, 200);
    surface.setResizable(true);
    surface.setTitle("Drawbot_image_to_gcode_v2, version 3.75");
    colorMode(RGB);
    frameRate(999);
    //randomSeed(millis());
    randomSeed(3);
    d1 = new botDrawing();
    dx = new Limit(); 
    dy = new Limit(); 
    loadInClass(pfms[current_pfm]);
    loadImageFromPath();
    background(0);
    //selectInput("Select an image to process:", "fileSelected");
    output.println("start");
    output.flush();
}

///////////////////////////////////////////////////////////////////////////////////////////////////////
public void draw() {
    output.println("draw");
    output.flush();
    drawfunctions();
}

public void setSettings() {
    JSONObject json = loadJSONObject(settings_path);
    
    global_gcode_scale = json.getFloat("global_gcode_scale");
    flip_gcode_xy = json.getBoolean("flip_gcode_xy");
    skip_gcode_negative_values = json.getBoolean("skip_gcode_negative_values");
    paper_top_to_origin =  json.getFloat("paper_top_to_origin");
    pen_width = json.getFloat("pen_width");
    pen_count =    json.getInt("pen_count");
    gcode_decimal_seperator = json.getString("gcode_decimal_seperator").charAt(0);
    gcode_decimals = json.getInt("gcode_decimals");
    svg_decimals = json.getInt("svg_decimals");
    grid_scale = json.getFloat("grid_scale");
    
    String jsonMode = json.getString("selectedMode");
    for(int i=0; i<pfms.length; i++){
      if(jsonMode.equals(pfms[i])){
        current_pfm = i;
        break;
      }
      if(i==pfms.length-1){
        current_pfm = 0;
      }
    }
    println(current_pfm);
    println(jsonMode);
    
}

///////////////////////////////////////////////////////////////////////////////////////////////////////
public void drawfunctions() {
    // background(255,0,0);
    if (state != 3) { background(255, 255, 255); }
    scale(screen_scale);
    translate(mx, my);
    rotate(HALF_PI * screen_rotate);
    
    switch(state) {
        case 1 : 
            //println("State=1, Waiting for filename selection");
            break;
        case 2:
            //println("State=2, Setup squiggles");
            // background(0,255,0);
            output.println("state2");
            output.flush();
            loop();
            setup_squiggles();
            startTime = millis();
            break;
        case 3 : 
            output.println("state3");
            output.flush();
            //println("State=3, Drawing image");
            if (display_line_count <= 1) {
                background(255);
            } 
            ocl.find_path();
            
            display_line_count = d1.line_count;
            break;
        case 4 : 
            output.println("state4");
            output.flush();
            println("State=4, pfm.post_processing");
            ocl.post_processing();
            
            set_even_distribution();
            
            println("elapsed time: " + (millis() - startTime) / 1000.0f + " seconds");
            display_line_count = d1.line_count;
            state++;
            break;
        case 5 : 
            if (drawToScreen) {
                render_all();
            }
            noLoop();
            save("output/preview.png");
            create_gcode_files(display_line_count);
            create_svg_file(display_line_count);
            exit();
            break;
        default:
        println("invalid state: " + state);
        break;
    }
}

///////////////////////////////////////////////////////////////////////////////////////////////////////
public void loadImageFromPath() {
    path_selected = dataPath(input_image_path);
    basefile_selected  = split(split(input_image_path, '/')[1], '.')[0]; //the [1] is wrong (correct way would be to take the last element of the list)
    state++;
}

///////////////////////////////////////////////////////////////////////////////////////////////////////
public void fileSelected(File selection) {
    if (selection == null) {
        println("no image file selected, exiting program.");
        exit();
    } else {
        path_selected = selection.getAbsolutePath();
        file_selected = selection.getName();
        String[] fileparts = split(file_selected, '.');
        basefile_selected = fileparts[0];
        println("user selected: " + path_selected);
        //println("user selected: " + file_selected);
        //println("user selected: " + basefile_selected);
        state++;
    }
}

///////////////////////////////////////////////////////////////////////////////////////////////////////
public void setup_squiggles() {
    float   gcode_scale_x;
    float   gcode_scale_y;
    float   screen_scale_x;
    float   screen_scale_y;
    
    //println("setup_squiggles...");
    
    d1.line_count = 0;
    //randomSeed(millis());
    
    
    img = loadImage(path_selected, "jpeg");  // Load the image into the program  
    image_rotate();
    
    img_orginal = createImage(img.width, img.height, RGB);
    img_orginal.copy(img, 0, 0, img.width, img.height, 0, 0, img.width, img.height);
    
    ocl.pre_processing();
    img.loadPixels();
    img_reference = createImage(img.width, img.height, RGB);
    img_reference.copy(img, 0, 0, img.width, img.height, 0, 0, img.width, img.height);
    
    gcode_scale_x = image_size_x / img.width;
    gcode_scale_y = image_size_y / img.height;
    if (global_gcode_scale!= 0) {
        gcode_scale = global_gcode_scale;
    } else{
        gcode_scale = min(gcode_scale_x, gcode_scale_y);
    }
    gcode_offset_x = 0;//- (img.width * gcode_scale / 2.0);  
    gcode_offset_y = -paper_top_to_origin; // - (paper_size_y - (img.height * gcode_scale)) / 2.0);
    
    screen_scale_x = width / (float)img.width;
    screen_scale_y = height / (float)img.height;
    screen_scale = min(screen_scale_x, screen_scale_y);
    screen_scale_org = screen_scale;
    state++;
}

///////////////////////////////////////////////////////////////////////////////////////////////////////
public void render_all() {
    println("render_all: " + display_mode + ", " + display_line_count + " lines, with pen set " + current_copic_set);
    
    if (display_mode == "drawing") {
        //<d1.render_all();
        d1.render_some(display_line_count);
    }
}

///////////////////////////////////////////////////////////////////////////////////////////////////////
public void keyPressed() {
    if (key == 'p') {
        current_pfm ++;
        if (current_pfm >= pfms.length) { current_pfm = 0; }
        //display_line_count = 0;
        loadInClass(pfms[current_pfm]); 
        state = 2;
    }
    if (key == 'g') { 
        create_gcode_files(display_line_count);
    }
    if (key == '<') {
        int delta = -5000;
        display_line_count = PApplet.parseInt(display_line_count + delta);
        display_line_count = constrain(display_line_count, 0, d1.line_count);
        //println("display_line_count: " + display_line_count);
    }
    if (key == '>') {
        int delta = 5000;
        display_line_count = PApplet.parseInt(display_line_count + delta);
        display_line_count = constrain(display_line_count, 0, d1.line_count);
        //println("display_line_count: " + display_line_count);
    }
    if (key == 'r') { 
        screen_rotate ++;
        if (screen_rotate == 4) { screen_rotate = 0; }
        
        switch(screen_rotate) {
            case 0 : 
                my -= img.height;
                break;
            case 1 : 
                mx += img.height;
                break;
            case 2 : 
                my += img.height;
                break;
            case 3 : 
                mx -= img.height;
                break;
        }
    }
    //surface.setSize(img.width, img.height);
    redraw();
}

///////////////////////////////////////////////////////////////////////////////////////////////////////
public void set_even_distribution() {
    println("set_even_distribution");
    for (int p = 0; p < pen_count; p++) {
        pen_distribution[p] = display_line_count / pen_count;
        //println("pen_distribution[" + p + "] = " + pen_distribution[p]);
    }
}

///////////////////////////////////////////////////////////////////////////////////////////////////////
public void loadInClass(String pfm_name) {
    String className = this.getClass().getName() + "$" + pfm_name;
    try {
        cl = Class.forName(className);
    } catch(ClassNotFoundException e) { 
        println("\nError unknown PFM: " + className); 
    }
    
    ocl = null;
    if (cl != null) {
        try {
            // Getthe constructor(s)
            java.lang.reflect.Constructor[] ctors = cl.getDeclaredConstructors();
            // Create an instance with the parent object as parameter (needed for inner classes)
            ocl = (pfm) ctors[0].newInstance(new Object[] { this });
        } catch(InstantiationException e) {
            println("Cannot create an instance of " + className);
        } catch(IllegalAccessException e) {
            println("Cannot access " + className + ": " + e.getMessage());
        } catch(Exception e) {
            // Lot of stuff can go wrong...
            e.printStackTrace();
        }
    }
    println("\nloaded PFM: " + className); 
}

///////////////////////////////////////////////////////////////////////////////////////////////////////
public void mousePressed() {
    morgx = mouseX - mx; 
    morgy = mouseY - my; 
}

///////////////////////////////////////////////////////////////////////////////////////////////////////
public void mouseDragged() {
    mx = mouseX - morgx; 
    my = mouseY - morgy; 
    redraw();
}

///////////////////////////////////////////////////////////////////////////////////////////////////////
// This is the pfm interface, it contains the only methods the main code can call.
// As well as any variables that all pfm modules must have.
interface pfm {
    //public int x=0;
    public void pre_processing();
    public void find_path();
    public void post_processing();
}

///////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////
// A class to describe all the line segments
class botDrawing {
  private int line_count = 0;
  botLine[] lines = new botLine[10000000];
  
  public void botDrawing() {
  }

  public void render_last () {
    lines[line_count/2].render_with_copic();
  }
  
  public void render_all () {
    for (int i=1; i<line_count; i++) {
      lines[i].render_with_copic();
    }
  }
  
  public void render_some (int line_count) {
    for (int i=1; i<line_count/2; i++) {
      lines[i].render_with_copic();
    }
  }

  public void render_one_pen (int line_count, int pen) {
    int c = color(255, 0, 0);

    for (int i=1; i<line_count; i++) {
    //for (int i=line_count; i>1; i--) {
      if (lines[i].pen_number == pen) {
        lines[i].render_with_copic();
      }
    }
  }
  
  public void set_pen_continuation_flags () {
    float prev_x = 123456.0f;
    float prev_y = 654321.0f;
    boolean prev_pen_down = false;
    int prev_pen_number = 123456;
    
    for (int i=1; i<line_count; i++) { 
 
      if (prev_x != lines[i].x1 || prev_y != lines[i].y1 || prev_pen_down != lines[i].pen_down  || prev_pen_number != lines[i].pen_number) {
        lines[i].pen_continuation = false;
      } else {
        lines[i].pen_continuation = true;
      }

      prev_x = lines[i].x2;
      prev_y = lines[i].y2;
      prev_pen_down = lines[i].pen_down;
      prev_pen_number = lines[i].pen_number;
    }
    println("set_pen_continuation_flags");
  }

  public void addline(int pen_number_, boolean pen_down_, float x1_, float y1_, float x2_, float y2_) {
    line_count++;
    lines[line_count] = new botLine (pen_down_, pen_number_, x1_, y1_, x2_, y2_);
  }
  
  public int get_line_count() {
    return line_count;
  }
  
  public void evenly_distribute_pen_changes (int line_count, int total_pens) {
    println("evenly_distribute_pen_changes");
    for (int i=1; i<=line_count; i++) {
      int cidx = (int)map(i - 1, 0, line_count, 1, total_pens);
      lines[i].pen_number = cidx;
      //println (i + "   " + lines[i].pen_number);
    }
  }

}
///////////////////////////////////////////////////////////////////////////////////////////////////////
// A class to describe one line segment
//
// Because of a bug in processing.org the MULTIPLY blendMode does not take into account the alpha of
// either source or destination.  If this gets corrected, tweaks to the stroke alpha might be more 
// representative of a Copic marker.  Right now it over emphasizes the darkening when overlaps
// of the same pen occur.

class botLine {
  int pen_number;
  boolean pen_down;
  boolean pen_continuation;
  float x1;
  float y1;
  float x2;
  float y2;
  
  botLine(boolean pen_down_, int pen_number_, float x1_, float y1_, float x2_, float y2_) {
    pen_down = pen_down_;
    pen_continuation = false;
    pen_number = pen_number_;
    x1 = x1_;
    y1 = y1_;
    x2 = x2_;
    y2 = y2_;
  }

  public void render_with_copic() {
    if (pen_down && drawToScreen) {
      int c = color(0, 0, 0);
      //stroke(c, 255-brightness(c));
      stroke(c);
      //strokeWeight(2);
      //blendMode(BLEND);
      line(x1, y1, x2, y2);
    }
  }

}

///////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////
class intPoint {
  int x, y;
  
  intPoint(int x_, int y_) {
    x = x_;
    y = y_;
  }
}

///////////////////////////////////////////////////////////////////////////////////////////////////////
// Algorithm was developed by Jack Elton Bresenham in 1962
// http://en.wikipedia.org/wiki/Bresenham's_line_algorithm
// Traslated from pseudocode labled "Simplification" from the link above.
///////////////////////////////////////////////////////////////////////////////////////////////////////
public ArrayList <intPoint> bresenham(int x0, int y0, int x1, int y1) {
  int sx, sy;
  int err;
  int e2;
  ArrayList <intPoint> pnts = new ArrayList <intPoint>();

  int dx = abs(x1-x0);
  int dy = abs(y1-y0);
  if (x0 < x1) { sx = 1; } else { sx = -1; }
  if (y0 < y1) { sy = 1; } else { sy = -1; }
  err = dx-dy;
  while (true) {
    pnts.add(new intPoint(x0, y0));
    if ((x0 == x1) && (y0 == y1)) {
      return pnts;
    }
    e2 = 2*err;
    if (e2 > -dy) {
      err = err - dy;
      x0 = x0 + sx;
    }
    if (e2 < dx) {
      err = err + dx;
      y0 = y0 + sy;
    }
  }
}

///////////////////////////////////////////////////////////////////////////////////////////////////////
  public void bresenham_lighten(int x0, int y0, int x1, int y1, int adjustbrightness) {
    ArrayList <intPoint> pnts;
  
    pnts = bresenham(x0, y0, x1, y1);
    for (intPoint p : pnts) {
      lighten_one_pixel(adjustbrightness * 5, p.x, p.y);
    }
  }

///////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////
// No, it's not a fancy dancy class like the snot nosed kids are doing these days.
// Now get the hell off my lawn.

///////////////////////////////////////////////////////////////////////////////////////////////////////
public void gcode_header() {
   // OUTPUT.println("$H");
   // OUTPUT.println("G92X0Y0Z0");
   // OUTPUT.println("F2000");
   // OUTPUT.println("G21");
   // OUTPUT.println("G90");
   // OUTPUT.println("M05");
}

///////////////////////////////////////////////////////////////////////////////////////////////////////
public void gcode_trailer() {
  //  OUTPUT.println("M05");
  //  OUTPUT.println("G1 X0 y0");
}
///////////////////////////////////////////////////////////////////////////////////////////////////////
public void pen_up() {
    is_pen_down = false;
}

///////////////////////////////////////////////////////////////////////////////////////////////////////
public void pen_down() {
    is_pen_down = true;
}

///////////////////////////////////////////////////////////////////////////////////////////////////////
public void move_abs(int pen_number, float x, float y) {
    
    d1.addline(pen_number, is_pen_down, old_x, old_y, x, y);
    if (is_pen_down) {
        d1.render_last();
    }
    
    old_x = x;
    old_y = y;
}

///////////////////////////////////////////////////////////////////////////////////////////////////////
public String gcode_format(Float n) {
    String s = nf(n, 0, gcode_decimals);
    s = s.replace('.', gcode_decimal_seperator);
    s = s.replace(',', gcode_decimal_seperator);
    return s; 
}

///////////////////////////////////////////////////////////////////////////////////////////////////////
public void create_gcode_files(int line_count) {
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
        String gname = "output/gcode.nc";
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

///////////////////////////////////////////////////////////////////////////////////////////////////////
// Thanks to Vladimir Bochkov for helping me debug the SVG international decimal separators problem.
public String svg_format (Float n) {
  final char regional_decimal_separator = ',';
  final char svg_decimal_seperator = '.';
  
  String s = nf(n, 0, svg_decimals);
  s = s.replace(regional_decimal_separator, svg_decimal_seperator);
  return s;
}

///////////////////////////////////////////////////////////////////////////////////////////////////////
// Thanks to John Cliff for getting the SVG output moving forward.
public void create_svg_file (int line_count) {
  boolean drawing_polyline = false;
  
  // Inkscape versions before 0.91 used 90dpi, Today most software assumes 96dpi.
  float svgdpi = 96.0f / 25.4f;
  
  String gname = "output/image.svg";
  OUTPUT = createWriter(sketchPath("") + gname);
  OUTPUT.println("<?xml version=\"1.0\" encoding=\"UTF-8\" ?>");
  OUTPUT.println("<svg width=\"" + svg_format(img.width * gcode_scale) + "mm\" height=\"" + svg_format(img.height * gcode_scale) + "mm\" xmlns=\"http://www.w3.org/2000/svg\" version=\"1.1\">");
  d1.set_pen_continuation_flags();
  
  // Loop over pens backwards to display dark lines last.
  // Then loop over all displayed lines.
  for (int p=pen_count-1; p>=0; p--) {    
    OUTPUT.println("<g id=\"0\">");
    for (int i=1; i<line_count; i++) { 
      if (d1.lines[i].pen_number == p) {

        // Do we add gcode_offsets needed by my bot, or zero based?
        //float gcode_scaled_x1 = d1.lines[i].x1 * gcode_scale * svgdpi + gcode_offset_x;
        //float gcode_scaled_y1 = d1.lines[i].y1 * gcode_scale * svgdpi + gcode_offset_y;
        //float gcode_scaled_x2 = d1.lines[i].x2 * gcode_scale * svgdpi + gcode_offset_x;
        //float gcode_scaled_y2 = d1.lines[i].y2 * gcode_scale * svgdpi + gcode_offset_y;
        
        float gcode_scaled_x1 = d1.lines[i].x1 * gcode_scale * svgdpi;
        float gcode_scaled_y1 = d1.lines[i].y1 * gcode_scale * svgdpi;
        float gcode_scaled_x2 = d1.lines[i].x2 * gcode_scale * svgdpi;
        float gcode_scaled_y2 = d1.lines[i].y2 * gcode_scale * svgdpi;

        if (d1.lines[i].pen_continuation == false && drawing_polyline) {
          OUTPUT.println("\" />");
          drawing_polyline = false;
        }

        if (d1.lines[i].pen_down) {
          if (d1.lines[i].pen_continuation) {
            String buf = svg_format(gcode_scaled_x2) + "," + svg_format(gcode_scaled_y2);
            OUTPUT.println(buf);
            drawing_polyline = true;
          } else {
            OUTPUT.println("<polyline fill=\"none\" stroke=\"#000000\" stroke-width=\"1.0\" stroke-opacity=\"1\" points=\"");
            String buf = svg_format(gcode_scaled_x1) + "," + svg_format(gcode_scaled_y1);
            OUTPUT.println(buf);
            drawing_polyline = true;
          }
        }
      }
    }
    if (drawing_polyline) {
      OUTPUT.println("\" />");
      drawing_polyline = false;
    }
    OUTPUT.println("</g>");
  }
  OUTPUT.println("</svg>");
  OUTPUT.flush();
  OUTPUT.close();
  println("SVG created:  " + gname);
}

///////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////
public void image_threshold() {
  img.filter(THRESHOLD);
}
  
///////////////////////////////////////////////////////////////////////////////////////////////////////
public void image_desaturate() {
  img.filter(GRAY);
}
  
///////////////////////////////////////////////////////////////////////////////////////////////////////
public void image_invert() {
  img.filter(INVERT);
}

///////////////////////////////////////////////////////////////////////////////////////////////////////
public void image_posterize(int amount) {
  img.filter(POSTERIZE, amount);
}
  
///////////////////////////////////////////////////////////////////////////////////////////////////////
public void image_blur(int amount) {
  img.filter(BLUR, amount);
}
 
///////////////////////////////////////////////////////////////////////////////////////////////////////
public void image_erode() {
  img.filter(ERODE);
}
  
///////////////////////////////////////////////////////////////////////////////////////////////////////
public void image_dilate() {
  img.filter(DILATE);
}

///////////////////////////////////////////////////////////////////////////////////////////////////////
public void image_rotate() {
  //image[y][x]                                     // assuming this is the original orientation
  //image[x][original_width - y]                    // rotated 90 degrees ccw
  //image[original_height - x][y]                   // 90 degrees cw
  //image[original_height - y][original_width - x]  // 180 degrees

  if (img.width > img.height) {
    PImage img2 = createImage(img.height, img.width, RGB);
    img.loadPixels();
    for (int x=1; x<img.width; x++) {
      for (int y=1; y<img.height; y++) {
        int loc1 = x + y*img.width;
        int loc2 = y + (img.width - x) * img2.width;
        img2.pixels[loc2] = img.pixels[loc1];
      }
    }
    img = img2;
    updatePixels();
  }
}

///////////////////////////////////////////////////////////////////////////////////////////////////////
public void lighten_one_pixel(int adjustbrightness, int x, int y) {
  int loc = (y)*img.width + x;
  float r = brightness (img.pixels[loc]);
  //r += adjustbrightness;
  r += adjustbrightness + random(0, 0.01f);
  r = constrain(r,0,255);
  int c = color(r);
  img.pixels[loc] = c;
}

///////////////////////////////////////////////////////////////////////////////////////////////////////
public void image_scale(int new_width) {
  if (img.width != new_width) {
    img.resize(new_width, 0);
  }
}

///////////////////////////////////////////////////////////////////////////////////////////////////////
public float avg_imgage_brightness() {
  float b = 0.0f;

  for (int p=0; p < img.width * img.height; p++) {
    b += brightness(img.pixels[p]);
  }
  
  return(b / (img.width * img.height));
}
  
///////////////////////////////////////////////////////////////////////////////////////////////////////
public void image_crop() {
  // This will center crop to the desired image size image_size_x and image_size_y
  
  PImage img2;
  float desired_ratio = image_size_x / image_size_y;
  float current_ratio = (float)img.width / (float)img.height;
  
  if (current_ratio < desired_ratio) {
    int desired_x = img.width;
    int desired_y = PApplet.parseInt(img.width / desired_ratio);
    int half_y = (img.height - desired_y) / 2;
    img2 = createImage(desired_x, desired_y, RGB);
    img2.copy(img, 0, half_y, desired_x, desired_y, 0, 0, desired_x, desired_y);
  } else {
    int desired_x = PApplet.parseInt(img.height * desired_ratio);
    int desired_y = img.height;
    int half_x = (img.width - desired_x) / 2;
    img2 = createImage(desired_x, desired_y, RGB);
    img2.copy(img, half_x, 0, desired_x, desired_y, 0, 0, desired_x, desired_y);
  }

  img = img2;
}

///////////////////////////////////////////////////////////////////////////////////////////////////////
public void image_boarder(String fname, int shrink, int blur) {
  // A quick and dirty way of softening the edges of your drawing.
  // Look in the boarders directory for some examples.
  // Ideally, the boarder will have similar dimensions as the image to be drawn.
  // For far more control, just edit your input image directly.
  // Most of the examples are pretty heavy handed so you can "shrink" them a few pixels as desired.
  // It does not matter if you use a transparant background or just white.  JPEG or PNG, it's all good.
  //
  // fname:   Name of boarder file.
  // shrink:  Number of pixels to pull the boarder away, 0 for no change. 
  // blur:    Guassian blur the boarder, 0 for no blur, 10+ for a lot.
  
  //PImage boarder = createImage(img.width+(shrink*2), img.height+(shrink*2), RGB);
  PImage temp_boarder = loadImage("boarder/" + fname);
  temp_boarder.resize(img.width, img.height);
  temp_boarder.filter(GRAY);
  temp_boarder.filter(INVERT);
  temp_boarder.filter(BLUR, blur);
  
  //boarder.copy(temp_boarder, 0, 0, temp_boarder.width, temp_boarder.height, 0, 0, boarder.width, boarder.height);
  img.blend(temp_boarder, shrink, shrink, img.width, img.height,  0, 0, img.width, img.height, ADD); 
}

///////////////////////////////////////////////////////////////////////////////////////////////////////
public void image_unsharpen(PImage img, int amount) {
  // Source:  https://www.taylorpetrick.com/blog/post/convolution-part3
  // Subtle unsharp matrix
  float[][] matrix = { { -0.00391f, -0.01563f, -0.02344f, -0.01563f, -0.00391f },
                       { -0.01563f, -0.06250f, -0.09375f, -0.06250f, -0.01563f },
                       { -0.02344f, -0.09375f,  1.85980f, -0.09375f, -0.02344f },
                       { -0.01563f, -0.06250f, -0.09375f, -0.06250f, -0.01563f },
                       { -0.00391f, -0.01563f, -0.02344f, -0.01563f, -0.00391f } };
  
  
  //print_matrix(matrix);
  matrix = scale_matrix(matrix, amount);
  //print_matrix(matrix);
  matrix = normalize_matrix(matrix);
  //print_matrix(matrix);

  image_convolution(img, matrix, 1.0f, 0.0f);
}

///////////////////////////////////////////////////////////////////////////////////////////////////////
public void image_blurr(PImage img) {
  // Basic blur matrix

  float[][] matrix = { { 1, 1, 1 },
                       { 1, 1, 1 },
                       { 1, 1, 1 } }; 
  
  matrix = normalize_matrix(matrix);
  image_convolution(img, matrix, 1, 0);
}

///////////////////////////////////////////////////////////////////////////////////////////////////////
public void image_sharpen(PImage img) {
  // Simple sharpen matrix

  float[][] matrix = { {  0, -1,  0 },
                       { -1,  5, -1 },
                       {  0, -1,  0 } }; 
  
  //print_matrix(matrix);
  image_convolution(img, matrix, 1, 0);
}

///////////////////////////////////////////////////////////////////////////////////////////////////////
public void image_emboss(PImage img) {
  float[][] matrix = { { -2, -1,  0 },
                       { -1,  1,  1 },
                       {  0,  1,  2 } }; 
                       
  image_convolution(img, matrix, 1, 0);
}

///////////////////////////////////////////////////////////////////////////////////////////////////////
public void image_edge_detect(PImage img) {
  // Edge detect
  float[][] matrix = { {  0,  1,  0 },
                       {  1, -4,  1 },
                       {  0,  1,  0 } }; 
                       
  image_convolution(img, matrix, 1, 0);
}

///////////////////////////////////////////////////////////////////////////////////////////////////////
public void image_motion_blur(PImage img) {
  // Motion Blur
  // http://lodev.org/cgtutor/filtering.html
                       
  float[][] matrix = { {  1, 0, 0, 0, 0, 0, 0, 0, 0 },
                       {  0, 1, 0, 0, 0, 0, 0, 0, 0 },
                       {  0, 0, 1, 0, 0, 0, 0, 0, 0 },
                       {  0, 0, 0, 1, 0, 0, 0, 0, 0 },
                       {  0, 0, 0, 0, 1, 0, 0, 0, 0 },
                       {  0, 0, 0, 0, 0, 1, 0, 0, 0 },
                       {  0, 0, 0, 0, 0, 0, 1, 0, 0 },
                       {  0, 0, 0, 0, 0, 0, 0, 1, 0 },
                       {  0, 0, 0, 0, 0, 0, 0, 0, 1 } };

  matrix = normalize_matrix(matrix);
  image_convolution(img, matrix, 1, 0);
}

///////////////////////////////////////////////////////////////////////////////////////////////////////
public void image_outline(PImage img) {
  // Outline (5x5)
  // https://www.jmicrovision.com/help/v125/tools/classicfilterop.htm

  float[][] matrix = { { 1,  1,   1,  1,  1 },
                       { 1,  0,   0,  0,  1 },
                       { 1,  0, -16,  0,  1 },
                       { 1,  0,   0,  0,  1 },
                       { 1,  1,   1,  1,  1 } };
                       
  //matrix = normalize_matrix(matrix);
  image_convolution(img, matrix, 1, 0);
}

///////////////////////////////////////////////////////////////////////////////////////////////////////
public void image_sobel(PImage img, float factor, float bias) {

  // Looks like some kind of inverting edge detection
  //float[][] matrix = { { -1, -1, -1 },
  //                     { -1,  8, -1 },
  //                     { -1, -1, -1 } }; 
                       
  //float[][] matrix = { {  1,  2,   0,  -2,  -1 },
  //                     {  4,  8,   0,  -8,  -4 },
  //                     {  6, 12,   0, -12,  -6 },
  //                     {  4,  8,   0,  -8,  -4 },
  //                     {  1,  2,   0,  -2,  -1 } };
  
  // Sobel 3x3 X
  float[][] matrixX = { { -1,  0,  1 },
                        { -2,  0,  2 },
                        { -1,  0,  1 } }; 

  // Sobel 3x3 Y
  float[][] matrixY = { { -1, -2, -1 },
                        {  0,  0,  0 },
                        {  1,  2,  1 } }; 
  
  image_convolution(img, matrixX, factor, bias);
  image_convolution(img, matrixY, factor, bias);
}

///////////////////////////////////////////////////////////////////////////////////////////////////////
public void image_convolution(PImage img, float[][] matrix, float factor, float bias) {
  // What about edge pixels?  Ignoring (maxrixsize-1)/2 pixels on the edges?
  
  int n = matrix.length;      // matrix rows
  int m = matrix[0].length;   // matrix columns
  
  //print_matrix(matrix);
  
  PImage simg = createImage(img.width, img.height, RGB);
  simg.copy(img, 0, 0, img.width, img.height, 0, 0, simg.width, simg.height);
  int matrixsize = matrix.length;


  for (int x = 0; x < simg.width; x++) {
    for (int y = 0; y < simg.height; y++ ) {
      int c = convolution(x, y, matrix, matrixsize, simg, factor, bias);
      int loc = x + y*simg.width;
      img.pixels[loc] = c;
    }
  }
  updatePixels();
}


///////////////////////////////////////////////////////////////////////////////////////////////////////
// Source:  https://py.processing.org/tutorials/pixels/
// By: Daniel Shiffman
// Factor & bias added by SCC

public int convolution(int x, int y, float[][] matrix, int matrixsize, PImage img, float factor, float bias) {
  float rtotal = 0.0f;
  float gtotal = 0.0f;
  float btotal = 0.0f;
  int offset = matrixsize / 2;

  // Loop through convolution matrix
  for (int i = 0; i < matrixsize; i++) {
    for (int j= 0; j < matrixsize; j++) {
      // What pixel are we testing
      int xloc = x+i-offset;
      int yloc = y+j-offset;
      int loc = xloc + img.width*yloc;
      // Make sure we have not walked off the edge of the pixel array
      loc = constrain(loc,0,img.pixels.length-1);
      // Calculate the convolution
      // We sum all the neighboring pixels multiplied by the values in the convolution matrix.
      rtotal += (red(img.pixels[loc]) * matrix[i][j]);
      gtotal += (green(img.pixels[loc]) * matrix[i][j]);
      btotal += (blue(img.pixels[loc]) * matrix[i][j]);
    }
  }
  
  // Added factor and bias
  rtotal = (rtotal * factor) + bias;
  gtotal = (gtotal * factor) + bias;
  btotal = (btotal * factor) + bias;
  
  // Make sure RGB is within range
  rtotal = constrain(rtotal,0,255);
  gtotal = constrain(gtotal,0,255);
  btotal = constrain(btotal,0,255);
  // Return the resulting color
  return color(rtotal,gtotal,btotal);
}

///////////////////////////////////////////////////////////////////////////////////////////////////////
public float [][] multiply_matrix (float[][] matrixA, float[][] matrixB) {
  // Source:  https://en.wikipedia.org/wiki/Matrix_multiplication_algorithm
  // Test:    http://www.calcul.com/show/calculator/matrix-multiplication_;2;3;3;5
  
  int n = matrixA.length;      // matrixA rows
  int m = matrixA[0].length;   // matrixA columns
  int p = matrixB[0].length;

  float[][] matrixC;
  matrixC = new float[n][p]; 

  for (int i=0; i<n; i++) {
    for (int j=0; j<p; j++) {
      for (int k=0; k<m; k++) {
        matrixC[i][j] = matrixC[i][j] + matrixA[i][k] * matrixB[k][j];
      }
    }
  }

  //print_matrix(matrix);
  return matrixC;
}

///////////////////////////////////////////////////////////////////////////////////////////////////////
public float [][] normalize_matrix (float[][] matrix) {
  // Source:  https://www.taylorpetrick.com/blog/post/convolution-part2
  // The resulting matrix is the same size as the original, but the output range will be constrained 
  // between 0.0 and 1.0.  Useful for keeping brightness the same.
  // Do not use on a maxtix that sums to zero, such as sobel.
  
  int n = matrix.length;      // rows
  int m = matrix[0].length;   // columns
  float sum = 0;
  
  for (int i=0; i<n; i++) {
    for (int j=0; j<m; j++) {
      sum += matrix[i][j];
    }
  }
  
  for (int i=0; i<n; i++) {
    for (int j=0; j<m; j++) {
      matrix[i][j] = matrix[i][j] / abs(sum);
    }
  }
  
  return matrix;
}

///////////////////////////////////////////////////////////////////////////////////////////////////////
public float [][] scale_matrix(float[][] matrix, int scale) {
  int n = matrix.length;      // rows
  int p = matrix[0].length;   // columns
  float sum = 0;
                         
  float [][] nmatrix = new float[n*scale][p*scale];
  
  for (int i=0; i<n; i++){
    for (int j=0; j<p; j++){
      for (int si=0; si<scale; si++){
        for (int sj=0; sj<scale; sj++){
          //println(si, sj);
          int a1 = (i*scale)+si;
          int a2 = (j*scale)+sj;
          float a3 = matrix[i][j];
          //println( a1 + ", " + a2 + " = " + a3 );
          //nmatrix[(i*scale)+si][(j*scale)+sj] = matrix[i][j];
          nmatrix[a1][a2] = a3;
        }
      }
    }
    //println();
  }
  //println("scale_matrix: " + scale);
  return nmatrix;
}

///////////////////////////////////////////////////////////////////////////////////////////////////////
public void print_matrix(float[][] matrix) {
  int n = matrix.length;      // rows
  int p = matrix[0].length;   // columns
  float sum = 0;

  for (int i=0; i<n; i++){
    for (int j=0; j<p; j++){
      sum += matrix[i][j];
      System.out.printf("%10.5f ", matrix[i][j]);
    }
    println();
  }
  println("Sum: ", sum);
}

///////////////////////////////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////////////////////////////
// A class to check the upper and lower limits of a value
class Limit {
  float min = 2147483647;
  float max = -2147483648;
  
  Limit() { }
  
  public void update_limit(float value_) {
    if (value_ < min) { min = value_; }
    if (value_ > max) { max = value_; }
  }
}

///////////////////////////////////////////////////////////////////////////////////////////////////////
// Experimental, mark coordinates of mouse locations to console.
// Useful for locating vanishing points etc.
// Currently works correctly with screen_scale, translation and rotation.
public void mouse_point() {
  
  print("Mouse point: ");
  switch(screen_rotate) {
    case 0: 
      println(  (mouseX/screen_scale - mx) + ", " +  (mouseY/screen_scale - my) );
      break;
    case 1: 
      println(  (mouseY/screen_scale - my) + ", " + -(mouseX/screen_scale - mx) );
      break;
    case 2: 
      println( -(mouseX/screen_scale - mx) + ", " + -(mouseY/screen_scale - my) );
      break;
    case 3: 
      println( -(mouseY/screen_scale - my) + ", " +  (mouseX/screen_scale - mx) );
      break;
   }
}
  
///////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////
// This path finding module is the basis for nearly all my drawings.
// Find the darkest average line away from my current location and move there.
///////////////////////////////////////////////////////////////////////////////////////////////////////

class PFM_original implements pfm {
    
    boolean addBoarder = true;
    int    squiggle_length = 5000;      // How often to lift the pen
    int    adjustbrightness = 10;       // How fast it moves from dark to light, over-draw
    float  desired_brightness = 250;   // How long to process.  You can always stop early with "s" key
    int    squiggles_till_first_change = 190;
    
    int          tests = 13;                 // Reasonable values:  13 for development, 720 for final
    int          line_length = PApplet.parseInt(random(3, 40));  // Reasonable values:  3 through 100
    
    int          squiggle_count;
    int          darkest_x;
    int          darkest_y;
    float        darkest_value;
    float        darkest_neighbor = 256;
    
    /////////////////////////////////////////////////////////////////////////////////////////////////////
    public void pre_processing() {
        setSettings();
        
        image_crop();
        image_scale(PApplet.parseInt(image_size_x / pen_width));
        //image_sharpen(img);
        //image_blurr(img);
        //image_unsharpen(img, 5);
        image_unsharpen(img, 4);
        image_unsharpen(img, 3);
        //image_unsharpen(img, 2);
        //image_unsharpen(img, 1);
        //image_motion_blur(img);
        //image_outline(img);
        //image_edge_detect(img);
        //image_sobel(img, 1.0, 0);
        //image_posterize(6);
        //image_erode();
        //image_dilate();
        //image_invert();
        //image_blur(2);
        if(addBoarder){
           image_boarder("b1.png", 0, 0);
           image_boarder("b11.png", 0, 0);
        }
        image_desaturate();
    }
    
    /////////////////////////////////////////////////////////////////////////////////////////////////////
    public void find_path() {
        find_squiggle();
        if (avg_imgage_brightness() > desired_brightness) {
            state++;
        }
    }
    
    /////////////////////////////////////////////////////////////////////////////////////////////////////
    private void find_squiggle() {
        int x, y;
        
        //find_darkest();
        find_darkest_area();
        x = darkest_x;
        y = darkest_y;
        squiggle_count++;
        pen_color = 0;
        
        find_darkest_neighbor(x, y);
        move_abs(0, darkest_x, darkest_y);
        pen_down();
        
        for (int s = 0; s < squiggle_length; s++) {
            find_darkest_neighbor(x, y);
            bresenham_lighten(x, y, darkest_x, darkest_y, adjustbrightness);
            move_abs(0, darkest_x, darkest_y);
            x = darkest_x;
            y = darkest_y;
        }
        pen_up();
    }
    
    /////////////////////////////////////////////////////////////////////////////////////////////////////
    private void find_darkest() {
        darkest_value = 257; //257
        int darkest_loc = 0;
        
        for (int loc = 0; loc < img.width * img.height; loc++) {
            float r = brightness(img.pixels[loc]);
            if (r < darkest_value) {
                darkest_value = r + random(1);
                darkest_loc = loc;
            }
        }
        darkest_x = darkest_loc % img.width;
        darkest_y = (darkest_loc - darkest_x) / img.width;
    }
    
    /////////////////////////////////////////////////////////////////////////////////////////////////////
    private void find_darkest_area() {
        // Warning, Experimental: 
        // Finds the darkest square area by down sampling the img into a much smaller area then finding 
        // the darkest pixel within that.  It returns a random pixel within that darkest area.
        
        int area_size = 10;
        darkest_value = 999;
        int darkest_loc = 1;
        
        PImage img2;
        img2 = createImage(img.width / area_size, img.height / area_size, RGB);
        img2.copy(img, 0, 0, img.width, img.height, 0, 0, img2.width, img2.height);
        
        for (int loc = 0; loc < img2.width * img2.height; loc++) {
            float r = brightness(img2.pixels[loc]);
            
            if (r < darkest_value) {
                darkest_value = r + random(1);
                darkest_loc = loc;
            }
        }
        darkest_x = darkest_loc % img2.width;
        darkest_y = (darkest_loc - darkest_x) / img2.width;
        darkest_x = darkest_x * area_size + PApplet.parseInt(random(area_size));
        darkest_y = darkest_y * area_size + PApplet.parseInt(random(area_size));
    }
    
    /////////////////////////////////////////////////////////////////////////////////////////////////////
    private void find_darkest_neighbor(int start_x, int start_y) {
        darkest_neighbor = 257;
        float delta_angle;
        float start_angle;
        
        //start_angle = random(-35, -15) + cos(radians(start_x/4+(start_y/6)))*30;
        //start_angle = random(-95, -75) + cos(radians(start_y/15))*90;
        //start_angle = 36 +degrees( ( sin(radians(start_x/9+46)) + cos(radians(start_y/26+26)) ));
        //start_angle = 34 +degrees( ( sin(radians(start_x/9+46)) + cos(radians(start_y/-7+26)) ));
        //if(squiggle_count <220) { tests = 20; } else { tests = 2; }
        //start_angle = random(20, 1);       // Cuba 1
        start_angle = random( -72, -52);    // Spitfire
        //start_angle = random(-120, -140);  // skier
        //start_angle = random(-360, -1);    // gradiant magic
        //start_angle = squiggle_count % 360;
        //start_angle += squiggle_count/4;
        //start_angle = -45;
        //start_angle = (squiggle_count * 37) % 360;
        
        //delta_angle = 180 + 10 / (float)tests;
        //delta_angle = 360.0 / (float)tests;
        
        if (squiggle_count < squiggles_till_first_change) { 
            //line_length = int(random(3, 60));
            delta_angle = 360.0f / (float)tests;
        } else {
            //start_angle = degrees(atan2(img.height/2.0 - start_y -470, img.width/2.0 - start_x+130) )-10+90;    // wierd spiral
            //start_angle = degrees(atan2(img.height/2.0 - start_y +145, img.width/2.0 - start_x+45) )-10+90;    //cuba car
            //start_angle = degrees(atan2(img.height/2.0 - start_y +210, img.width/2.0 - start_x-100) )-10;    // italy
            delta_angle = 180 + 7 / (float)tests;
        }
        
        for (int d = 0; d < tests; d++) {
            float b = bresenham_avg_brightness(start_x, start_y, line_length,(delta_angle * d) + start_angle);
        }
    }
    
    ///////////////////////////////////////////////////////////////////////////////////////////////////////
    public float bresenham_avg_brightness(int x0, int y0, float distance, float degree) {
        int x1, y1;
        int sum_brightness = 0;
        int count_brightness = 0;
        ArrayList <intPoint> pnts;
        
        x1 = PApplet.parseInt(cos(radians(degree)) * distance) + x0;
        y1 = PApplet.parseInt(sin(radians(degree)) * distance) + y0;
        x0 = constrain(x0, 0, img.width - 1);
        y0 = constrain(y0, 0, img.height - 1);
        x1 = constrain(x1, 0, img.width - 1);
        y1 = constrain(y1, 0, img.height - 1);
        
        pnts = bresenham(x0, y0, x1, y1);
        for (intPoint p : pnts) {
            int loc = p.x + p.y * img.width;
            sum_brightness += brightness(img.pixels[loc]);
            count_brightness++;
            if (sum_brightness / count_brightness < darkest_neighbor) {
                darkest_x = p.x;
                darkest_y = p.y;
                darkest_neighbor = (float)sum_brightness / (float)count_brightness;
            }
            //println(x0+","+y0+"  "+p.x+","+p.y+"  brightness:"+sum_brightness / count_brightness+"  darkest:"+darkest_neighbor+"  "+darkest_x+","+darkest_y); 
        }
        // println();
        return(sum_brightness / count_brightness);
    }
    
    /////////////////////////////////////////////////////////////////////////////////////////////////////
    public void post_processing() {
    }
    
    private void setSettings() {
        JSONObject json = loadJSONObject(settings_path).getJSONObject("PFM_original");
        
        addBoarder = json.getBoolean("addBoarder");
        squiggle_length = json.getInt("squiggle_length");
        adjustbrightness = json.getInt("adjustbrightness");
        desired_brightness = json.getFloat("desired_brightness");
        squiggles_till_first_change = json.getInt("squiggles_till_first_change");
        
        tests = json.getInt("tests");                 
        line_length = PApplet.parseInt(random(json.getInt("line_length_min"), json.getInt("line_length_max")));
    }
}
///////////////////////////////////////////////////////////////////////////////////////////////////////
// Path finding module:  https://github.com/krummrey/SpiralFromImage
//
// Issues:
//    Transparencys currently do not work as a mask colour
///////////////////////////////////////////////////////////////////////////////////////////////////////

class PFM_spiral implements pfm {

  float settingsRingDistance = 7;
  float settingsARadius = 1;
  float settingsBRadius = 1;
  float settingsDensity = 75;
  float settingsAmpScale = 4.5f;
  int settingsMask = color (240, 240, 240);

  /////////////////////////////////////////////////////////////////////////////////////////////////////
  public void pre_processing() {
    setSettings();
    
    image_crop();
    image_scale(1000);
    image_unsharpen(img, 3);
    image_boarder("b6.png", 0, 0);
    image_desaturate();
  }

  /////////////////////////////////////////////////////////////////////////////////////////////////////
  public void find_path() {
    int c = 0;                               // Sampled color
    float b;                                   // Sampled brightness
    float dist = settingsRingDistance;         // Distance between rings
    float radius = dist/2;                     // Current radius
    float aradius = settingsARadius;           // Radius with brighness applied up
    float bradius = settingsBRadius;           // Radius with brighness applied down
    float alpha;                               // Initial rotation
    float density = settingsDensity;           // Density
    float ampScale = settingsAmpScale;         // Controls the amplitude
    float x, y, xa, ya, xb, yb;                // Current X and Y + jittered X and Y 
    float k;                                   // Current radius
    float endRadius;                           // Largest value the spiral needs to cover the image
    int mask = settingsMask;                 // This color will not be drawn (WHITE)

    k = density/radius;
    alpha = k;
    radius += dist/(360/k);

    // When have we reached the far corner of the image?
    // TODO: this will have to change if not centered
    endRadius = sqrt(pow((img.width/2), 2)+pow((img.height/2), 2));

    // Calculates the first point.  Currently just the center.
    // TODO: Allow for ajustable center
    pen_up();
    x =  radius*cos(radians(alpha))+img.width/2;
    y = -radius*sin(radians(alpha))+img.height/2;
    move_abs(0, x, y);
    xa = 0;
    xb = 0;
    ya = 0;
    yb = 0;

    // Have we reached the far corner of the image?
    while (radius < endRadius) {
      k = (density/2)/radius;
      alpha += k;
      radius += dist/(360/k);
      x =  radius*cos(radians(alpha))+img.width/2;
      y = -radius*sin(radians(alpha))+img.height/2;

      // Are we within the the image?
      // If so check if the shape is open. If not, open it
      if ((x>=0) && (x<img.width) && (y>0) && (y<img.height)) {

        // Get the color and brightness of the sampled pixel
        c = img.get (PApplet.parseInt(x), PApplet.parseInt(y));
        b = brightness(c);
        b = map (b, 0, 255, dist*ampScale, 0);

        // Move up according to sampled brightness
        aradius = radius+(b/dist);
        xa =  aradius*cos(radians(alpha))+img.width/2;
        ya = -aradius*sin(radians(alpha))+img.height/2;

        // Move down according to sampled brightness
        k = (density/2)/radius;
        alpha += k;
        radius += dist/(360/k);
        bradius = radius-(b/dist);
        xb =  bradius*cos(radians(alpha))+img.width/2;
        yb = -bradius*sin(radians(alpha))+img.height/2;

        // If the sampled color is the mask color do not write to the shape
        if (brightness(mask) <= brightness(c)) {
          pen_up();
        } else {
          pen_down();
        }
      } else {
        // We are outside of the image
        pen_up();
      }

      int pen_number = PApplet.parseInt(map(brightness(c), 0, 255, 0, pen_count-1)+0.5f);
      move_abs(pen_number, xa, ya);
      move_abs(pen_number, xb, yb);
    }

    pen_up();
    state++;
  }


  /////////////////////////////////////////////////////////////////////////////////////////////////////
  public void post_processing() {
  }

  /////////////////////////////////////////////////////////////////////////////////////////////////////
  public void output_parameters() {
    //gcode_comment("dist: " + dist);
    //gcode_comment("ampScale: " + ampScale);
  }

  private void setSettings() {
    JSONObject json = loadJSONObject(settings_path).getJSONObject("PFM_spiral");
    
    settingsRingDistance = json.getFloat("ringDistance");
    settingsARadius = json.getFloat("aRadius");
    settingsBRadius = json.getFloat("bRadius");
    settingsDensity = json.getFloat("density");
    settingsAmpScale = json.getFloat("amplitudeScale");
    
    int r,g,b = 240;
    JSONObject maskColor = json.getJSONObject("maskColor");
    r = maskColor.getInt("R");
    g = maskColor.getInt("G");
    b = maskColor.getInt("B");
    
    settingsMask = color (r, g, b);
  }
}
///////////////////////////////////////////////////////////////////////////////////////////////////////
// This path finding module makes some wavy squares
///////////////////////////////////////////////////////////////////////////////////////////////////////

class PFM_squares implements pfm {
    
  boolean addBoarder = true;
    int    squiggle_length = 1000;      // How often to lift the pen
    int    adjustbrightness = 9;        // How fast it moves from dark to light, over-draw
    float  desired_brightness = 250;    // How long to process.  You can always stop early with "s" key
    
    int          tests = 4;                  // Reasonable values:  13 for development, 720 for final
    int          line_length = 30;           // Reasonable values:  3 through 100
    
    int          squiggle_count;
    int          darkest_x;
    int          darkest_y;
    float        darkest_value;
    float        darkest_neighbor = 256;
    
    /////////////////////////////////////////////////////////////////////////////////////////////////////
    public void pre_processing() {
        setSettings();
        image_crop();
        image_scale(1000);
        image_unsharpen(img, 3);
        if(addBoarder){
          image_boarder("b6.png", 0, 0);
        }
        image_desaturate();
    }
        
        /////////////////////////////////////////////////////////////////////////////////////////////////////
        public void find_path() {
            find_squiggle();
            if (avg_imgage_brightness() > desired_brightness) {
                state++;
            }
        }
            
            /////////////////////////////////////////////////////////////////////////////////////////////////////
            private void find_squiggle() {
                int x, y;
                
                //find_darkest();
                find_darkest_area();
                x = darkest_x;
                y = darkest_y;
                squiggle_count++;
                pen_color = 0;
                
                find_darkest_neighbor(x, y);
                move_abs(0, darkest_x, darkest_y);
                pen_down();
                
                for (int s = 0; s < squiggle_length; s++) {
                    find_darkest_neighbor(x, y);
                    bresenham_lighten(x, y, darkest_x, darkest_y, adjustbrightness);
                    move_abs(0, darkest_x, darkest_y);
                    x = darkest_x;
                    y = darkest_y;
                }
                pen_up();
            }
                
                /////////////////////////////////////////////////////////////////////////////////////////////////////
                private void find_darkest() {
                    darkest_value = 257;
                    int darkest_loc = 0;
                    
                   for (int loc= 0; loc < img.width * img.height; loc++) {
                        float r = brightness(img.pixels[loc]);
                       if (r < darkest_value) {
                            darkest_value = r + random(1);
                            darkest_loc = loc;
                        }
                    }
                    darkest_x = darkest_loc % img.width;
                    darkest_y = (darkest_loc - darkest_x) / img.width;
                }
                    
                    /////////////////////////////////////////////////////////////////////////////////////////////////////
                   private void find_darkest_area() {
                        // Warning, Experimental: 
                      // Finds the darkest square area by down sampling the img into a much smaller area then finding 
                        // the darkest pixel within that.  It returns a random pixel within that darkest area.
                        
                        int area_size = 10;
                        darkest_value = 999;
                        int darkest_loc = 1;
                        
                        PImage img2;
                        img2 = createImage(img.width / area_size, img.height / area_size, RGB);
                        img2.copy(img, 0, 0, img.width, img.height, 0, 0, img2.width, img2.height);
                        
                      for (int loc = 0; loc < img2.width * img2.height; loc++) {
                            float r = brightness(img2.pixels[loc]);
                            
                           if (r < darkest_value) {
                                darkest_value = r + random(1);
                                darkest_loc = loc;
                            }
                        }
                        darkest_x = darkest_loc % img2.width;
                        darkest_y = (darkest_loc - darkest_x) / img2.width;
                        darkest_x = darkest_x * area_size + PApplet.parseInt(random(area_size));
                        darkest_y = darkest_y * area_size + PApplet.parseInt(random(area_size));
                    }
                        
                        /////////////////////////////////////////////////////////////////////////////////////////////////////
                       private void find_darkest_neighbor(int start_x, int start_y) {
                           darkest_neighbor = 257;
                            float start_angle;
                            float delta_angle;
                            
                           start_angle = 36 + degrees((sin(radians(start_x / 9 + 46)) + cos(radians(start_y / 26 + 26))));
                            delta_angle = 360.0f / (float)tests;
                            
                          for (int d = 0; d < tests; d++) {
                                float b = bresenham_avg_brightness(start_x, start_y, line_length,(delta_angle * d) + start_angle);
                            }
                        }
                            
                            ///////////////////////////////////////////////////////////////////////////////////////////////////////
                            public float bresenham_avg_brightness(int x0, int y0, float distance, float degree) {
                                int x1, y1;
                               int sum_brightness = 0;
                               int count_brightness = 0;
                               ArrayList <intPoint> pnts;
                                
                                x1 = PApplet.parseInt(cos(radians(degree)) * distance) + x0;
                                y1 = PApplet.parseInt(sin(radians(degree)) * distance) + y0;
                               x0 = constrain(x0, 0, img.width - 1);
                               y0 = constrain(y0, 0, img.height - 1);
                               x1 = constrain(x1, 0, img.width - 1);
                               y1 = constrain(y1, 0, img.height - 1);
                                
                                pnts = bresenham(x0, y0, x1, y1);
                                for (intPoint p : pnts) {
                                    int loc = p.x + p.y * img.width;
                                    sum_brightness += brightness(img.pixels[loc]);
                                    count_brightness++;
                                    if (sum_brightness / count_brightness < darkest_neighbor) {
                                        darkest_x = p.x;
                                        darkest_y = p.y;
                                       darkest_neighbor = (float)sum_brightness / (float)count_brightness;
                                    }
                                        //println(x0+","+y0+"  "+p.x+","+p.y+"  brightness:"+sum_brightness / count_brightness+"  darkest:"+darkest_neighbor+"  "+darkest_x+","+darkest_y); 
                                    }
                                        // println();
                                        return(sum_brightness / count_brightness);
                                    }
                                        
                                        /////////////////////////////////////////////////////////////////////////////////////////////////////
                                    public void post_processing() {
                                        }
                                            
                                       private void setSettings() {
                                                JSONObject json = loadJSONObject(settings_path).getJSONObject("PFM_squares");
                                                
                                                addBoarder = json.getBoolean("addBoarder");
                                                squiggle_length = json.getInt("squiggle_length");
                                               adjustbrightness = json.getInt("adjustbrightness");
                                               desired_brightness = json.getFloat("desired_brightness");
                                                tests = json.getInt("tests");                 
                                                line_length = json.getInt("line_length");
                                            }
                                                
                                            }
                                                
  public void settings() {  size(500, 500); }
  static public void main(String[] passedArgs) {
    String[] appletArgs = new String[] { "Drawbot_image_to_gcode_stripped" };
    if (passedArgs != null) {
      PApplet.main(concat(appletArgs, passedArgs));
    } else {
      PApplet.main(appletArgs);
    }
  }
}
