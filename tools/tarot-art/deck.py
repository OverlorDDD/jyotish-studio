"""Galaxiora original Tarot art — sample set for design review.
Symbolic emblem deck: every card is a night sky inside an Indian torana arch, lit by one glow,
with the card's traditional symbols drawn in fine saffron-gold line. No figures copied from any deck."""
import math, random, json, os

G = '#E7BD72'      # saffron gold (line)
G2 = '#F6DCA4'     # highlight gold
IV = '#F3EEE4'     # starlight ivory
W, H = 300, 520
CX, CY = 150, 270

def stroke(w=2.2, op=1, col=G):
    return f'fill="none" stroke="{col}" stroke-width="{w}" stroke-linecap="round" stroke-linejoin="round" opacity="{op}"'

def star_path(cx, cy, r1, r2, n=8, rot=-90):
    pts = []
    for i in range(n * 2):
        r = r1 if i % 2 == 0 else r2
        a = math.radians(rot + i * 180 / n)
        pts.append(f'{cx + r*math.cos(a):.1f},{cy + r*math.sin(a):.1f}')
    return 'M' + ' L'.join(pts) + ' Z'

def rays(cx, cy, r1, r2, n, w=1.6, op=.9, wavy=False):
    out = []
    for i in range(n):
        a = math.radians(i * 360 / n)
        x1, y1 = cx + r1*math.cos(a), cy + r1*math.sin(a)
        x2, y2 = cx + r2*math.cos(a), cy + r2*math.sin(a)
        if wavy and i % 2:
            nx, ny = -math.sin(a)*4, math.cos(a)*4
            mx, my = (x1+x2)/2, (y1+y2)/2
            out.append(f'<path d="M{x1:.1f} {y1:.1f} Q{(x1+mx)/2+nx:.1f} {(y1+my)/2+ny:.1f} {mx:.1f} {my:.1f} T{x2:.1f} {y2:.1f}" {stroke(w, op)}/>')
        else:
            out.append(f'<line x1="{x1:.1f}" y1="{y1:.1f}" x2="{x2:.1f}" y2="{y2:.1f}" {stroke(w, op)}/>')
    return ''.join(out)

def drop(x, y, s=1, op=.85):
    return f'<path d="M{x} {y-7*s} C{x+4*s} {y-1*s} {x+4*s} {y+4*s} {x} {y+4*s} C{x-4*s} {y+4*s} {x-4*s} {y-1*s} {x} {y-7*s} Z" fill="{G}" opacity="{op}"/>'

def waves(y, x1=70, x2=230, amp=4, step=20, op=.8, w=1.6):
    d = f'M{x1} {y}'
    x = x1
    up = True
    while x < x2:
        d += f' q{step/2} {-amp if up else amp} {step} 0'
        x += step; up = not up
    return f'<path d="{d}" {stroke(w, op)}/>'

def flower(cx, cy, r=7, petals=10, op=1):
    out = [f'<circle cx="{cx}" cy="{cy}" r="{r*.55:.1f}" fill="{G}" opacity="{op*.85}"/>']
    for i in range(petals):
        a = i * 360 / petals
        out.append(f'<ellipse cx="{cx}" cy="{cy - r*1.15:.1f}" rx="{r*.32:.1f}" ry="{r*.6:.1f}" transform="rotate({a} {cx} {cy})" {stroke(1.2, op)}/>')
    return ''.join(out)

def chalice(cx, top, s=1, op=1):
    w = 26*s
    return (f'<path d="M{cx-w} {top} C{cx-w} {top+30*s} {cx-10*s} {top+40*s} {cx} {top+40*s} C{cx+10*s} {top+40*s} {cx+w} {top+30*s} {cx+w} {top} Z" {stroke(2.2*s if s>.6 else 1.6, op)}/>'
            f'<line x1="{cx-w}" y1="{top}" x2="{cx+w}" y2="{top}" {stroke(2.2 if s>.6 else 1.6, op)}/>'
            f'<path d="M{cx} {top+40*s} V{top+66*s} M{cx-6*s} {top+52*s} H{cx+6*s} M{cx-18*s} {top+70*s} Q{cx} {top+60*s} {cx+18*s} {top+70*s} Z" {stroke(2 if s>.6 else 1.5, op)}/>')

