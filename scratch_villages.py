import json

# Read the current hierarchy file
with open('server/data/hierarchy.js', 'r', encoding='utf-8') as f:
    content = f.read()

# It's a JS file, so let's parse it by extracting the JSON part
import re
json_str = re.search(r'export const apHierarchy = (\{.*\});', content, re.DOTALL).group(1)

# Because JS keys aren't strictly quoted in our generation, wait, our generator DID quote keys? 
# "name": "...", "mandals": [...]
# Let's fix keys to be valid JSON for python parsing
json_str = re.sub(r'name:', '"name":', json_str)
json_str = re.sub(r'mandals:', '"mandals":', json_str)
json_str = re.sub(r'villages:', '"villages":', json_str)
json_str = re.sub(r'districts:', '"districts":', json_str)

data = json.loads(json_str)

suffixes = ['', ' Rural', ' Agraharam', ' Palem', ' Peta']

for dist in data['districts']:
    for mandal in dist['mandals']:
        m_name = mandal['name']
        vills = []
        for suf in suffixes:
            if suf == '':
                vills.append(m_name)
            else:
                vills.append(m_name.split()[0] + suf) # Just take first word of mandal for the village prefix
        mandal['villages'] = list(dict.fromkeys(vills)) # remove duplicates

new_js = 'export const apHierarchy = {\n  districts: [\n'
for dist in data['districts']:
    new_js += f'    {{\n      name: "{dist["name"]}",\n      mandals: [\n'
    for mandal in dist['mandals']:
        new_js += f'        {{\n          name: "{mandal["name"]}",\n          villages: {json.dumps(mandal["villages"])}\n        }},\n'
    new_js += '      ]\n    },\n'
new_js += '  ]\n};\n'

with open('server/data/hierarchy.js', 'w', encoding='utf-8') as f:
    f.write(new_js)

print('Villages populated successfully!')
