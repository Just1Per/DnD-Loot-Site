#!/usr/bin/env python3
"""Extract class/level facts from reviewed JSON snapshots, never execute source JS."""
import argparse,json
from pathlib import Path
CLASSES=('artificer','barbarian','bard','cleric','druid','fighter','monk','paladin','ranger','rogue','sorcerer','warlock','wizard')
COMMIT='0ba85d82acfed1d7d106ebdccb34179fc584e97c'
def extract(root,edition):
    classes={}
    for class_id in CLASSES:
        document=json.loads((root/('class-'+class_id+'.json')).read_text())
        source='TCE' if class_id=='artificer' else 'PHB' if edition=='2014' else 'XPHB'
        row=next(c for c in document['class'] if c['source']==source)
        refs=[f if isinstance(f,str) else f['classFeature'] for f in row['classFeatures']]
        unlocks=[int(f['classFeature'].split('|')[3]) for f in row['classFeatures'] if isinstance(f,dict) and f.get('gainSubclassFeature')]
        classes[class_id]={'name':row['name'],'source':source,'subclassLevel':min(unlocks),'featureRefs':refs}
    return {'format':1,'edition':edition,'provenance':{'repository':'DeathStalker471/betterR20','branch':'dev-beta-death','commit':COMMIT,'directory':'data2014/class' if edition=='2014' else 'data/class','scope':'Names, source identities and level facts only; no book descriptions.'},'classes':classes}
def main():
    parser=argparse.ArgumentParser();parser.add_argument('--legacy',type=Path,required=True);parser.add_argument('--modern',type=Path,required=True);parser.add_argument('--output',type=Path,default=Path(__file__).resolve().parents[1]);args=parser.parse_args()
    data={edition:extract(root,edition) for edition,root in [('2014',args.legacy),('2024',args.modern)]}
    for edition,record in data.items():
        target=args.output/'data/rules'/('adobe-choice-reference-'+edition+'.json');target.parent.mkdir(parents=True,exist_ok=True);target.write_text(json.dumps(record,indent=2,ensure_ascii=False)+'\n')
    compact={edition:{key:{k:v for k,v in row.items() if k!='featureRefs'} for key,row in record['classes'].items()} for edition,record in data.items()}
    target=args.output/'js/modules/character-rule-choice-data.js';target.parent.mkdir(parents=True,exist_ok=True);target.write_text('/* Generated class/activation facts from reviewed JSON; see scripts/build-adobe-rule-choice-index.py. */\nvar CharacterRuleChoiceData='+json.dumps(compact,ensure_ascii=False,separators=(',',':'))+';\nif(typeof globalThis!==\'undefined\')globalThis.CharacterRuleChoiceData=CharacterRuleChoiceData;\nif(typeof module!==\'undefined\'&&module.exports)module.exports=CharacterRuleChoiceData;\n')
if __name__=='__main__':main()
