"""Full Galaxiora deck (78 cards + back) for the site. Art only: the localized card name is
rendered by the site under the picture. Reuses the frame and helpers of deck.py."""
import math, os, random, sys
sys.path.insert(0, os.path.dirname(__file__))
import deck as D
from deck import G, G2, IV, stroke, star_path, rays, drop, waves, flower, chalice, sword, pentacle, wand

OUT = sys.argv[1] if len(sys.argv) > 1 else '/home/claude/gx-design/full'

def ln(x1, y1, x2, y2, w=2.2, op=1): return f'<line x1="{x1:.1f}" y1="{y1:.1f}" x2="{x2:.1f}" y2="{y2:.1f}" {stroke(w, op)}/>'
def P(d, w=2.2, op=1): return f'<path d="{d}" {stroke(w, op)}/>'
def F(d, op=.9, col=G): return f'<path d="{d}" fill="{col}" opacity="{op}"/>'
def circ(x, y, r, w=2, op=1): return f'<circle cx="{x}" cy="{y}" r="{r}" {stroke(w, op)}/>'
def dot(x, y, r=2.2, op=.9, col=G2): return f'<circle cx="{x}" cy="{y}" r="{r}" fill="{col}" opacity="{op}"/>'
def tstar(x, y, r=6, op=.85): return F(star_path(x, y, r, r*.38, 4), op, G2)
def ground(y=404, op=.6): return P(f'M66 {y} Q150 {y-8} 234 {y}', 1.4, op)
def mountains(y=404, op=.45): return P(f'M66 {y} L104 {y-40} L128 {y-18} L160 {y-56} L196 {y-20} L214 {y-34} L234 {y}', 1.3, op)
def cup(cx, top, s=.55, op=1): return chalice(cx, top, s, op)
def pent(cx, cy, r=14, op=1): return pentacle(cx, cy, r, op, 1.6)
def swd(x1, y1, x2, y2, op=1, w=1.9): return sword(x1, y1, x2, y2, w, op)
def wnd(x1, y1, x2, y2, op=1, leaves=True): return wand(x1, y1, x2, y2, op, 2, leaves)
def crown(cx, y, s=1, op=1):
    return P(f'M{cx-24*s} {y} L{cx-18*s} {y-24*s} L{cx-8*s} {y-10*s} L{cx} {y-30*s} L{cx+8*s} {y-10*s} L{cx+18*s} {y-24*s} L{cx+24*s} {y} Z', 2, op) + \
           ''.join(dot(cx+dx*s, y+dy*s, 2.4*s) for dx, dy in ((-18, -24), (0, -30), (18, -24)))
def ankh(cx, cy, s=1):
    return P(f'M{cx} {cy} C{cx-10*s} {cy-6*s} {cx-10*s} {cy-26*s} {cx} {cy-28*s} C{cx+10*s} {cy-26*s} {cx+10*s} {cy-6*s} {cx} {cy} Z M{cx-14*s} {cy+2*s} H{cx+14*s} M{cx} {cy} V{cy+44*s}', 2)
def orb(cx, cy, r=10): return circ(cx, cy, r, 1.8) + ln(cx, cy-r, cx, cy-r-9, 1.6) + ln(cx-5, cy-r-5, cx+5, cy-r-5, 1.6)
def spiral(cx, cy, r, d=1):
    pts = []
    for i in range(36):
        a = i * 0.32; rr = r * (1 - i/40)
        pts.append(f'{cx + d*rr*math.cos(a):.1f} {cy + rr*math.sin(a):.1f}')
    return P('M' + ' L'.join(pts), 1.6, .9)
def key(cx, cy, ang):
    return (f'<g transform="rotate({ang} {cx} {cy})">' + circ(cx, cy+52, 10, 2) + circ(cx, cy+52, 4, 1.2) +
            ln(cx, cy+42, cx, cy-50, 2.2) + P(f'M{cx} {cy-50} h12 v10 h-6 M{cx} {cy-34} h10 v8', 2) + '</g>')
def wheat(x, y, s=1, d=1):
    out = ln(x, y, x + d*8*s, y - 70*s, 1.5, .85)
    for i in range(5):
        yy = y - 30*s - i*9*s; xx = x + d*(8*s*(30+i*9)/70)
        out += f'<ellipse cx="{xx-4*s:.1f}" cy="{yy:.1f}" rx="2.2" ry="5" transform="rotate(-30 {xx-4*s:.1f} {yy:.1f})" fill="{G}" opacity=".8"/>'
        out += f'<ellipse cx="{xx+4*s:.1f}" cy="{yy:.1f}" rx="2.2" ry="5" transform="rotate(30 {xx+4*s:.1f} {yy:.1f})" fill="{G}" opacity=".8"/>'
    return out
def cloud(cx, cy, s=1, op=.75):
    return P(f'M{cx-30*s} {cy} q-4 -16 12 -18 q6 -14 22 -8 q12 -10 24 2 q16 -2 16 14 q4 14 -12 12 Z', 1.6, op)
