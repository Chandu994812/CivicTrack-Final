import json

with open('data.json', 'rb') as f:
    raw = f.read()

text = raw.decode('utf-16le').lstrip('\ufeff')
data = json.loads(text)

user_districts = [
    'Srikakulam', 'Parvathipuram Manyam', 'Vizianagaram', 'Visakhapatnam', 'Anakapalli', 
    'Alluri Sitharama Raju', 'Kakinada', 'East Godavari', 'Dr. B. R. Ambedkar Konaseema', 
    'West Godavari', 'Eluru', 'Krishna', 'NTR', 'Guntur', 'Palnadu', 'Bapatla', 'Prakasam', 
    'Sri Potti Sriramulu Nellore', 'Kurnool', 'Nandyal', 'Anantapur', 'Sri Sathya Sai', 
    'YSR Kadapa', 'Annamayya', 'Chittoor', 'Tirupati'
]

final_map = {d: set() for d in user_districts}

def normalize(s):
    s = s.replace('district', '').strip()
    s = s.replace('Sri Potti Sri Ramulu Nellore', 'Sri Potti Sriramulu Nellore')
    s = s.replace('Anantapuram', 'Anantapur')
    return s

for raw_dist, mandals in data.items():
    dist = normalize(raw_dist)
    matched = None
    for ud in user_districts:
        if dist.lower() == ud.lower():
            matched = ud
            break
    
    if matched:
        for m in mandals:
            final_map[matched].add(m)
    else:
        print(f'Unmatched district: {raw_dist} -> {dist}')

js_content = 'export const apHierarchy = {\n  districts: [\n'

for d in user_districts:
    mandals = sorted(list(final_map[d]))
    js_content += f'    {{\n      name: "{d}",\n      mandals: [\n'
    for m in mandals:
        js_content += f'        {{\n          name: "{m}",\n          villages: []\n        }},\n'
    js_content += '      ]\n    },\n'

js_content += '  ]\n};\n'

with open('server/data/hierarchy.js', 'w', encoding='utf-8') as f:
    f.write(js_content)
print('Done!')
