from PIL import Image, ImageDraw, ImageFont
import os

# Create a simple icon with the store logo design
def create_icon(size, filename):
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # Background circle (green)
    margin = size // 10
    draw.ellipse([margin, margin, size-margin, size-margin], fill=(37, 211, 102, 255))
    
    # Inner design - white bag/shopping icon
    inner_margin = size // 4
    draw.ellipse([inner_margin, inner_margin, size-inner_margin, size-inner_margin], 
                 outline=(255, 255, 255, 255), width=max(size//20, 2))
    
    # Save
    img.save(filename, 'PNG')
    print(f'Created {filename} ({size}x{size})')

os.makedirs('icons', exist_ok=True)
create_icon(192, 'icons/icon-192.png')
create_icon(512, 'icons/icon-512.png')
print('Done!')
