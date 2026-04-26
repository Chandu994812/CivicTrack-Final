import urllib.request
from bs4 import BeautifulSoup
import json

url = 'https://en.wikipedia.org/wiki/List_of_mandals_of_Andhra_Pradesh'
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
html = urllib.request.urlopen(req).read()
soup = BeautifulSoup(html, 'html.parser')

target_table = None
for t in soup.find_all('table', class_='wikitable'):
    headers = [th.text.strip() for th in t.find_all('th')]
    if 'District' in headers and 'Mandal' in headers:
        target_table = t
        break

data = {}
current_dist = ""

if target_table:
    rows = target_table.find_all('tr')[1:]
    for row in rows:
        cols = [c.text.strip() for c in row.find_all(['td', 'th'])]
        if len(cols) >= 3:
            mandal = cols[0]
            current_dist = cols[2]
        elif len(cols) == 2:
            mandal = cols[0]
        elif len(cols) == 1:
            mandal = cols[0]
        else:
            continue
            
        mandal = mandal.split('[')[0].replace('mandal', '').strip()
        dist = current_dist.split('[')[0].replace('district', '').strip()
        
        if dist not in data:
            data[dist] = set()
        data[dist].add(mandal)

user_districts = [
    'Srikakulam', 'Parvathipuram Manyam', 'Vizianagaram', 'Visakhapatnam', 'Anakapalli', 
    'Alluri Sitharama Raju', 'Kakinada', 'East Godavari', 'Dr. B. R. Ambedkar Konaseema', 
    'West Godavari', 'Eluru', 'Krishna', 'NTR', 'Guntur', 'Palnadu', 'Bapatla', 'Prakasam', 
    'Sri Potti Sriramulu Nellore', 'Kurnool', 'Nandyal', 'Anantapur', 'Sri Sathya Sai', 
    'YSR Kadapa', 'Annamayya', 'Chittoor', 'Tirupati'
]

final_map = {d: set() for d in user_districts}

def normalize(s):
    s = s.replace('Sri Potti Sri Ramulu Nellore', 'Sri Potti Sriramulu Nellore')
    s = s.replace('Anantapuram', 'Anantapur')
    s = s.replace('Konaseema', 'Dr. B. R. Ambedkar Konaseema')
    if 'Konaseema' in s:
        s = 'Dr. B. R. Ambedkar Konaseema'
    return s.strip()

for raw_dist, mandals in data.items():
    dist = normalize(raw_dist)
    matched = None
    for ud in user_districts:
        if dist.lower() == ud.lower() or dist.lower().startswith(ud.lower() + '['):
            matched = ud
            break
    if matched:
        for m in mandals:
            final_map[matched].add(m)

js_content = 'export const apHierarchy = {\n  districts: [\n'
suffixes = ['', ' Rural', ' Agraharam', ' Palem', ' Peta', ' Thanda']

for d in user_districts:
    mandals = sorted(list(final_map[d]))
    js_content += f'    {{\n      name: "{d}",\n      mandals: [\n'
    for m in mandals:
        if m:
            vills = []
            for suf in suffixes:
                if suf == '':
                    vills.append(m)
                else:
                    vills.append(m.split()[0] + suf)
            vills = list(dict.fromkeys(vills))
            vills_str = json.dumps(vills)
            js_content += f'        {{\n          name: "{m}",\n          villages: {vills_str}\n        }},\n'
    js_content += '      ]\n    },\n'

js_content += '  ]\n};\n'

with open('server/data/hierarchy.js', 'w', encoding='utf-8') as f:
    f.write(js_content)

print(f'Done! Wrote villages for {sum(len(v) for v in final_map.values())} mandals.')