def leaf(x, y, ang, s=1, op=.75):
    return f'<path d="M{x} {y} q{6*s} {-4*s} {9*s} {-12*s} q{-8*s} {1*s} {-9*s} {12*s}" transform="rotate({ang} {x} {y})" fill="{G}" opacity="{op}"/>'
def boat(cx, y):
    return P(f'M{cx-50} {y} L{cx+50} {y} L{cx+36} {y+20} L{cx-36} {y+20} Z', 2)
def hexagram(cx, cy, r):
    return F(star_path(cx, cy, r, r*.58, 6), .95, G2)

# ---------------- Major Arcana (the 9 drawn earlier come from deck.py) ----------------
def empress():
    stars = ''.join(tstar(150 + 64*math.cos(math.radians(a)), 214 + 40*math.sin(math.radians(a)), 4.4) for a in range(200, 341, 13))
    heart = 'M150 330 C150 330 106 302 106 268 C106 248 122 238 136 242 C143 244 147 249 150 254 C153 249 157 244 164 242 C178 238 194 248 194 268 C194 302 150 330 150 330 Z'
    return stars + F(heart, .14) + P(heart, 2.4) + circ(150, 272, 12, 2) + ln(150, 284, 150, 306, 2) + ln(141, 296, 159, 296, 2) + \
        wheat(88, 404, 1, 1) + wheat(212, 404, 1, -1) + waves(392, 110, 196, 3, 14, .6)

def emperor():
    return mountains(250, .4) + P('M96 400 V214 H204 V400', 2.2) + P('M96 214 Q96 188 120 186 M204 214 Q204 188 180 186', 1.6, .8) + \
        spiral(108, 202, 14, -1) + spiral(192, 202, 14, 1) + ankh(150, 260, 1.15) + orb(150, 352, 13) + ln(80, 400, 220, 400, 1.6, .7)

def hierophant():
    tiara = 'M128 222 Q150 160 172 222 Z'
    return P(tiara, 2.2) + ln(130, 206, 170, 206, 1.6) + ln(134, 190, 166, 190, 1.6) + dot(150, 162, 3) + ln(150, 150, 150, 160, 1.6) + \
        P('M84 404 V232 M216 404 V232 M78 232 H90 M210 232 H222', 2, .5) + key(150, 312, -28) + key(150, 312, 28) + \
        ln(108, 404, 192, 404, 1.6, .7)

def chariot():
    canopy = ''.join(tstar(x, 186 + abs(x-150)*.12, 4.5) for x in range(96, 206, 18))
    return canopy + P('M92 200 Q150 176 208 200', 1.6, .7) + ln(100, 200, 100, 300, 1.8) + ln(200, 200, 200, 300, 1.8) + \
        P('M86 300 H214 V346 H86 Z', 2.2) + P('M128 318 q22 -14 44 0 M150 312 v14', 1.6) + circ(150, 324, 4, 1.4) + \
        circ(104, 370, 20, 2) + circ(196, 370, 20, 2) + rays(104, 370, 3, 18, 8, 1.2, .7) + rays(196, 370, 3, 18, 8, 1.2, .7) + \
        f'<circle cx="122" cy="398" r="7" fill="{G}"/>' + circ(178, 398, 7, 1.6) + ground(410, .55)

def strength():
    lem = 'M150 170 C138 156 118 156 118 170 C118 184 138 184 150 170 C162 156 182 156 182 170 C182 184 162 184 150 170 Z'
    mane = rays(150, 290, 46, 70, 22, 1.6, .85, wavy=True)
    face = (circ(150, 290, 44, 2.4) + P('M118 258 q-4 -16 10 -18 q4 8 2 16 M182 258 q4 -16 -10 -18 q-4 8 -2 16', 1.8) +
            P('M132 282 q6 -5 12 0 M156 282 q6 -5 12 0', 1.8) + P('M140 302 q10 -6 20 0 L150 314 Z', 1.6) +
            P('M150 314 V322 M138 326 Q150 332 162 326', 1.6, .8) + P('M128 300 h-12 M128 308 h-12 M172 300 h12 M172 308 h12', 1, .5))
    garland = ''.join(flower(x, 222 + (x-150)**2/260, 4, 6, .8) for x in (110, 130, 150, 170, 190))
    return P(lem, 2.2) + mane + face + garland + ground(406, .5)

def hermit():
    return P('M66 404 L120 340 L150 362 L186 316 L234 404', 1.6, .55) + ln(110, 404, 110, 196, 2.4) + \
        P('M168 214 h28 l6 12 v40 l-6 10 h-28 l-6 -10 v-40 Z', 2.2) + ln(182, 196, 182, 214, 1.6) + circ(182, 192, 5, 1.6) + \
        hexagram(182, 246, 12) + rays(182, 246, 26, 40, 12, 1.1, .5) + ''.join(dot(x, y, 1.6, .55) for x, y in ((88, 230), (230, 300), (70, 300)))