def sword(x1, y1, x2, y2, w=2, op=1):
    ang = math.atan2(y2-y1, x2-x1)
    px, py = -math.sin(ang), math.cos(ang)
    hx, hy = x1 + (x2-x1)*.16, y1 + (y2-y1)*.16
    return (f'<line x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}" {stroke(w, op)}/>'
            f'<line x1="{hx-px*11:.1f}" y1="{hy-py*11:.1f}" x2="{hx+px*11:.1f}" y2="{hy+py*11:.1f}" {stroke(w, op)}/>'
            f'<circle cx="{x1}" cy="{y1}" r="3.2" fill="{G}" opacity="{op}"/>')

def pentacle(cx, cy, r, op=1, w=1.6):
    return f'<circle cx="{cx}" cy="{cy}" r="{r}" {stroke(w, op)}/><path d="{star_path(cx, cy, r*.82, r*.32, 5)}" {stroke(w*.8, op)}/>'

def wand(x1, y1, x2, y2, op=1, w=2.2, leaves=True):
    out = f'<line x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}" {stroke(w, op)}/>'
    if leaves:
        for t in (.25, .5):
            x, y = x1 + (x2-x1)*t, y1 + (y2-y1)*t
            out += f'<path d="M{x:.1f} {y:.1f} q7 -4 9 -11 q-8 1 -9 11" fill="{G}" opacity="{op*.75}"/>'
    return out

# ---------- the emblems (centre of the arch ~ 150,270; usable 66..234 x 150..420) ----------
def fool():
    return ''.join([
        f'<circle cx="206" cy="176" r="15" {stroke()}/>', rays(206, 176, 21, 30, 12, 1.5, .85),
        f'<path d="M62 414 V352 L104 338 L140 346 L176 334 L178 414" {stroke()}/>',
        f'<path d="M178 334 L186 352 L182 380 L190 414" {stroke(1.4, .6)}/>',
        f'<path d="M196 414 L212 388 L222 400 L240 376" {stroke(1.5, .55)}/>',
        f'<line x1="104" y1="326" x2="156" y2="226" {stroke()}/>',
        f'<path d="M150 216 q14 -10 26 2 q-2 16 -18 16 q-12 -2 -8 -18 Z" {stroke()}/>',
        f'<path d="M156 222 l12 8" {stroke(1.2, .8)}/>',
        flower(112, 268, 7, 5),
        f'<path d="M112 276 Q114 300 108 318" {stroke(1.4, .8)}/>',
        ''.join(f'<circle cx="{x}" cy="{y}" r="1.8" fill="{G2}" opacity=".7"/>' for x, y in ((122, 342), (138, 344), (154, 340), (168, 336))),
    ])

def magician():
    lem = 'M150 172 C134 152 108 152 108 172 C108 192 134 192 150 172 C166 152 192 152 192 172 C192 192 166 192 150 172 Z'
    return ''.join([
        f'<path d="{lem}" {stroke(2.4)}/>', rays(150, 172, 54, 62, 16, 1.1, .45),
        f'<line x1="150" y1="204" x2="150" y2="304" {stroke(2.6)}/>',
        f'<circle cx="150" cy="200" r="5" fill="{G2}"/><circle cx="150" cy="308" r="5" fill="{G2}"/>',
        f'<path d="M72 346 H228 M84 346 V404 M216 346 V404" {stroke()}/>',
        chalice(92, 306, .5), pentacle(128, 326, 13), sword(162, 340, 182, 304, 1.6),
        wand(206, 342, 212, 300, 1, 1.8, False),
    ])

def high_priestess():
    pillar = lambda x, letter: (f'<rect x="{x}" y="186" width="22" height="214" {stroke()}/>'
                                f'<path d="M{x-5} 186 H{x+27} M{x-5} 400 H{x+27} M{x-2} 178 H{x+24}" {stroke(1.8)}/>'
                                f'<text x="{x+11}" y="300" text-anchor="middle" font-family="DM Sans, Inter, sans-serif" font-size="15" font-weight="600" fill="{G2}">{letter}</text>')
    veil = 'M94 222 Q150 250 206 222'
    return ''.join([
        pillar(72, 'B'), pillar(206, 'J'),
        f'<path d="M150 158 a26 26 0 1 0 0.1 0 Z" {stroke(1.2, .35)}/>',
        f'<path d="M140 168 a20 20 0 1 0 22 30 a16 16 0 1 1 -22 -30 Z" fill="{G}" opacity=".95"/>',
        f'<path d="{veil}" {stroke(1.6, .8)}/>',
        ''.join(f'<circle cx="{x}" cy="{y}" r="4.2" {stroke(1.3, .85)}/>' for x, y in ((112, 232), (132, 238), (150, 240), (168, 238), (188, 232))),
        f'<path d="M150 254 V282 M136 268 H164" {stroke(2)}/>',
        f'<rect x="122" y="312" width="56" height="36" rx="6" {stroke()}/>',
        f'<path d="M132 324 H168 M132 334 H160" {stroke(1.2, .7)}/>',
        f'<text x="150" y="345" text-anchor="middle" font-family="DM Sans, Inter, sans-serif" font-size="9" letter-spacing="2" fill="{G2}" opacity=".0">TORA</text>',
    ])

