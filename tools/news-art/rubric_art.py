"""GalaxiNews rubric artwork: 12 monthly scenes + 53 weekly sky charts.

Monthly (month-01 … month-12): the season's festival or sky phenomenon plus the
sidereal sign the Sun enters that month (its Sankranti), drawn as a
constellation. Weekly (week-01 … week-53): the Sun on its path through the
sidereal sign it occupies in that ISO week, in the season's palette. The same
files are reused every year (Sun ingress dates shift by about a day).

Usage: python3 tools/news-art/rubric_art.py OUT_DIR
Writes SVG sources, then renders 1200×675 WebP + JPEG and 480×270 WebP with
headless Chrome (Playwright) and Pillow. Fully original, no external assets.
"""
import math, random, sys, os, datetime

W, H = 1200, 675

# --- simplified zodiac constellation figures (x, y in a 0..1 box) -------------
CONST = {
 'aries': ([(0.08,0.62),(0.42,0.36),(0.55,0.40),(0.92,0.58)], [(0,1),(1,2),(2,3)], [1]),
 'taurus': ([(0.47,0.56),(0.55,0.48),(0.60,0.53),(0.63,0.45),(0.08,0.18),(0.12,0.80),(0.76,0.62),(0.40,0.60)],
            [(4,1),(1,3),(3,6),(5,7),(7,0),(0,2),(2,3)], [0]),
 'gemini': ([(0.20,0.12),(0.28,0.45),(0.24,0.88),(0.46,0.18),(0.52,0.52),(0.62,0.90),(0.12,0.62),(0.72,0.66)],
            [(0,1),(1,2),(3,4),(4,5),(1,4),(1,6),(4,7)], [0,3]),
 'cancer': ([(0.50,0.10),(0.50,0.48),(0.24,0.86),(0.80,0.82),(0.56,0.62)], [(0,1),(1,4),(4,2),(4,3)], []),
 'leo': ([(0.30,0.78),(0.30,0.52),(0.38,0.36),(0.33,0.20),(0.22,0.17),(0.62,0.44),(0.92,0.58),(0.64,0.70)],
         [(0,1),(1,2),(2,3),(3,4),(1,5),(5,6),(6,7),(7,0)], [0,6]),
 'virgo': ([(0.15,0.18),(0.32,0.38),(0.50,0.44),(0.70,0.34),(0.86,0.18),(0.52,0.62),(0.62,0.88),(0.38,0.80)],
           [(0,1),(1,2),(2,3),(3,4),(2,5),(5,6),(5,7)], [6]),
 'libra': ([(0.30,0.30),(0.70,0.22),(0.76,0.64),(0.36,0.74),(0.52,0.94)], [(0,1),(1,2),(2,3),(3,0),(3,4)], [0,1]),
 'scorpio': ([(0.12,0.12),(0.20,0.28),(0.10,0.44),(0.34,0.40),(0.44,0.50),(0.50,0.63),(0.54,0.78),(0.64,0.90),(0.80,0.93),(0.89,0.83),(0.85,0.70)],
             [(0,1),(1,2),(1,3),(3,4),(4,5),(5,6),(6,7),(7,8),(8,9),(9,10)], [3]),
 'sagittarius': ([(0.18,0.62),(0.34,0.46),(0.50,0.34),(0.64,0.46),(0.82,0.38),(0.78,0.70),(0.52,0.76),(0.30,0.76)],
                 [(0,1),(1,2),(2,3),(3,4),(4,5),(5,6),(6,7),(7,0),(1,3),(3,6)], [5]),
 'capricorn': ([(0.08,0.28),(0.20,0.34),(0.48,0.76),(0.64,0.72),(0.92,0.24),(0.76,0.30),(0.50,0.40)],
               [(0,1),(1,2),(2,3),(3,4),(4,5),(5,6),(6,1)], [4]),
 'aquarius': ([(0.08,0.18),(0.28,0.28),(0.44,0.22),(0.55,0.44),(0.40,0.58),(0.60,0.68),(0.50,0.88),(0.76,0.80),(0.92,0.94)],
              [(0,1),(1,2),(2,3),(3,4),(4,5),(5,6),(5,7),(7,8)], [2]),
 'pisces': ([(0.06,0.12),(0.14,0.05),(0.21,0.13),(0.14,0.22),(0.32,0.46),(0.46,0.70),(0.60,0.90),(0.74,0.74),(0.86,0.54),(0.92,0.44),(0.98,0.50),(0.94,0.60)],
            [(0,1),(1,2),(2,3),(3,0),(3,4),(4,5),(5,6),(6,7),(7,8),(8,9),(9,10),(10,11),(11,8)], [6]),
}
SIGNS = ['aries','taurus','gemini','cancer','leo','virgo','libra','scorpio','sagittarius','capricorn','aquarius','pisces']
# Approximate sidereal (Lahiri) Sankranti dates: (month, day) the Sun enters each sign.
INGRESS = {'aries':(4,14),'taurus':(5,15),'gemini':(6,15),'cancer':(7,16),'leo':(8,17),'virgo':(9,17),
           'libra':(10,17),'scorpio':(11,16),'sagittarius':(12,16),'capricorn':(1,14),'aquarius':(2,13),'pisces':(3,14)}

