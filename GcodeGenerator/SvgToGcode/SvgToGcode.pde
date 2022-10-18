/*

  Sketch found on Github: https://gist.github.com/villares/a63f71db5b17675fe2af06ee29012532
  Modified for Depictor by Iqwertz

 This sketch is an adaptation from Sighack's Gcode Export
 Blog post: https://sighack.com/post/processing-boilerplate-with-gcode-export
 
 Depends on http://www.ricardmarxer.com/geomerative/
 
 TODO: 
 [ ] Select directory dialog
 [ ] Check file extension
*/
import geomerative.*;

/*
 * Gcode-generation settings. Edit these as per your needs.
 * CONFIG_SVGS_DIR            : Directory containing the SVG files
 * CONFIG_PRINT_WIDTH_MM      : The width of paper in mm 
 * CONFIG_PRINT_HEIGHT_MM     : The height of the paper in mm 
 * CONFIG_PRINT_HEIGHT_MM     : The height of the paper in mm
 * CONFIG_GCODE_PEN_UP        : The gcode for raising up the pen 
 * CONFIG_GCODE_PEN_DOWN      : The gcode for lowering the pen
 * CONFIG_GCODE_MOVE_FEEDRATE : The feedrate during drawing moves
 * CONFIG_GCODE_RAPID_FEEDRATE: The feedrate during rapid moves
 * CONFIG_GCODE_PRE           : This is added to the top of the file
 * CONFIG_GCODE_POST          : This is added at the end of the file
 */
final String CONFIG_SVGS_DIR = "./data/testSvgs/";
final int CONFIG_PRINT_WIDTH_MM = 100;
final int CONFIG_PRINT_HEIGHT_MM = 100;
final String CONFIG_GCODE_PEN_DOWN = "M05\n";
final String CONFIG_GCODE_PEN_UP = "M03 S20\n";
final String CONFIG_GCODE_MOVE_FEEDRATE = "3000";
final String CONFIG_GCODE_RAPID_FEEDRATE = "10000";
final String CONFIG_GCODE_PRE =
    /* Use absolute positioning */
    "G90\n" +
    /* Raise the pen (in case it's currently lowered) */
    CONFIG_GCODE_PEN_UP +
    /* Move to origin: (0, 0) */
    "G0 F" + CONFIG_GCODE_RAPID_FEEDRATE + " X0 Y0\n";
final String CONFIG_GCODE_POST =
    /* Raise the pen (in case it's currently lowered) */
    CONFIG_GCODE_PEN_UP +
    /* Move to origin: (0, 0) */
    "G0 F" + CONFIG_GCODE_RAPID_FEEDRATE + " X0 Y0\n";

void setup() {
    File[] files = listFiles(CONFIG_SVGS_DIR);
    for (int i=0; i < files.length; i++){
      File f = files[i];
      saveGcode(f.getAbsolutePath(), true);
    }
}

void draw() {
}

void saveGcode(String svg_filename, boolean writeToFile) {
  println("Generating Gcode for " + svg_filename + "...");
  __saveGcode(svg_filename, writeToFile);
  println("Done!");
}

void __saveGcode(String svg_filename, boolean writeToFile) {
  RShape grp;
  RPoint[][] paths;
  boolean ignoringStyles = false;
  String gcode = CONFIG_GCODE_PRE;

  /* Load SVG file and convert to paths */
  RG.init(this);
  RG.ignoreStyles(ignoringStyles);
  RG.setPolygonizer(RG.ADAPTATIVE);
  RG.setPolygonizerAngle(PI/4);
  grp = RG.loadShape(svg_filename);
  grp.centerIn(g, 0, 0, 0);
  paths = grp.getPointsInPaths();

  for (int i = 0; i < paths.length; i++) {
    println(i, paths.length);
    if (paths[i] == null)
      continue;

    //boolean outOfClip = true;
    boolean initialized = false; 
    float lastx = 0;
    float lasty = 0;
    for (int j = 0; j < paths[i].length; j++) {
      //vertex(pointPaths[i][j].x, pointPaths[i][j].y);
      float xmapped = map(paths[i][j].x, 0, grp.width, 0, CONFIG_PRINT_WIDTH_MM);
      /* Flip Y axis since GRBL expects (0, 0) to be at the bottom left */
      float ymapped = map(paths[i][j].y, 0, grp.height, CONFIG_PRINT_HEIGHT_MM, 0);
      
      if (!initialized) {
        lastx = xmapped;
        lasty = ymapped;
        initialized = true;
        continue;
      }
      
      gcode += __drawLine(lastx, lasty, xmapped, ymapped, false);
      lastx = xmapped;
      lasty = ymapped;
    }
    gcode += CONFIG_GCODE_PEN_UP;
    penDown = false;
  }
  gcode += CONFIG_GCODE_POST;
  
  if (writeToFile) {
    /* Write out the Gcode file */
    PrintWriter out = createWriter(svg_filename + ".gcode");
    out.println(gcode);
    out.flush();
    out.close();
  } else {
    println(gcode);
  }
}

