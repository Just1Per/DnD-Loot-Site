#!/usr/bin/env python3
"""Inventory PDF fields/actions/templates and dynamic UI sites without executing JS.

No filled values, embedded rule text, attachments or executable scripts are
published. Dynamic menu sites are explicitly unreviewed, not claimed complete.
"""
import argparse, collections, hashlib, json, pathlib, re
from pypdf import PdfReader

def obj(v): return v.get_object() if hasattr(v,'get_object') else v

def inherited(field,key,default=None):
    seen=set()
    while field:
        field=obj(field)
        if id(field) in seen:break
        seen.add(id(field))
        if key in field:return obj(field[key])
        field=field.get('/Parent')
    return default

def field_name(field):
    parts=[];seen=set()
    while field:
        field=obj(field)
        if id(field) in seen:break
        seen.add(id(field))
        if field.get('/T'):parts.append(str(field['/T']))
        field=field.get('/Parent')
    return '.'.join(reversed(parts))

def script(action):
    value=obj(action.get('/JS',''))
    if hasattr(value,'get_data'):return value.get_data().decode('utf-8','replace')
    return str(value or '')

def calls(text):
    return sorted(set(re.findall(r'\b([A-Za-z_$][\w$]*(?:\.[A-Za-z_$][\w$]*)*)\s*\(',text))-{'if','for','while','switch','catch','function'})

def action_records(action,event,seen=None):
    seen=set()if seen is None else seen
    if not action:return []
    action=obj(action)
    if isinstance(action,list):return [r for a in action for r in action_records(a,event,seen)]
    if not hasattr(action,'get')or id(action) in seen:return []
    seen.add(id(action));kind=str(action.get('/S','Unknown')).lstrip('/');text=script(action)if kind=='JavaScript'else''
    records=[{'event':event,'type':kind,**({'sha256':hashlib.sha256(text.encode()).hexdigest(),'calls':calls(text)}if text else{})}]
    return records+action_records(action.get('/Next'),event,seen)

def named_pairs(tree):
    tree=obj(tree);result=[]
    if not tree:return result
    names=tree.get('/Names',[])
    result.extend((str(names[i]),names[i+1])for i in range(0,len(names),2))
    for child in tree.get('/Kids',[]):result.extend(named_pairs(child))
    return result

def scan(path):
    reader=PdfReader(path);root=reader.trailer['/Root'];names=obj(root.get('/Names',{}));pages=[];known={}
    for i,page in enumerate(reader.pages):
        key=page.indirect_reference.idnum;known[key]=len(pages);pages.append({'id':'page-'+str(i+1),'page':i+1,'templates':[],'object':page})
    for name,ref in named_pairs(names.get('/Templates')):
        key=getattr(ref,'idnum',None)
        if key in known:pages[known[key]]['templates'].append(name)
        else:known[key]=len(pages);pages.append({'id':'template-'+name,'page':None,'templates':[name],'object':obj(ref)})
    records=[];page_rows=[];placed=set();page_actions=[]
    for page in pages:
        count=0
        for ref in obj(page['object'].get('/Annots',[])):
            field=obj(ref)
            if field.get('/Subtype')!='/Widget':continue
            placed.add(getattr(ref,'idnum',id(field)));count+=1;name=field_name(field);ft=str(inherited(field,'/FT',''));flags=int(inherited(field,'/Ff',0));aflags=int(field.get('/F',0))
            kind='button'if ft=='/Btn'and flags&65536 else'checkbox'if ft=='/Btn'else'select'if ft=='/Ch'else'text'
            actions=[]
            chain=[];node=field;seen=set()
            while node and id(node)not in seen:
                seen.add(id(node));chain.append(node);node=obj(node.get('/Parent'))if node.get('/Parent')else None
            aa={}
            for ancestor in reversed(chain):aa.update(obj(ancestor.get('/AA',{})))
            for event,action in aa.items():actions.extend(action_records(action,str(event).lstrip('/')))
            actions.extend(action_records(field.get('/A'),'activate'))
            records.append({'id':page['id']+':'+str(count),'location':page['id'],'field':name,'kind':kind,'visible':not bool(aflags&35),'readOnly':bool(flags&1),'rect':[float(n)for n in field.get('/Rect',[])],'actions':actions,'review':'unmapped'})
        page_actions.extend({'location':page['id'],**a}for event,action in obj(page['object'].get('/AA',{})).items()for a in action_records(action,str(event).lstrip('/')))
        page_rows.append({k:v for k,v in page.items()if k!='object'}|{'widgetCount':count})
    acroform=obj(root.get('/AcroForm',{}));unplaced=[];groups=[];seen_fields=set()
    def visit(ref):
        field=obj(ref);identity=getattr(ref,'idnum',id(field))
        if identity in seen_fields:return
        seen_fields.add(identity)
        children=obj(field.get('/Kids',[]))
        if children:
            groups.append({'field':field_name(field),'fieldType':str(inherited(field,'/FT','')),'children':len(children),'actions':[a for event,action in obj(field.get('/AA',{})).items()for a in action_records(action,str(event).lstrip('/'))]+action_records(field.get('/A'),'activate'),'review':'unmapped'})
            for child in children:visit(child)
        elif identity not in placed:
            aa=inherited(field,'/AA',{});actions=[a for event,action in aa.items()for a in action_records(action,str(event).lstrip('/'))]+action_records(field.get('/A'),'activate')
            unplaced.append({'field':field_name(field),'fieldType':str(inherited(field,'/FT','')),'actions':actions,'review':'unmapped'})
    for field in obj(acroform.get('/Fields',[])):visit(field)
    calculation_order=[field_name(obj(ref))for ref in obj(acroform.get('/CO',[]))]
    modules=[];dynamic=[]
    for name,ref in named_pairs(names.get('/JavaScript')):
        text=script(obj(ref));modules.append({'name':name,'bytes':len(text.encode()),'sha256':hashlib.sha256(text.encode()).hexdigest(),'functionDefinitions':len(re.findall(r'\bfunction\s+[\w$]+\s*\(',text))})
        patterns={'dialog':r'\bapp\.execDialog\s*\(','popup-menu':r'\b(?:app\.)?popUpMenu(?:Ex)?\s*\(','toolbar':r'\bapp\.addToolButton\s*\(','dialog-control':r'\btype\s*:\s*[\"\'](button|popup|edit_text|check_box|radio|list_box|hier_list_box)[\"\']'}
        for kind,pattern in patterns.items():
            for match in re.finditer(pattern,text):dynamic.append({'module':name,'kind':kind,'line':text.count('\n',0,match.start())+1,'review':'unexpanded'})
    return {'format':1,'sourceVersion':'MPMB 13.0.4 Printer Friendly','sourceSha256':hashlib.sha256(path.read_bytes()).hexdigest(),'limits':['Static inventory; no Acrobat JS execution.','Filled values and long rule/script text excluded.','Dynamic menus/dialogs require manual expansion and branch review.','Discovery is not implemented functional parity.'],'pages':page_rows,'modules':modules,'dynamicUI':dynamic,'widgets':records,'unplacedFields':unplaced,'fieldGroups':groups,'calculationOrder':calculation_order,'pageActions':page_actions,'documentActions':action_records(root.get('/OpenAction'),'open')+[a for event,action in obj(root.get('/AA',{})).items()for a in action_records(action,str(event).lstrip('/'))]}