# --- season palettes: sky top, sky mid, horizon glow, land, accent ------------
PAL = {
 1: ('#070d24','#1b2a5e','#7f8fc9','#0b1430','#f2a65a'),
 2: ('#06091c','#16204d','#5d6fae','#0a1229','#cfe0ff'),
 3: ('#120a26','#3b1f55','#d77aa8','#140c22','#ffd166'),
 4: ('#0d1534','#3a3f78','#f4b183','#13261f','#ffcf7a'),
 5: ('#05141f','#0f3442','#4f9aa0','#06171c','#f6b8cf'),
 6: ('#0e1638','#45457e','#ffc98b','#1b2416','#ffe0a3'),
 7: ('#070c18','#1e2a3c','#6d8197','#0b1418','#f7e7b6'),
 8: ('#040818','#14204a','#3b4f8f','#0a1120','#ffffff'),
 9: ('#0b1230','#3a3a6a','#e3a467','#1d1a10','#f2d27a'),
 10: ('#140a1c','#3c1e2e','#c8783e','#170e0a','#ffb347'),
 11: ('#080a1e','#231a45','#a35a3a','#0b0b17','#ffc56b'),
 12: ('#050a1c','#132451','#5b7fc0','#0c1730','#dbe8ff'),
}

def rng(seed):
    r = random.Random(seed)
    return r

def stars(r, n, ymax=520, big=0.06):
    out = []
    for _ in range(n):
        x, y = r.uniform(0, W), r.uniform(0, ymax) ** 1.08
        s = r.uniform(0.5, 1.4) if r.random() > big else r.uniform(1.6, 2.4)
        o = r.uniform(0.35, 0.95)
        out.append(f'<circle cx="{x:.1f}" cy="{min(y,ymax):.1f}" r="{s:.2f}" fill="#fff" opacity="{o:.2f}"/>')
    return ''.join(out)

def sky(pal, uid, glow_y=0.86):
    top, mid, glow, land, acc = pal
    return (f'<defs><linearGradient id="sky{uid}" x1="0" y1="0" x2="0" y2="1">'
            f'<stop offset="0" stop-color="{top}"/><stop offset=".62" stop-color="{mid}"/><stop offset="1" stop-color="{glow}"/></linearGradient>'
            f'<radialGradient id="hz{uid}" cx=".5" cy="{glow_y}" r=".7"><stop offset="0" stop-color="{glow}" stop-opacity=".55"/><stop offset="1" stop-color="{glow}" stop-opacity="0"/></radialGradient>'
            f'<filter id="blur{uid}" filterUnits="userSpaceOnUse" x="-300" y="-300" width="1800" height="1300"><feGaussianBlur stdDeviation="18"/></filter>'
            f'<filter id="soft{uid}" filterUnits="userSpaceOnUse" x="-300" y="-300" width="1800" height="1300"><feGaussianBlur stdDeviation="3"/></filter>'
            f'<radialGradient id="vig{uid}" cx=".5" cy=".45" r=".75"><stop offset=".6" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".45"/></radialGradient>'
            f'<radialGradient id="sun{uid}" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#fff6d8"/><stop offset=".35" stop-color="#ffd27a"/><stop offset="1" stop-color="#ffb347" stop-opacity="0"/></radialGradient>'
            f'<radialGradient id="moon{uid}" cx=".42" cy=".38" r=".7"><stop offset="0" stop-color="#fffaf0"/><stop offset="1" stop-color="#d9d2c0"/></radialGradient>'
            f'</defs><rect width="{W}" height="{H}" fill="url(#sky{uid})"/><rect width="{W}" height="{H}" fill="url(#hz{uid})"/>')

def milky(r, uid, color='#c9d6ff', o=0.10):
    cx, cy, rot = r.uniform(300, 900), r.uniform(120, 300), r.uniform(-35, 35)
    return (f'<g filter="url(#blur{uid})" opacity="{o}"><ellipse cx="{cx:.0f}" cy="{cy:.0f}" rx="620" ry="70" fill="{color}" '
            f'transform="rotate({rot:.0f} {cx:.0f} {cy:.0f})"/></g>')

def constellation(name, x, y, w, h, color='#f2c982', line_o=0.55, uid='', red=False):
    pts, lines, bright = CONST[name]
    P = [(x + px * w, y + py * h) for px, py in pts]
    out = [f'<g stroke="{color}" stroke-opacity="{line_o}" stroke-width="2" stroke-linecap="round">']
    for a, b in lines:
        out.append(f'<line x1="{P[a][0]:.1f}" y1="{P[a][1]:.1f}" x2="{P[b][0]:.1f}" y2="{P[b][1]:.1f}"/>')
    out.append('</g>')
    for i, (px, py) in enumerate(P):
        big = i in bright
        col = '#ff8a6b' if (red and big) else '#fff7e0'
        rr = 5.5 if big else 3.2
        out.append(f'<circle cx="{px:.1f}" cy="{py:.1f}" r="{rr*3.2:.1f}" fill="{col}" opacity=".18" filter="url(#soft{uid})"/>')
        out.append(f'<circle cx="{px:.1f}" cy="{py:.1f}" r="{rr:.1f}" fill="{col}"/>')
    return ''.join(out)

