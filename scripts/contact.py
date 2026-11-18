import sys, os
from PIL import Image, ImageDraw
# usage: contact.py out.png cols label=path ...
out, cols, items = sys.argv[1], int(sys.argv[2]), sys.argv[3:]
tw = 720
thumbs = []
for it in items:
    label, p = it.split("=", 1)
    im = Image.open(p).convert("RGB")
    h = int(im.height * tw / im.width)
    im = im.resize((tw, h))
    thumbs.append((label, im))
th = max(t[1].height for t in thumbs) + 28
rows = (len(thumbs) + cols - 1) // cols
sheet = Image.new("RGB", (cols * (tw + 12) + 12, rows * (th + 12) + 12), (40, 40, 40))
d = ImageDraw.Draw(sheet)
for i, (label, im) in enumerate(thumbs):
    x = 12 + (i % cols) * (tw + 12); y = 12 + (i // cols) * (th + 12)
    d.text((x + 4, y + 6), label, fill=(255, 255, 255))
    sheet.paste(im, (x, y + 28))
sheet.save(out)
print(out, sheet.size)
