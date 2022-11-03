from svg_to_gcode.svg_parser import parse_file
from svg_to_gcode.compiler import Compiler, interfaces

# Instantiate a compiler, specifying the interface type and the speed at which the tool should move. pass_depth controls
# how far down the tool moves after every pass. Set it to 0 if your machine does not support Z axis movement.
gcode_compiler = Compiler(
    interfaces.Gcode, movement_speed=1000, cutting_speed=300, pass_depth=0)

# Parse an svg file into geometric curves
curves = parse_file("input/image3.svg")

gcode_compiler.append_curves(curves)
gcode_compiler.compile_to_file("drawing.nc", passes=2)
