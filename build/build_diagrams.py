from pathlib import Path
import math
from PIL import Image, ImageDraw, ImageFont

OUT = Path(__file__).resolve().parents[1] / '새록_2차_디자인_산출물'
OUT.mkdir(exist_ok=True)
FRAME, INK, PURPLE = '#282338', '#2C283D', '#5D55BE'
SOFT, LIGHT, MINT, LINE, MUTED = '#EFEBFA', '#F8F6FC', '#DDF0E8', '#CEC7E4', '#716B86'
REG = 'C:/Windows/Fonts/NotoSansKR-Regular.ttf'
BOLD = 'C:/Windows/Fonts/NotoSansKR-Bold.ttf'
ENG = 'C:/Windows/Fonts/arial.ttf'
fonts = {}
seen = set()

def font(size, bold=False, english=False):
    key = size, bold, english
    if key not in fonts:
        fonts[key] = ImageFont.truetype(ENG if english else BOLD if bold else REG, size)
    return fonts[key]

def text(x, y, value, size=30, fill=INK, bold=False, width=None, center=False, english=False):
    f = font(size, bold, english)
    rows = str(value).split('\n')
    for index, row in enumerate(rows):
        length = draw.textlength(row, font=f)
        assert width is None or length <= width, (row, length, width)
        xx = x + (width - length) / 2 if center and width is not None else x
        draw.text((xx, y + index * size * 1.45), row, font=f, fill=fill, stroke_width=0)
    return len(rows) * size * 1.45

def rounded(box, fill='white', radius=24, outline=None, weight=2):
    draw.rounded_rectangle(box, radius, fill, outline, weight)

def arrow(points, fill=LINE, weight=3, head=11):
    draw.line(points, fill=fill, width=weight, joint='curve')
    (x1, y1), (x2, y2) = points[-2:]
    a = math.atan2(y2-y1, x2-x1)
    draw.polygon([(x2,y2),(x2-head*math.cos(a-.45), y2-head*math.sin(a-.45)),(x2-head*math.cos(a+.45),y2-head*math.sin(a+.45))], fill)

def node(x, y, w, num, title, soft=False, h=100):
    seen.add(num)
    rounded((x,y,x+w,y+h), MINT if soft else PURPLE, 24)
    label_color = INK if soft else 'white'
    text(x+20,y+13,f'{num:02}',21, label_color, True)
    rows = title.split('\n')
    fsize = 30 if len(rows)==1 else 27
    text(x+54,y+(h-fsize*1.45*len(rows))/2-3,title,fsize,label_color,True,w-69,True)

def chain(y, entries, w, xs, h=100):
    for x, entry in zip(xs, entries):
        node(x,y,w,*entry,h=h)
    for x in xs[:-1]:
        arrow([(x+w,y+h/2),(x+w+(xs[1]-xs[0]-w),y+h/2)])

def section(y, n, title, detail=None):
    rounded((120,y,179,y+53),SOFT,15)
    text(120,y+4,n,28,PURPLE,True,59,True)
    text(204,y-1,title,35,INK,True)
    if detail:
        text(204,y+57,detail,25,MUTED)

def page(h, number, title, subtitle):
    global im, draw
    im = Image.new('RGB',(2600,h),FRAME)
    draw = ImageDraw.Draw(im)
    text(82,58,f'({number})',43,'#CFC4F2',english=True)
    text(275,38,title,76,'white',english=True)
    text(278,130,subtitle,27,'#BBB3CD')
    text(2245,61,'새록',40,'#D1C8FA',True,width=270,center=True)
    text(2245,122,'2ND HTML DEMO',21,'#BBB3CD',width=270,center=True,english=True)
    rounded((65,195,2535,h-114),'#FFFEFF',34)
    text(90,h-78,'새록_앱데모_2차.html 기반 · 32개 화면 · 모바일 414 × 920',23,'#BDB4CC')
    text(2220,h-78,'2026.11.02',23,'#BDB4CC',english=True)