def justice():
    return ln(150, 168, 150, 396, 2.4) + P('M138 186 L150 156 L162 186', 1.6) + ln(140, 188, 160, 188, 2) + \
        ln(84, 230, 216, 230, 2.2) + dot(150, 230, 4) + \
        P('M92 230 L72 300 M92 230 L112 300 M70 300 Q92 318 114 300', 1.8) + P('M208 230 L188 300 M208 230 L228 300 M186 300 Q208 318 230 300', 1.8) + \
        P('M80 404 V196 M220 404 V196', 1.6, .4) + ln(110, 396, 190, 396, 1.8, .7)

def hanged():
    leaves = ''.join(leaf(x, y, a) for x, y, a in ((96, 170, -40), (204, 168, 40), (100, 300, -20), (200, 300, 20)))
    return P('M88 176 H212 M100 176 V404 M200 176 V404', 2.4) + leaves + ln(150, 176, 150, 206, 1.6) + \
        P('M150 206 V270 M150 226 L170 246 L150 262', 2) + ln(150, 270, 150, 316, 2) + P('M132 286 L150 300 L168 286', 1.8) + \
        circ(150, 330, 13, 2) + rays(150, 330, 18, 30, 14, 1.2, .8) + ground(406, .5)

def death():
    return P('M66 404 Q150 380 234 404', 1.4, .5) + P('M80 350 V300 h14 v50 M206 350 V300 h14 v50', 1.6, .6) + \
        P('M118 352 A32 32 0 0 1 182 352', 2) + rays(150, 352, 40, 52, 9, 1.2, .55) + \
        ln(112, 176, 112, 330, 2.4) + P('M112 184 Q150 172 192 186 L192 262 Q150 248 112 262', 2) + flower(152, 222, 9, 5, 1) + \
        waves(372, 96, 200, 3, 16, .55)

def temperance():
    tri = P('M150 176 L166 204 L134 204 Z', 1.8) + P('M130 168 H170 V212 H130 Z', 1.4, .6)
    return tri + chalice(104, 250, .7) + chalice(196, 230, .7) + P('M118 254 C140 236 160 232 182 236', 1.6, .85) + \
        P('M66 404 H150', 1.6, .6) + waves(400, 150, 234, 3, 14, .7) + P('M168 390 Q190 330 214 300', 1.2, .45) + \
        circ(214, 290, 8, 1.4) + rays(214, 290, 11, 17, 8, 1, .6) + flower(84, 380, 5, 6, .8)

def devil():
    return F(star_path(150, 188, 26, 10, 5, 90), .9) + \
        P('M150 226 C122 210 96 214 76 236 C92 236 98 246 98 256 C112 246 124 250 132 262', 2) + \
        P('M150 226 C178 210 204 214 224 236 C208 236 202 246 202 256 C188 246 176 250 168 262', 2) + \
        P('M124 300 H176 V352 H124 Z', 2.2) + P('M132 352 Q120 380 108 396 M168 352 Q180 380 192 396', 1.6, .85) + \
        circ(108, 400, 6, 1.6) + circ(192, 400, 6, 1.6) + P('M150 300 V270 m-6 0 q6 -16 12 0', 1.8) + F('M150 262 q-6 -10 0 -18 q6 8 0 18 Z', .7)

def judgement():
    return cloud(150, 196, 1.4) + P('M120 178 L196 226 L204 218 L130 168 Z', 1.8) + P('M196 226 q10 12 20 8 q-6 -10 -14 -16', 1.8) + \
        P('M140 186 V228 H176 V196', 1.4, .8) + P('M152 202 V216 M146 209 H158', 1.4) + \
        ''.join(P(f'M{x-16} 372 L{x-12} 340 H{x+12} L{x+16} 372 Z', 1.8) + P(f'M{x} 340 V318 M{x-8} 326 L{x} 318 L{x+8} 326', 1.6) for x in (96, 150, 204)) + \
        waves(388, 72, 228, 3, 18, .6)

def world():
    wreath = '<ellipse cx="150" cy="282" rx="62" ry="94" ' + stroke(2.4) + '/>' + \
        ''.join(leaf(150 + 62*math.cos(math.radians(a)), 282 + 94*math.sin(math.radians(a)), a + 90, 1, .7) for a in range(0, 360, 20))
    ribbons = P('M138 188 q12 -10 24 0 q-12 10 -24 0 M138 376 q12 -10 24 0 q-12 10 -24 0', 1.8)
    corners = P('M82 186 L94 166 L106 186 Z', 1.6) + P('M194 166 L218 166 L206 186 Z', 1.6) + P('M82 380 L106 380 L94 400 Z M84 390 H104', 1.6) + P('M206 400 L194 380 L218 380 Z M196 390 H216', 1.6)
    return wreath + ribbons + F(star_path(150, 282, 30, 10, 8), .95, G2) + circ(150, 282, 40, 1, .4) + corners

