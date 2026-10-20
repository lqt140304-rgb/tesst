"""Photo pipeline (proposal-visual.md §6.2–6.3): one colour grade, 9 hero crops, card + thumb sizes, WebP.

Run: python3 scripts/photos.py   (sources: reference/hero-demo/assets, output: src/assets/img)
"""
from pathlib import Path
import shutil
from PIL import Image, ImageEnhance, ImageOps, ImageStat

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


def trim_dark_top(im):
    """Drop near-black rows at the top (phone screenshots / letterboxing in owner photos)."""
    gray = ImageOps.grayscale(im)
    top = 0
    while top < im.height // 10 and ImageStat.Stat(gray.crop((0, top, im.width, top + 1))).mean[0] < 24:
        top += 1
    return im.crop((0, top, im.width, im.height)) if top else im


def save_webp(im, name, quality):
    path = OUT / name
    im.save(path, 'WEBP', quality=quality, method=6)
    assert path.stat().st_size <= 250 * 1024, f'{name} is over the 250 KB photo budget'


def pet_sizes(slug, im, box):
    save_webp(square(im, *box).resize((320, 320), Image.LANCZOS), f'pet-{slug}-avatar.webp', 80)
    for variant, width, quality in (('card', 960, 76), ('banner', 1600, 72)):
        if variant == 'banner' and im.width < width:
            continue  # banners only from sources big enough for them
        w = min(width, im.width)
        save_webp(im.resize((w, round(im.height * w / im.width)), Image.LANCZOS), f'pet-{slug}-{variant}.webp', quality)


for slug, (key, cx, cy, side) in PETS.items():
    pet_sizes(slug, graded[key], (cx, cy, side))
if OWNER.is_dir():
    for f in sorted(OWNER.iterdir()):
        if f.suffix.lower() in ('.jpg', '.jpeg', '.png', '.webp'):
            im = grade(trim_dark_top(ImageOps.exif_transpose(Image.open(f)).convert('RGB')))
            pet_sizes(f.stem.lower(), im, (im.width / 2, im.height * 0.42, min(im.width, im.height)))

# Head-doctor photo (part 2 §5): a real person, so no plum grade; the text printed on the left third is cropped off.
TEAM = OWNER / 'doi-ngu' / 'bac-si-le-thai-son.png'
if TEAM.is_file():
    im = ImageOps.exif_transpose(Image.open(TEAM)).convert('RGB')
    im = im.crop((round(im.width * 0.34), 0, im.width, im.height))
    im = ImageEnhance.Color(im).enhance(0.97).resize((720, round(im.height * 720 / im.width)), Image.LANCZOS)
    save_webp(im, 'team-le-thai-son-card.webp', 80)

shutil.copyfile(SRC / 'logo-le-son.png', OUT / 'logo-le-son.png')
for svg in ('cat-silhouette.svg', 'cat-pose-booking.svg', 'sketch-cartoon-cat.svg'):
    shutil.copyfile(SRC / svg, OUT / svg)
print('photos ok')
