PrintWriter output;

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
final float scale_factor = 10;
final float global_gcode_scale = 0.25; //if 0 scale is auto. calculated
final boolean flip_gcode_xy = true;
final boolean skip_gcode_negative_values = true;
final float   paper_size_x = 16 * scale_factor;
final float   paper_size_y = 20 * scale_factor;
final float   image_size_x = 28 * 15;
final float   image_size_y = 36 * 15;
final float   paper_top_to_origin = 9;      //mm, make smaller to move drawing down on paper
final float   pen_width = 0.65;               //mm, determines image_scale, reduce, if solid black areas are speckled with white holes. //0.65
final int     pen_count = 1;
final char    gcode_decimal_seperator = '.';    
final int     gcode_decimals = 2;             // Number of digits right of the decimal point in the gcode files.
final int     svg_decimals = 2;               // Number of digits right of the decimal point in the SVG file.
final float   grid_scale = 10.0;              // Use 10.0 for centimeters, 25.4 for inches, and between 444 and 529.2 for cubits.

final String input_image_path = "input/image.jpg";

// Every good program should have a shit pile of badly named globals.
Class cl = null;
pfm ocl;
int current_pfm = 0;
String[] pfms = {"PFM_original", "PFM_squares"}; 

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
void setup() {
    output = createWriter("log.txt"); 
    
    
    size(500, 500);
    frame.setLocation(200, 200);
    surface.setResizable(true);
    surface.setTitle("Drawbot_image_to_gcode_v2, version 3.75");
    colorMode(RGB);
    frameRate(999);
    //randomSeed(millis());
    randomSeed(3);
    d1= new botDrawing();
    dx= new Limit(); 
    dy= new Limit(); 
    loadInClass(pfms[current_pfm]);
    loadImageFromPath();
    background(0);
    //selectInput("Select an image to process:", "fileSelected");
    output.println("start");
    output.flush();
}

///////////////////////////////////////////////////////////////////////////////////////////////////////
void draw() {
    output.println("draw");
    output.flush();
    drawfunctions();
}

///////////////////////////////////////////////////////////////////////////////////////////////////////
void drawfunctions() {
    // background(255,0,0);
    if(state != 3) { background(255, 255, 255); }
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
            
            println("elapsed time: " + (millis() - startTime) / 1000.0 + " seconds");
            display_line_count = d1.line_count;
            state++;
            break;
        case 5 : 
        if(drawToScreen){
           render_all();
    }
            noLoop();
           save("gcode/render.png");
            create_gcode_files(display_line_count);
            exit();
            break;
        default:
        println("invalid state: " + state);
        break;
    }
}

///////////////////////////////////////////////////////////////////////////////////////////////////////
void loadImageFromPath() {
    path_selected = dataPath(input_image_path);
    basefile_selected  = split(split(input_image_path, '/')[1], '.')[0]; //the [1] is wrong (correct way would be to take the last element of the list)
    state++;
}

///////////////////////////////////////////////////////////////////////////////////////////////////////
void fileSelected(File selection) {
    if(selection == null) {
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
void setup_squiggles() {
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
void render_all() {
    println("render_all: " + display_mode + ", " + display_line_count + " lines, with pen set " + current_copic_set);
    
    if(display_mode == "drawing") {
        //<d1.render_all();
       d1.render_some(display_line_count);
    }
}

///////////////////////////////////////////////////////////////////////////////////////////////////////
void keyPressed() {
    if(key == 'p') {
        current_pfm ++;
        if (current_pfm >= pfms.length) { current_pfm = 0; }
        //display_line_count = 0;
        loadInClass(pfms[current_pfm]); 
        state = 2;
    }
    if(key == 'g') { 
        create_gcode_files(display_line_count);
    }
    if(key == '<') {
        int delta = -5000;
        display_line_count = int(display_line_count + delta);
        display_line_count = constrain(display_line_count, 0, d1.line_count);
        //println("display_line_count: " + display_line_count);
    }
    if(key == '>') {
        int delta = 5000;
        display_line_count = int(display_line_count + delta);
        display_line_count = constrain(display_line_count, 0, d1.line_count);
        //println("display_line_count: " + display_line_count);
    }
    if(key == 'r') { 
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
void set_even_distribution() {
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
        cl =Class.forName(className);
    } catch(ClassNotFoundException e) { 
        println("\nError unknown PFM: " + className); 
    }
    
    ocl = null;
    if(cl != null) {
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
void mousePressed() {
    morgx = mouseX - mx; 
    morgy = mouseY - my; 
}

///////////////////////////////////////////////////////////////////////////////////////////////////////
void mouseDragged() {
    mx= mouseX - morgx; 
    my= mouseY - morgy; 
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