MAJORS = {
    'major-fool': ('0', D.fool), 'major-magician': ('I', D.magician), 'major-priestess': ('II', D.high_priestess),
    'major-empress': ('III', empress), 'major-emperor': ('IV', emperor), 'major-hierophant': ('V', hierophant),
    'major-lovers': ('VI', D.lovers), 'major-chariot': ('VII', chariot), 'major-strength': ('VIII', strength),
    'major-hermit': ('IX', hermit), 'major-wheel': ('X', D.wheel), 'major-justice': ('XI', justice), 'major-hanged': ('XII', hanged),
    'major-death': ('XIII', death), 'major-temperance': ('XIV', temperance), 'major-devil': ('XV', devil), 'major-tower': ('XVI', D.tower),
    'major-star': ('XVII', D.star), 'major-moon': ('XVIII', D.moon), 'major-sun': ('XIX', D.sun), 'major-judgement': ('XX', judgement),
    'major-world': ('XXI', world)
}
NO_ORBIT = {'major-wheel', 'major-priestess', 'major-world', 'major-emperor', 'major-justice', 'major-hanged'}

# ---------------- Minor Arcana ----------------
# Wands
def w_ace(): return wnd(150, 400, 150, 186) + rays(150, 186, 16, 34, 12, 1.3, .7) + dot(150, 186, 5) + mountains(404, .4) + cloud(98, 300, .8, .5)
def w_two(): return wnd(110, 404, 110, 196) + wnd(190, 404, 190, 196) + circ(150, 286, 26, 2) + P('M124 286 H176 M150 260 Q136 286 150 312 Q164 286 150 260', 1.3, .8) + ground()
def w_three(): return wnd(96, 404, 102, 196) + wnd(150, 404, 150, 186) + wnd(204, 404, 198, 196) + waves(352, 70, 230, 3, 18, .7) + \
    ''.join(P(f'M{x-14} 340 h28 l-5 8 h-18 Z M{x} 340 v-16 l9 12', 1.4, .85) for x in (110, 190))
def w_four(): return ''.join(wnd(x, 404, x, 214, 1, False) for x in (88, 126, 174, 212)) + \
    P('M88 222 Q107 246 126 222 Q150 252 174 222 Q193 246 212 222', 1.6, .85) + ''.join(flower(x, y, 4, 6, .9) for x, y in ((107, 238), (150, 244), (193, 238))) + ground()
def w_five(): return wnd(80, 360, 200, 200) + wnd(220, 360, 100, 200) + wnd(150, 400, 150, 186) + wnd(86, 250, 214, 292) + wnd(90, 300, 210, 236) + ground(410, .4)
def w_six(): return wnd(150, 404, 150, 196) + '<ellipse cx="150" cy="190" rx="22" ry="12" ' + stroke(1.8) + '/>' + \
    ''.join(leaf(150 + 22*math.cos(math.radians(a)), 190 + 12*math.sin(math.radians(a)), a + 90, .8) for a in range(0, 360, 36)) + \
    ''.join(wnd(x, 404, x + (x-150)*.08, 240, .85, False) for x in (98, 120, 180, 202, 76)) + ground()
def w_seven(): return wnd(150, 404, 150, 190) + ''.join(wnd(x, 404, x + (150-x)*.25, 300, .75, False) for x in (78, 98, 118, 182, 202, 222)) + P('M66 404 L150 300 L234 404', 1.4, .45)
def w_eight(): return ''.join(wnd(84 + i*10, 360 - i*4, 192 + i*10, 196 - i*4, .95, i % 2 == 0) for i in range(8)) + P('M66 404 Q120 386 160 400 T234 396', 1.4, .5) + waves(408, 90, 210, 2.5, 14, .45)
def w_nine(): return ''.join(wnd(x, 404, x, 252, .85, False) for x in (78, 96, 114, 132, 168, 186, 204, 222)) + wnd(150, 404, 150, 190) + \
    P('M140 228 h20 M140 236 h20', 1.4, .8) + ground(410, .5)
def w_ten(): return ''.join(wnd(118 + i*7, 404, 132 + i*7, 196, .9, i in (0, 9)) for i in range(10)) + P('M114 300 Q150 290 196 300', 2) + mountains(404, .35)
def w_page(): return wnd(150, 404, 150, 196) + P('M110 404 L128 368 L150 384 L172 362 L190 404', 1.4, .5) + \
    P('M120 248 q-14 -30 4 -50 q8 26 -4 50', 1.6) + tstar(196, 214, 7) + tstar(108, 300, 5)
def horse(op=1):
    head = ('M104 404 C100 352 110 306 132 272 L133 252 L139 240 L147 256 '
            'C170 262 198 290 212 322 C216 334 208 342 196 338 C186 336 178 332 170 326 '
            'C166 348 174 378 186 404')
    mane = ''.join(P(f'M{x} {y} q-10 6 -14 18', 1.3, .7) for x, y in ((132, 276), (126, 300), (120, 326), (116, 352)))
    return P(head, 2.2, op) + dot(164, 278, 2.6) + dot(202, 328, 1.8, .8) + P('M172 304 q10 8 22 8', 1.2, .6) + mane
