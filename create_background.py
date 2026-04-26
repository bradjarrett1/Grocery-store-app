from PIL import Image, ImageDraw, ImageFont
import random

# Phone aspect ratio (9:16) - common mobile size
width = 1080
height = 1920

# Light green background color
bg_color = (230, 245, 230)  # Light mint green

# Much more visible darker green for the imprints
imprint_color = (180, 215, 180)  # More visible darker mint green

# Create the image
img = Image.new('RGB', (width, height), bg_color)
draw = ImageDraw.Draw(img)

# Food items to draw (simple shapes representing fruits, bread, grains)
def draw_apple(draw, x, y, size, color):
    """Draw a simple apple shape"""
    draw.ellipse([x, y, x+size, y+size], fill=color)
    # Small stem
    stem_width = size // 8
    draw.rectangle([x+size//2-stem_width//2, y-size//4, x+size//2+stem_width//2, y], fill=color)

def draw_banana(draw, x, y, size, color):
    """Draw a simple banana shape"""
    # Curved banana using arc
    draw.arc([x, y, x+size*1.5, y+size], start=180, end=360, fill=color, width=size//4)

def draw_bread(draw, x, y, size, color):
    """Draw a simple bread loaf"""
    # Rounded rectangle for bread
    draw.rounded_rectangle([x, y, x+size*1.5, y+size], radius=size//4, fill=color)
    # Lines on top for detail
    for i in range(3):
        offset = (i+1) * size // 4
        draw.line([x+offset, y+size//4, x+offset, y+size*0.75], fill=color, width=2)

def draw_grain(draw, x, y, size, color):
    """Draw wheat grain stalks"""
    stem_x = x + size // 2
    # Stem
    draw.line([stem_x, y+size, stem_x, y], fill=color, width=2)
    # Grains on sides
    for i in range(5):
        offset_y = y + (i * size // 5)
        draw.ellipse([stem_x-size//4, offset_y, stem_x+size//4, offset_y+size//6], fill=color)

def draw_carrot(draw, x, y, size, color):
    """Draw a simple carrot"""
    # Triangle for carrot body
    points = [(x+size//2, y+size), (x, y+size//3), (x+size, y+size//3)]
    draw.polygon(points, fill=color)
    # Leafy top
    draw.line([x+size//2, y+size//3, x+size//3, y], fill=color, width=2)
    draw.line([x+size//2, y+size//3, x+size*2//3, y], fill=color, width=2)

def draw_orange(draw, x, y, size, color):
    """Draw a simple orange"""
    draw.ellipse([x, y, x+size, y+size], fill=color)
    # Small segments
    center_x = x + size//2
    center_y = y + size//2
    for angle in range(0, 360, 60):
        import math
        end_x = center_x + (size//3) * math.cos(math.radians(angle))
        end_y = center_y + (size//3) * math.sin(math.radians(angle))
        draw.line([center_x, center_y, end_x, end_y], fill=color, width=1)

# Food drawing functions list
food_functions = [draw_apple, draw_banana, draw_bread, draw_grain, draw_carrot, draw_orange]

# Create sparse, evenly-spaced pattern
spacing_x = 200
spacing_y = 200
icon_size = 60

# Create regular grid with some randomness
for y in range(100, height, spacing_y):
    for x in range(100, width, spacing_x):
        # Add slight random offset for organic feel
        offset_x = random.randint(-30, 30)
        offset_y = random.randint(-30, 30)

        # Randomly choose which food item to draw
        food_func = random.choice(food_functions)

        # Draw the food item
        food_func(draw, x+offset_x, y+offset_y, icon_size, imprint_color)

# Save the image
output_path = 'C:\\Users\\Admin\\grocery-app\\grocery-background.png'
img.save(output_path)
print(f"Background image created successfully: {output_path}")
print(f"Dimensions: {width}x{height}px")
