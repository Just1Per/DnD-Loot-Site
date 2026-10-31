#!/usr/bin/env python3
"""Export blank active/template paper layouts and controls, never filled values."""
import argparse, collections, importlib.util, json, pathlib, re
import fitz
from pypdf import PdfReader
from PIL import Image
ROOT=pathlib.Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location('first_page',ROOT/'scripts/build-adobe-control-prototype.py');base=importlib.util.module_from_spec(spec);spec.loader.exec_module(base)
TITLES={'page-1':'Character & combat','page-2':'Features & equipment','page-3':'Feats, magic items & extra gear','page-4':'Background & appearance','page-5':'Notes','page-6':'Player reference (2014)','AScomp':'Companion','WSfront':'Wild Shape','SSfront':'Spell sheet','SSmore':'More spells','ALlog':'Adventure log','ASoverflow':'More feats, magic items & resources','ASnotes':'Extra notes','ASbackgr':'Extra background','ASfront':'More feats, magic items & gear','PRsheet':'Extra reference (2014)','blank':'Blank page'}
def name(n):return re.sub(r'^P\d+\.[^.]+\.','',n)
def safe_art(w):
 n=name(w.field_name)
 # Generic spell-table frames live in button appearances, with user text in separate widgets.
 return n.startswith(('spellshead.Image.','spellsdiv.Image.','Image.MagicItemAttuned.'))or n in base.STATIC_FIELDS or n.startswith('Image.calc_boxes.')or n.startswith('Image.DnDLogo')