def w_knight(): return horse() + wnd(214, 404, 214, 186) + P('M66 404 L96 360 L116 384 L150 352', 1.3, .4)
def w_queen(): return D.queen_wands()
def w_king(): return P('M92 404 V246 C92 214 118 198 150 198 C182 198 208 214 208 246 V404', 1.4, .45) + crown(150, 236, 1.2) + \
    wnd(150, 404, 150, 254) + P('M100 360 q16 -18 34 -6 q-12 16 -34 6 M200 360 q-16 -18 -34 -6 q12 16 34 6', 1.6, .8) + ground()

# Cups
def c_ace(): return D.ace_cups()
def c_two(): return cup(104, 300, .7) + cup(196, 300, .7) + ln(150, 210, 150, 320, 1.8) + P('M150 230 q-16 10 0 20 q16 10 0 20 q-16 10 0 20 M150 230 q16 10 0 20 q-16 10 0 20 q16 10 0 20', 1.4, .8) + \
    P('M126 214 q24 -14 48 0', 1.8) + circ(150, 206, 9, 1.6) + ground()
def c_three(): return cup(110, 268, .65) + cup(190, 268, .65) + cup(150, 210, .65) + ''.join(flower(x, 396, 4, 6, .8) for x in (90, 120, 180, 210)) + ''.join(wheat(x, 400, .6, d) for x, d in ((150, 1),))
def c_four(): return cup(106, 330, .55) + cup(150, 330, .55) + cup(194, 330, .55) + cloud(204, 226, .8, .7) + P('M192 236 Q176 250 170 262', 1.4, .8) + cup(160, 254, .45) + P('M70 404 Q120 398 150 404', 1.4, .5) + \
    P('M86 300 V240 q0 -10 10 -10', 1.4, .45)
def c_five(): return ''.join(f'<g transform="rotate(100 {x} {y})">{cup(x, y, .5)}</g>' for x, y in ((92, 300), (122, 312), (152, 300))) + \
    ''.join(waves(338 + i*6, 80 + i*8, 168 - i*8, 2, 10, .55) for i in range(2)) + cup(178, 330, .5) + cup(212, 330, .5) + P('M70 404 Q150 380 234 404', 1.4, .5) + \
    P('M170 220 L200 232 L230 220 M182 220 v-14 h36 v14', 1.4, .45)
def c_six(): return ''.join(cup(x, y, .5) + flower(x, y - 8, 6, 8, .95) for x, y in ((100, 214), (150, 204), (200, 214), (100, 312), (150, 302), (200, 312))) + ground()
def c_seven(): return cloud(150, 400, 2.1, .55) + ''.join(cup(x, y, .5) for x, y in ((96, 190), (150, 182), (204, 190), (96, 290), (150, 282), (204, 290), (150, 360))) + \
    ''.join(tstar(x, y, 5) for x, y in ((96, 182), (204, 282))) + F(star_path(150, 174, 6, 2.4, 6), .9, G2) + circ(96, 280, 4, 1.4) + P('M200 176 q4 -10 8 0', 1.4)
def c_eight(): return ''.join(cup(x, y, .48) for x, y in ((92, 330), (128, 330), (164, 330), (110, 290), (146, 290), (182, 330), (128, 250), (164, 290))) + \
    F('M196 178 A22 22 0 1 0 196 222 A28 28 0 0 1 196 178 Z', .9) + P('M206 404 L222 360 L234 380', 1.4, .5) + ground(410, .45)
def c_nine(): return P('M70 236 Q150 200 230 236', 1.6, .6) + ''.join(cup(70 + i*20, 206 + abs(i-4)*4 - 18, .38) for i in range(9)) + \
    P('M80 300 H220 L210 360 H90 Z', 2) + P('M104 300 V356 M128 300 V360 M150 300 V360 M172 300 V360 M196 300 V356', 1.2, .45) + P('M120 404 L132 360 M180 404 L168 360', 1.6, .7) + ground(406, .5)
def c_ten(): return ''.join(P(f'M{150-r} 316 A{r} {r} 0 0 1 {150+r} 316', 1.6, .9 - k*.15) for k, r in enumerate((104, 92, 80))) + \
    ''.join(cup(150 + 98*math.cos(math.radians(a)), 304 - 98*math.sin(math.radians(a)), .34) for a in range(15, 170, 17)) + \
    P('M96 404 V360 l12 -12 l12 12 V404 M180 404 V350 l14 -14 l14 14 V404', 1.6, .7) + ground(406, .5)
def c_page(): return cup(150, 230, .9) + P('M150 236 q-8 -16 6 -22 q14 6 10 20 q-4 10 -16 2', 1.8) + dot(156, 222, 1.8) + waves(380, 84, 216, 4, 16, .7) + waves(396, 96, 204, 3, 14, .45)
def c_knight(): return horse() + cup(214, 230, .55) + P('M212 270 V290', 1.4, .6) + waves(400, 66, 234, 3, 14, .55)
def c_queen(): return P('M92 404 V246 C92 214 118 198 150 198 C182 198 208 214 208 246 V404', 1.4, .45) + crown(150, 232, 1) + \
    P('M118 250 h64 l-4 12 h-56 Z', 1.6) + chalice(150, 270, .95) + ''.join(P(f'M{x} 262 l-6 -10 h12 Z', 1.4, .8) for x in (122, 178)) + waves(400, 70, 230, 3, 14, .7)
