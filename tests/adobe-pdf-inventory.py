"""Exercise the scanner with synthetic PDF data, never the supplied character."""
import importlib.util
import json
import pathlib
import tempfile
import unittest
from pypdf import PdfWriter
from pypdf.generic import ArrayObject, DictionaryObject, NameObject, NumberObject, TextStringObject

ROOT = pathlib.Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('inventory', ROOT / 'scripts/scan-adobe-sheet.py')
scanner = importlib.util.module_from_spec(spec)
spec.loader.exec_module(scanner)


def dictionary(**values):
    return DictionaryObject({NameObject('/' + key): value for key, value in values.items()})


def action(code):
    return dictionary(S=NameObject('/JavaScript'), JS=TextStringObject(code))


class InventoryTests(unittest.TestCase):
    def test_inherited_actions_hidden_widgets_calculation_order_and_unplaced_fields(self):
        writer = PdfWriter()
        page = writer.add_blank_page(600, 800)
        parent = dictionary(T=TextStringObject('Group'), FT=NameObject('/Tx'), Ff=NumberObject(1),
                            AA=dictionary(K=action("validate('PRIVATE_CALLBACK_ARGUMENT')")))
        parent_ref = writer._add_object(parent)
        widget = dictionary(Type=NameObject('/Annot'), Subtype=NameObject('/Widget'),
                            T=TextStringObject('Score'), Parent=parent_ref, F=NumberObject(2),
                            Rect=ArrayObject([NumberObject(n) for n in [10, 10, 40, 30]]),
                            V=TextStringObject('PRIVATE_FILLED_VALUE'),
                            AA=dictionary(C=action('calculate()')))
        widget_ref = writer._add_object(widget)
        parent[NameObject('/Kids')] = ArrayObject([widget_ref])
        internal = writer._add_object(dictionary(T=TextStringObject('Internal'), FT=NameObject('/Tx'),
                                                  AA=dictionary(C=action('internalCalculate()'))))
        writer._root_object[NameObject('/AcroForm')] = writer._add_object(dictionary(
            Fields=ArrayObject([parent_ref, internal]), CO=ArrayObject([parent_ref, widget_ref, internal])))
        page[NameObject('/Annots')] = ArrayObject([widget_ref])
        page[NameObject('/AA')] = dictionary(O=action('pageOpened()'))
        writer._root_object[NameObject('/OpenAction')] = action('documentOpened()')
        with tempfile.TemporaryDirectory() as temporary:
            path = pathlib.Path(temporary) / 'synthetic.pdf'
            writer.write(path)
            report = scanner.scan(path)
        field = report['widgets'][0]
        self.assertEqual(field['field'], 'Group.Score')
        self.assertTrue(field['readOnly'])
        self.assertFalse(field['visible'])
        self.assertEqual({a['event'] for a in field['actions']}, {'K', 'C'})
        self.assertEqual(report['calculationOrder'], ['Group', 'Group.Score', 'Internal'])
        self.assertEqual(report['unplacedFields'][0]['field'], 'Internal')
        self.assertEqual(report['fieldGroups'][0]['field'], 'Group')
        self.assertEqual(report['fieldGroups'][0]['children'], 1)
        self.assertEqual(report['fieldGroups'][0]['actions'][0]['calls'], ['validate'])
        self.assertEqual(report['pageActions'][0]['calls'], ['pageOpened'])
        self.assertEqual(report['documentActions'][0]['calls'], ['documentOpened'])
        exported = json.dumps(report)
        self.assertNotIn('PRIVATE_FILLED_VALUE', exported)
        self.assertNotIn('PRIVATE_CALLBACK_ARGUMENT', exported)

    def test_action_chains_stop_at_cycles_and_expose_metadata_only(self):
        first, second = action("first('PRIVATE')"), action('second()')
        first[NameObject('/Next')] = second
        second[NameObject('/Next')] = first
        records = scanner.action_records(first, 'activate')
        self.assertEqual(len(records), 2)
        self.assertEqual([r['calls'] for r in records], [['first'], ['second']])
        self.assertTrue(all(len(r['sha256']) == 64 for r in records))
        self.assertNotIn('PRIVATE', json.dumps(records))

    def test_named_dynamic_menus_remain_unexpanded_without_exporting_script_text(self):
        writer = PdfWriter()
        writer.add_blank_page(600, 800)
        code = "app.execDialog({text:'PRIVATE_MENU_TEXT'});\napp.popUpMenuEx({cName:'PRIVATE_LABEL'});"
        module = writer._add_object(action(code))
        writer._root_object[NameObject('/Names')] = dictionary(JavaScript=dictionary(
            Names=ArrayObject([TextStringObject('Menu module'), module])))
        with tempfile.TemporaryDirectory() as temporary:
            path = pathlib.Path(temporary) / 'menus.pdf'
            writer.write(path)
            report = scanner.scan(path)
        self.assertEqual(report['modules'][0]['name'], 'Menu module')
        self.assertEqual([row['kind'] for row in report['dynamicUI']], ['dialog', 'popup-menu'])
        self.assertTrue(all(row['review'] == 'unexpanded' for row in report['dynamicUI']))
        self.assertNotIn('PRIVATE_MENU_TEXT', json.dumps(report))
        self.assertNotIn('PRIVATE_LABEL', json.dumps(report))

    def test_empty_document_still_has_explicit_review_queues(self):
        writer = PdfWriter()
        writer.add_blank_page(600, 800)
        with tempfile.TemporaryDirectory() as temporary:
            path = pathlib.Path(temporary) / 'blank.pdf'
            writer.write(path)
            report = scanner.scan(path)
        for key in ['widgets', 'fieldGroups', 'unplacedFields', 'calculationOrder', 'pageActions', 'dynamicUI']:
            self.assertEqual(report[key], [])
        self.assertEqual(report['pages'][0]['widgetCount'], 0)


if __name__ == '__main__':
    unittest.main()
