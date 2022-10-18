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
ArrayList <intPoint> bresenham(int x0, int y0, int x1, int y1) {
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
