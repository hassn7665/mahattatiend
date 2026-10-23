#!/usr/bin/env python3
"""يدمج ملفات css/js داخل ملف HTML واحد: python3 build.py  ->  dist/mahattati-single.html"""
import re, pathlib
r = pathlib.Path(__file__).parent
h = (r/'index.html').read_text('utf-8')
h = h.replace('<link rel="stylesheet" href="css/style.css">', '<style>\n'+(r/'css/style.css').read_text('utf-8')+'\n</style>')
srcs = re.findall(r'<script src="(js/[^"]+)"></script>', h)
code = '\n'.join((r/s).read_text('utf-8') for s in srcs)
h = re.sub(r'<script src="js/[^"]+"></script>\n?', '', h)
h = h.replace('</body>', '<script>\n'+code+'\n</script></body>')
(r/'dist').mkdir(exist_ok=True)
(r/'dist'/'mahattati-single.html').write_text(h, 'utf-8')
print('built dist/mahattati-single.html')