def save(name):
    im.save(OUT/name,optimize=True)
    preview = im.copy()
    preview.thumbnail((1300,1500),Image.Resampling.LANCZOS)
    checks = Path(__file__).resolve().parent / 'diagram_checks'
    checks.mkdir(exist_ok=True)
    preview.save(checks/name)

def flow():
    page(2760,'01','user flow','첫 진입부터 기억 연습, 생활 계획과 펫 성장까지의 실제 사용 경로')
    text(120,245,'화면 번호는 현재 앱 화면과 연결됩니다.  화살표는 누른 뒤 이동하는 화면을 뜻합니다.',27,MUTED)
    section(325,'01','첫 방문 · 예제 체험','나에게 편한 글자와 프로필을 고른 뒤, 예제 데이터로 서비스를 먼저 살펴봅니다.')
    xs=[140,610,1080,1550,2020]
    chain(445,[(13,'데모 로그인 /\n로그인 없이 체험'),(14,'글자 크기 선택'),(15,'이름 · 연령대\n성별 선택'),(16,'기억 방법\n친숙도 선택'),(28,'준비 완료\n예제 둘러보기')],380,xs)
    arrow([(2210,545),(2210,590),(330,590),(330,645)])
    chain(645,[(29,'예제 홈\n한눈에 보기'),(30,'예제 기록\n4주 흐름'),(31,'체험 마치기\n로그인 체험'),(32,'가입 완료\n데모 화면'),(3,'첫 연습\n준비하기')],380,xs)
    text(140,770,'29 · 32  연습 시작 → 03 준비하기',26,PURPLE,True)
    text(1100,770,'31  조금 더 둘러보기 → 29     /     28  다시 고르기 → 13',26,MUTED)
    text(140,815,'32  홈으로 가기 → 01',25,MUTED)

    section(875,'02','매일의 연습 · 생활 적용','전략을 배우고 연습한 뒤, 결과를 확인하고 일상에서 써 볼 목표를 정합니다.')
    six=[140,535,930,1325,1720,2115]
    chain(995,[(1,'오늘의 연습'),(2,'이용 안내\n내용 확인'),(3,'편안하게\n준비하기'),(4,'묶기 전략\n배우기'),(5,'순서\n기억하기'),(6,'순서대로\n고르기')],330,six)
    arrow([(2280,1095),(2280,1140),(330,1140),(330,1195)])
    chain(1195,[(7,'조금 뒤에\n떠올리기'),(8,'오늘의\n연습 기록'),(9,'생활 목표\n주간 계획'),(27,'펫 성장\n보상 확인'),(1,'홈으로\n다음 연습')],380,xs)
    text(140,1320,'03  큰 카드 누른 뒤 진행',26,PURPLE,True)
    text(790,1320,'06  답을 선택한 뒤 진행 · 다시 보기 → 05',26,MUTED)
    text(1795,1320,'07  진행자에게 구두 회상',26,MUTED)

    section(1430,'03','나의 연습 유형 · 기억 친구','4가지 선호와 그림 다시 찾기를 살펴보고, 함께할 펫을 고릅니다.')
    chain(1550,[(17,'유형 테스트\n안내'),(18,'기억 단서\n그림 / 단어'),(19,'정리 방식\n묶기 / 순서'),(20,'연습 호흡\n짧게 / 차근차근'),(21,'동행 선호\n혼자 / 함께'),(22,'기억 준비\n그림 보기')],330,six)
    arrow([(2280,1650),(2280,1695),(330,1695),(330,1750)])
    chain(1750,[(23,'기억 준비\n다시 찾기'),(24,'나의 기억\n연습 유형'),(25,'펫 고르기\n몽글 · 새봄 · 반짝'),(26,'펫 돌보기\n간식 주기'),(27,'펫 성장\n보상 확인')],380,xs)
    text(140,1875,'진입  01 → 17',26,PURPLE,True)
    text(650,1875,'17  예시 유형 사용 → 25',26,MUTED)
    text(1350,1875,'22  이번에는 건너뛰기 → 24',26,MUTED)
    text(140,1935,'펫 선택 시  성장 전 → 26 / 성장 후 → 27',26,PURPLE,True)
    text(1330,1935,'26  첫 간식은 씨앗 2개 → 0개 · 연습하기 → 04',26,MUTED)

    section(2050,'04','기록 · 설정 · 쉬어가기')
    cards=[(140,10,'나의 기록','연습과 생활 적용 돌아보기\n이번 주 계획 바꾸기 → 09\n홈으로 돌아가기 → 01'),(930,11,'설정과 가족 공유','예제 프로필 수정 → 15\n글자 크기 조정 → 14\n공유하지 않고 계속 → 01'),(1720,12,'도움과 쉬어가기','설정 바꾸기 → 11\n계속 연습하기 → 이전 화면\n오늘은 여기까지 → 01')]
    for x,num,title,body in cards:
        seen.add(num)
        rounded((x,2145,x+730,2410),LIGHT,22,LINE)
        rounded((x+25,2173,x+88,2222),SOFT,13)
        text(x+25,2177,f'{num:02}',26,PURPLE,True,63,True)
        text(x+111,2173,title,32,INK,True,width=590)
        text(x+29,2247,body,27,MUTED,width=670)
    rounded((140,2470,2460,2576),SOFT,20)
    text(168,2491,'데모 범위',28,PURPLE,True)
    text(365,2495,'로그인·가입은 체험용 화면 전환이며, 선택과 펫 성장은 현재 브라우저에 저장됩니다.',26,MUTED,width=2050)
    assert seen == set(range(1,33)), sorted(set(range(1,33))-seen)
    save('01_user_flow.png')

