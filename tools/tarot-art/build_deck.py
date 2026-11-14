"""Build the Galaxiora Tarot deck from the 1909 Rider–Waite–Smith scans (public domain).

    python3 tools/tarot-art/build_deck.py <scans_dir> [dark|light]

<scans_dir> = tarot/rider-waite/full of https://github.com/mixvlad/TarotCards (pinned revision in
apps/web/lib/tarot-art.ts). dark → apps/web/public/tarot/galaxiora, light → .../galaxiora-light.
Writes <card-id>.webp (600×1000) and <card-id>-sm.webp (300×500) for all 78 cards.
Needs Python with numpy, opencv-python and Pillow (WebP)."""
import os, sys
import numpy as np
from PIL import Image
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import recolor as R

MAJOR = dict(fool='00_Fool', magician='01_Magician', priestess='02_High_Priestess', empress='03_Empress', emperor='04_Emperor',
             hierophant='05_Hierophant', lovers='06_Lovers', chariot='07_Chariot', strength='08_Strength', hermit='09_Hermit',
             wheel='10_Wheel_of_Fortune', justice='11_Justice', hanged='12_Hanged_Man', death='13_Death', temperance='14_Temperance',
             devil='15_Devil', tower='16_Tower', star='17_Star', moon='18_Moon', sun='19_Sun', judgement='20_Judgement', world='21_World')
SUITS = dict(wands='Wands', cups='Cups', swords='Swords', pentacles='Pents')
RANKS = ['ace', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'page', 'knight', 'queen', 'king']

def card_files():
    ids = {'major-' + k: v + '.jpg' for k, v in MAJOR.items()}
    for suit, prefix in SUITS.items():
        for i, rank in enumerate(RANKS):
            ids[suit + '-' + rank] = f'{prefix}{i + 1:02d}.jpg'
    return ids

def main():
    src = sys.argv[1]
    theme = sys.argv[2] if len(sys.argv) > 2 else 'dark'
    root = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'apps', 'web', 'public', 'tarot')
    out = os.path.join(root, 'galaxiora' if theme == 'dark' else 'galaxiora-' + theme)
    os.makedirs(out, exist_ok=True)
    for cid, name in card_files().items():
        rgb = np.array(Image.open(os.path.join(src, name)).convert('RGB'))
        card = Image.fromarray(R.frame(R.recolor(R.crop_picture(rgb, name), theme), theme))
        card.save(os.path.join(out, cid + '.webp'), 'WEBP', quality=82, method=6)
        card.resize((300, 500), Image.LANCZOS).save(os.path.join(out, cid + '-sm.webp'), 'WEBP', quality=80, method=6)
    print('78 cards →', os.path.normpath(out))

if __name__ == '__main__':
    main()