def c_king(): return crown(150, 220, 1.2) + P('M100 404 V246 H200 V404', 1.6, .6) + chalice(150, 262, .9) + \
    P('M70 380 q20 -10 40 0 t40 0 t40 0 t40 0', 1.6, .7) + P('M196 330 q10 -20 26 -8 q-10 2 -6 14 Z', 1.6, .8) + waves(400, 70, 230, 3, 14, .55)

# Swords
def s_ace(): return swd(150, 400, 150, 180, 1, 2.4) + crown(150, 200, .9) + P('M118 206 q-14 20 -8 40 M182 206 q14 20 8 40', 1.4, .7) + \
    ''.join(drop(x, y, .6, .75) for x, y in ((112, 260), (190, 270), (124, 300), (178, 236))) + mountains(404, .45)
def s_two(): return swd(118, 210, 196, 352) + swd(182, 210, 104, 352) + P('M136 274 q14 6 28 0', 2.2) + \
    F('M150 168 A18 18 0 1 0 150 204 A22 22 0 0 1 150 168 Z', .9) + waves(388, 70, 230, 3, 16, .65) + ''.join(dot(x, 396, 1.8, .5) for x in (84, 214))
def s_three(): return D.three_swords()
def s_four(): return P('M84 360 H216 V400 H84 Z M92 360 V346 H208 V360', 2) + swd(110, 352, 196, 352, .9, 1.8) + \
    ''.join(swd(x, 186, x, 280, .85) for x in (110, 150, 190)) + P('M128 300 h44 a12 12 0 0 1 0 24 h-44 a12 12 0 0 1 0 -24', 1.4, .45)
def s_five(): return swd(150, 196, 150, 320) + swd(98, 330, 132, 230) + swd(204, 330, 170, 230) + \
    P('M80 398 L132 382 M220 398 L166 380', 1.9) + dot(80, 398, 3) + dot(220, 398, 3) + waves(404, 66, 234, 3, 18, .4) + cloud(102, 182, .7, .4) + cloud(198, 176, .7, .4)
def s_six(): return boat(150, 340) + ''.join(swd(x, 270, x, 344, .9, 1.7) for x in (114, 132, 150, 168, 186, 204)) + \
    waves(372, 66, 234, 3.5, 16, .75) + waves(388, 80, 220, 2.5, 14, .45) + ln(76, 336, 98, 370, 2) + P('M200 220 L234 220 M66 220 L94 220', 1.2, .35)
def s_seven(): return ''.join(swd(x, 220, x + 22, 330, .9, 1.7) for x in (104, 120, 136, 152, 168)) + swd(190, 300, 190, 390, .7) + swd(212, 300, 212, 390, .7) + \
    P('M200 220 L210 196 L220 220 Z M86 404 V346 M80 346 H92', 1.4, .55) + ground(410, .45)
def s_eight(): return ''.join(swd(x, 396, x, 290, .85, 1.6) for x in (74, 94, 114, 186, 206, 226)) + swd(84, 260, 84, 196, .6, 1.4) + swd(216, 260, 216, 196, .6, 1.4) + \
    P('M150 220 C130 250 132 310 150 350 C168 310 170 250 150 220 Z', 1.8) + P('M136 262 l28 14 M134 290 l32 -10 M138 318 l26 12', 1.4, .85) + circ(150, 206, 12, 1.8) + ln(140, 204, 160, 204, 2.4, .9)
def s_nine(): return ''.join(swd(72, 172 + i*18, 228, 172 + i*18, .8, 1.5) for i in range(9)) + P('M90 404 V350 H210 V404 M90 372 H210', 2) + \
    P('M132 350 q-12 -26 6 -34 q18 8 6 34', 1.6, .8)
def s_ten(): return P('M66 380 H234', 1.6, .7) + ''.join(swd(x, 210, x, 376, .9, 1.6) for x in (84, 100, 116, 132, 148, 164, 180, 196, 212)) + swd(228, 230, 228, 376, .9, 1.6) + \
    P('M110 380 A40 40 0 0 1 190 380', 1.6, .55) + rays(150, 380, 46, 58, 9, 1.2, .45) + waves(398, 70, 230, 3, 16, .5)
def s_page(): return swd(158, 400, 158, 190, 1, 2.2) + cloud(98, 206, .9, .55) + cloud(206, 236, .7, .45) + ''.join(P(f'M{x} {y} l-14 8', 1.2, .5) for x, y in ((210, 280), (218, 300), (96, 290))) + \
    P('M66 404 L104 352 L130 380 L170 330 L234 404', 1.4, .5) + ''.join(drop(x, y, .5, .5) for x, y in ((92, 330), (214, 336)))