def lovers():
    wing = lambda s: f'<path d="M{150+s*24} 182 C{150+s*60} 150 {150+s*84} 168 {150+s*92} 196 C{150+s*70} 186 {150+s*56} 196 {150+s*42} 206 C{150+s*62} 204 {150+s*74} 212 {150+s*80} 226 C{150+s*58} 216 {150+s*40} 214 {150+s*26} 206" {stroke(1.8)}/>'
    heart = 'M150 352 C150 352 134 340 134 328 C134 320 142 316 150 324 C158 316 166 320 166 328 C166 340 150 352 150 352 Z'
    return ''.join([
        f'<circle cx="150" cy="186" r="20" {stroke()}/>', rays(150, 186, 25, 33, 16, 1.3, .8), wing(-1), wing(1),
        f'<circle cx="126" cy="322" r="38" {stroke()}/><circle cx="174" cy="322" r="38" {stroke()}/>',
        f'<path d="{heart}" fill="{G}" opacity=".95"/>',
        f'<path d="M98 404 L150 360 L202 404" {stroke(1.6, .7)}/>',
        flower(108, 306, 5, 6, .8), f'<path d="M190 300 l6 -10 l6 10 l-6 8 Z" {stroke(1.4, .85)}/>',
    ])

def wheel():
    spokes = ''.join(f'<line x1="{150+12*math.cos(math.radians(a)):.1f}" y1="{270+12*math.sin(math.radians(a)):.1f}" x2="{150+50*math.cos(math.radians(a)):.1f}" y2="{270+50*math.sin(math.radians(a)):.1f}" {stroke(1.8)}/>' for a in range(0, 360, 45))
    letters = ''.join(f'<text x="{150+61*math.cos(math.radians(a-90)):.1f}" y="{270+61*math.sin(math.radians(a-90))+5:.1f}" text-anchor="middle" font-family="DM Sans, Inter, sans-serif" font-size="13" font-weight="600" fill="{G2}">{l}</text>' for a, l in ((0, 'T'), (90, 'A'), (180, 'R'), (270, 'O')))
    return ''.join([
        f'<circle cx="150" cy="270" r="74" {stroke(2.4)}/><circle cx="150" cy="270" r="50" {stroke(1.6)}/><circle cx="150" cy="270" r="12" {stroke(2)}/>',
        spokes, letters,
        ''.join(f'<path d="{star_path(x, y, 7, 2.6, 4)}" fill="{G2}" opacity=".8"/>' for x, y in ((82, 176), (218, 176), (82, 372), (218, 372))),
        f'<path d="{star_path(150, 270, 5, 2, 4)}" fill="{G2}"/>',
    ])

def tower():
    return ''.join([
        f'<path d="M120 404 L130 214 L170 214 L180 404 Z" {stroke(2.4)}/>',
        f'<path d="M136 252 h10 v16 h-10 Z M154 300 h10 v16 h-10 Z M138 344 h10 v16 h-10 Z" {stroke(1.5, .85)}/>',
        f'<g transform="rotate(28 186 196)"><path d="M168 204 L170 186 L178 194 L186 182 L194 194 L202 186 L204 204 Z" {stroke(2)}/></g>',
        f'<path d="M232 140 L200 180 L214 182 L176 220" {stroke(2.6, 1, G2)}/>',
        ''.join(drop(x, y, .8) for x, y in ((92, 236), (104, 292), (88, 340), (210, 262), (222, 318), (204, 356))),
        f'<path d="M70 404 Q110 396 150 404 T230 404" {stroke(1.6, .7)}/>',
        f'<path d="M146 230 q-6 -14 4 -22 q2 10 8 12 q-2 8 -12 10" fill="{G}" opacity=".55"/>',
    ])

