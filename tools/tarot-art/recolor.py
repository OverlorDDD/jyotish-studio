"""Galaxiora deck from the 1909 Rider–Waite–Smith drawings (Pamela Colman Smith, public domain):
the original linework stays exactly as drawn; ink becomes the theme's line colour and every colour
region is re-painted in the site palette. One pipeline, two themes (dark now, light later).
Usage: python3 recolor.py <src_dir> <out_dir> <theme: dark|light> [file ...]"""
import os, sys
import numpy as np
import cv2
from PIL import Image

THEMES = {
    # ink: line colour; anchors: (hue°, colour in shadow, colour in light) for saturated areas;
    # grey: (dark, light) ramp for unsaturated areas (white robes, clouds, stone). Site palette.
    'dark': dict(
        ink=(231, 189, 114), frame=(231, 189, 114), border_bg=(10, 18, 38), glow=.16,
        anchors=[(0, (62, 22, 40), (128, 52, 74)), (22, (78, 50, 48), (156, 116, 104)), (45, (16, 26, 54), (26, 42, 84)),
                 (70, (18, 32, 52), (34, 56, 80)), (120, (16, 42, 46), (44, 92, 88)), (190, (20, 38, 72), (46, 80, 132)),
                 (230, (22, 30, 74), (56, 72, 146)), (275, (38, 28, 80), (96, 78, 158)), (330, (56, 24, 54), (128, 62, 108))],
        grey=((12, 20, 40), (92, 104, 140)), sat_floor=.14, fill=(9, 15, 32)),
    'light': dict(
        ink=(27, 37, 71), frame=(176, 136, 70), border_bg=(246, 241, 231), glow=0,
        anchors=[(0, (170, 92, 104), (236, 196, 200)), (22, (196, 146, 120), (246, 222, 206)), (45, (232, 214, 170), (250, 240, 212)),
                 (70, (220, 220, 178), (244, 242, 214)), (120, (140, 180, 160), (212, 230, 214)), (190, (140, 176, 210), (212, 228, 242)),
                 (230, (150, 160, 214), (214, 218, 244)), (275, (170, 150, 214), (226, 216, 244)), (330, (196, 140, 180), (240, 210, 228))],
        grey=((190, 192, 204), (252, 249, 242)), sat_floor=.14, fill=(40, 52, 92)),
}
TITLE_RULE = .905   # fallback position of the line above the title box (fraction of height)

def has_title(name):
    import re
    return bool(re.match(r'^\d\d_', name)) or bool(re.match(r'^(Cups|Pents|Swords|Wands)(01|1[1-4])\.jpg$', name))

