"""Photo pipeline (proposal-visual.md §6.2–6.3): one colour grade, 9 hero crops, card + thumb sizes, WebP.

Run: python3 scripts/photos.py   (sources: reference/hero-demo/assets, output: src/assets/img)
"""
from pathlib import Path
import shutil
from PIL import Image, ImageEnhance, ImageOps

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / 'reference/hero-demo/assets'
OUT = ROOT / 'src/assets/img'
OUT.mkdir(parents=True, exist_ok=True)


def hexrgb(h):
    h = h.lstrip('#')
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))


def grade(im, teal_sky=False):
    im = im.convert('RGB')
    if teal_sky:  # pet-right: shift the strong blue sky toward the teal accent
        hsv = im.convert('HSV')
        h, s, v = hsv.split()
        h = h.point(lambda x: (x - 6) % 256)
        s = s.point(lambda x: int(x * 0.75))
        im = Image.merge('HSV', (h, s, v)).convert('RGB')
    r, g, b = im.split()
    r = r.point(lambda v: min(255, int(v * 1.025)))
    b = b.point(lambda v: int(v * 0.965))
    im = Image.merge('RGB', (r, g, b))
    im = ImageEnhance.Color(im).enhance(0.93)
    im = ImageEnhance.Contrast(im).enhance(0.96)
    gm = ImageOps.colorize(ImageOps.grayscale(im), hexrgb('#421247'), hexrgb('#FFF6EC'))
    return Image.blend(im, gm, 0.10)


SOURCES = {
    'kham': 'service-kham.jpg', 'grooming': 'service-grooming.jpg', 'noitru': 'service-noitru.jpg', 'capcuu': 'service-capcuu.jpg',
    'pet_center': 'pet-center.png', 'pet_left': 'pet-left.png', 'pet_right': 'pet-right.png',
}
graded = {k: grade(Image.open(SRC / f), teal_sky=(k == 'pet_right')) for k, f in SOURCES.items()}

# Full-size graded sources for the video pipeline (scripts/make-media.sh); not committed.
GRADED = ROOT / 'build/graded'
GRADED.mkdir(parents=True, exist_ok=True)
for key, im in graded.items():
    im.save(GRADED / f'{key}.jpg', 'JPEG', quality=92)

for key, im in graded.items():
    for variant, width in (('card', 900), ('thumb', 480)):
        w = min(width, im.width)
        out = im.resize((w, round(im.height * w / im.width)), Image.LANCZOS)
        out.save(OUT / f'{key}-{variant}.webp', 'WEBP', quality=78, method=6)

# 9 hero frames, w × 1.06w (index 0–5 strongest; even = outer ring).
HERO = [
    ('pet_left', 70, 34, 560), ('noitru', 190, 504, 560), ('pet_center', 180, 42, 600), ('pet_right', 50, 34, 560),
    ('grooming', 485, 23, 430), ('kham', 340, 55, 520), ('kham', 50, 4, 560), ('grooming', 260, 258, 420), ('capcuu', 50, 483, 900),
]
for i, (key, x, y, w) in enumerate(HERO):
    im = graded[key]
    h = round(w * 1.06)
    x, y = max(0, min(x, im.width - w)), max(0, min(y, im.height - h))  # keep the box inside the photo
    crop = im.crop((x, y, x + w, y + h)).resize((400, 424), Image.LANCZOS)
    crop.save(OUT / f'hero-{i}.webp', 'WEBP', quality=78, method=6)

# Pet photos (redesign §5.3): avatar 320² (square around the face), card 960 wide, banner 1600 wide (only from big sources).
# Slug = what the animal is; keys are what data stores as photo_key.
PETS = {
    'meo-tam-the': ('pet_left', 300, 330, 540),
    'cho-vang': ('pet_center', 486, 260, 440),
    'meo-muop': ('pet_right', 380, 420, 560),
}
OWNER = ROOT / 'docs/tham-khao/anh'  # owner photos: any image here becomes pet-<file stem>-*.webp


def square(im, cx, cy, side):
    side = min(side, im.width, im.height)
    x = max(0, min(round(cx - side / 2), im.width - side))
    y = max(0, min(round(cy - side / 2), im.height - side))
    return im.crop((x, y, x + side, y + side))


def pet_sizes(slug, im, box):
    square(im, *box).resize((320, 320), Image.LANCZOS).save(OUT / f'pet-{slug}-avatar.webp', 'WEBP', quality=80, method=6)
    for variant, width in (('card', 960), ('banner', 1600)):
        if im.width < width and variant == 'banner':
            continue
        w = min(width, im.width)
        im.resize((w, round(im.height * w / im.width)), Image.LANCZOS).save(OUT / f'pet-{slug}-{variant}.webp', 'WEBP', quality=78, method=6)


for slug, (key, cx, cy, side) in PETS.items():
    pet_sizes(slug, graded[key], (cx, cy, side))
if OWNER.is_dir():
    for f in sorted(OWNER.iterdir()):
        if f.suffix.lower() in ('.jpg', '.jpeg', '.png', '.webp'):
            im = grade(ImageOps.exif_transpose(Image.open(f)))
            pet_sizes(f.stem.lower(), im, (im.width / 2, im.height * 0.42, min(im.width, im.height)))

shutil.copyfile(SRC / 'logo-le-son.png', OUT / 'logo-le-son.png')
for svg in ('cat-silhouette.svg', 'cat-pose-booking.svg', 'sketch-cartoon-cat.svg'):
    shutil.copyfile(SRC / svg, OUT / svg)
print('photos ok')
