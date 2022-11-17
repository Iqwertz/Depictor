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
  float settingsAmpScale = 4.5;
  color settingsMask = color (240, 240, 240);

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
    color c = 0;                               // Sampled color
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
    color mask = settingsMask;                 // This color will not be drawn (WHITE)

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
        c = img.get (int(x), int(y));
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

      int pen_number = int(map(brightness(c), 0, 255, 0, pen_count-1)+0.5);
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
