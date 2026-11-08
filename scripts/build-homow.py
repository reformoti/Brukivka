"""Build the independent single-file HoMoW game from the editable source modules."""
from pathlib import Path
import re,base64
ROOT=Path(__file__).resolve().parents[1]
source=(ROOT/'realms.html').read_text()
def css_text(name,chain=()):
 name=name.split('?')[0]
 if name in chain:raise ValueError('Circular CSS import: '+name)
 text=(ROOT/name).read_text()
 def imported(m):
  target=((ROOT/name).parent/m.group(2).split('?')[0]).relative_to(ROOT)
  return css_text(str(target),chain+(name,))
 text=re.sub(r"@import\s+url\((['\"]?)([^)\"']+)\1\)\s*;",imported,text)
 def embed(u):
  file=(ROOT/name).parent/u.group(2).split('?')[0]
  if not file.is_file():return u.group(0)
  mime='font/ttf' if file.suffix=='.ttf' else 'image/webp'
  return "url('data:"+mime+';base64,'+base64.b64encode(file.read_bytes()).decode()+"')"
 return re.sub(r'url\(([\"\']?)([^\)\"\']+)\1\)',embed,text)
def css(m):
 return '<style>\n'+css_text(m.group(1))+'\n</style>'
def js(m):
 name=m.group(1).split('?')[0]
 return '<script>\n'+(ROOT/name).read_text().replace('</script','<\\/script')+'\n</script>'
source=re.sub(r'<link rel="stylesheet" href="([^"]+)"\s*/?>',css,source)
source=re.sub(r'<script src="([^"]+)"[^>]*></script>',js,source)
source=source.replace('</body>', '<script>if(location.protocol===\'file:\'){document.querySelectorAll(\'a[href="index.html"]\').forEach(a=>a.href=\'https://reformoti.github.io/Brukivka/\');}</script></body>')
license_note='\n<!-- Bundled fonts: Manrope and Solitus, SIL Open Font License 1.1.\n'+(ROOT/'fonts/OFL-Manrope.txt').read_text()+'\n'+(ROOT/'fonts/OFL-Solitus.txt').read_text()+'\n-->\n'
source=source.replace('<head>','<head>'+license_note)
(ROOT/'homow.html').write_text(source)
print('Built homow.html:',len(source.encode()),'bytes; no external runtime assets')
