import os, sys
from PIL import Image

MIN_WIDTH = 500
MIN_HEIGHT = 500

def resize_height(width, height, mwidth):
    new_height = mwidth * height // width
    return mwidth, new_height
    
def resize_width(width, height, mheight):
    new_width  = mheight * width // height
    return new_width, mheight

def upscale_image(filename: str, out: str):
    img = Image.open(filename)
    width, height = img.size
    if width < MIN_WIDTH:
        width, height = resize_height(width, height, MIN_WIDTH)
    if height < MIN_HEIGHT:
        width, height = resize_width(width, height, MIN_HEIGHT)
        
    img = img.resize((width, height), Image.Resampling.LANCZOS)
    img.save(out)

if __name__ == "__main__":
    upscale_image(sys.argv[1])
