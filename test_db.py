import os
import json
from urllib.request import Request, urlopen

# Load env vars
env_vars = {}
with open('.env.local') as f:
    for line in f:
        line = line.strip()
        if line and not line.startswith('#') and '=' in line:
            key, val = line.split('=', 1)
            env_vars[key] = val.strip('\"\'')

url = env_vars.get('NEXT_PUBLIC_SUPABASE_URL')
key = env_vars.get('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY')

if not url or not key:
    print('Missing credentials')
    exit(1)

req = Request(f'{url}/rest/v1/Services?select=id,nameVN,idx&order=idx.asc', headers={
    'apikey': key
})

try:
    with urlopen(req) as response:
        data = json.loads(response.read().decode())
        print(f'Total Services: {len(data)}')
        for item in data:
             print(f"{item['idx']}: {item['id']} - {item['nameVN']}")
except Exception as e:
    print('Request error:', e)
