def lin(c):
    c=c/255
    return c/12.92 if c<=0.03928 else ((c+0.055)/1.055)**2.4
def L(h):
    h=h.lstrip('#'); r,g,b=[int(h[i:i+2],16) for i in (0,2,4)]
    return 0.2126*lin(r)+0.7152*lin(g)+0.0722*lin(b)
def cr(a,b):
    la,lb=L(a),L(b); hi,lo=max(la,lb),min(la,lb); return (hi+0.05)/(lo+0.05)
pairs = [
 # text on page backgrounds
 ("ink-900 #231627","#231627","#FBF7F1"),
 ("ink-800 #3F3342","#3F3342","#FBF7F1"),
 ("ink-600 #5E4A62","#5E4A62","#FBF7F1"),
 ("ink-500 #6B5A6E","#6B5A6E","#FBF7F1"),
 ("ink-500 on white","#6B5A6E","#FFFFFF"),
 ("ink-400 #8C7A90 (disabled only)","#8C7A90","#FBF7F1"),
 ("plum-900 on cream","#421247","#FBF7F1"),
 ("plum-700 on cream","#5A1E5E","#FBF7F1"),
 ("plum-500 on cream","#824787","#FBF7F1"),
 ("plum-muted on cream","#76457A","#FBF7F1"),
 ("orange-600 #C2560C on cream (large only)","#C2560C","#FBF7F1"),
 ("orange-700 #A34803 on cream","#A34803","#FBF7F1"),
 ("teal-700 #1D625F on cream","#1D625F","#FBF7F1"),
 ("teal-600 #23706E on cream","#23706E","#FBF7F1"),
 ("teal-600 on white","#23706E","#FFFFFF"),
 ("rose-700 #8E2A4F on white","#8E2A4F","#FFFFFF"),
 ("danger-700 #9C2A2A on white","#9C2A2A","#FFFFFF"),
 # buttons
 ("cream on plum-700 (primary btn)","#FBF7F1","#5A1E5E"),
 ("cream on plum-800 hover","#FBF7F1","#4A154E"),
 ("white on teal-600 (success btn)","#FFFFFF","#23706E"),
 ("white on danger-700","#FFFFFF","#9C2A2A"),
 ("white on rose-700 (emergency call btn)","#FFFFFF","#8E2A4F"),
 # chips text on tint
 ("plum-700 on plum-100 #F1E6F3","#5A1E5E","#F1E6F3"),
 ("orange-700 on orange-100 #FDEBDD","#A34803","#FDEBDD"),
 ("teal-700 on teal-100 #E3F3F2","#1D625F","#E3F3F2"),
 ("teal-600 on teal-100 #E3F3F2","#23706E","#E3F3F2"),
 ("rose-700 on rose-100 #FBE7EE","#8E2A4F","#FBE7EE"),
 ("ink-600 on grey-100 #F1EEF0","#5E4A62","#F1EEF0"),
 ("honey-800 #6E4C00 on honey-100 #FAEFD2","#6E4C00","#FAEFD2"),
 ("ink-600 on white (outline chip)","#5E4A62","#FFFFFF"),
 # icons on approved badges (non-text >=3)
 ("plum-900 icon on peach #FCD0B4","#421247","#FCD0B4"),
 ("plum-900 icon on mint #BEE4E6","#421247","#BEE4E6"),
 ("plum-900 icon on lilac #E4C4E8","#421247","#E4C4E8"),
 ("plum-900 icon on rose #F6BBC6","#421247","#F6BBC6"),
 # dark surfaces
 ("cream on plum-900 (footer/sidebar)","#FBF7F1","#421247"),
 ("plum-200 #E4C4E8 on plum-900 (secondary text)","#E4C4E8","#421247"),
 ("#D9C3DC on plum-900","#D9C3DC","#421247"),
 ("orange-400 #FC9238 focus on plum-900","#FC9238","#421247"),
 ("orange-400 on plum-700","#FC9238","#5A1E5E"),
 ("plum-700 focus ring on cream","#5A1E5E","#FBF7F1"),
 ("plum-700 focus ring on peach badge","#5A1E5E","#FCD0B4"),
 ("staff bg #F6F2F5 ink-800","#3F3342","#F6F2F5"),
 ("staff bg #F6F2F5 ink-600","#5E4A62","#F6F2F5"),
 ("staff bg ink-500","#6B5A6E","#F6F2F5"),
 ("teal-500 #2E8C88 on cream (large/icon)","#2E8C88","#FBF7F1"),
 ("turquoise #3FA9A3 decor on cream","#3FA9A3","#FBF7F1"),
 ("border line-300 #DCCBDD vs white (non-text decor)","#DCCBDD","#FFFFFF"),
 ("input border #A88FAB vs white (>=3 req)","#A88FAB","#FFFFFF"),
 ("input border #9C82A0 vs white","#9C82A0","#FFFFFF"),
 ("plum-700 on plum-50 #F8F2F9 active nav","#5A1E5E","#F8F2F9"),
 ("cream on plum-900 #421247 active? n/a","#421247","#FBF7F1"),
 ("ink-600 on lilac-wash #F4ECF5","#5E4A62","#F4ECF5"),
 ("orange-700 on white","#A34803","#FFFFFF"),
 ("rose-700 on cream","#8E2A4F","#FBF7F1"),
 ("honey-800 on white","#6E4C00","#FFFFFF"),
 ("toast: cream on ink-900 #2A1B2E","#FBF7F1","#2A1B2E"),
 ("orange-400 on #2A1B2E","#FC9238","#2A1B2E"),
 ("teal-200 #8FD3CC on #2A1B2E (toast icon)","#8FD3CC","#2A1B2E"),
 ("white on plum-900 video overlay","#FFFFFF","#421247"),
]
for name,a,b in pairs:
    print(f"{cr(a,b):5.2f}  {name}")