def hills(r, base, amp, color, n=7, opacity=1.0, sharp=False):
    xs = [i * W / n for i in range(n + 1)]
    ys = [base - r.uniform(0, amp) for _ in xs]
    d = f'M0 {H} L0 {ys[0]:.0f} '
    for i in range(1, len(xs)):
        if sharp:
            mx = (xs[i-1] + xs[i]) / 2
            d += f'L{mx:.0f} {min(ys[i-1],ys[i]) - r.uniform(amp*0.2, amp*0.9):.0f} L{xs[i]:.0f} {ys[i]:.0f} '
        else:
            cx = (xs[i-1] + xs[i]) / 2
            d += f'Q{cx:.0f} {(ys[i-1]+ys[i])/2 - r.uniform(-amp*0.4, amp*0.6):.0f} {xs[i]:.0f} {ys[i]:.0f} '
    d += f'L{W} {H} Z'
    return f'<path d="{d}" fill="{color}" opacity="{opacity}"/>'

def sun(cx, cy, r_, uid, o=1):
    return (f'<circle cx="{cx}" cy="{cy}" r="{r_*3.2:.0f}" fill="url(#sun{uid})" opacity="{0.55*o:.2f}"/>'
            f'<circle cx="{cx}" cy="{cy}" r="{r_:.0f}" fill="#fff1c4" opacity="{o}"/>')

def full_moon(cx, cy, r_, uid):
    return (f'<circle cx="{cx}" cy="{cy}" r="{r_*2.6:.0f}" fill="#fff" opacity=".08" filter="url(#blur{uid})"/>'
            f'<circle cx="{cx}" cy="{cy}" r="{r_}" fill="url(#moon{uid})"/>'
            f'<g fill="#b9b19c" opacity=".35"><circle cx="{cx-r_*.3:.0f}" cy="{cy-r_*.25:.0f}" r="{r_*.22:.0f}"/>'
            f'<circle cx="{cx+r_*.32:.0f}" cy="{cy+r_*.28:.0f}" r="{r_*.15:.0f}"/><circle cx="{cx+r_*.1:.0f}" cy="{cy-r_*.45:.0f}" r="{r_*.09:.0f}"/></g>')

def crescent(cx, cy, r_, color='#f3eee4'):
    return (f'<path d="M{cx} {cy-r_} A{r_} {r_} 0 1 0 {cx} {cy+r_} A{r_*0.78:.0f} {r_} 0 1 1 {cx} {cy-r_} Z" fill="{color}"/>')

def diya(cx, cy, s, uid, flame='#ffcf6b'):
    return (f'<g><circle cx="{cx}" cy="{cy-s*0.9:.0f}" r="{s*2.4:.0f}" fill="{flame}" opacity=".28" filter="url(#blur{uid})"/>'
            f'<path d="M{cx-s*1.1:.0f} {cy-s*0.2:.0f} Q{cx} {cy+s*0.9:.0f} {cx+s*1.1:.0f} {cy-s*0.2:.0f} Z" fill="#b8642f"/>'
            f'<path d="M{cx} {cy-s*1.6:.0f} Q{cx+s*0.42:.0f} {cy-s*0.8:.0f} {cx} {cy-s*0.35:.0f} Q{cx-s*0.42:.0f} {cy-s*0.8:.0f} {cx} {cy-s*1.6:.0f} Z" fill="{flame}"/>'
            f'<path d="M{cx} {cy-s*1.15:.0f} Q{cx+s*0.16:.0f} {cy-s*0.75:.0f} {cx} {cy-s*0.5:.0f} Q{cx-s*0.16:.0f} {cy-s*0.75:.0f} {cx} {cy-s*1.15:.0f} Z" fill="#fff6d0"/></g>')

def meteor(x, y, length, angle, w=2.2):
    a = math.radians(angle)
    x2, y2 = x + length * math.cos(a), y + length * math.sin(a)
    return (f'<line x1="{x:.0f}" y1="{y:.0f}" x2="{x2:.0f}" y2="{y2:.0f}" stroke="url(#met)" stroke-width="{w}" stroke-linecap="round"/>')

def pine(x, base, h, color):
    w = h * 0.42
    return (f'<path d="M{x} {base-h} L{x+w*0.5:.0f} {base-h*0.55:.0f} L{x+w*0.3:.0f} {base-h*0.55:.0f} L{x+w*0.65:.0f} {base-h*0.18:.0f} '
            f'L{x+w*0.12:.0f} {base-h*0.18:.0f} L{x+w*0.12:.0f} {base} L{x-w*0.12:.0f} {base} L{x-w*0.12:.0f} {base-h*0.18:.0f} '
            f'L{x-w*0.65:.0f} {base-h*0.18:.0f} L{x-w*0.3:.0f} {base-h*0.55:.0f} L{x-w*0.5:.0f} {base-h*0.55:.0f} Z" fill="{color}"/>')