def star():
    small = [(150 + 78*math.cos(math.radians(a)), 214 + 50*math.sin(math.radians(a))) for a in (200, 230, 260, 280, 310, 340, 0)]
    return ''.join([
        f'<path d="{star_path(150, 190, 36, 12, 8)}" fill="{G}" opacity=".95"/>',
        f'<path d="{star_path(150, 190, 22, 8, 8, -67.5)}" fill="{G2}" opacity=".9"/>',
        ''.join(f'<path d="{star_path(x, y, 8, 3, 8)}" fill="{G2}" opacity=".85"/>' for x, y in small),
        f'<path d="M98 300 q-6 -16 6 -26 l18 0 q10 10 4 26 Z M104 274 q-4 -8 4 -12" {stroke()}/>',
        f'<path d="M122 286 C140 290 150 318 150 360" {stroke(1.6, .85)}/>',
        waves(368, 92, 232, 4, 20, .85), waves(384, 100, 224, 3, 16, .55), waves(398, 112, 212, 2.5, 14, .35),
        f'<path d="M70 400 Q84 388 98 400" {stroke(1.4, .6)}/>',
    ])

def moon():
    return ''.join([
        f'<circle cx="150" cy="186" r="30" {stroke(2.2)}/>',
        f'<path d="M150 160 A26 26 0 1 0 150 212 A34 34 0 0 1 150 160 Z" fill="{G}" opacity=".95"/>',
        rays(150, 186, 36, 44, 24, 1, .55),
        ''.join(drop(x, y, .7, .8) for x, y in ((126, 236), (150, 246), (174, 236), (138, 262), (162, 262))),
        f'<path d="M70 392 V300 l11 -10 l11 10 v92 M208 392 V300 l11 -10 l11 10 v92" {stroke()}/>',
        f'<rect x="77" y="318" width="8" height="12" {stroke(1.2, .7)}/><rect x="215" y="318" width="8" height="12" {stroke(1.2, .7)}/>',
        f'<path d="M150 410 C132 394 170 378 150 360 C134 346 164 334 150 318 C140 308 156 300 150 292" {stroke(1.6, .85)}/>',
        waves(408, 96, 204, 3.5, 18, .8),
    ])

def sun():
    return ''.join([
        f'<circle cx="150" cy="214" r="34" fill="{G}" opacity=".22"/><circle cx="150" cy="214" r="34" {stroke(2.4)}/>',
        rays(150, 214, 42, 66, 16, 1.8, .95, wavy=True),
        f'<path d="M70 356 H230 M70 372 H230 M90 356 V372 M120 356 V372 M150 356 V372 M180 356 V372 M210 356 V372" {stroke(1.5, .75)}/>',
        ''.join(f'<path d="M{x} 352 Q{x+3} 330 {x} 312" {stroke(1.4, .85)}/>' + flower(x, 304, 7, 10) for x in (102, 150, 198)),
        f'<path d="M70 404 Q150 392 230 404" {stroke(1.4, .55)}/>',
    ])

def ace_cups():
    dove = 'M150 176 q-18 -4 -26 -16 q14 2 22 8 q-2 -12 4 -22 q6 10 4 22 q8 -6 22 -8 q-8 12 -26 16 Z'
    return ''.join([
        f'<path d="{dove}" {stroke(1.8)}/>', f'<circle cx="150" cy="198" r="7" {stroke(1.6)}/><path d="M150 193 V203 M145 198 H155" {stroke(1.2)}/>',
        chalice(150, 228, 1.25),
        ''.join(f'<path d="M{150+dx} 232 C{150+dx*1.3} 262 {150+dx*1.9} 320 {150+dx*2.1} 368" {stroke(1.3, .7)}/>' for dx in (-30, -18, 18, 30)),
        f'<path d="M150 230 C150 250 150 300 150 300" {stroke(1.4, .0)}/>',
        waves(376, 82, 218, 4, 17, .85), waves(392, 92, 208, 3, 14, .5),
        flower(96, 388, 5, 6, .8), flower(206, 390, 5, 6, .8),
    ])