def s_knight(): return horse() + swd(222, 310, 222, 180, 1, 2) + ''.join(P(f'M{x} {y} l-18 6', 1.2, .55) for x, y in ((94, 230), (102, 250), (88, 270), (210, 360))) + cloud(110, 196, .8, .45)
def s_queen(): return P('M92 404 V246 C92 214 118 198 150 198 C182 198 208 214 208 246 V404', 1.4, .45) + crown(150, 232, 1) + swd(150, 400, 150, 248, 1, 2.2) + \
    ''.join(P(f'M{x} {y} q6 -8 12 0', 1.3, .7) for x, y in ((104, 300), (182, 300), (110, 340))) + cloud(196, 380, .9, .5)
def s_king(): return crown(150, 222, 1.2) + P('M100 404 V246 H200 V404', 1.6, .6) + swd(150, 404, 150, 250, 1, 2.4) + \
    ''.join(P(f'M{x} {y} q8 -12 16 0 q8 -12 16 0', 1.4, .7) for x, y in ((106, 290), (166, 290))) + cloud(150, 386, 1.3, .45)

# Pentacles
def p_ace(): return pent(150, 240, 34) + rays(150, 240, 40, 56, 16, 1.2, .6) + P('M96 404 V330 Q150 300 204 330 V404', 2) + \
    ''.join(flower(x, 328 - abs(x-150)*.1, 4, 6, .8) for x in (110, 130, 170, 190)) + P('M140 404 V352 h20 V404', 1.4, .6)
def p_two(): return P('M150 280 C120 230 80 230 80 280 C80 330 120 330 150 280 C180 230 220 230 220 280 C220 330 180 330 150 280 Z', 2) + \
    pent(96, 280, 18) + pent(204, 280, 18) + ''.join(P(f'M{x-20} 214 l12 -10 l12 10 l12 -10 l12 10', 1.3, .55) for x in (100, 170)) + waves(380, 70, 230, 4, 20, .6)
def p_three(): return P('M84 404 V250 C84 196 116 170 150 162 C184 170 216 196 216 250 V404', 2.2) + P('M96 404 V256 C96 210 122 188 150 180 C178 188 204 210 204 256 V404', 1.2, .4) + \
    pent(150, 220, 14) + pent(122, 262, 14) + pent(178, 262, 14) + P('M120 404 V326 H180 V404 M150 326 V404', 1.4, .55)
def p_four(): return pent(150, 186, 14) + pent(150, 290, 24) + pent(110, 384, 13) + pent(190, 384, 13) + crown(150, 214, .6) + \
    P('M104 270 Q150 240 196 270 M104 310 Q150 340 196 310', 1.6, .75) + P('M70 330 h24 v-40 h-24 M206 330 h24 v-40 h-24', 1.3, .4)
def p_five(): return P('M118 186 H182 V300 H118 Z', 2.2) + ''.join(pent(x, y, 9) for x, y in ((134, 206), (166, 206), (150, 238), (134, 270), (166, 270))) + \
    ''.join(f'<circle cx="{x}" cy="{y}" r="1.8" fill="{IV}" opacity=".7"/>' for x, y in ((80, 210), (96, 250), (210, 230), (226, 270), (88, 310), (214, 330), (110, 350), (190, 360), (230, 200), (74, 270))) + \
    P('M84 404 L102 336 M102 336 l-10 -12 M180 404 L196 344', 1.8, .8) + circ(102, 326, 7, 1.6) + circ(196, 336, 7, 1.6) + P('M66 404 Q150 396 234 404', 1.4, .55)
def p_six(): return ln(150, 186, 150, 214, 2) + ln(104, 214, 196, 214, 2) + P('M108 214 l-14 36 h28 Z M192 214 l-14 36 h28 Z', 1.8) + \
    pent(124, 296, 12) + pent(176, 296, 12) + pent(150, 336, 12) + pent(108, 362, 12) + pent(192, 362, 12) + pent(150, 384, 10) + \
    ''.join(dot(x, y, 1.6, .6) for x, y in ((130, 268), (170, 270), (150, 300)))
def p_seven(): return P('M150 404 C150 330 128 290 112 250 M150 360 C168 320 190 300 200 260 M136 300 C120 290 100 296 92 286', 1.8) + \
    ''.join(leaf(x, y, a) for x, y, a in ((122, 270, -30), (184, 284, 30), (106, 300, -60), (164, 330, 40), (140, 340, -20))) + \
    ''.join(pent(x, y, 11) for x, y in ((112, 234), (200, 244), (92, 278), (174, 300), (128, 314), (196, 332))) + ln(212, 404, 214, 300, 2) + pent(220, 380, 11) + ground(408, .5)
def p_eight(): return P('M118 404 V176 M182 404 V176', 1.6, .5) + ''.join(pent(150, 190 + i*30, 11) for i in range(6)) + pent(100, 380, 11) + pent(200, 380, 11) + \
    P('M76 404 H124 V384 H76 Z', 1.4, .6) + P('M214 336 l14 -14 l6 6 l-14 14 Z M214 336 l-12 12', 1.6, .8)