def frame(body):
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" width="{W}" height="{H}">'
            '<defs><linearGradient id="met" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity="0"/>'
            '<stop offset="1" stop-color="#fff" stop-opacity=".95"/></linearGradient>'
            '<radialGradient id="vig" cx=".5" cy=".45" r=".78"><stop offset=".62" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".42"/></radialGradient></defs>' + body +
            '<rect width="1200" height="675" fill="url(#vig)"/><rect width="1200" height="675" fill="none" stroke="#f3eee4" stroke-opacity=".06" stroke-width="2"/></svg>')

# --- monthly scenes ------------------------------------------------------------
def month_scene(m):
    uid = f'm{m}'
    r = rng(1000 + m)
    pal = PAL[m]
    top, mid, glow, land, acc = pal
    sign = {1:'capricorn',2:'aquarius',3:'pisces',4:'aries',5:'taurus',6:'gemini',7:'cancer',8:'leo',9:'virgo',10:'libra',11:'scorpio',12:'sagittarius'}[m]
    b = [sky(pal, uid), milky(r, uid), stars(r, 220)]
    cbox = (70, 60, 430, 300)  # default constellation placement (upper left)
    if m == 1:   # Makara Sankranti: kites over a snowy winter horizon
        b.append(constellation(sign, 700, 70, 420, 250, uid=uid))
        b.append(sun(330, 560, 46, uid, 0.95))
        b.append(hills(r, 560, 60, '#1c2a52', 6))
        b.append(hills(r, 600, 40, '#dfe7f5', 5, 0.9))
        b.append(hills(r, 640, 25, '#c3d0e8', 4))
        for i, (kx, ky, kc) in enumerate([(220, 250, '#f2a65a'), (400, 170, '#e05a8a'), (560, 300, '#ffd166'), (130, 380, '#7fd1b9')]):
            s = 34 - i * 3
            b.append(f'<path d="M{kx} {ky-s} L{kx+s} {ky} L{kx} {ky+s} L{kx-s} {ky} Z" fill="{kc}" opacity=".95"/>'
                     f'<path d="M{kx} {ky-s} L{kx} {ky+s} M{kx-s} {ky} L{kx+s} {ky}" stroke="#000" stroke-opacity=".25" stroke-width="1.5"/>'
                     f'<path d="M{kx} {ky+s} q-20 40 10 80 q25 40 -15 90" fill="none" stroke="#f3eee4" stroke-opacity=".45" stroke-width="1.4"/>')
    elif m == 2:  # Maha Shivaratri: crescent, trident on a dark mountain
        b.append(constellation(sign, 660, 60, 470, 300, uid=uid))
        b.append(crescent(300, 170, 70))
        b.append(hills(r, 520, 220, '#0f1a3a', 4, 1, sharp=True))
        b.append(hills(r, 600, 70, land, 5))
        tx, ty = 600, 300
        b.append(f'<g fill="none" stroke="#cfe0ff" stroke-width="7" stroke-linecap="round" opacity=".92">'
                 f'<line x1="{tx}" y1="{ty}" x2="{tx}" y2="{ty+300}"/>'
                 f'<path d="M{tx-70} {ty-40} Q{tx-70} {ty+40} {tx} {ty+40} Q{tx+70} {ty+40} {tx+70} {ty-40}"/>'
                 f'<path d="M{tx} {ty-90} L{tx} {ty+40}"/></g>'
                 f'<path d="M{tx-14} {ty-90} L{tx} {ty-125} L{tx+14} {ty-90} Z M{tx-84} {ty-40} L{tx-70} {ty-75} L{tx-56} {ty-40} Z M{tx+56} {ty-40} L{tx+70} {ty-75} L{tx+84} {ty-40} Z" fill="#cfe0ff" opacity=".92"/>'
                 f'<circle cx="{tx}" cy="{ty-10}" r="160" fill="#cfe0ff" opacity=".07" filter="url(#blur{uid})"/>')
    elif m == 3:  # Holi: clouds of colour powder at dusk
        b.append(constellation(sign, 640, 50, 500, 270, uid=uid))
        for cx, cy, rad, col in [(250, 430, 170, '#ff5fa2'), (470, 380, 150, '#ffd166'), (680, 450, 170, '#52d1a0'),
                                 (900, 400, 150, '#6aa8ff'), (380, 500, 140, '#c77dff'), (800, 520, 130, '#ff8f5a')]:
            b.append(f'<circle cx="{cx}" cy="{cy}" r="{rad}" fill="{col}" opacity=".42" filter="url(#blur{uid})"/>')
        for _ in range(28):
            cx, cy, col = r.uniform(120, 1080), r.uniform(330, 600), r.choice(['#ff5fa2','#ffd166','#52d1a0','#6aa8ff','#c77dff','#ff8f5a'])
            for k in range(5):
                b.append(f'<circle cx="{cx+r.uniform(-40,40):.0f}" cy="{cy+r.uniform(-25,25):.0f}" r="{r.uniform(14,34):.0f}" fill="{col}" opacity=".33" filter="url(#soft{uid})"/>')
        for _ in range(160):
            b.append(f'<circle cx="{r.uniform(100,1100):.0f}" cy="{r.uniform(300,620):.0f}" r="{r.uniform(1,3.2):.1f}" fill="{r.choice(["#ff5fa2","#ffd166","#52d1a0","#6aa8ff","#c77dff"])}" opacity=".8"/>')
        b.append(hills(r, 620, 30, land, 6))
    elif m == 4:  # Mesha Sankranti: spring dawn, sun rising, young fields
        b.append(constellation(sign, 120, 70, 460, 230, uid=uid))
        b.append(sun(820, 520, 70, uid))
        for i in range(12):
            a = math.radians(-180 + i * 15)
            b.append(f'<line x1="{820+100*math.cos(a):.0f}" y1="{520+100*math.sin(a):.0f}" x2="{820+260*math.cos(a):.0f}" y2="{520+260*math.sin(a):.0f}" stroke="#ffd9a0" stroke-opacity=".25" stroke-width="3"/>')
        b.append(hills(r, 540, 50, '#2c4a35', 6))
        b.append(hills(r, 590, 35, '#3f6b3e', 5))
        b.append(hills(r, 640, 20, '#24402a', 4))
        for i in range(70):
            x = r.uniform(0, W); y = r.uniform(600, 675)
            b.append(f'<path d="M{x:.0f} {y:.0f} q3 -16 1 -26" stroke="#8fd3a0" stroke-opacity=".6" stroke-width="2" fill="none"/>')
    elif m == 5:  # Vaishakha/Buddha Purnima: full moon over a lotus pond; Pleiades in Taurus
        b.append(constellation(sign, 640, 70, 480, 260, uid=uid))
        for i in range(7):
            b.append(f'<circle cx="{1040+r.uniform(-30,30):.0f}" cy="{150+r.uniform(-20,20):.0f}" r="{r.uniform(2,3.5):.1f}" fill="#dfe9ff"/>')
        b.append(full_moon(340, 220, 95, uid))
        b.append(f'<rect x="0" y="470" width="{W}" height="205" fill="#05202a"/>')
        b.append(f'<ellipse cx="340" cy="520" rx="60" ry="200" fill="#fff6dd" opacity=".12" filter="url(#blur{uid})"/>')
        for i in range(10):
            y = 480 + i * 18
            b.append(f'<line x1="{340-50+r.uniform(-10,10):.0f}" y1="{y}" x2="{340+50+r.uniform(-10,10):.0f}" y2="{y}" stroke="#fff6dd" stroke-opacity="{0.35-i*0.03:.2f}" stroke-width="3"/>')
        for lx, ly, s in [(600, 560, 1.0), (820, 600, 0.8), (180, 610, 0.7), (980, 545, 0.65)]:
            b.append(f'<ellipse cx="{lx}" cy="{ly+18*s:.0f}" rx="{90*s:.0f}" ry="{16*s:.0f}" fill="#1f5a48"/>')
            for k, ang in enumerate([-60, -30, 0, 30, 60]):
                a = math.radians(ang - 90)
                px, py = lx + 34 * s * math.cos(a), ly + 34 * s * math.sin(a)
                b.append(f'<ellipse cx="{(lx+px)/2:.0f}" cy="{(ly+py)/2:.0f}" rx="{11*s:.0f}" ry="{26*s:.0f}" fill="{"#f6b8cf" if k%2 else "#f7cfe0"}" transform="rotate({ang} {(lx+px)/2:.0f} {(ly+py)/2:.0f})"/>')
    elif m == 6:  # International Yoga Day / solstice: practitioner at dawn
        b.append(constellation(sign, 90, 60, 420, 280, uid=uid))
        b.append(sun(820, 470, 80, uid))
        b.append(hills(r, 560, 70, '#2b3326', 5))
        b.append(f'<path d="M600 675 Q760 470 1200 520 L1200 675 Z" fill="#141a12"/>')
        x, y = 860, 470  # tree pose silhouette on the ridge
        b.append(f'<g fill="#0c100b"><circle cx="{x}" cy="{y-118}" r="15"/>'
                 f'<path d="M{x-11} {y-100} L{x+11} {y-100} L{x+9} {y-30} L{x+4} {y+38} L{x-4} {y+38} L{x-9} {y-30} Z"/>'
                 f'<path d="M{x-4} {y-30} L{x-38} {y-8} L{x-8} {y+2} Z"/>'
                 f'<path d="M{x-9} {y-96} L{x-26} {y-150} L{x-4} {y-196} L{x-1} {y-190} L{x-16} {y-150} L{x-2} {y-100} Z"/>'
                 f'<path d="M{x+9} {y-96} L{x+26} {y-150} L{x+4} {y-196} L{x+1} {y-190} L{x+16} {y-150} L{x+2} {y-100} Z"/></g>')
    elif m == 7:  # Guru Purnima in the monsoon: full moon through clouds, rain
        b.append(constellation(sign, 700, 90, 400, 260, uid=uid))
        b.append(full_moon(420, 230, 90, uid))
        for cx, cy, rx in [(260, 330, 260), (620, 300, 300), (980, 360, 280), (420, 120, 200)]:
            b.append(f'<ellipse cx="{cx}" cy="{cy}" rx="{rx}" ry="70" fill="#2b3a4f" opacity=".85" filter="url(#blur{uid})"/>')
        for _ in range(180):
            x = r.uniform(0, W); y = r.uniform(330, 640)
            b.append(f'<line x1="{x:.0f}" y1="{y:.0f}" x2="{x-8:.0f}" y2="{y+26:.0f}" stroke="#bcd0e6" stroke-opacity=".35" stroke-width="1.4"/>')
        b.append(hills(r, 610, 40, '#0b1a17', 6))
        b.append(diya(600, 640, 16, uid))
    elif m == 8:  # Perseids over night fields
        b.append(constellation(sign, 90, 80, 480, 260, uid=uid))
        for _ in range(9):
            b.append(meteor(r.uniform(500, 1150), r.uniform(40, 330), r.uniform(120, 260), r.uniform(140, 165), r.uniform(1.6, 3)))
        b.append(hills(r, 560, 50, '#121c35', 6))
        b.append(hills(r, 610, 30, '#0c1426', 5))
        for i in range(14):
            b.append(f'<line x1="{i*90}" y1="675" x2="{600+(i*90-600)*0.25:.0f}" y2="600" stroke="#2a3a63" stroke-opacity=".45" stroke-width="2"/>')
    elif m == 9:  # Equinox: day and night in balance, harvest
        b = [f'<defs><linearGradient id="eq{uid}" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#f0b37a"/><stop offset=".44" stop-color="#7a5a8a"/>'
             f'<stop offset=".56" stop-color="#2a2a5a"/><stop offset="1" stop-color="#0a1030"/></linearGradient></defs>', sky(pal, uid)]
        b.append(f'<rect width="{W}" height="{H}" fill="url(#eq{uid})" opacity=".85"/>')
        b.append(stars(r, 120))
        b.append(constellation(sign, 680, 70, 430, 290, uid=uid))
        b.append(sun(250, 260, 60, uid))
        b.append(f'<line x1="600" y1="40" x2="600" y2="560" stroke="#f3eee4" stroke-opacity=".25" stroke-dasharray="4 10"/>')
        b.append(hills(r, 570, 30, '#3a2a12', 6))
        for i in range(48):
            x = 20 + i * 24 + r.uniform(-6, 6); y = 675
            hgt = r.uniform(70, 120)
            b.append(f'<path d="M{x:.0f} {y} Q{x+4:.0f} {y-hgt*0.6:.0f} {x+10:.0f} {y-hgt:.0f}" stroke="#d9a94e" stroke-width="2.2" fill="none" opacity=".85"/>'
                     f'<ellipse cx="{x+10:.0f}" cy="{y-hgt-8:.0f}" rx="4" ry="12" fill="#f2c96a" opacity=".9" transform="rotate(18 {x+10:.0f} {y-hgt-8:.0f})"/>')
    elif m == 10:  # Navaratri: nine lamps in an arc, autumn dusk
        b.append(constellation(sign, 640, 60, 460, 260, uid=uid))
        b.append(hills(r, 560, 40, '#2a160d', 6))
        b.append(f'<rect x="0" y="575" width="{W}" height="100" fill="#140b07"/>')
        for i in range(9):
            a = math.radians(200 + i * 17.5)
            x = 600 + 430 * math.cos(a); y = 640 + 230 * math.sin(a)
            b.append(diya(round(x), round(y), 20, uid))
        for _ in range(26):
            lx, ly = r.uniform(0, W), r.uniform(80, 520)
            b.append(f'<ellipse cx="{lx:.0f}" cy="{ly:.0f}" rx="7" ry="3.5" fill="{r.choice(["#c8783e","#e0a050","#9a4a24"])}" opacity=".7" transform="rotate({r.uniform(0,180):.0f} {lx:.0f} {ly:.0f})"/>')
    elif m == 11:  # Kartika & Diwali: lamps floating on the river; Scorpius with red Antares
        b.append(constellation(sign, 660, 50, 420, 300, uid=uid, red=True))
        b.append(f'<rect x="0" y="430" width="{W}" height="245" fill="#090b1c"/>')
        b.append(hills(r, 440, 60, '#120f22', 6))
        for i in range(16):
            x = r.uniform(60, 1140); y = r.uniform(480, 650); s = 6 + (y - 470) / 26
            b.append(f'<ellipse cx="{x:.0f}" cy="{y+s*1.8:.0f}" rx="{s*0.8:.0f}" ry="{s*4:.0f}" fill="#ffb347" opacity=".18" filter="url(#soft{uid})"/>')
            b.append(diya(round(x), round(y), round(s), uid))
        b.append(f'<circle cx="250" cy="200" r="3" fill="#fff"/>')
    elif m == 12:  # Winter solstice: Geminids over a snowy forest; Sagittarius
        b.append(constellation(sign, 640, 80, 460, 250, uid=uid))
        for _ in range(6):
            b.append(meteor(r.uniform(100, 600), r.uniform(60, 260), r.uniform(100, 200), r.uniform(20, 40), 2))
        b.append(hills(r, 560, 40, '#dfe7f5', 5, 0.85))
        b.append(hills(r, 620, 25, '#c3d0e8', 4))
        for i in range(22):
            x = r.uniform(0, W); base = r.uniform(560, 640); h = r.uniform(90, 190)
            b.append(pine(round(x), round(base), round(h), '#0d1a2e'))
        for _ in range(90):
            b.append(f'<circle cx="{r.uniform(0,W):.0f}" cy="{r.uniform(0,H):.0f}" r="{r.uniform(1,2.4):.1f}" fill="#fff" opacity=".55"/>')
    return frame(''.join(b))

