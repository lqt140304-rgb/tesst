import sys
from PIL import Image, ImageDraw, ImageFont
A='/tmp/claude-0/hero/demo/assets/'
OUT='/tmp/claude-0/-home-user/ee1c545f-6576-5903-b05e-d62a2d0e8267/scratchpad/design/crops/'
# (label, file, cx, cy, w)  crop box w x 1.06w centred at (cx,cy) in source px
C=[
 ('F0 pet-left mặt mèo khăn vàng','pet-left.png',350,330,560),
 ('F1 noitru mèo cam ngủ','service-noitru.jpg',470,800,560),
 ('F2 pet-center cún ngậm hoa','pet-center.png',480,360,600),
 ('F3 pet-right mèo trời xanh','pet-right.png',330,330,560),
 ('F4 grooming mặt golden','service-grooming.jpg',700,250,430),
 ('F5 kham tay vuốt mèo','service-kham.jpg',600,330,520),
 ('F6 kham người & mèo','service-kham.jpg',330,300,560),
 ('F7 grooming tay chải lông','service-grooming.jpg',470,440,420),
 ('F8 capcuu cún toàn thân','service-capcuu.jpg',500,960,900),
]
tiles=[]
for lab,f,cx,cy,w in C:
    im=Image.open(A+f).convert('RGB'); h=int(w*1.06)
    x0=max(0,min(im.width-w,cx-w//2)); y0=max(0,min(im.height-h,cy-h//2))
    t=im.crop((x0,y0,x0+w,y0+h)).resize((240,254))
    tiles.append((lab,t,(x0,y0,w,h),f))
sheet=Image.new('RGB',(5*250,2*290),'#FBF7F1'); d=ImageDraw.Draw(sheet)
for i,(lab,t,box,f) in enumerate(tiles):
    x=(i%5)*250+5; y=(i//5)*290+5; sheet.paste(t,(x,y)); d.text((x,y+258),lab[:34],fill='#421247')
    print(lab,'|',f,'| box x,y,w,h =',box)
sheet.save(OUT+'hero-crops-sheet.jpg',quality=85)
