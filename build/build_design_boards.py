from pathlib import Path
from functools import lru_cache
import hashlib
import json
import math
from PIL import Image, ImageDraw, ImageFont, ImageFilter

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / '새록_2차_디자인_산출물'
SCREENS = {x['num']: x for x in json.loads((OUT / 'screen_manifest.json').read_text(encoding='utf-8'))}
INK, MUTED, PURPLE = '#2C283D', '#626173', '#5D55BE'
FRAME, SOFT, PAPER, LINE, MINT = '#282338', '#EFEBFA', '#FCFBFE', '#DDD7EC', '#DDF0E8'
CHECKS = []


@lru_cache(None)
def font(size, bold=False, latin=False):
    name = ('arialbd.ttf' if bold else 'arial.ttf') if latin else ('NotoSansKR-Bold.ttf' if bold else 'NotoSansKR-Regular.ttf')
    return ImageFont.truetype(str(Path('C:/Windows/Fonts') / name), size)


def txt(im, xy, value, size, fill=INK, bold=False, width=None, latin=False):
    f = font(size, bold, latin)
    length = f.getlength(value)
    if width is not None:
        assert length <= width + 1, (value, length, width)
    ImageDraw.Draw(im).text(xy, value, font=f, fill=fill, anchor='lt')
    CHECKS.append({'text': value, 'x': xy[0], 'y': xy[1], 'width': round(length), 'height': size * 1.3})


def wrap(value, size, width, bold=False):
    f = font(size, bold)
    result = []
    for paragraph in value.split('\n'):
        line = ''
        for char in paragraph:
            if line and f.getlength(line + char) > width:
                # Keep readable word boundaries where enough of the line remains.
                split = line.rfind(' ')
                if split > len(line) * .55:
                    result.append(line[:split])
                    line = line[split + 1:] + char
                else:
                    result.append(line)
                    line = char
            else:
                line += char
        result.append(line.rstrip())
    return result


def para(im, xy, value, size, width, fill=MUTED, bold=False, leading=None, maxlines=6):
    lines = wrap(value, size, width, bold)
    assert len(lines) <= maxlines, (value, lines)
    leading = leading or round(size * 1.55)
    for i, line in enumerate(lines):
        txt(im, (xy[0], xy[1] + i * leading), line, size, fill, bold, width)
    return len(lines) * leading


def rounded(im, box, fill, radius=30, outline=None, width=2):
    ImageDraw.Draw(im).rounded_rectangle(box, radius, fill, outline, width)