def three_swords():
    heart = 'M150 340 C150 340 96 304 96 262 C96 236 116 222 134 228 C142 231 147 237 150 244 C153 237 158 231 166 228 C184 222 204 236 204 262 C204 304 150 340 150 340 Z'
    rain = ''.join(f'<line x1="{x}" y1="{y}" x2="{x-6}" y2="{y+14}" {stroke(1.2, .45)}/>' for x, y in ((84, 176), (112, 166), (196, 170), (224, 184), (78, 214), (230, 222), (90, 368), (214, 372), (120, 388), (184, 390)))
    return ''.join([
        f'<path d="M86 196 q12 -22 34 -14 q10 -16 30 -8 q22 -10 34 10 q20 -2 26 14" {stroke(1.6, .6)}/>', rain,
        f'<path d="{heart}" fill="{G}" opacity=".18"/><path d="{heart}" {stroke(2.4)}/>',
        sword(150, 186, 150, 376, 2.2), sword(96, 206, 196, 340, 2.2), sword(204, 206, 104, 340, 2.2),
    ])

def queen_wands():
    crown = 'M118 188 L124 160 L138 176 L150 152 L162 176 L176 160 L182 188 Z'
    cat = ('M178 404 C176 384 180 364 194 356 L192 342 L200 350 L208 342 L208 356 C220 364 224 386 220 404 Z '
           'M220 398 C236 394 240 380 232 372')
    return ''.join([
        f'<path d="M92 404 V250 C92 214 118 198 150 198 C182 198 208 214 208 250 V404" {stroke(1.4, .45)}/>',
        f'<path d="{crown}" {stroke(2.2)}/>', ''.join(f'<circle cx="{x}" cy="{y}" r="2.6" fill="{G2}"/>' for x, y in ((124, 160), (150, 152), (176, 160))),
        wand(134, 214, 134, 400, 1, 2.6),
        f'<path d="M166 404 Q170 330 166 282" {stroke(1.5, .85)}/>', flower(166, 270, 11, 12),
        f'<path d="M166 330 q10 -2 14 -10 q-10 0 -14 10" fill="{G}" opacity=".7"/>',
        f'<path d="{cat}" {stroke(1.8)}/>',
    ])

CARDS = [
    ('fool', '0', 'Блазень', fool), ('magician', 'I', 'Маг', magician), ('high-priestess', 'II', 'Верховна Жриця', high_priestess),
    ('lovers', 'VI', 'Закохані', lovers), ('wheel-of-fortune', 'X', 'Колесо Фортуни', wheel), ('tower', 'XVI', 'Вежа', tower),
    ('star', 'XVII', 'Зірка', star), ('moon', 'XVIII', 'Місяць', moon), ('sun', 'XIX', 'Сонце', sun),
    ('ace-of-cups', 'Туз', 'Туз Кубків', ace_cups), ('three-of-swords', '3', 'Трійка Мечів', three_swords), ('queen-of-wands', '', 'Королева Жезлів', queen_wands),
]
ORBIT_OFF = {'wheel-of-fortune', 'high-priestess'}

ARCH = 'M34 456 V178 C34 116 92 82 150 64 C208 82 266 116 266 178 V456 Z'
ARCH_IN = 'M42 448 V180 C42 124 96 92 150 75 C204 92 258 124 258 180 V448 Z'

def frame(slug, numeral, name, body, orbit=True):
    rnd = random.Random(slug)
    stars = ''.join(f'<circle cx="{rnd.uniform(44, 256):.1f}" cy="{rnd.uniform(96, 440):.1f}" r="{rnd.uniform(.5, 1.3):.2f}" fill="{IV}" opacity="{rnd.uniform(.25, .8):.2f}"/>' for _ in range(46))
    orb = (f'<g opacity=".55"><ellipse cx="150" cy="276" rx="104" ry="30" transform="rotate(-14 150 276)" {stroke(1, .6)}/>'
           f'<ellipse cx="150" cy="276" rx="118" ry="40" transform="rotate(-14 150 276)" {stroke(.7, .3)}/>'
           f'<circle cx="{150+104*math.cos(math.radians(205)):.1f}" cy="{276+30*math.sin(math.radians(205)) + 26:.1f}" r="3" fill="{G2}"/></g>') if orbit else ''
    num = f'<text x="150" y="112" text-anchor="middle" font-family="DM Sans, Inter, sans-serif" font-size="14" font-weight="600" letter-spacing="3" fill="{G2}" opacity=".9">{numeral}</text>'
    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" role="img" aria-label="{name}">
