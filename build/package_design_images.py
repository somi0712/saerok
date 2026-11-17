from pathlib import Path
import hashlib
import json
import zipfile
from PIL import Image, ImageDraw, ImageFont, ImageOps

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / '새록_2차_디자인_산출물'
items = [
    ('01_user_flow.png', '01  User Flow', '사용자 흐름도'),
    ('02_information_architecture.png', '02  Information Architecture', '인포메이션 아키텍처'),
    ('03_wireframes.png', '03  Wireframes', '현재 UI 기반 와이어프레임 · 32개 화면'),
    ('04_UIUX_portfolio.png', '04  UI/UX Portfolio', '한 장 UI/UX 포트폴리오'),
]

overview = Image.new('RGB', (1800, 1530), '#282338')
d = ImageDraw.Draw(overview)
regular = lambda n: ImageFont.truetype('C:/Windows/Fonts/NotoSansKR-Regular.ttf', n)
bold = lambda n: ImageFont.truetype('C:/Windows/Fonts/NotoSansKR-Bold.ttf', n)
d.text((60, 38), '새록 · UI/UX 디자인 산출물', font=bold(43), fill='white')
d.text((62, 111), '2차 앱 데모 기반 / 32개 실제 화면 / 고해상도 PNG 4종', font=regular(23), fill='#D1C9E2')
manifest = []
for i, (filename, title, subtitle) in enumerate(items):
    path = OUT / filename
    assert path.is_file() and path.stat().st_size > 10000
    with Image.open(path) as im:
        im.load()
        width, height = im.size
        assert width >= 2400 and height >= 2300
        tile = ImageOps.contain(im.convert('RGB'), (800, 500), Image.Resampling.LANCZOS)
    x, y = 60 + i % 2 * 870, 183 + i // 2 * 655
    d.rounded_rectangle((x, y, x + 810, y + 620), 22, fill='#F9F7FD')
    d.text((x + 22, y + 18), title, font=bold(25), fill='#5D55BE')
    d.text((x + 22, y + 60), subtitle, font=regular(21), fill='#626173')
    overview.paste(tile, (x + (810 - tile.width) // 2, y + 112 + (500 - tile.height) // 2))
    manifest.append({'file': filename, 'width': width, 'height': height, 'sha256': hashlib.sha256(path.read_bytes()).hexdigest()})
overview.save(OUT / '00_산출물_미리보기.png', optimize=True)

note = '''# 새록 2차 디자인 산출물

제공하신 먹어보조 예시의 네 가지 구성을 새록의 보라색 톤과 실제 앱 화면으로 제작했습니다.

- 01_user_flow.png: 첫 진입, 예제 체험, 기억 연습, 유형 테스트와 펫, 기록·설정·도움의 이동 경로
- 02_information_architecture.png: 시작 화면, 실제 하단 탭 4개, 유형·펫 및 공통 화면의 구조
- 03_wireframes.png: 원본 32개 화면 전체를 담은 현재 UI 기반 와이어프레임
- 04_UIUX_portfolio.png: 서비스 개요, 디자인 시스템, 여섯 가지 핵심 경험을 담은 한 장 포트폴리오

PNG 원본은 확대해서 볼 수 있습니다. screens 폴더에는 개별 화면 32장(828×1840), assets에는 원본에서 추출한 기억 친구 이미지가 있습니다.

원본: 새록_앱데모_2차.html / 모바일 화면 414×920 / 제작일: 2026-11-02

앱 원본은 수정하지 않았습니다. 캡처는 각 화면의 초기 예제 상태와 처음 보이는 모바일 영역 기준입니다. 기록의 수치와 이름은 예시이며, 유형은 연습 선호를 안내합니다. 로그인·가입·가족 공유는 데모 화면 기준으로 표현했습니다.
'''
(OUT / '읽어주세요.md').write_text(note, encoding='utf-8')
source = ROOT / '새록_앱데모_2차.html'
source_version = json.loads((OUT / 'source_version.json').read_text(encoding='utf-8'))
assert hashlib.sha256(source.read_bytes()).hexdigest() == source_version['sha256']
assert len(json.loads((OUT / 'screen_manifest.json').read_text(encoding='utf-8'))) == 32
(OUT / 'export_manifest.json').write_text(json.dumps({'sourceUnchanged': True, 'screenCount': 32, 'date': '2026-11-02', 'images': manifest}, ensure_ascii=False, indent=2), encoding='utf-8')
archive = OUT / '새록_2차_디자인_이미지_4종.zip'
with zipfile.ZipFile(archive, 'w', zipfile.ZIP_DEFLATED) as z:
    for name in [x[0] for x in items] + ['00_산출물_미리보기.png', '디자인_방향.md', '읽어주세요.md']:
        z.write(OUT / name, name)
with zipfile.ZipFile(archive) as z:
    assert z.testzip() is None and len(z.namelist()) == 7
print(json.dumps({'images': manifest, 'archive': str(archive), 'sourceUnchanged': True}, ensure_ascii=False))