def chip(im, xy, value, size=22, fill=SOFT, color=PURPLE, bold=False, pad=20, height=48):
    w = math.ceil(font(size, bold).getlength(value)) + pad * 2
    rounded(im, (xy[0], xy[1], xy[0] + w, xy[1] + height), fill, height // 2)
    txt(im, (xy[0] + pad, xy[1] + (height - size) // 2 - 1), value, size, color, bold)
    return w


def phone(im, num, xy, width, frame=8, shadow=True, rotate=0):
    shot = Image.open(SCREENS[num]['path']).convert('RGBA')
    assert shot.size == (828, 1840)
    h = round(width * 920 / 414)
    shot = shot.resize((width, h), Image.Resampling.LANCZOS)
    mask = Image.new('L', shot.size)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, width, h), round(width * 38 / 414), 255)
    shot.putalpha(mask)
    fw, fh = width + frame * 2, h + frame * 2
    tile = Image.new('RGBA', (fw + 80, fh + 90))
    if shadow:
        sh = Image.new('RGBA', tile.size)
        ImageDraw.Draw(sh).rounded_rectangle((32, 35, fw + 32, fh + 35), round(width * .1), (30, 21, 57, 40))
        tile.alpha_composite(sh.filter(ImageFilter.GaussianBlur(18)))
    ImageDraw.Draw(tile).rounded_rectangle((30, 24, 30 + fw, 24 + fh), round(width * .105), 'white')
    tile.alpha_composite(shot, (30 + frame, 24 + frame))
    if rotate:
        tile = tile.rotate(rotate, Image.Resampling.BICUBIC, expand=True)
    im.paste(tile, (xy[0] - 30, xy[1] - 24), tile)
    return h + frame * 2


def finish(im, name):
    width, height = im.size
    for c in CHECKS:
        assert c['x'] >= 0 and c['y'] >= 0
        assert c['x'] + c['width'] <= width, (name, c)
        assert c['y'] + c['height'] <= height, (name, c)
    im.convert('RGB').save(OUT / name, optimize=True, dpi=(200, 200))
    CHECKS.clear()


def wireframes():
    im = Image.new('RGB', (5600, 4050), FRAME)
    d = ImageDraw.Draw(im)
    txt(im, (100, 78), '(03)', 56, '#CFC6FF', latin=True)
    txt(im, (300, 55), 'wireframes', 94, 'white', latin=True)
    txt(im, (305, 179), '현재 UI 기반 와이어프레임 · 32개 화면의 전체 구성', 32, '#C6BED7')
    txt(im, (5130, 78), '새록', 55, '#D9D1FF', True)
    txt(im, (4970, 163), '2ND HTML DEMO / 32 SCREENS', 26, '#C6BED7', latin=True)
    d.line((100, 238, 5500, 238), fill='#51485F', width=2)
    rows = [
        ('01', '시작과 예제 체험', '읽기 편한 화면을 고르고, 예제 데이터로 먼저 둘러보기', [13, 14, 15, 16, 28, 29, 30, 31, 32]),
        ('02', '연습 선호와 기억 친구', '네 가지 선호 질문 → 그림 과제 → 유형 결과 → 펫 선택과 성장', list(range(17, 28))),
        ('03', '기억 전략과 생활 실천', '준비 → 전략 학습 → 순서·회상 연습 → 기록과 생활 목표', list(range(1, 13))),
    ]
    short = {13: '로그인 · 데모 시작', 14: '글자 크기 선택', 15: '이름 · 연령 · 성별', 16: '나를 아는 정도', 28: '준비 완료', 29: '예제 홈', 30: '예제 4주 기록', 31: '체험 마치기', 32: '가입 완료', 17: '유형 테스트 안내', 18: '기억 단서 선호', 19: '정리 방식 선호', 20: '연습 호흡 선호', 21: '동행 선호', 22: '그림 보기', 23: '그림 다시 찾기', 24: '나의 연습 유형', 25: '펫 고르기', 26: '펫 돌보기', 27: '펫 성장과 보상', 1: '오늘의 연습', 2: '이용 안내와 동의', 3: '편안하게 준비', 4: '묶기 전략 배우기', 5: '순서 기억하기', 6: '순서대로 고르기', 7: '조금 뒤에 회상', 8: '오늘의 연습 기록', 9: '생활 목표 · 계획', 10: '나의 기록', 11: '설정 · 가족 공유', 12: '도움 · 쉬어가기'}
    width, gap = 420, 30
    seen = []
    for row, (n, title, desc, nums) in enumerate(rows):
        top = 290 + row * 1220
        txt(im, (100, top), n, 32, '#CFC6FF', True, latin=True)
        txt(im, (168, top - 3), title, 40, 'white', True)
        txt(im, (790, top + 3), desc, 28, '#C6BED7')
        start = (5600 - len(nums) * width - (len(nums) - 1) * gap) // 2
        for col, num in enumerate(nums):
            x, y = start + col * (width + gap), top + 90
            txt(im, (x, y), f'{num:02d}', 26, '#CFC6FF', True, latin=True)
            txt(im, (x + 47, y - 1), short[num], 25, '#EAE5F3', width=width - 47)
            phone(im, num, (x, y + 48), width, frame=3, shadow=False)
            seen.append(num)
    assert sorted(seen) == list(range(1, 33)), seen
    d.line((100, 3938, 5500, 3938), fill='#51485F', width=2)
    txt(im, (100, 3980), '원본 UI를 그대로 사용했습니다. 화면 수치·이름·기록은 데모 예시이며, 각 화면의 첫 화면 영역을 담았습니다.', 28, '#C6BED7')
    txt(im, (4820, 3980), 'MOBILE VIEW 414 × 920', 28, '#C6BED7', latin=True)
    finish(im, '03_wireframes.png')


def portfolio():
    im = Image.new('RGB', (2400, 4150), PAPER)
    d = ImageDraw.Draw(im)
    for y in range(680):
        p = y / 680
        c = tuple(round(a + (b - a) * p) for a, b in zip((65, 56, 145), (116, 99, 194)))
        d.line((0, y, 2400, y), fill=c)
    for r in [330, 480, 630, 780]:
        d.ellipse((1950 - r, -60 - r, 1950 + r, -60 + r), outline='#8072C6', width=2)
    txt(im, (110, 65), 'MEMORY PRACTICE / UI·UX DESIGN PROJECT', 23, '#DED7FF', bold=True, latin=True)
    mascot = Image.open(OUT / 'assets' / '몽글.png').convert('RGBA')
    small = mascot.resize((115, 115), Image.Resampling.LANCZOS)
    rounded(im, (110, 123, 231, 244), '#F0EBFF', 34)
    im.paste(small, (113, 126), small)
    txt(im, (261, 123), '새록', 106, 'white', True)
    txt(im, (110, 288), '나만의 기억 방법,', 70, 'white', True)
    txt(im, (110, 385), '친구와 함께 찾아요.', 70, '#E4DDFF', True)
    para(im, (114, 500), '기억하는 방법을 배우고,\n작은 실천을 이어가는 기억 연습 앱', 32, 1000, '#F0EAFF', maxlines=2)
    x = 112
    for value in ['연습 선호 탐색', '전략과 생활 실천', '기억 친구와 성장']:
        x += chip(im, (x, 617), value, 23, '#8172C8', 'white', pad=18, height=43) + 15
    phone(im, 29, (1415, 76), 245, rotate=6)
    phone(im, 26, (1787, 39), 252, rotate=-7)
    big = mascot.resize((230, 230), Image.Resampling.LANCZOS)
    im.paste(big, (2110, 419), big)
    d.rectangle((0, 680, 2400, 738), fill=PAPER)
    # The hero uses captured UI and the original mascot only.
    txt(im, (110, 742), '01  SERVICE OVERVIEW', 22, PURPLE, True, latin=True)
    txt(im, (110, 790), '읽기 편하게 시작하고, 나의 속도로 연습하다.', 43, INK, True)
    challenges = [
        ('01', '시작할 때 느끼는 조작 부담', '처음부터 글자 크기를 고르고,\n로그인 없이 예제 화면을 살펴봐요.', '글자 크기 · 데모 둘러보기'),
        ('02', '나에게 맞는 기억 방법 찾기', '그림·말, 묶기·순서 등 연습 선호를\n질문과 짧은 과제로 돌아봐요.', '선호 탐색 · 쉬운 유형 설명'),
        ('03', '연습을 생활로 이어가기', '생활 목표와 주간 계획을 정하고,\n기억 친구와 작은 실천을 이어가요.', '생활 목표 · 실천 기록 · 펫 성장'),
    ]
    for i, (n, title, desc, tag) in enumerate(challenges):
        x = 110 + i * 735
        rounded(im, (x, 864, x + 710, 1083), 'white', 28, LINE)
        txt(im, (x + 27, 891), n, 24, PURPLE, True, latin=True)
        txt(im, (x + 80, 889), title, 29, INK, True, width=600)
        para(im, (x + 29, 943), desc, 25, 650, maxlines=2)
        txt(im, (x + 29, 1038), tag, 21, PURPLE, True)
    rounded(im, (0, 1120, 2400, 1442), SOFT, 0)
    txt(im, (110, 1153), '02  DESIGN SYSTEM & NAVIGATION', 22, PURPLE, True, latin=True)
    txt(im, (110, 1197), '편안한 보라, 선명한 다음 행동.', 35, INK, True)
    swatches = [('Primary', PURPLE), ('Lavender', '#E5DFF9'), ('Mint', MINT), ('Ink', INK)]
    for i, (name, color) in enumerate(swatches):
        x = 111 + i * 255
        d.ellipse((x, 1263, x + 46, 1309), fill=color, outline=LINE)
        txt(im, (x + 62, 1264), name, 19, INK, True, latin=True)
        txt(im, (x + 62, 1294), color, 18, MUTED, latin=True)
    txt(im, (110, 1356), '가나다 Aa', 33, PURPLE, True)
    txt(im, (325, 1358), '본문 20·22·24px  /  제목 30·32·34px  /  주요 버튼 62px', 21, MUTED)
    txt(im, (1280, 1181), 'MAIN NAVIGATION', 20, MUTED, latin=True)
    rounded(im, (1650, 1221, 1900, 1276), PURPLE, 27)
    txt(im, (1726, 1234), '새록', 26, 'white', True)
    centers = [1385, 1642, 1899, 2156]
    d.line((1775, 1276, 1775, 1298), fill='#B7ACD4', width=2)
    d.line((centers[0], 1298, centers[-1], 1298), fill='#B7ACD4', width=2)
    for c, value in zip(centers, ['홈', '배우기', '연습', '내 기록']):
        d.line((c, 1298, c, 1321), fill='#B7ACD4', width=2)
        rounded(im, (c - 112, 1321, c + 112, 1375), 'white', 14, LINE)
        tw = font(25, True).getlength(value)
        txt(im, (round(c - tw / 2), 1334), value, 25, PURPLE, True)
    txt(im, (1280, 1401), '공통 화면: 설정 · 가족 공유 안내 / 도움 · 쉬어가기', 21, MUTED)
    txt(im, (110, 1490), '03  CORE EXPERIENCES', 22, PURPLE, True, latin=True)
    txt(im, (552, 1484), '새록 2차 데모의 여섯 가지 경험', 38, INK, True)
    cards = [
        ('01', '내 눈에 맞춰 시작', '시작 화면에서 읽기 편한 크기를 직접 골라요.', (14, 15), ('글자 크기 선택', '기본 정보'), [
            ('먼저, 편안하게 읽기', '본문 20·22·24px 중 고르고,\n제목 크기도 함께 바뀌어요.'),
            ('기본 정보는 쉬운 선택으로', '이름·연령대·성별을 입력하고,\n다음 화면으로 한 단계씩 가요.')]),
        ('02', '나에게 맞는 연습 방법', '네 가지 선호를 쉬운 말로 정리해요.', (18, 24), ('기억 단서 선호', '나의 연습 유형'), [
            ('질문은 한 화면에 하나씩', '그림과 말, 묶기와 순서,\n연습 호흡과 동행 선호를 골라요.'),
            ('유형은 나의 방법을 설명해요', '네 축의 선택을 쉬운 유형명과\n추천 전략으로 보여줘요.')]),
        ('03', '보고, 묶고, 떠올리는 연습', '방법을 배운 뒤 직접 기억해 보는 흐름이에요.', (4, 6), ('묶기 전략 배우기', '순서대로 고르기'), [
            ('기억 전략을 먼저 배워요', '비슷한 그림을 묶는 방법을 보고,\n순서를 기억하는 연습으로 가요.'),
            ('시간 제한 없이 천천히', '큰 선택 영역과 간단한 안내로\n순서 기억과 구두 회상을 이어요.')]),
        ('04', '작은 실천을 생활로', '오늘의 연습에서 생활 속 목표로 이어져요.', (8, 9), ('오늘의 연습 기록', '생활 목표 · 주간 계획'), [
            ('결과를 함께 돌아보기', '오늘의 연습 기록과 사용한\n방법을 화면에서 확인해요.'),
            ('다음 실천을 직접 정해요', '장보기·약속 시간·물건 위치 중\n목표와 연습할 요일을 골라요.')]),
        ('05', '기억 친구와 이어가는 동기', '실천의 보상을 친숙한 캐릭터로 보여줘요.', (25, 27), ('펫 고르기', '펫 성장과 보상'), [
            ('나의 기억 친구를 골라요', '몽글·새봄·반짝 중 고르고,\n함께할 친구를 직접 정해요.'),
            ('작은 실천이 성장으로', '씨앗으로 간식을 주고,\n성장과 보상을 확인해요.')]),
        ('06', '기록과 도움을 가까이', '내 흐름을 돌아보고, 필요할 때 쉬어가요.', (30, 12), ('예제 4주 기록', '도움 · 쉬어가기'), [
            ('실천 흐름을 한눈에', '예제 4주 기록으로 실천 흐름과\n변화를 보는 화면을 체험해요.'),
            ('도움과 휴식도 선택이에요', '설정으로 가거나 잠시 쉬고,\n이전 화면으로 돌아갈 수 있어요.')]),
    ]
    for i, (n, title, desc, nums, captions, points) in enumerate(cards):
        x, y = 110 + (i % 2) * 1115, 1570 + (i // 2) * 800
        rounded(im, (x, y, x + 1065, y + 750), 'white', 35, LINE)
        rounded(im, (x + 34, y + 30, x + 91, y + 87), '#E5DFF9', 16)
        txt(im, (x + 48, y + 45), n, 26, PURPLE, True, latin=True)
        txt(im, (x + 111, y + 40), title, 35, INK, True, width=920)
        txt(im, (x + 36, y + 111), desc, 25, MUTED, width=990)
        for j, (num, caption) in enumerate(zip(nums, captions)):
            xx = x + 39 + j * 250
            phone(im, num, (xx, y + 185), 217, frame=6)
            w = font(21).getlength(caption)
            txt(im, (round(xx + 114 - w / 2), y + 702), caption, 21, MUTED)
        for j, (heading, body) in enumerate(points):
            yy = y + 210 + j * 218
            d.ellipse((x + 565, yy - 3, x + 600, yy + 32), fill=SOFT)
            txt(im, (x + 578, yy + 4), str(j + 1), 18, PURPLE, True, latin=True)
            para(im, (x + 616, yy), heading, 27, 410, PURPLE, True, leading=38, maxlines=2)
            para(im, (x + 616, yy + 79), body, 24, 405, MUTED, maxlines=3)
    d.line((110, 3983, 2290, 3983), fill=LINE, width=2)
    txt(im, (110, 4021), '새록', 41, PURPLE, True)
    txt(im, (110, 4083), '작은 연습으로, 내 생활에 가까운 기억 방법.', 22, MUTED)
    para(im, (1040, 4023), '새록_앱데모_2차.html의 실제 UI를 바탕으로 구성했습니다.\n유형은 연습 선호 안내이며, 기록은 예시 데이터입니다. 가입·가족 공유는 데모 화면입니다.', 21, 1250, MUTED, maxlines=3)
    finish(im, '04_UIUX_portfolio.png')


if __name__ == '__main__':
    assert set(SCREENS) == set(range(1, 33))
    source = ROOT / '새록_앱데모_2차.html'
    expected = json.loads((OUT / 'source_version.json').read_text(encoding='utf-8'))['sha256']
    assert hashlib.sha256(source.read_bytes()).hexdigest() == expected
    wireframes()
    portfolio()
    assert hashlib.sha256(source.read_bytes()).hexdigest() == expected
    print(json.dumps({'generated': ['03_wireframes.png', '04_UIUX_portfolio.png'], 'screens': len(SCREENS), 'originalUnchanged': True}, ensure_ascii=False))
