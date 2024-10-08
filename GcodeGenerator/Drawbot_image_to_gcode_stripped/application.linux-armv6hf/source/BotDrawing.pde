///////////////////////////////////////////////////////////////////////////////////////////////////////
// A class to describe all the line segments
class botDrawing {
  private int line_count = 0;
  botLine[] lines = new botLine[10000000];
  
  void botDrawing() {
  }

  void render_last () {
    lines[line_count/2].render_with_copic();
  }
  
  void render_all () {
    for (int i=1; i<line_count; i++) {
      lines[i].render_with_copic();
    }
  }
  
  void render_some (int line_count) {
    for (int i=1; i<line_count/2; i++) {
      lines[i].render_with_copic();
    }
  }

  void render_one_pen (int line_count, int pen) {
    color c = color(255, 0, 0);

    for (int i=1; i<line_count; i++) {
    //for (int i=line_count; i>1; i--) {
      if (lines[i].pen_number == pen) {
        lines[i].render_with_copic();
      }
    }
  }
  
  void set_pen_continuation_flags () {
    float prev_x = 123456.0;
    float prev_y = 654321.0;
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

  void addline(int pen_number_, boolean pen_down_, float x1_, float y1_, float x2_, float y2_) {
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