def p_nine(): return P('M150 404 C150 330 150 260 150 200', 1.4, .5) + ''.join(leaf(150, y, a) for y, a in ((240, -40), (270, 40), (300, -40), (330, 40))) + \
    ''.join(pent(x, y, 12) for x, y in ((96, 220), (96, 262), (96, 304), (96, 346), (204, 220), (204, 262), (204, 304), (204, 346), (204, 388))) + \
    P('M128 196 q10 -14 22 -4 q6 -8 14 -2 l-10 8 q-12 10 -26 -2 Z', 1.6) + dot(146, 194, 1.6)
def p_ten(): return P('M96 404 V226 C96 196 118 180 150 176 C182 180 204 196 204 226 V404', 2) + \
    ''.join(pent(x, y, 11) for x, y in ((150, 202), (124, 228), (176, 228), (150, 256), (124, 284), (176, 284), (150, 312), (124, 340), (176, 340), (150, 368))) + \
    P('M70 404 V352 l10 -10 l10 10 V404 M210 404 V352 l10 -10 l10 10 V404', 1.4, .55)
def p_page(): return pent(150, 236, 26) + P('M128 296 q22 -12 44 0', 1.6, .6) + P('M66 404 Q100 380 150 392 T234 384', 1.4, .55) + \
    ''.join(flower(x, 380, 4, 6, .75) for x in (92, 208)) + P('M80 404 L120 344 L148 372 L188 326 L234 404', 1.2, .35)
def p_knight(): return horse() + pent(214, 236, 16) + P('M70 404 h164', 1.4, .5) + ''.join(P(f'M{x} 404 l-8 -14 M{x} 404 l8 -14', 1.2, .45) for x in (90, 230))
def p_queen(): return P('M92 404 V246 C92 214 118 198 150 198 C182 198 208 214 208 246 V404', 1.4, .45) + crown(150, 232, 1) + pent(150, 300, 30) + \
    ''.join(flower(x, y, 5, 6, .8) for x, y in ((104, 252), (196, 252), (100, 380), (200, 380))) + P('M196 360 q8 -10 16 0 q-8 6 -16 0', 1.4, .7)
def p_king(): return crown(150, 222, 1.2) + P('M100 404 V246 H200 V404', 1.6, .6) + pent(150, 300, 30) + \
    ''.join(P(f'M{x} {y} q-6 -10 2 -16 q10 4 4 16', 1.4, .75) for x, y in ((112, 380), (124, 394), (176, 394), (188, 380))) + spiral(112, 252, 10, -1) + spiral(188, 252, 10, 1)

RANKS = ['ace', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'page', 'knight', 'queen', 'king']
LABEL = ['Туз', '2', '3', '4', '5', '6', '7', '8', '9', '10', '', '', '', '']
SUITS = {
    'wands': [w_ace, w_two, w_three, w_four, w_five, w_six, w_seven, w_eight, w_nine, w_ten, w_page, w_knight, w_queen, w_king],
    'cups': [c_ace, c_two, c_three, c_four, c_five, c_six, c_seven, c_eight, c_nine, c_ten, c_page, c_knight, c_queen, c_king],
    'swords': [s_ace, s_two, s_three, s_four, s_five, s_six, s_seven, s_eight, s_nine, s_ten, s_page, s_knight, s_queen, s_king],
    'pentacles': [p_ace, p_two, p_three, p_four, p_five, p_six, p_seven, p_eight, p_nine, p_ten, p_page, p_knight, p_queen, p_king],
}
SUIT_MARK = {'wands': lambda x, y: wnd(x, y + 10, x, y - 10, 1, False), 'cups': lambda x, y: cup(x, y - 8, .28), 'swords': lambda x, y: swd(x, y - 11, x, y + 11, 1, 1.4), 'pentacles': lambda x, y: pent(x, y, 8)}

def art(slug, numeral, body, orbit=True, mark=None):
    svg = D.frame(slug, numeral, '', body, orbit)
    # Art without the baked-in name: the site renders the localized name under the picture.
    svg = svg.replace('<path d="M74 486 H112 M188 486 H226" ', '<path d="M86 486 H134 M166 486 H214" ')
    svg = svg.replace('<text x="150" y="491"', '<text x="150" y="491" display="none"')
    ornament = (f'<g>{mark}</g>' if mark else f'<path d="M150 478 l6 8 l-6 8 l-6 -8 Z" fill="{G}" opacity=".85"/>')
    return svg.replace('</svg>', ornament + '</svg>')

def main():
    os.makedirs(OUT, exist_ok=True)
    for slug, (num, fn) in MAJORS.items():
        open(f'{OUT}/{slug}.svg', 'w').write(art(slug, num, fn(), slug not in NO_ORBIT))
    for suit, fns in SUITS.items():
        for i, fn in enumerate(fns):
            slug = f'{suit}-{RANKS[i]}'
            open(f'{OUT}/{slug}.svg', 'w').write(art(slug, LABEL[i], fn(), i < 10 and suit != 'swords' or i == 0, SUIT_MARK[suit](150, 486)))
    open(f'{OUT}/back.svg', 'w').write(D.back())
    print(len(os.listdir(OUT)), 'files')

if __name__ == '__main__':
    main()
