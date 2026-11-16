#!/usr/bin/env python3
"""Extract the original blank hidden companion gear layer; never run Acrobat code."""
import argparse, json, pathlib
import fitz
from pypdf import PdfReader
from PIL import Image
ROOT=pathlib.Path(__file__).resolve().parents[1]
def extract(source,target):
    reader=PdfReader(source)
    names=reader.trailer['/Root']['/Names']['/Templates']['/Names']
    page_id=next(names[i+1].idnum for i in range(0,len(names),2) if str(names[i])=='AScomp')
    doc=fitz.open(source)
    root_id=int(doc.xref_get_key(doc.pdf_catalog(),'Pages')[1].split()[0])
    doc.xref_set_key(page_id,'Type','/Page');doc.xref_set_key(page_id,'Parent',f'{root_id} 0 R')
    doc.xref_set_key(root_id,'Kids',f'[{page_id} 0 R]');doc.xref_set_key(root_id,'Count','1')
    doc=fitz.open(stream=doc.tobytes(),filetype='pdf');page=doc[0]
    fields=[];buttons=[];art=None
    for widget in list(page.widgets() or []):
        name=widget.field_name
        if name=='Comp.eqp.Image':
            art={'asset':'companion-equipment.webp','rect':[round(v,3) for v in widget.rect]}
            doc.xref_set_key(widget.xref,'F','4');continue
        if name.startswith(('Comp.eqp.','Comp.eqpB.')):
            base={'id':name,'sourceField':name,'label':name.replace('Comp.eqpB.Gear Button','Companion equipment options').replace('Comp.eqp.','Companion '),'rect':[round(v,3) for v in widget.rect],'printable':widget.field_type_string!='Button'}
            if widget.field_type_string=='Button':buttons.append({**base,'caption':'›'})
            else:fields.append({**base,'kind':'textarea' if widget.field_flags&4096 else 'text','fontSize':round(widget.text_fontsize or 8,2),'pdfReadOnly':bool(widget.field_flags&1)})
        page.delete_widget(widget)
    if not art or len([r for r in fields if r['id'].startswith('Comp.eqp.Gear Row ')])!=17:raise ValueError('Expected the original 17-row companion equipment layer')
    target.mkdir(parents=True,exist_ok=True)
    pix=page.get_pixmap(matrix=fitz.Matrix(3,3),clip=fitz.Rect(art['rect']),alpha=False)
    Image.frombytes('RGB',(pix.width,pix.height),pix.samples).save(target/art['asset'],format='WEBP',lossless=True,method=6)
    return fields,buttons,art

def update(source,target):
    fields,buttons,art=extract(source,target)
    path=target/'template-AScomp.json';data=json.loads(path.read_text())
    data['fields']=[r for r in data['fields'] if not r['id'].startswith(('Comp.eqp.','Comp.eqpB.'))]+fields
    data['buttons']=[r for r in data['buttons'] if not r['id'].startswith(('Comp.eqp.','Comp.eqpB.'))]+buttons
    data['equipmentArtwork']=art;path.write_text(json.dumps(data,ensure_ascii=False,separators=(',',':'))+'\n')
    path=target/'pages.json';manifest=json.loads(path.read_text())
    for row in manifest['pages']:
        if row['id']=='template-AScomp':row.update(fields=len(data['fields']),buttons=len(data['buttons']))
    path.write_text(json.dumps(manifest,indent=2)+'\n')
if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('pdf',type=pathlib.Path);parser.add_argument('--output',type=pathlib.Path,default=ROOT/'data/adobe-pages');args=parser.parse_args();update(args.pdf,args.output)