def markdown(report):
    widgets=report['widgets'];buttons=[r for r in widgets if r['kind']=='button'];active=sum(p['widgetCount']for p in report['pages']if p['page']);types=collections.Counter(r['kind']for r in widgets)
    lines=['# Adobe PDF function inventory','','Static scan of the supplied Adobe reference. No filled values or executable PDF code are included.','','- Active pages: '+str(sum(bool(p['page'])for p in report['pages'])), '- Widgets on active pages: '+str(active),'- Active/template page objects: '+str(len(report['pages'])),'- Widgets across all page objects: '+str(len(widgets)),'- Pushbuttons: '+str(len(buttons)),'- Widgets with actions: '+str(sum(bool(r['actions'])for r in widgets)),'- Field groups: '+str(len(report['fieldGroups'])),'- Leaf fields without a placed widget: '+str(len(report['unplacedFields'])),'- Entries in Acrobat calculation order: '+str(len(report['calculationOrder'])),'- Page lifecycle actions: '+str(len(report['pageActions'])),'- Named script/data modules: '+str(len(report['modules'])),'- Dynamic UI sites needing expansion: '+str(len(report['dynamicUI'])),'','These are inventory counts, not completion percentages. Template variants, hidden controls and calculated-field events are included. Dynamic menus and dialogs remain a separate review queue.','','## Page and template coverage','','| Location | Templates | Widgets |','|---|---|---:|']
    for p in report['pages']:lines.append('| '+p['id']+' | '+', '.join(p['templates'])+' | '+str(p['widgetCount'])+' |')
    lines+=['','## Every discovered pushbutton','','| Location | Button | Referenced functions | Status |','|---|---|---|---|']
    for r in buttons:
        names=sorted(set(call for a in r['actions']for call in a.get('calls',[])))
        lines.append('| '+r['location']+' | '+r['field'].replace('|','/')+' | '+', '.join(names).replace('|','/')+' | Unmapped |')
    return '\n'.join(lines)+'\n'

if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('pdf',type=pathlib.Path);parser.add_argument('--output',type=pathlib.Path,default=pathlib.Path('docs/adobe-inventory'));args=parser.parse_args();report=scan(args.pdf);args.output.mkdir(parents=True,exist_ok=True);(args.output/'inventory.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n');(args.output/'README.md').write_text(markdown(report));print(markdown(report).split('## Every discovered pushbutton')[0])
