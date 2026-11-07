"""Build the compact, local strategy atlas. Inputs: Natural Earth 5.1.1, public domain."""
import json,math,pathlib,urllib.request,zipfile,sys,hashlib,collections
import shapefile
from shapely.geometry import shape,Point,Polygon,MultiPolygon
from shapely import STRtree,unary_union,make_valid
from shapely.prepared import prep
ROOT=pathlib.Path(__file__).resolve().parents[1];CACHE=pathlib.Path('/tmp/bruk-geodata');CACHE.mkdir(exist_ok=True)
URLS={'countries':'https://naturalearth.s3.amazonaws.com/10m_cultural/ne_10m_admin_0_countries_ukr.zip','provinces':'https://naturalearth.s3.amazonaws.com/10m_cultural/ne_10m_admin_1_states_provinces.zip','cities':'https://naturalearth.s3.amazonaws.com/10m_cultural/ne_10m_populated_places_simple.zip','coast':'https://naturalearth.s3.amazonaws.com/10m_physical/ne_10m_coastline.zip'}
def source(key):
 f=CACHE/(key+'.zip')
 if not f.exists():f.write_bytes(urllib.request.urlopen(URLS[key],timeout=90).read())
 d=CACHE/key;d.mkdir(exist_ok=True)
 if not list(d.glob('*.shp')):zipfile.ZipFile(f).extractall(d)
 return shapefile.Reader(str(next(d.glob('*.shp'))),encoding='utf-8')
def clean(g):
 if not g.is_valid:g=make_valid(g)
 if g.geom_type=='GeometryCollection':g=unary_union([p for p in g.geoms if p.geom_type in ['Polygon','MultiPolygon']])
 return g
project=lambda x,y:[round((x+180)*1200/360,2),round((85-y)*600/170,2)]
def path(g,tol):
 g=g.simplify(tol,preserve_topology=True);parts=list(g.geoms) if g.geom_type=='MultiPolygon' else [g];out=[]
 for p in parts:
  if p.geom_type!='Polygon':continue
  for ring in [p.exterior,*p.interiors]:
   pts=[project(*v[:2]) for v in ring.coords];out.append('M'+'L'.join(f'{x:g},{y:g}' for x,y in pts)+'Z')
 return ''.join(out)
def bounds(g):
 a,b,c,d=g.bounds;x,y=project(a,d);xx,yy=project(c,b);return [x,y,round(xx-x,2),round(yy-y,2)]
def flag(code):return ''.join(chr(127397+ord(c)) for c in code) if isinstance(code,str) and len(code)==2 and code.isalpha() else '◈'
countries=[];country_geoms=[]
for f in source('countries').iterShapeRecords():
 d=f.record.as_dict();g=clean(shape(f.shape.__geo_interface__))
 if g.is_empty:continue
 id=d.get('ADM0_A3_UA') or d['ADM0_A3']
 countries.append({'id':id,'name':d.get('NAME_UK') or d.get('NAME_EN') or d['NAME'],'en':d.get('NAME_EN') or d['NAME'],'flag':flag(d.get('ISO_A2_EH') or d.get('ISO_A2')),'continent':d['CONTINENT'],'pop':max(0,int(d.get('POP_EST') or 0)),'gdp':max(0,int(d.get('GDP_MD') or 0)),'center':project(d.get('LABEL_X') or g.representative_point().x,d.get('LABEL_Y') or g.representative_point().y),'bounds':bounds(g),'path':path(g,.13),'playable':id!='ATA','regions':[]});country_geoms.append(g)
