from PIL import Image, ImageOps, ImageEnhance, ImageChops
A='/tmp/claude-0/hero/demo/assets/'
OUT='/tmp/claude-0/-home-user/ee1c545f-6576-5903-b05e-d62a2d0e8267/scratchpad/design/crops/'
def hexrgb(h): h=h.lstrip('#'); return tuple(int(h[i:i+2],16) for i in (0,2,4))
def grade(im):
    im=im.convert('RGB')
    r,g,b=im.split()
    r=r.point(lambda v:min(255,int(v*1.025))); b=b.point(lambda v:int(v*0.965))
    im=Image.merge('RGB',(r,g,b))
    im=ImageEnhance.Color(im).enhance(0.93)
    im=ImageEnhance.Contrast(im).enhance(0.96)
    # gradient map plum->cream at 10% (tints shadows plum, highlights cream)
    gm=ImageOps.colorize(ImageOps.grayscale(im),hexrgb('#421247'),hexrgb('#FFF6EC'))
    return Image.blend(im,gm,0.10)
def duotone(im,dark='#421247',light='#FCD0B4'):
    g=ImageOps.autocontrast(ImageOps.grayscale(im),cutoff=1)
    return ImageOps.colorize(g,hexrgb(dark),hexrgb(light),mid=hexrgb('#A0577F'))
srcs=['pet-left.png','service-noitru.jpg','service-grooming.jpg','pet-right.png']
row=[]
for f in srcs:
    im=Image.open(A+f).convert('RGB'); im=ImageOps.fit(im,(260,300))
    row+= [im, grade(im), duotone(im)]
W=260*3+20; sheet=Image.new('RGB',(W*2,300*2+10),'#FBF7F1')
for i,f in enumerate(srcs):
    for j in range(3):
        x=(i%2)*W+j*260; y=(i//2)*310
        sheet.paste(row[i*3+j],(x,y))
sheet.save(OUT+'grade-duotone-sheet.jpg',quality=85)
print('ok')