/*
 * Encode a given point (x, y) into the different regions of
 * a clip window as specified by its top-left corner (cx, cy)
 * and it's width and height (cw, ch).
 */
int encode_endpoint(
  float x, float y,
  float clipx, float clipy, float clipw, float cliph)
{
  int code = 0; /* Initialized to being inside clip window */

  /* Calculate the min and max coordinates of clip window */
  float xmin = clipx;
  float xmax = clipx + clipw;
  float ymin = clipy;
  float ymax = clipy + clipw;

  if (x < xmin)       /* to left of clip window */
    code |= (1 << 0);
  else if (x > xmax)  /* to right of clip window */
    code |= (1 << 1);

  if (y < ymin)       /* below clip window */
    code |= (1 << 2);
  else if (y > ymax)  /* above clip window */
    code |= (1 << 3);

  return code;
}

class ClippedLineResponse {
  public float x0, y0;
  public float x1, y1;
  public boolean clipped;
  public boolean reject;
  
  ClippedLineResponse() {
    clipped = false;
    reject = false;
  }
  
  void set(float px0, float py0, float px1, float py1) {
    x0 = px0;
    y0 = py0;
    x1 = px1;
    y1 = py1;
  }
};

ClippedLineResponse line_clipped(
  float x0, float y0, float x1, float y1,
  float clipx, float clipy, float clipw, float cliph) {

  /* Stores encodings for the two endpoints of our line */
  int e0code, e1code;
  
  ClippedLineResponse ret = new ClippedLineResponse();

  /* Calculate X and Y ranges for our clip window */
  float xmin = clipx;
  float xmax = clipx + clipw;
  float ymin = clipy;
  float ymax = clipy + cliph;

  /* Whether the line should be drawn or not */
  //boolean accept = false;
  ret.reject = true;

  do {
    /* Get encodings for the two endpoints of our line */
    e0code = encode_endpoint(x0, y0, clipx, clipy, clipw, cliph);
    e1code = encode_endpoint(x1, y1, clipx, clipy, clipw, cliph);

    if (e0code == 0 && e1code == 0) {
      /* If line inside window, accept and break out of loop */
      //accept = true;
      ret.reject = false;
      break;
    } else if ((e0code & e1code) != 0) {
      /*
       * If the bitwise AND is not 0, it means both points share
       * an outside zone. Leave accept as 'false' and exit loop.
       */
      break;
    } else {
      /* Pick an endpoint that is outside the clip window */
      int code = e0code != 0 ? e0code : e1code;

      float newx = 0, newy = 0;
      
      /*
       * Now figure out the new endpoint that needs to replace
       * the current one. Each of the four cases are handled
       * separately.
       */
      if ((code & (1 << 0)) != 0) {
        /* Endpoint is to the left of clip window */
        newx = xmin;
        newy = ((y1 - y0) / (x1 - x0)) * (newx - x0) + y0;
      } else if ((code & (1 << 1)) != 0) {
        /* Endpoint is to the right of clip window */
        newx = xmax;
        newy = ((y1 - y0) / (x1 - x0)) * (newx - x0) + y0;
      } else if ((code & (1 << 3)) != 0) {
        /* Endpoint is above the clip window */
        newy = ymax;
        newx = ((x1 - x0) / (y1 - y0)) * (newy - y0) + x0;
      } else if ((code & (1 << 2)) != 0) {
        /* Endpoint is below the clip window */
        newy = ymin;
        newx = ((x1 - x0) / (y1 - y0)) * (newy - y0) + x0;
      }
      
      /* Now we replace the old endpoint depending on which we chose */
      if (code == e0code) {
        x0 = newx;
        y0 = newy;
      } else {
        x1 = newx;
        y1 = newy;
      }
      
      ret.clipped = true;
    }
  } while (true);

  /* Only draw the line if it was not rejected */
  if (!ret.reject)
    ret.set(x0, y0, x1, y1);

  return ret;
}

boolean penDown = false;

String __moveTo(float x, float y, boolean rapid) {
  String feed = rapid ? CONFIG_GCODE_RAPID_FEEDRATE : CONFIG_GCODE_MOVE_FEEDRATE;
  return "G1 F" + feed +
         " X" + str(x) +
         " Y" + str(y) + "\n";
}

String __drawLine(float x0, float y0, float x1, float y1, boolean rapid) {
  String snippet = "";
  ClippedLineResponse ret = line_clipped(x0, y0, x1, y1, 0, 0, CONFIG_PRINT_WIDTH_MM, CONFIG_PRINT_HEIGHT_MM);
  
  if (ret.reject) {
    if (penDown) {
      snippet += CONFIG_GCODE_PEN_UP;
      penDown = false;
    }
    return snippet;
  }
  
  snippet += __moveTo(ret.x0, ret.y0, rapid);
  if (!penDown) {
    snippet += CONFIG_GCODE_PEN_DOWN;
    penDown = true;
  }
  snippet += __moveTo(ret.x1, ret.y1, rapid);
  
  if (ret.clipped) {
    snippet += CONFIG_GCODE_PEN_UP;
    penDown = false;
  }
  
  return snippet;
}