# Keep deterministic identifiers independent of shapefile row order.
order=sorted(range(len(countries)),key=lambda i:countries[i]['id']);countries=[countries[i] for i in order];country_geoms=[country_geoms[i] for i in order];by_id={c['id']:c for c in countries};ctree=STRtree(country_geoms)
regions=[];region_geoms=[]
for f in source('provinces').iterShapeRecords():
 d=f.record.as_dict();g=clean(shape(f.shape.__geo_interface__));pt=g.representative_point();home=d.get('adm0_a3');iso=d.get('iso_3166_2') or ''
 # The admin-0 Ukraine worldview is authoritative for country membership.
 matches=[int(i) for i in ctree.query(pt) if country_geoms[int(i)].covers(pt)]
 if iso.startswith('UA-'):home='UKR'
 elif matches:home=countries[matches[0]]['id']
 if home not in by_id or not by_id[home]['playable']:continue
 if iso=='UA-32':d['name_uk']='Київська область'
 n=len(regions);regions.append({'id':d['adm1_code'],'home':home,'name':d.get('name_uk') or d.get('name_en') or d['name'] or d['adm1_code'],'center':project(pt.x,pt.y),'lonlat':[round(pt.x,3),round(pt.y,3)],'bounds':bounds(g),'path':path(g,.10),'neighbors':[],'coast':False});region_geoms.append(g.simplify(.025,preserve_topology=True));by_id[home]['regions'].append(n)
for c,g in zip(countries,country_geoms):
 if c['playable'] and not c['regions']:
  pt=g.representative_point();c['regions']=[len(regions)];regions.append({'id':c['id']+'-ALL','home':c['id'],'name':c['name'],'center':project(pt.x,pt.y),'lonlat':[round(pt.x,3),round(pt.y,3)],'bounds':bounds(g),'path':path(g,.10),'neighbors':[],'coast':True});region_geoms.append(g.simplify(.025,preserve_topology=True))
print('Joining provinces',len(regions),flush=True)
rtree=STRtree(region_geoms)
for i,g in enumerate(region_geoms):
 regions[i]['neighbors']=[int(j) for j in rtree.query(g,predicate='dwithin',distance=.035) if int(j)!=i]
# The physical coastline avoids false ports along tiny gaps in country boundaries.
coastlines=[shape(f.shape.__geo_interface__).simplify(.015) for f in source('coast').iterShapeRecords()]
coasttree=STRtree(coastlines)
for p,g in zip(regions,region_geoms):p['coast']=len(coasttree.query(g,predicate='dwithin',distance=.045))>0
for c in countries:
 if not c['playable']:continue
 c['capital']=min(c['regions'],key=lambda i:math.dist(c['center'],regions[i]['center']));c['capitalName']=regions[c['capital']]['name'];c['coastal']=any(regions[i]['coast'] for i in c['regions'])
# Prefer the dataset's actual national capitals, retaining the geographic label fallback.
for f in source('cities').iterShapeRecords():
 d=f.record.as_dict();id=d.get('adm0_a3') or d.get('ADM0_A3');capital=d.get('adm0cap') or d.get('ADM0CAP');c=by_id.get(id)
 if not c or not c['playable'] or capital!=1:continue
 pt=Point(f.shape.points[0]);inside=[i for i in c['regions'] if region_geoms[i].buffer(.025).covers(pt)]
 if inside:c['capital']=inside[0]
 c['capitalName']=d.get('name_uk') or d.get('NAME_UK') or d.get('name') or d.get('NAME') or c['capitalName']
# Do not write full source records or population claims into gameplay state.
data={'width':1200,'height':600,'source':'Natural Earth 5.1.1 · Ukraine POV','countries':countries,'provinces':regions}
parts=[]
for i in range(0,len(regions),600):
 name='world-map-provinces-'+str(len(parts)+1)+'.js';parts.append(name)
 rows=json.dumps(regions[i:i+600],ensure_ascii=False,separators=(',',':'))
 (ROOT/name).write_text('(function(r){const rows='+rows+";if(typeof module==='object'&&module.exports)module.exports=rows;else r.BrukWorldMap.provinces.push(...rows);})(typeof window==='undefined'?globalThis:window);\n")
data['provinces']=[]
imports=''.join("data.provinces.push(...require('./"+name+"'));" for name in parts)
(ROOT/'world-map-data.js').write_text('(function(root){const data='+json.dumps(data,ensure_ascii=False,separators=(',',':'))+";if(typeof module==='object'&&module.exports){module.exports=data;"+imports+"}else root.BrukWorldMap=data;})(typeof window==='undefined'?globalThis:window);\n")
print('Built atlas:',len(countries),'countries/territories,',len(regions),'provinces in',len(parts),'modules',flush=True)