def crop_picture(rgb, name):
    """Drop the outer black frame and, on majors, aces and court cards, the title box."""
    g = cv2.cvtColor(rgb, cv2.COLOR_RGB2GRAY)
    h, w = g.shape
    dark = g < 90
    rows, cols = dark.mean(axis=1), dark.mean(axis=0)
    def edge(arr, rng):
        last = None
        for i in rng:
            if arr[i] > .55: last = i
            elif last is not None: break
        return last
    top = edge(rows, range(0, h // 30)) or 0
    left = edge(cols, range(0, w // 30)) or 0
    right = edge(cols, range(w - 1, w - w // 30, -1)) or w - 1
    bottom = edge(rows, range(h - 1, h - h // 30, -1)) or h - 1
    cut = bottom
    if has_title(name):
        band = g[:, int(w * .15):int(w * .85)].astype(np.float32)
        bd, med = (band < 100).mean(axis=1), np.median(band, axis=1)
        ys = [y for y in range(int(h * .86), int(h * .96)) if bd[y] > .75 and np.median(med[y + 8:y + 20]) > 150]
        if ys:
            y = ys[-1]
            while y - 1 >= int(h * .86) and bd[y - 1] > .6: y -= 1
            cut = y
        else:
            cut = int(h * TITLE_RULE)
    pad = 4
    return rgb[top + pad:cut - pad, left + pad:right - pad]

def recolor(rgb, theme):
    t = THEMES[theme]
    rgb = cv2.bilateralFilter(rgb, 7, 40, 5)   # smooth JPEG blocks, keep the line edges
    img = rgb.astype(np.float32) / 255.
    soft = cv2.GaussianBlur(rgb, (0, 0), 1.8)   # colours from a softened copy: no printing dots
    hsv = cv2.cvtColor(soft, cv2.COLOR_RGB2HSV_FULL).astype(np.float32)
    hue = hsv[..., 0] / 255. * 360.
    sat = hsv[..., 1] / 255.
    val = hsv[..., 2] / 255.
    lum = (0.299 * img[..., 0] + 0.587 * img[..., 1] + 0.114 * img[..., 2])
    sf = soft.astype(np.float32) / 255.
    lum_s = (0.299 * sf[..., 0] + 0.587 * sf[..., 1] + 0.114 * sf[..., 2])
    # Hue → palette colour: each anchor has a shadow and a light colour; value picks between them.
    anchors = sorted(t['anchors'])
    hs = np.array([a[0] for a in anchors] + [anchors[0][0] + 360], np.float32)
    dk = np.array([a[1] for a in anchors] + [anchors[0][1]], np.float32) / 255.
    lt = np.array([a[2] for a in anchors] + [anchors[0][2]], np.float32) / 255.
    v = np.clip((val - .25) / .7, 0, 1)[..., None] ** 1.1
    out_h = np.zeros(rgb.shape, np.float32)
    for i in range(len(hs) - 1):
        m = (hue >= hs[i]) & (hue < hs[i + 1])
        k = ((hue - hs[i]) / (hs[i + 1] - hs[i]))[..., None]
        c_dark = dk[i] * (1 - k) + dk[i + 1] * k
        c_light = lt[i] * (1 - k) + lt[i + 1] * k
        out_h = np.where(m[..., None], c_dark * (1 - v) + c_light * v, out_h)
    lo, hi = np.array(t['grey'][0], np.float32) / 255., np.array(t['grey'][1], np.float32) / 255.
    out_g = lo + (hi - lo) * (np.clip((lum_s - .2) / .75, 0, 1)[..., None])
    w = np.clip((sat - t['sat_floor']) / .2, 0, 1)[..., None]
    base = out_g * (1 - w) + out_h * w
    # Ink: only the drawing's true dark lines (dark and not strongly coloured), softened at edges.
    chroma = img.max(axis=2) - img.min(axis=2)
    ink = np.clip((0.40 - lum) / 0.18, 0, 1) * np.clip((0.24 - chroma) / 0.12, 0, 1)
    # Solid black masses (hair, hulls, shadows) stay dark with a line-thin gold outline, like an engraving.
    solid = (ink > .5).astype(np.uint8)
    dist = cv2.distanceTransform(solid, cv2.DIST_L2, 3)
    fill = np.clip((dist - 7.0) / 3.0, 0, 1)
    fill = cv2.GaussianBlur(fill.astype(np.float32), (0, 0), 0.8)[..., None]
    ink = cv2.GaussianBlur(ink.astype(np.float32), (0, 0), 0.6)[..., None]
    ink_c = np.array(t['ink'], np.float32) / 255.
    fill_c = np.array(t.get('fill', t['grey'][0]), np.float32) / 255.
    line_c = ink_c * (1 - fill) + fill_c * fill
    out = base * (1 - ink) + line_c * ink
    ink = ink * (1 - fill)
    if t['glow']:
        glow = cv2.GaussianBlur(ink[..., 0], (0, 0), 3.0)[..., None] * t['glow']
        out = np.clip(out + ink_c * glow, 0, 1)
    return (out * 255).astype(np.uint8)

def frame(pic, theme, W=600, H=1000, border=18):
    t = THEMES[theme]
    canvas = np.zeros((H, W, 3), np.uint8); canvas[:] = t['border_bg']
    ih, iw = pic.shape[:2]
    bw, bh = W - 2 * border, H - 2 * border
    s = min(bw / iw, bh / ih)
    nw, nh = int(iw * s), int(ih * s)
    rs = cv2.resize(pic, (nw, nh), interpolation=cv2.INTER_AREA)
    x0, y0 = (W - nw) // 2, (H - nh) // 2
    canvas[y0:y0 + nh, x0:x0 + nw] = rs
    fc = t['frame']
    cv2.rectangle(canvas, (x0 - 1, y0 - 1), (x0 + nw, y0 + nh), fc, 2, cv2.LINE_AA)
    cv2.rectangle(canvas, (7, 7), (W - 8, H - 8), tuple(int(c * .6 + bg * .4) for c, bg in zip(fc, t['border_bg'])), 1, cv2.LINE_AA)
    return canvas

def run(src, out, theme, files=None):
    os.makedirs(out, exist_ok=True)
    for f in files or sorted(os.listdir(src)):
        if not f.lower().endswith('.jpg'): continue
        rgb = np.array(Image.open(os.path.join(src, f)).convert('RGB'))
        pic = recolor(crop_picture(rgb, f), theme)
        Image.fromarray(frame(pic, theme)).save(os.path.join(out, f[:-4] + '.webp'), 'WEBP', quality=84, method=6)

if __name__ == '__main__':
    run(sys.argv[1], sys.argv[2], sys.argv[3], sys.argv[4:] or None)