# --- weekly charts -----------------------------------------------------------------
def sun_sign_for(date):
    """(sign, fraction 0..1 through the sign) for a calendar date, approximate."""
    y = date.year
    starts = []
    for s in SIGNS:
        mo, d = INGRESS[s]
        for yy in (y - 1, y, y + 1):
            starts.append((datetime.date(yy, mo, d), s))
    starts.sort()
    prev = max(st for st in starts if st[0] <= date)
    nxt = min(st for st in starts if st[0] > date)
    frac = (date - prev[0]).days / (nxt[0] - prev[0]).days
    return prev[1], frac

def mix(c1, c2, t):
    a = [int(c1[i:i+2], 16) for i in (1, 3, 5)]; b = [int(c2[i:i+2], 16) for i in (1, 3, 5)]
    return '#' + ''.join(f'{round(a[i] + (b[i]-a[i]) * t):02x}' for i in range(3))

def week_scene(week):
    uid = f'w{week}'
    r = rng(5000 + week)
    thursday = datetime.date.fromisocalendar(2026, min(week, 53) if week < 53 else 53, 4) if week <= 53 else None
    sign, frac = sun_sign_for(thursday)
    m = thursday.month + (thursday.day - 1) / 31
    m1 = int(m) if int(m) >= 1 else 12
    m2 = m1 % 12 + 1
    t = m - int(m)
    pal = tuple(mix(PAL[m1][i], PAL[m2][i], t) for i in range(5))
    b = [sky(pal, uid, glow_y=0.95), milky(r, uid, o=0.12), stars(r, 260, ymax=560)]
    # Ecliptic arc across the frame; the Sun's place along it marks the week.
    b.append(f'<path d="M-60 520 Q600 170 1260 520" fill="none" stroke="#f2c982" stroke-opacity=".28" stroke-width="2"/>'
             f'<path d="M-60 520 Q600 170 1260 520" fill="none" stroke="#f2c982" stroke-opacity=".08" stroke-width="56"/>')
    b.append(constellation(sign, 330, 110, 540, 300, uid=uid, red=(sign == 'scorpio')))
    # Sign boundaries on the arc and the Sun's position within the sign.
    def arc(tt):
        x = (1 - tt) ** 2 * -60 + 2 * (1 - tt) * tt * 600 + tt ** 2 * 1260
        y = (1 - tt) ** 2 * 520 + 2 * (1 - tt) * tt * 170 + tt ** 2 * 520
        return x, y
    t0, t1 = 0.22, 0.78
    for tt in (t0, t1):
        x, y = arc(tt)
        b.append(f'<line x1="{x:.0f}" y1="{y-26:.0f}" x2="{x:.0f}" y2="{y+26:.0f}" stroke="#f2c982" stroke-opacity=".5" stroke-width="2"/>')
    sx, sy = arc(t0 + (t1 - t0) * frac)
    b.append(sun(round(sx), round(sy), 26, uid))
    for k in range(1, 8):  # the week's seven days as small marks just ahead of the Sun
        tx, ty = arc(min(t1, t0 + (t1 - t0) * frac + k * 0.0065))
        b.append(f'<circle cx="{tx:.0f}" cy="{ty:.0f}" r="2.6" fill="#ffe2a8" opacity="{0.9-k*0.1:.2f}"/>')
    # Season on the ground: snow, young grass, summer water, autumn fields.
    season = 'winter' if week >= 49 or week <= 9 else 'spring' if week <= 21 else 'summer' if week <= 35 else 'autumn'
    if season == 'winter':
        b.append(hills(r, 600, 45, '#cfdbef', 7, 0.92)); b.append(hills(r, 640, 25, '#b7c6e0', 5))
        for _ in range(9):
            b.append(pine(round(r.uniform(0, W)), round(r.uniform(610, 660)), round(r.uniform(70, 130)), '#0d1a2e'))
    elif season == 'spring':
        b.append(hills(r, 600, 45, '#2c4a35', 7)); b.append(hills(r, 640, 25, '#3f6b3e', 5))
        for _ in range(60):
            x = r.uniform(0, W); y = r.uniform(630, 675)
            b.append(f'<path d="M{x:.0f} {y:.0f} q3 -14 1 -22" stroke="#8fd3a0" stroke-opacity=".55" stroke-width="2" fill="none"/>')
    elif season == 'summer':
        b.append(hills(r, 590, 40, mix(pal[3], '#000000', 0.2), 7))
        b.append(f'<rect x="0" y="615" width="{W}" height="60" fill="#06141c"/>')
        for _ in range(26):  # starlight shimmer on calm summer water
            x = r.uniform(0, W); y = r.uniform(624, 670); ln = r.uniform(20, 70)
            b.append(f'<line x1="{x:.0f}" y1="{y:.0f}" x2="{x+ln:.0f}" y2="{y:.0f}" stroke="#cfe0ff" stroke-opacity="{r.uniform(.12,.3):.2f}" stroke-width="1.6"/>')
    else:
        b.append(hills(r, 600, 40, '#2a1a0e', 7)); b.append(hills(r, 640, 20, '#1a0f08', 5))
        for i in range(40):
            x = 10 + i * 30 + r.uniform(-6, 6); hgt = r.uniform(40, 70)
            b.append(f'<path d="M{x:.0f} 675 Q{x+3:.0f} {675-hgt*0.6:.0f} {x+7:.0f} {675-hgt:.0f}" stroke="#c99a48" stroke-width="2" fill="none" opacity=".7"/>')
    # Zodiac dial: twelve signs, this one lit, the Sun at its place within it.
    cx, cy, R = 1080, 112, 62
    idx = SIGNS.index(sign)
    b.append(f'<circle cx="{cx}" cy="{cy}" r="{R}" fill="#0a1224" fill-opacity=".55" stroke="#f2c982" stroke-opacity=".35"/>')
    for i in range(12):
        a0 = math.radians(-90 + i * 30); a1 = math.radians(-90 + (i + 1) * 30)
        x0, y0, x1, y1 = cx + R*math.cos(a0), cy + R*math.sin(a0), cx + R*math.cos(a1), cy + R*math.sin(a1)
        if i == idx:
            b.append(f'<path d="M{cx} {cy} L{x0:.1f} {y0:.1f} A{R} {R} 0 0 1 {x1:.1f} {y1:.1f} Z" fill="#f2c982" fill-opacity=".38"/>')
        b.append(f'<line x1="{cx}" y1="{cy}" x2="{x0:.1f}" y2="{y0:.1f}" stroke="#f2c982" stroke-opacity=".22"/>')
    a = math.radians(-90 + (idx + frac) * 30)
    b.append(f'<circle cx="{cx+R*0.72*math.cos(a):.1f}" cy="{cy+R*0.72*math.sin(a):.1f}" r="7" fill="#fff1c4"/>'
             f'<circle cx="{cx}" cy="{cy}" r="4" fill="#f3eee4" opacity=".7"/>')
    return frame(''.join(b)), sign, frac

