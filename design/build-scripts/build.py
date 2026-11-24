from pathlib import Path
import json
from bs4 import BeautifulSoup

root = Path(__file__).resolve().parent.parent
source = root / '새록_앱데모_1차.html'
doc = BeautifulSoup(source.read_text(encoding='utf-8'), 'html.parser')
data = json.loads((root / '.html_build/figma-runtime.json').read_text(encoding='utf-8'))

def node(node_id):
    return doc.find(attrs={'data-node-id': node_id})

def label(node_id, value):
    element = node(node_id)
    if element:
        element.clear()
        element.append(value)
        element['style'] = element.get('style', '') + ';white-space:pre-line;line-height:1.45'

def button(node_id, value):
    element = doc.new_tag('button', type='button')
    element['class'] = 'actionbtn'
    element['data-node-id'] = node_id
    element.string = value
    return element

for link in list(doc.find_all('link')):
    link.decompose()
doc.html['data-theme'] = 'light'
doc.title.string = '새록 · 로그인 없이 체험하는 앱 데모'
doc.head.append(doc.new_tag('link', rel='icon', href='data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="10" fill="%235d55be"/></svg>'))
for key, value in data['text'].items():
    label(key, value)
for key, value in {
    '4:843': '연습 점수에는 들어가지 않아요.',
    'I4:849;4185:3781': '준비 확인 후 배우기',
    '4:907': '다음에 같은 순서로 골라요.',
    '4:918': '예제 순서 · 마지막을 골라요',
    '4:984': '예제 기록으로 흐름을 살펴봐요.',
    '24:1283': '나의 펫 돌보기',
}.items():
    label(key, value)

for body_id, new_id, value, anchor_id in [
    ('4:470', '53:870', '잠시 쉬기', '4:909'),
    ('4:507', '53:875', '잠시 쉬기', '4:958'),
    ('4:544', '53:880', '잠시 쉬기', '4:976'),
]:
    anchor = node(anchor_id)
    anchor.insert_before(button(new_id, value))
old = node('4:956')
row = doc.new_tag('div', attrs={'class': 'actrow'})
row.append(button('53:886', '하나 지우기'))
row.append(button('53:890', '다시 보기'))
old.replace_with(row)
goals = doc.new_tag('div', attrs={'class': 'actrow goals'})
for node_id, value in [('53:904', '장보기'), ('53:909', '약속'), ('53:914', '물건')]:
    goals.append(button(node_id, value))
node('4:1012').insert_after(goals)

old_input = node('45:840')
name_input = doc.new_tag('input', type='text', value='정희', maxlength='20', autocomplete='off')
name_input['id'] = 'profile-name'
name_input['class'] = 'profile-input'
name_input['aria-label'] = '이름 또는 별명'
name_input['data-node-id'] = '45:840'
old_input.replace_with(name_input)
node('24:974')['data-name'] = '이름 입력'

for node_id, value in [('44:912', '카카오 로그인 체험'), ('44:919', '이메일 로그인 체험')]:
    element = node(node_id)
    text = element.find('p')
    if text:
        text.string = value
join = doc.find('section', attrs={'data-id': '46:845'})
join.find(attrs={'data-name': '본문'}).insert(0, doc.new_tag('p', attrs={'class': 'demo-note'}))
join.select_one('.demo-note').string = '계정이 만들어지지 않는 데모 화면이에요.'

doc.select_one('.brand .eyebrow').string = '새록 · HTML DEMO'
doc.select_one('.brand p').string = '32개 화면을 눌러 보는 앱 데모예요. 선택과 펫의 성장은 이 브라우저에만 저장됩니다.'
doc.find(id='restart').string = '첫 화면으로'
doc.find(id='toast')['role'] = 'status'
doc.find(id='toast')['aria-live'] = 'polite'

style = doc.new_tag('style')
style.string = (root / '.html_build/runtime.css').read_text(encoding='utf-8')
doc.head.append(style)
runtime = (root / '.html_build/runtime.js').read_text(encoding='utf-8')
payload = json.dumps(data, ensure_ascii=False, separators=(',', ':')).replace('</', '<\\/')
doc.find_all('script')[-1].string = 'const FIGMA = ' + payload + ';\n' + runtime
target = root / '새록_앱데모.html'
target.write_text(str(doc), encoding='utf-8')
assert len(doc.select('section.scr')) == 32
assert not doc.find('script', src=True)
assert not doc.find('link', href=lambda x: x and x.startswith('http'))
print(str(target))
print(f'{target.stat().st_size:,} bytes · 32 screens · embedded assets')
