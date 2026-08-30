from PIL import Image
import sys

img = Image.open(sys.argv[1]).convert('RGB')
w, h = img.size

colors = {}
for y in range(h):
    for x in range(w):
        c = img.getpixel((x, y))
        if c not in colors:
            colors[c] = 0
        colors[c] += 1

# sort by count
sorted_colors = sorted(colors.items(), key=lambda item: item[1], reverse=True)
for i in range(10):
    if i < len(sorted_colors):
        print(f"RGB: {sorted_colors[i][0]} Count: {sorted_colors[i][1]}")