def main(out):
    os.makedirs(out, exist_ok=True)
    meta = {}
    for m in range(1, 13):
        open(os.path.join(out, f'month-{m:02d}.svg'), 'w').write(month_scene(m))
    for w in range(1, 54):
        svg, sign, frac = week_scene(w)
        open(os.path.join(out, f'week-{w:02d}.svg'), 'w').write(svg)
        meta[w] = (sign, round(frac, 2))
    import json
    json.dump(meta, open(os.path.join(out, 'weeks.json'), 'w'))
    render(out)

def render(out):
    from playwright.sync_api import sync_playwright
    from PIL import Image
    files = sorted(f for f in os.listdir(out) if f.endswith('.svg'))
    with sync_playwright() as p:
        b = p.chromium.launch(executable_path='/usr/bin/google-chrome')
        pg = b.new_page(viewport={'width': W, 'height': H})
        for f in files:
            pg.set_content('<html><body style="margin:0;background:#000">' + open(os.path.join(out, f)).read() + '</body></html>')
            png = os.path.join(out, f[:-4] + '.png')
            pg.screenshot(path=png, clip={'x': 0, 'y': 0, 'width': W, 'height': H})
            im = Image.open(png).convert('RGB')
            im.save(os.path.join(out, f[:-4] + '.webp'), 'WEBP', quality=80, method=6)
            im.save(os.path.join(out, f[:-4] + '.jpg'), 'JPEG', quality=84, optimize=True, progressive=True)
            im.resize((480, 270), Image.LANCZOS).save(os.path.join(out, f[:-4] + '-sm.webp'), 'WEBP', quality=78, method=6)
            os.remove(png)
        b.close()

if __name__ == '__main__':
    main(sys.argv[1] if len(sys.argv) > 1 else 'out')
