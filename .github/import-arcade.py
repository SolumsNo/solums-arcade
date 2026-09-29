import concurrent.futures,hashlib,json,pathlib,re,subprocess,urllib.parse
manifest=json.loads(pathlib.Path('.github/arcade-import.json').read_text())
def download(item):
 path=pathlib.Path(item['path'])
 if path.is_absolute() or '..' in path.parts:raise ValueError('Unsafe path')
 url=manifest['base_url']+urllib.parse.quote(item['path'])
 data=subprocess.check_output(['curl','--fail','--silent','--show-error','--location','--retry','3','--max-time','90',url])
 if hashlib.sha256(data).hexdigest()!=item['sha256'] and path.suffix=='.html':
  # The hosting edge may append its browser-check script; retain only our original bytes.
  data=re.sub(rb'<script>\(function\(\)\{function c\(\).*?__CF\$cv\$params.*?</script>',b'',data,flags=re.S)
 if hashlib.sha256(data).hexdigest()!=item['sha256']:raise ValueError('Checksum mismatch: '+str(path))
 staged=pathlib.Path('.arcade-staging')/path;staged.parent.mkdir(parents=True,exist_ok=True);staged.write_bytes(data)
 return path
with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:paths=list(pool.map(download,manifest['files']))
for path in paths:
 path.parent.mkdir(parents=True,exist_ok=True);(pathlib.Path('.arcade-staging')/path).replace(path)
print('Verified and imported',len(paths),'files')