def ia_card(x,y,w,title,rows):
    height=91+sum(53 if isinstance(r,str) else 85 for r in rows)
    rounded((x,y,x+w,y+height),LIGHT,22,LINE)
    text(x+27,y+21,title,32,INK,True,width=w-54)
    yy=y+86
    for row in rows:
        if isinstance(row,str):
            text(x+29,yy,row,26,MUTED,width=w-56)
            yy+=53
        else:
            heading,detail=row
            text(x+27,yy,heading,28,PURPLE,True,width=w-54)
            text(x+27,yy+42,detail,24,MUTED,width=w-54)
            yy+=85
    return height

def architecture():
    page(2370,'02','information architecture','현재 UI의 진입 구조, 하단 탐색과 공통 화면을 한눈에 정리한 정보 구조')
    rounded((1085,250,1515,340),PURPLE,45)
    text(1085,263,'새록',43,'white',True,430,True)
    text(140,265,'32 SCREENS',26,PURPLE,True,english=True)
    text(140,308,'실제 데모의 화면 구성 기준',26,MUTED)
    text(1885,280,'선은 소속 관계 · → 는 주요 이동',25,MUTED,width=575)
    rounded((140,390,2460,690),SOFT,24)
    text(175,412,'진입 · 예제 체험',33,PURPLE,True)
    text(175,470,'체험 준비  5개 화면',28,INK,True)
    text(175,520,'13  로그인과 데모 시작   →   14  글자 크기 선택',27,MUTED,width=1090)
    text(175,568,'15  이름·연령대·성별   →   16  기억 방법 선택',27,MUTED,width=1090)
    text(175,616,'28  준비 완료 · 예제 둘러보기',27,MUTED,width=1090)
    draw.line([(1295,470),(1295,650)],LINE,2)
    text(1345,470,'예제 데이터 둘러보기  4개 화면',28,INK,True)
    text(1345,520,'29  예제 홈   →   30  예제 기록 · 4주 흐름',27,MUTED,width=1080)
    text(1345,568,'31  체험 마치기   →   32  가입 완료',27,MUTED,width=1080)
    text(1345,616,'29·32  연습 시작 → 03  /  32  홈으로 가기 → 01',27,MUTED,width=1080)

    text(140,745,'MAIN NAVIGATION',23,PURPLE,True,english=True)
    text(140,783,'실제 하단 탭 4개',35,INK,True)
    xs=[140,735,1330,1925]
    draw.line([(1300,340),(1300,365),(2490,365),(2490,845),(405,845)],LINE,3)
    for x in xs:
        draw.line([(x+265,845),(x+265,880)],LINE,3)
    tabs=[('홈','01'),('배우기','04'),('연습','03'),('내 기록','10')]
    for x,(title,num) in zip(xs,tabs):
        rounded((x,880,x+530,968),PURPLE,26)
        text(x+22,904,num,23,'#D8D1F7',True)
        text(x+22,894,title,40,'white',True,486,True)
        draw.line([(x+265,968),(x+265,992)],LINE,3)

    ia_card(140,992,530,'01  오늘의 연습',[
        ('02  이용 안내와 동의','연습 시작 전 내용 확인'),
        ('유형 테스트 · 펫 고르기','17 안내 · 25 펫 선택으로 연결'),
        ('기억 친구 카드','26 돌보기 / 27 성장 확인'),
        '오늘의 연습 시작 → 02',
    ])
    ia_card(735,992,530,'04  묶기 전략 배우기',[
        ('그림을 종류별로 묶기','전략 설명 · 그림 예시'),
        ('이 방법으로 연습하기','05 순서 기억하기로 이동'),
        '하단 탭에서 바로 접근',
    ])
    ia_card(1330,992,530,'03  편안하게 준비하기',[
        '소리·조작 확인 · 큰 카드 누르기',
        '05  순서 기억하기',
        '06  순서대로 고르기',
        '07  조금 뒤에 떠올리기',
        '08  오늘의 연습 기록',
        '09  생활 목표와 주간 계획',
    ])
    ia_card(1925,992,530,'10  나의 기록',[
        ('연습·생활 적용 돌아보기','주간 연습과 도움 기록'),
        ('이번 주 계획 바꾸기','09 생활 목표와 주간 계획'),
        ('홈으로 돌아가기','01 오늘의 연습'),
    ])

    text(140,1505,'SHARED SCREENS',23,PURPLE,True,english=True)
    text(140,1543,'유형·펫과 이용을 돕는 공통 화면',35,INK,True)
    cards=[
        (140,'유형 테스트  17–24',[
            ('17  유형 테스트 안내','시작 / 예시 유형으로 건너뛰기'),
            ('18–21  네 가지 선호','기억 단서 · 정리 방식 · 호흡 · 동행'),
            ('22–23  기억 준비','그림 보기 · 다시 찾기'),
            ('24  나의 기억 연습 유형','선호 기반 유형 · 추천 전략'),
        ]),
        (930,'기억 친구  25–27',[
            ('25  펫 고르기','몽글 · 새봄 · 반짝'),
            ('26  펫 돌보기','씨앗 2개로 간식 주기'),
            ('27  펫 성장과 보상','성장 확인 · 생활 목표 · 홈'),
            '홈의 기억 친구 카드에서 접근',
        ]),
        (1720,'설정 · 도움  11–12',[
            ('11  설정과 가족 공유','프로필 · 글자 크기 · 공유 안내'),
            ('12  도움과 쉬어가기','설정 · 계속 연습 · 오늘은 여기까지'),
            '상단 설정·도움 버튼에서 접근',
            '연습 화면의 잠시 쉬기 → 12',
        ]),
    ]
    for x,title,rows in cards:
        ia_card(x,1632,730,title,rows)
    rounded((140,2145,2460,2228),SOFT,18)
    text(168,2165,'유형은 선호를 살펴보는 데모입니다. 기록의 수치·이름은 예시이며, 선택 상태는 현재 브라우저에 저장됩니다.',26,MUTED,width=2250)
    save('02_information_architecture.png')

flow()
architecture()
print('완료: 사용자 흐름도와 정보 구조도 · 모든 32개 화면 참조 확인')
