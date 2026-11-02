#!/usr/bin/env python3
"""Build factual equipment choices from reviewed JSON, without executing userscripts."""
import argparse,ast,json,re
from pathlib import Path

def slug(value): return re.sub('[^a-z0-9]+','-',value.lower()).strip('-')
def entry(raw):
    if isinstance(raw,str): return {'item':raw}
    out={k:raw[k] for k in ('item','quantity','special','equipmentType','value','containsValue') if k in raw}
    display=raw.get('displayName','')
    if display and '(' not in display and len(display)<=60:out['displayName']=display
    return out

def main():
    p=argparse.ArgumentParser();p.add_argument('--items-base',type=Path,required=True);p.add_argument('--items',type=Path,required=True);p.add_argument('--backgrounds',type=Path,required=True);p.add_argument('--output',type=Path,default=Path(__file__).resolve().parents[1]/'data/rules/adobe-starting-equipment.json');a=p.parse_args()
    base=json.loads(a.items_base.read_text());items=json.loads(a.items.read_text());backgrounds=json.loads(a.backgrounds.read_text());data={'format':1,'provenance':{'repository':'DeathStalker471/betterR20','commit':'0ba85d82acfed1d7d106ebdccb34179fc584e97c','paths':['data/items-base.json','data/items.json','data/backgrounds.json'],'scope':'Equipment names, source IDs, quantities, weights, reference prices and structured starting choices; no book descriptions.'},'editions':{}}
    sources={'2014':{'PHB'},'2024':{'XPHB'}}
    metadata=(Path(__file__).resolve().parents[1]/'js/modules/character-expanded-background-data.js').read_text()
    quoted=r"'(?:[^'\\]|\\.)*'"
    for match in re.finditer(r'add\(('+quoted+r'),\s*('+quoted+r'),\s*('+quoted+r'),\s*('+quoted+r')',metadata):
        _,_,edition,source=(ast.literal_eval(token) for token in match.groups())
        if edition in sources:sources[edition].add(source)
    background_index={(row['name'].lower(),row['source']):row for row in backgrounds['background']}
    def equipment(row,seen=()):
        uid=(row['name'].lower(),row['source'])
        if uid in seen:return []
        if row.get('startingEquipment'):return row['startingEquipment']
        copy=row.get('_copy',{})
        if 'startingEquipment' in copy.get('_mod',{}):return []
        parent=background_index.get((copy.get('name','').lower(),copy.get('source',row['source'])))
        return equipment(parent,(*seen,uid)) if parent else []
    categories={'AT':"artisan's tools",'GS':'gaming set','INS':'musical instrument','T':'Tools','LA':'Light armor','MA':'Medium armor','HA':'Heavy armor','S':'Shield','M':'Weapons','R':'Weapons','A':'Ammunition','SCF':'Spellcasting focus'}
    allowed={'AT','GS','INS','T','LA','MA','HA','S','M','R','A','AF','SCF','G','EXP','OTH','TG'}
    for edition,source in [('2014','PHB'),('2024','XPHB')]:
        gear=[];packs=[];seen=set()
        for row in [*base.get('baseitem',[]),*items.get('item',[])]:
            kind=row.get('type','').split('|')[0]
            if str(row.get('source','')).upper() not in sources[edition] or kind not in allowed or row.get('rarity','none')!='none':continue
            uid=row['name'].lower()+'|'+row['source'].lower()
            if uid in seen:continue
            seen.add(uid);record={'id':'reference-'+edition+'-'+slug(row['source'])+'-'+slug(row['name']),'uid':uid,'name':row['name'],'edition':edition,'source':row['source'].upper(),'quantity':1,'weight':row.get('weight'),'category':categories.get(kind,'Adventuring gear'),'price':str(row['value']/100).removesuffix('.0')+' gp' if isinstance(row.get('value'),(int,float)) else ''}
            if row.get('scfType'):record['focus']=row['scfType']
            if row.get('packContents') and row['name'].lower().endswith('pack'):packs.append({**record,'items':[entry(item) for item in row['packContents']]})
            else:gear.append(record)
        kits=[]
        for row in backgrounds['background']:
            if str(row.get('source','')).upper() not in sources[edition] or not equipment(row):continue
            groups=[]
            for block in equipment(row):
                groups.append({'fixed':[entry(item) for item in block.get('_',[])],'options':[{'key':k,'items':[entry(item) for item in values]} for k,values in block.items() if k!='_' and isinstance(values,list)]})
            kits.append({'id':slug(row['name'])+'-'+slug(row['source'])+'-'+edition,'name':row['name'],'edition':edition,'source':row['source'].upper(),'equipment':groups})
        data['editions'][edition]={'gear':sorted(gear,key=lambda x:x['name']),'packs':sorted(packs,key=lambda x:x['name']),'backgrounds':sorted(kits,key=lambda x:x['name'])}
    a.output.parent.mkdir(parents=True,exist_ok=True);a.output.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n')
if __name__=='__main__':main()