def export(source,target):
 r=PdfReader(source);names=r.trailer['/Root']['/Names'].get('/Templates',{}).get('/Names',[])
 pages=[('page-'+str(i+1),i)for i,page in enumerate(r.pages)]
 pages += [('template-'+str(names[i]),names[i+1].idnum)for i in range(0,len(names),2)if str(names[i])not in ['remember']]
 target.mkdir(parents=True,exist_ok=True);manifest=[]
 for key,page in pages:
  doc=fitz.open(source)
  if key.startswith('template-'):
   # Attach the template to a temporary in-memory page tree. Keeping the
   # original AcroForm preserves inherited field types/options/appearances.
   _,root_pages=doc.xref_get_key(doc.pdf_catalog(),'Pages');root_id=int(root_pages.split()[0])
   doc.xref_set_key(page,'Type','/Page');doc.xref_set_key(page,'Parent',str(root_id)+' 0 R');doc.xref_set_key(root_id,'Kids','['+str(page)+' 0 R]');doc.xref_set_key(root_id,'Count','1')
   doc=fitz.open(stream=doc.tobytes(),filetype='pdf');p=doc[0]
  else:p=doc[page]
  widgets=list(p.widgets()or[]);fields=[];buttons=[];note_masks=[];ammo_icons=[];secondary_dc=None;carrying_art=None;counts=collections.Counter()
  for w in widgets:
   _,raw=doc.xref_get_key(w.xref,'F');flags=int(raw)if raw.isdigit()else 0
   n=name(w.field_name)
   if n=='Weight Carrying Capacity.Button'and key=='page-2':
    icon_doc=fitz.open(source);icon_page=icon_doc[page]
    for candidate in list(icon_page.widgets()or[]):
     if candidate.field_name==w.field_name:icon_doc.xref_set_key(candidate.xref,'F','4')
     else:icon_page.delete_widget(candidate)
    pix=icon_page.get_pixmap(matrix=fitz.Matrix(3,3),clip=w.rect,alpha=False);asset='carrying-capacity.webp'
    Image.frombytes('RGB',(pix.width,pix.height),pix.samples).save(target/asset,format='WEBP',lossless=True,method=6)
    carrying_art={'rect':[round(v,3)for v in w.rect],'asset':asset};icon_doc.close()
   if n=='Image.SaveDC'and key=='page-1':
    icon_doc=fitz.open(source);icon_page=icon_doc[page]
    for candidate in list(icon_page.widgets()or[]):
     if candidate.field_name==w.field_name:icon_doc.xref_set_key(candidate.xref,'F','4')
     else:icon_page.delete_widget(candidate)
    pix=icon_page.get_pixmap(matrix=fitz.Matrix(3,3),clip=w.rect,alpha=False);asset='secondary-save-dc.webp'
    Image.frombytes('RGB',(pix.width,pix.height),pix.samples).save(target/asset,format='WEBP',lossless=True,method=6)
    secondary_dc={'rect':[round(v,3)for v in w.rect],'asset':asset};icon_doc.close();continue
   ammo_icon=re.fullmatch(r'Ammo(Left|Right)\.Icon\.(Arrows|Axes|Bullets|Daggers|Flasks|Hammers|Spears|Vials)',n)
   if ammo_icon:
    # Render this static appearance alone. Delete every other widget first,
    # including filled values and portraits; never invoke Acrobat callbacks.
    icon_doc=fitz.open(source);icon_page=icon_doc[page]
    for candidate in list(icon_page.widgets()or[]):
     if candidate.field_name==w.field_name:icon_doc.xref_set_key(candidate.xref,'F','4')
     else:icon_page.delete_widget(candidate)
    pix=icon_page.get_pixmap(matrix=fitz.Matrix(3,3),clip=w.rect,alpha=False)
    asset='ammo-'+ammo_icon[1].lower()+'-'+ammo_icon[2].lower()+'.webp'
    Image.frombytes('RGB',(pix.width,pix.height),pix.samples).save(target/asset,format='WEBP',lossless=True,method=6)
    ammo_icons.append({'side':ammo_icon[1].lower(),'icon':ammo_icon[2],'rect':[round(v,3)for v in w.rect],'asset':asset});icon_doc.close();continue
   if n in ['Whiteout.Notes.Left','Whiteout.Notes.Right']:note_masks.append({'side':n.rsplit('.',1)[-1].lower(),'rect':[round(v,3)for v in w.rect]})
   gear_row=bool(re.fullmatch(r'(Adventuring Gear|Extra\.Gear) (Row|Amount|Weight|Button) \d+',n))
   # Reset the supplied character's hidden-row preference on blank inventory layouts.
   log_balance=key=='template-ALlog'and bool(re.fullmatch(r'AdvLog\.[1-6]\.(xp|gold|downtime|renown|magicItems)\.(start|total)',n))
   ammo_check=bool(re.fullmatch(r'Ammo(Left|Right)\.(Top|Base|Bullet)\.(Axe\.)?\d+',n))
   dc_field=n in ['Spell DC 1 Mod','Spell DC 2 Mod','Spell save DC 2']
   carry_field=key=='page-2'and n=='Weight Heavily Encumbered'
   if flags&35 and not(carry_field or gear_row or log_balance or ammo_check or dc_field)or not p.rect.contains(w.rect)or w.rect.get_area()<=0 or safe_art(w):continue
   counts[n]+=1;ident=n+(' #'+str(counts[n])if counts[n]>1 else'');rect=[round(v,3)for v in w.rect]
   if w.field_type_string=='Button':
    # Very large image hit areas are decorative, never blank giant buttons.
    if w.rect.get_area()<p.rect.get_area()*.15:buttons.append({'id':ident,'label':base.label(n),'rect':rect,'caption':str(getattr(w,'button_caption','')or'')[:80],'printable':bool(flags&4)})
    continue
   if w.field_type_string not in ['Text','ComboBox','CheckBox']:continue
   font=w.text_fontsize if w.text_fontsize>0 else 12 if n=='Speed'else min(20,max(6.5,w.rect.height*.7));opts=[]
   for option in w.choice_values or []:
    if isinstance(option,(tuple,list)):option=option[-1]
    if str(option).strip()and str(option)not in opts:opts.append(str(option))
   if n.startswith('Spell DC ')and not opts:opts=list(base.ABILITIES.values())
   dc_layout=('dual'if flags&35 else'single')if n=='Spell DC 1 Mod'else'dual'if dc_field else None
   fields.append({'id':ident,'sourceField':w.field_name,'label':base.label(n),'kind':{'Text':'textarea'if w.field_flags&4096 else'text','ComboBox':'select','CheckBox':'checkbox'}[w.field_type_string],'rect':rect,'fontSize':round(font,2),'pdfReadOnly':bool(w.field_flags&1),'printable':bool(flags&4),**({'options':opts}if opts else{}),**({'dcLayout':dc_layout}if dc_layout else{})})
  for w in widgets:
   if not safe_art(w):p.delete_widget(w)
  pix=p.get_pixmap(matrix=fitz.Matrix(2.5,2.5),alpha=False);im=Image.frombytes('RGB',(pix.width,pix.height),pix.samples);im.save(target/(key+'.webp'),format='WEBP',lossless=True,method=6)
  title=TITLES.get(key,TITLES.get(key.replace('template-',''),key));data={'format':1,'id':key,'title':title,'width':round(p.rect.width,3),'height':round(p.rect.height,3),'fields':fields,'buttons':buttons,**({'noteLineMasks':note_masks}if note_masks else{}),**({'ammoIcons':ammo_icons}if ammo_icons else{}),**({'secondaryDC':secondary_dc}if secondary_dc else{}),**({'carryingArtwork':carrying_art}if carrying_art else{})}
  (target/(key+'.json')).write_text(json.dumps(data,ensure_ascii=False,separators=(',',':'))+'\n');manifest.append({'id':key,'title':title,'fields':len(fields),'buttons':len(buttons),'optional':key.startswith('template-')});print(key,len(fields),len(buttons),flush=True)
 (target/'pages.json').write_text(json.dumps({'format':1,'sourceVersion':'MPMB 13.0.4','pages':manifest},indent=2)+'\n')
if __name__=='__main__':
 p=argparse.ArgumentParser(description=__doc__);p.add_argument('pdf',type=pathlib.Path);p.add_argument('--output',type=pathlib.Path,default=ROOT/'data/adobe-pages');a=p.parse_args();export(a.pdf,a.output)