<defs>
 <linearGradient id="bg-{slug}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1B2C55"/><stop offset=".55" stop-color="#111D3A"/><stop offset="1" stop-color="#0A1226"/></linearGradient>
 <radialGradient id="neb-{slug}" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#4466AE" stop-opacity=".55"/><stop offset="1" stop-color="#4466AE" stop-opacity="0"/></radialGradient>
 <radialGradient id="vio-{slug}" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#7A62C4" stop-opacity=".35"/><stop offset="1" stop-color="#7A62C4" stop-opacity="0"/></radialGradient>
 <radialGradient id="glow-{slug}" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#F6C46E" stop-opacity=".2"/><stop offset="1" stop-color="#F2C982" stop-opacity="0"/></radialGradient>
 <clipPath id="clip-{slug}"><path d="{ARCH}"/></clipPath>
</defs>
<rect width="{W}" height="{H}" rx="20" fill="url(#bg-{slug})"/>
<g clip-path="url(#clip-{slug})">
 <circle cx="150" cy="250" r="190" fill="url(#neb-{slug})"/><circle cx="86" cy="150" r="120" fill="url(#vio-{slug})"/>
 {stars}
 <circle cx="150" cy="268" r="110" fill="url(#glow-{slug})"/>
 {orb}
</g>
<rect x="9" y="9" width="{W-18}" height="{H-18}" rx="13" {stroke(1, .45)}/>
<path d="{ARCH}" {stroke(1.5, .95)}/><path d="{ARCH_IN}" {stroke(.8, .35)}/>
<path d="M150 40 l6 10 l-6 10 l-6 -10 Z" fill="{G}" opacity=".9"/><path d="M118 52 H138 M162 52 H182" {stroke(1, .6)}/>
{num}
<g transform="translate(150 285) scale(1.12) translate(-150 -285)">{body}</g>
<path d="M74 486 H112 M188 486 H226" {stroke(1, .55)}/>
<text x="150" y="491" text-anchor="middle" font-family="DM Sans, Inter, sans-serif" font-size="{15 if len(name) < 13 else 13.5}" font-weight="600" letter-spacing=".6" fill="{IV}">{name}</text>
</svg>'''

def back():
    rnd = random.Random('back')
    stars = ''.join(f'<circle cx="{rnd.uniform(20, 280):.1f}" cy="{rnd.uniform(20, 500):.1f}" r="{rnd.uniform(.5, 1.4):.2f}" fill="{IV}" opacity="{rnd.uniform(.2, .7):.2f}"/>' for _ in range(70))
    petals = ''.join(f'<ellipse cx="150" cy="200" rx="14" ry="66" transform="rotate({a} 150 260)" {stroke(1.1, .7)}/>' for a in range(0, 360, 30))
    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" role="img" aria-label="Сорочка карти">
<defs><linearGradient id="bgb" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#1B2C55"/><stop offset="1" stop-color="#0A1226"/></linearGradient>
<radialGradient id="glb" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#F2C982" stop-opacity=".28"/><stop offset="1" stop-color="#F2C982" stop-opacity="0"/></radialGradient></defs>
<rect width="{W}" height="{H}" rx="20" fill="url(#bgb)"/>{stars}<circle cx="150" cy="260" r="150" fill="url(#glb)"/>
<rect x="9" y="9" width="{W-18}" height="{H-18}" rx="13" {stroke(1, .45)}/><rect x="20" y="20" width="{W-40}" height="{H-40}" rx="8" {stroke(.7, .3)}/>
<circle cx="150" cy="260" r="100" {stroke(1, .5)}/><circle cx="150" cy="260" r="118" {stroke(.6, .3)}/>{petals}
<path d="{star_path(150, 260, 30, 11, 8)}" fill="{G}"/><circle cx="150" cy="260" r="6" fill="#0A1226"/>
<path d="M150 70 l7 12 l-7 12 l-7 -12 Z M150 426 l7 12 l-7 12 l-7 -12 Z" fill="{G}" opacity=".85"/>
</svg>'''

if __name__ == '__main__':
    os.makedirs('/tmp/deck/svg', exist_ok=True)
    for slug, num, name, fn in CARDS:
        open(f'/tmp/deck/svg/{slug}.svg', 'w').write(frame(slug, num, name, fn(), slug not in ORBIT_OFF))
    open('/tmp/deck/svg/back.svg', 'w').write(back())
    print(len(CARDS), 'cards')
