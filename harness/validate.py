"""Reproducible isolated fault-injection tests, plus an unmodified-copy audit."""
import copy
import json
from pathlib import Path
import shutil
import tempfile
import unittest
import zipfile
import xml.etree.ElementTree as ET
import sys
import time
import argparse
from gate import Engine, NS, digest, plan_hash, read, save, ppt_info, canonical

ROOT = Path(__file__).resolve().parent.parent
PR = 'http://schemas.openxmlformats.org/package/2006/relationships'


def bind(unit, rel):
    return {'path': rel, 'sha256': digest(unit / rel)}


def write_plan(unit, data):
    (unit / 'plan.md').write_text('# 검증 전용 계획\n\n실제 수업 계획이나 제작 승인이 아님.\n\n```harness-plan\n' +
        json.dumps(data, ensure_ascii=False, indent=2) + '\n```\n', encoding='utf-8')


def with_notes(source, target, n):
    # Preserve original slide XML and media; inject clearly simulated notes only.
    with zipfile.ZipFile(source) as z:
        entries = {name: z.read(name) for name in z.namelist()}
    for i in range(1, n + 1):
        relname = f'ppt/slides/_rels/slide{i}.xml.rels'
        rels = ET.fromstring(entries[relname]) if relname in entries else ET.Element('Relationships', xmlns=PR)
        for child in list(rels):
            if child.get('Type', '').endswith('/notesSlide'):
                rels.remove(child)
        ET.SubElement(rels, '{' + PR + '}Relationship', {
            'Id': 'rIdHarnessSimulation', 'Type': NS['r'] + '/notesSlide',
            'Target': f'../notesSlides/harness{i}.xml'})
        entries[relname] = ET.tostring(rels, encoding='utf-8', xml_declaration=True)
        note = ET.Element('{' + NS['p'] + '}notes')
        tree = ET.SubElement(ET.SubElement(note, '{' + NS['p'] + '}cSld'), '{' + NS['p'] + '}spTree')
        sp = ET.SubElement(tree, '{' + NS['p'] + '}sp')
        body = ET.SubElement(sp, '{' + NS['p'] + '}txBody')
        p = ET.SubElement(body, '{' + NS['a'] + '}p')
        ET.SubElement(ET.SubElement(p, '{' + NS['a'] + '}r'), '{' + NS['a'] + '}t').text = (
            f'SIMULATION ONLY: slide {i}. Not a teaching script. Source: supplied osmosis reference PPTX')
        name = f'ppt/notesSlides/harness{i}.xml'
        entries[name] = ET.tostring(note, encoding='utf-8', xml_declaration=True)
        types = ET.fromstring(entries['[Content_Types].xml'])
        ET.SubElement(types, '{http://schemas.openxmlformats.org/package/2006/content-types}Override', {
            'PartName': '/' + name,
            'ContentType': 'application/vnd.openxmlformats-officedocument.presentationml.notesSlide+xml'})
        entries['[Content_Types].xml'] = ET.tostring(types, encoding='utf-8', xml_declaration=True)
    with zipfile.ZipFile(target, 'w', zipfile.ZIP_DEFLATED) as z:
        for name, body in entries.items():
            z.writestr(name, body)


def docx_fixture(path, n):
    body = ET.Element('{' + NS['w'] + '}document')
    b = ET.SubElement(body, '{' + NS['w'] + '}body')
    for i in range(1, n + 1):
        for text in [f'Slide {i}', 'SIMULATION ONLY. Parser fixture, not a usable teaching manuscript. Source: osmosis reference.']:
            p = ET.SubElement(b, '{' + NS['w'] + '}p')
            ET.SubElement(ET.SubElement(p, '{' + NS['w'] + '}r'), '{' + NS['w'] + '}t').text = text
    with zipfile.ZipFile(path, 'w') as z:
        z.writestr('word/document.xml', ET.tostring(body))
        z.writestr('[Content_Types].xml', '<?xml version="1.0"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>')
        z.writestr('_rels/.rels', f'<Relationships xmlns="{PR}"><Relationship Id="rId1" Type="{NS["r"]}/officeDocument" Target="word/document.xml"/></Relationships>')


def build_fixture(root, original, rendered, rules):
    u = root / 'unit'
    for d in ['research', 'assets', 'drafts', 'checks', 'figma', 'renders']:
        (u / d).mkdir(parents=True, exist_ok=True)
    (u / '.harness-test').write_text('SIMULATION ONLY', encoding='utf-8')
    protected = root / 'protected'
    protected.mkdir()
    shutil.copy2(original, protected / 'osmosis.pptx')
    n = len(ppt_info(original))
    save(u / 'input.json', {'unit': 'osmosis-validation', 'curriculum': 'SIMULATION', 'target_slides': n, 'minutes': 30})
    (u / 'research/evidence.txt').write_text('SIMULATION source extract, not verified curriculum evidence.', encoding='utf-8')
    save(u / 'research/sources.json', [{'id': sid, 'role': role, 'curriculum': 'SIMULATION',
          'citation': 'Simulation role fixture, not actual textbook/official standard',
          'evidence': bind(u, 'research/evidence.txt')}
         for sid,role in [('src1','primary'),('src2','secondary'),('src3','comparison'),('std','standard')]])
    save(u / 'research/content-map.json', [{'id': 'c1', 'claim': 'Osmosis teaching content: simulation coverage item',
         'standard': 'SIMULATED-NOT-OFFICIAL', 'standard_source_id': 'std', 'rationale': 'parser test only', 'scope': '범위 내', 'source_ids': ['src1']}])
    (u / 'research/comparison.md').write_text('Simulation only.', encoding='utf-8')
    p = {'unit': 'osmosis-validation', 'curriculum': 'SIMULATION', 'objectives': ['parser validation only'],
         'target_slides': n, 'minutes': 30, 'design': 'design.md', 'supplementary': {},
         'slides': [{'number': i, 'title': f'검증 {i}', 'message': f'Simulation slide {i}', 'content_ids': ['c1'],
                     'source_ids': ['src1'], 'visual': [f'a{i}'], 'layout': 'reference', 'character': 'none'} for i in range(1, n+1)]}
    write_plan(u, p)
    (u / 'approval-evidence.txt').write_text('SIMULATED HUMAN APPROVAL. NOT ACTUAL USER CONSENT.', encoding='utf-8')
    save(u / 'approvals.json', [{'unit': p['unit'], 'actor': 'human', 'decision': 'approve', 'simulation': True,
         'message_ref': 'test://simulated-approval', 'plan_hash': plan_hash(u), 'evidence': bind(u, 'approval-evidence.txt')}])
    assets, reviewrows = [], []
    for i in range(1, n+1):
        src = rendered / f'幻灯片{i}.PNG'
        files = list(rendered.glob('*.PNG')) + list(rendered.glob('*.png'))
        import re
        matches = [x for x in files if re.search(r'(\d+)\.(?:png)$', x.name, re.I) and int(re.search(r'(\d+)\.(?:png)$', x.name, re.I)[1]) == i]
        if not matches:
            raise RuntimeError(f'Original render missing: slide {i}')
        shutil.copy2(matches[0], u / f'renders/slide{i:02}.png')
        shutil.copy2(matches[0], u / f'assets/slide{i:02}.png')
        assets.append({'id': f'a{i}', 'file': bind(u, f'assets/slide{i:02}.png'), 'kind': 'existing',
                       'purpose': f'reference slide {i}', 'review': 'passed', 'reviewer': 'simulation',
                       'provenance': 'original PowerPoint rendering'})
        rev = {'status': 'passed', 'reviewer': 'simulation', 'comment': 'Fixture only, not actual content validation',
               'simulation': True, 'evidence': bind(u, 'research/evidence.txt')}
        reviewrows.append({'number': i, 'render': bind(u, f'renders/slide{i:02}.png'),
                           'science': copy.deepcopy(rev), 'curriculum': copy.deepcopy(rev), 'visual': copy.deepcopy(rev)})
    save(u / 'assets/manifest.json', assets)
    with_notes(original, u / 'drafts/deck.pptx', n)
    docx_fixture(u / 'drafts/script.docx', n)
    save(u / 'checks/reviews.json', {'plan_hash': plan_hash(u), 'artifacts': {
         x: digest(u / x) for x in ['drafts/deck.pptx', 'drafts/script.docx']}, 'open_issues': [], 'slides': reviewrows})
    (u / 'figma/simulation.txt').write_text('SIMULATED FIGMA, NO CLOUD UPLOAD.', encoding='utf-8')
    save(u / 'figma/mapping.json', {'url': 'https://www.figma.com/design/SIMULATION/test',
         'deck_sha256': digest(u / 'drafts/deck.pptx'), 'status': 'verified', 'reviewer': 'simulation', 'simulation': True,
         'evidence': bind(u, 'figma/simulation.txt'), 'frames': [{'slide': i, 'node_id': f'0:{i}'} for i in range(1,n+1)]})
    design_fixture(u, rules)
    engine = Engine(u, rules, root / 'control', test=True)
    engine.baseline([protected])
    return engine



def design_fixture(u, rules):
    """Synthetic evidence for parser tests only; never a real design judgement."""
    cfg = read(rules)['design_review']
    p = u / 'design-review'; p.mkdir(exist_ok=True)
    (u / 'drafts/representatives').mkdir(exist_ok=True)
    templates, slides = [], []
    for i, kind in enumerate(cfg['types'], 1):
        rel = f'drafts/representatives/{kind}.txt'
        (u / rel).write_text('SIMULATION CANDIDATE ' + kind)
        objects = []
        for role in cfg['required_roles'][kind]:
            objects.append({'role': role, 'kind': 'chevron' if role == 'part_blocks' else 'test',
                'bbox': [0.1, 0.2, 0.3, 0.4], 'fill': '#000000', 'font_family': 'Pretendard',
                'font_size': 30, 'font_weight': 700, 'alignment': 'left', 'character_asset_id': 'fixture', 'visible_bbox': [0.8,0.04,0.08,0.05], 'asset_sha256': 'simulation-logo-hash'})
        source_layout = {'artifact_sha256': digest(u / rel), 'render_sha256': digest(u / 'renders/slide01.png'),
                         'exporter': 'simulation-only-exporter', 'canvas': [1920, 1080], 'objects': objects}
        for tag in ['reference', 'candidate']:
            save(p / f'{kind}-{tag}.json', source_layout)
        ref = {'id': 'ref-' + kind, 'type': kind, 'slide': 1 if kind=='cover' else i, 'source': bind(u, rel),
               'render': bind(u, 'renders/slide01.png'), 'layout': bind(u, f'design-review/{kind}-reference.json')}
        templates.append(ref)
        slides.append({'id': 'candidate-' + kind, 'type': kind, 'reference_id': ref['id'],
            'slide': 1 if kind=='cover' else i, 'artifact': bind(u, rel), 'render': bind(u, 'renders/slide01.png'),
            'layout': bind(u, f'design-review/{kind}-candidate.json'), 'comparison': bind(u, 'renders/slide01.png'),
            'reviewer': 'simulation', 'reason': 'parser fixture only', 'simulation': True,
            'criteria': {k: {'status': 'passed', 'reason': 'simulated fixture, not visual validation',
                            'reviewer': 'simulation', 'simulation': True, 'evidence': bind(u, 'renders/slide01.png')}
                         for k in cfg['criteria']}})
    lock = {'unit': 'osmosis-validation', 'templates': templates}
    save(p / 'reference-lock.json', lock)
    review = {'unit': 'osmosis-validation', 'version': 'test-version-1', 'plan_hash': plan_hash(u),
              'reference_hash': canonical(lock), 'simulation': True, 'slides': slides}
    save(p / 'review.json', review)
    save(p / 'feedback.json', [])
    reviews = read(u / 'checks/reviews.json')
    for row in reviews['slides']:
        role_objects = read(u / 'design-review/cover-reference.json')['objects'] if row['number']==1 else []
        rel = 'checks/layout%02d.json' % row['number']
        save(u / rel, {'artifact_sha256': digest(u / 'drafts/deck.pptx'),
             'render_sha256': row['render']['sha256'], 'exporter':'simulation-only',
             'canvas':[1920,1080], 'objects':role_objects})
        row['layout'] = bind(u, rel)
    save(u / 'checks/reviews.json', reviews)

    save(p / 'approvals.json', [{'unit': 'osmosis-validation', 'version': review['version'],
        'review_hash': canonical(review), 'reference_hash': review['reference_hash'], 'actor': 'human',
        'decision': 'approve_design', 'message_ref': 'test://design-confirmation', 'simulation': True,
        'evidence': bind(u, 'approval-evidence.txt')}])

class GatesTest(unittest.TestCase):
    template = None
    records = []

    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(prefix='osmosis-gate-')
        self.root = Path(self.temp.name)
        shutil.copytree(self.template / 'unit', self.root / 'unit')
        shutil.copytree(self.template / 'protected', self.root / 'protected')
        self.e = Engine(self.root / 'unit', control=self.root / 'control', test=True)
        self.e.baseline([self.root / 'protected'])
        self.u = self.e.unit
        self.started = time.monotonic()

    def tearDown(self):
        self.records.append({'test': self.id().split('.')[-1], 'seconds': round(time.monotonic()-self.started,3)})
        self.temp.cleanup()

    def mutate(self, rel, fn):
        d = read(self.u / rel); fn(d); save(self.u / rel, d)

    def fails(self, gate):
        r = self.e.check([gate]); self.assertFalse(r['passed'], r); return r

    def test_01_all_seven_pass_in_simulation(self):
        r = self.e.check(list(self.e.rules['gates'])); self.assertTrue(r['passed'], r)

    def test_02_missing_approval(self):
        save(self.u/'approvals.json', []); self.fails('G03')
        with self.assertRaises(ValueError): self.e.write('image','assets/new.png',b'x')
        self.assertFalse((self.u/'assets/new.png').exists())

    def test_03_core_plan_change(self):
        p=plan_data(self.u); p['slides'][0]['message']='changed'; write_plan(self.u,p); self.fails('G03')

    def test_04_layout_change_keeps_approval(self):
        p=plan_data(self.u); p['slides'][0]['layout']='two-column'; write_plan(self.u,p)
        self.assertTrue(self.e.check(['G03'])['passed'])

    def test_05_original_content_change(self):
        with (self.root/'protected/osmosis.pptx').open('ab') as f: f.write(b'changed')
        self.fails('G07')

    def test_06_original_deleted(self):
        (self.root/'protected/osmosis.pptx').unlink(); self.fails('G07')

    def test_07_original_moved(self):
        (self.root/'protected/osmosis.pptx').rename(self.root/'outside.pptx'); self.fails('G07')

    def test_08_original_renamed(self):
        (self.root/'protected/osmosis.pptx').rename(self.root/'protected/renamed.pptx'); self.fails('G07')

    def test_09_missing_source(self):
        self.mutate('research/content-map.json',lambda d:d[0].update(source_ids=['missing'])); self.fails('G01')

    def test_10_undecided_scope(self):
        self.mutate('research/content-map.json',lambda d:d[0].update(scope='미판정')); self.fails('G01')

    def test_11_empty_research(self):
        save(self.u/'research/content-map.json',[]); self.fails('G01')

    def test_12_number_duplicate(self):
        p=plan_data(self.u); p['slides'][1]['number']=1; write_plan(self.u,p); self.fails('G02')

    def test_13_ppt_count_mismatch(self):
        with zipfile.ZipFile(self.u/'drafts/deck.pptx') as z: entries={n:z.read(n) for n in z.namelist()}
        doc=ET.fromstring(entries['ppt/presentation.xml']); nodes=doc.find('p:sldIdLst',NS); nodes.remove(list(nodes)[-1])
        entries['ppt/presentation.xml']=ET.tostring(doc)
        with zipfile.ZipFile(self.u/'drafts/deck.pptx','w') as z:
            for n,b in entries.items(): z.writestr(n,b)
        self.fails('G05')

    def test_14_missing_presenter_notes(self):
        shutil.copy2(self.root/'protected/osmosis.pptx',self.u/'drafts/deck.pptx'); self.fails('G05')

    def test_15_docx_section_missing(self):
        docx_fixture(self.u/'drafts/script.docx',25); self.fails('G05')

    def test_16_open_review_issue(self):
        self.mutate('checks/reviews.json',lambda d:d.update(open_issues=['overlap'])); self.fails('G06')

    def test_17_review_missing(self):
        self.mutate('checks/reviews.json',lambda d:d['slides'][0].pop('science')); self.fails('G06')

    def test_18_stale_render(self):
        (self.u/'renders/slide01.png').write_bytes(b'stale'); self.fails('G06')

    def test_19_figma_missing(self):
        (self.u/'figma/mapping.json').unlink(); self.fails('G06')

    def test_20_duplicate_figma_nodes(self):
        self.mutate('figma/mapping.json',lambda d:d['frames'][1].update(node_id='0:1')); self.fails('G06')

    def test_21_production_rejects_simulated_consent(self):
        e=Engine(self.u,control=self.root/'control',test=False)
        self.assertFalse(e.check(['G03'])['passed'])

    def test_22_role_boundary_and_logging(self):
        for role,path in [('image','drafts/escape.txt'),('judge','research/escape.txt'),('analysis','../escape.txt'),('production','drafts/file:stream')]:
            with self.assertRaises(ValueError): self.e.write(role,path,b'denied')
        self.assertEqual(len((self.u/'checks/access.jsonl').read_text().splitlines()),4)
        self.assertFalse((self.root/'escape.txt').exists())

    def test_23_retry_limit(self):
        self.assertEqual(self.e.retry('production','overlap'),1)
        self.assertEqual(self.e.retry('production','overlap'),2)
        with self.assertRaises(ValueError): self.e.retry('production','overlap')

    def checkpoint_all(self):
        for stage in self.e.rules['stages']:
            r=self.e.checkpoint(stage); self.assertTrue(r['passed'],r)

    def test_24_unchanged_resume(self):
        self.checkpoint_all(); self.assertTrue(self.e.resume()['complete'])

    def test_25_input_change_resume(self):
        self.checkpoint_all(); self.mutate('input.json',lambda d:d.update(minutes=31))
        self.assertEqual(self.e.resume()['resume_from'],'research')

    def test_26_output_change_resume(self):
        self.checkpoint_all()
        with (self.u/'drafts/deck.pptx').open('ab') as f: f.write(b'changed')
        self.assertEqual(self.e.resume()['resume_from'],'production')

    def test_27_rules_change_resume(self):
        self.checkpoint_all(); p=self.root/'rules.json'; shutil.copy2(self.e.rules_path,p)
        d=read(p); d['version']='test-change'; save(p,d); self.e.rules_path=p; self.e.rules=d
        self.assertEqual(self.e.resume()['resume_from'],'research')

    def test_28_interrupted_running(self):
        self.checkpoint_all(); self.mutate('state.json',lambda d:d['stages']['image'].update(status='running'))
        self.assertEqual(self.e.resume()['resume_from'],'image')

    def test_29_missing_state(self):
        with self.assertRaises(OSError): self.e.resume()

    def test_30_asset_missing(self):
        (self.u/'assets/slide01.png').unlink(); self.fails('G04')

    def test_31_asset_review_pending(self):
        self.mutate('assets/manifest.json',lambda d:d[0].update(review='pending')); self.fails('G04')

    def test_32_valid_guarded_write_and_history(self):
        self.e.write('analysis','research/comparison.md',b'updated comparison')
        self.assertTrue(list((self.u/'history').rglob('comparison.md')))
        self.assertEqual(read(self.u/'state.json')['stages']['research']['status'],'running')

    def test_33_protection_baseline_cannot_reset(self):
        with self.assertRaises(ValueError): self.e.baseline([self.root/'protected'])

    def test_34_source_evidence_stale(self):
        (self.u/'research/evidence.txt').write_text('changed'); self.fails('G01')

    def test_35_empty_assets(self):
        save(self.u/'assets/manifest.json',[]); self.fails('G04')

    def test_36_production_review_simulation_rejected(self):
        self.mutate('approvals.json',lambda d:d[0].update(simulation=False))
        e=Engine(self.u,control=self.root/'control')
        self.assertFalse(e.check(['G06'])['passed'])

    def test_37_supplement_without_rationale(self):
        self.mutate('research/content-map.json',lambda d:d[0].update(scope='보충·심화')); self.fails('G01')

    def test_38_content_change_invalidates_approval(self):
        self.mutate('research/content-map.json',lambda d:d[0].update(claim='New claim with same ID'))
        self.fails('G03')

    def test_39_missing_standard_role(self):
        self.mutate('research/sources.json',lambda d:d.pop()); self.fails('G01')

    def test_40_malformed_json(self):
        (self.u/'assets/manifest.json').write_text('{invalid'); self.fails('G04')

    def test_41_no_protection_baseline(self):
        (self.e.control/'protected.json').unlink(); self.fails('G07')

    def test_42_simulated_fixture_cannot_finalize(self):
        with self.assertRaises(ValueError): self.e.finalize()
        self.assertFalse((self.u/'final').exists())

    def test_43_protected_target_write_blocked_before_change(self):
        (self.e.control/'protected.json').unlink()
        self.e.baseline([self.u/'research'])
        before=digest(self.u/'research/comparison.md')
        with self.assertRaises(ValueError): self.e.write('analysis','research/comparison.md',b'forbidden')
        self.assertEqual(before,digest(self.u/'research/comparison.md'))

    def test_44_wrong_unit_approval(self):
        self.mutate('approvals.json',lambda d:d[0].update(unit='other-unit')); self.fails('G03')

    def test_45_approval_evidence_changed(self):
        (self.u/'approval-evidence.txt').write_text('changed'); self.fails('G03')

    def test_46_stale_artifact_review(self):
        self.mutate('checks/reviews.json',lambda d:d['artifacts'].update({'drafts/deck.pptx':'bad'})); self.fails('G06')

    def test_47_checkpoint_reports_retained(self):
        a=self.e.checkpoint('research'); b=self.e.checkpoint('plan')
        self.assertNotEqual(a['run_id'],b['run_id'])
        self.assertEqual(read(self.u/'checks/runs'/ (a['run_id']+'.json'))['run_id'],a['run_id'])
        self.assertEqual(read(self.u/'checks/report.json')['run_id'],b['run_id'])

    def test_48_source_only_script_rejected(self):
        p=self.u/'drafts/script.docx'
        with zipfile.ZipFile(p) as z: entries={n:z.read(n) for n in z.namelist()}
        root=ET.fromstring(entries['word/document.xml'])
        texts=root.findall('.//w:t',NS)
        for t in texts:
            if not (t.text or '').startswith('Slide '): t.text='Source: supplied reference'
        entries['word/document.xml']=ET.tostring(root)
        with zipfile.ZipFile(p,'w') as z:
            for name,data in entries.items(): z.writestr(name,data)
        self.fails('G05')


    def test_49_design_confirmation_missing(self):
        save(self.u/'design-review/approvals.json', []); self.fails('G09')

    def test_50_seven_types_required(self):
        self.mutate('design-review/review.json', lambda d:d['slides'].pop()); self.fails('G08')

    def test_51_duplicate_type(self):
        self.mutate('design-review/review.json',lambda d:d['slides'][0].update(type='part')); self.fails('G08')

    def test_52_arrow_replaced_by_rectangle(self):
        rel='design-review/contents-candidate.json'
        self.mutate(rel,lambda d:next(o for o in d['objects'] if o['role']=='part_blocks').update(kind='rectangle'))
        self.mutate('design-review/review.json',lambda d:next(r for r in d['slides'] if r['type']=='contents').update(layout=bind(self.u,rel)))
        report=self.fails('G08'); self.assertIn('kind mismatch',report['results'][0]['detail'])

    def test_53_moved_title(self):
        rel='design-review/cover-candidate.json'
        self.mutate(rel,lambda d:d['objects'][0].update(bbox=[0.5,0.2,0.3,0.4]))
        self.mutate('design-review/review.json',lambda d:d['slides'][0].update(layout=bind(self.u,rel)))
        self.assertIn('position/scale mismatch',self.fails('G08')['results'][0]['detail'])

    def test_54_stale_reference_hash(self):
        self.mutate('design-review/reference-lock.json',lambda d:d.update(revision='changed')); self.fails('G08')

    def test_55_stale_candidate_file(self):
        (self.u/'drafts/representatives/cover.txt').write_text('changed'); self.fails('G08')

    def test_56_missing_comparison(self):
        self.mutate('design-review/review.json',lambda d:d['slides'][0].pop('comparison')); self.fails('G08')

    def test_57_failed_visual_item(self):
        self.mutate('design-review/review.json',lambda d:d['slides'][0]['criteria']['typography'].update(status='failed')); self.fails('G08')

    def test_58_unverified_visual_item(self):
        self.mutate('design-review/review.json',lambda d:d['slides'][0]['criteria']['spacing'].update(status='unverified')); self.fails('G08')

    def test_59_cannot_skip_fidelity(self):
        self.mutate('design-review/review.json',lambda d:d['slides'][0]['criteria']['layout_fidelity'].update(status='not_applicable')); self.fails('G08')

    def test_60_stale_design_approval(self):
        self.mutate('design-review/approvals.json',lambda d:d[0].update(version='old')); self.fails('G09')

    def test_61_wrong_unit_design_approval(self):
        self.mutate('design-review/approvals.json',lambda d:d[0].update(unit='other')); self.fails('G09')

    def test_62_open_rejection_blocks_expansion(self):
        save(self.u/'design-review/feedback.json',[{'id':'F1','scope':'global','text':'reference mismatch',
             'message_ref':'test://rejection','evidence':bind(self.u,'approval-evidence.txt'),'status':'open'}])
        self.fails('G09'); report=self.e.preflight('production'); self.assertFalse(report['passed'])
        self.assertEqual(read(self.u/'state.json')['stages']['prototype']['status'],'pending')
        with self.assertRaises(ValueError):self.e.write('production','drafts/new.pptx',b'denied')
        self.assertFalse((self.u/'drafts/new.pptx').exists())

    def test_63_local_fix_does_not_close_global_rejection(self):
        save(self.u/'design-review/feedback.json',[{'id':'F1','scope':'global','text':'style rejected',
             'message_ref':'test://rejection','evidence':bind(self.u,'approval-evidence.txt'),'status':'resolved',
             'resolution_version':'test-version-1','resolution_reason':'formula background only',
             'resolution_evidence':bind(self.u,'approval-evidence.txt'),'confirmation_ref':'test://old'}])
        self.fails('G09')

    def test_64_design_change_invalidates_resume(self):
        self.checkpoint_all()
        self.mutate('design-review/review.json',lambda d:d.update(version='test-version-2'))
        self.assertEqual(self.e.resume()['resume_from'],'prototype')

    def test_65_whole_production_without_design_confirmation_denied(self):
        save(self.u/'design-review/approvals.json',[])
        with self.assertRaises(ValueError): self.e.write('production','drafts/new.pptx',b'denied')
        self.assertFalse((self.u/'drafts/new.pptx').exists())

    def test_66_sample_write_scoped(self):
        save(self.u/'design-review/approvals.json',[])
        self.e.write('sample','drafts/representatives/new.txt',b'sample only')
        with self.assertRaises(ValueError): self.e.write('sample','drafts/deck.pptx',b'denied')

    def test_67_optional_na_requires_reason(self):
        self.mutate('design-review/review.json',lambda d:d['slides'][0]['criteria']['borders'].update(status='not_applicable',reason=''))
        self.fails('G08')

    def test_68_review_artifact_binding_cannot_be_invented(self):
        rel='design-review/cover-candidate.json'
        self.mutate(rel,lambda d:d.update(artifact_sha256='bad'))
        self.mutate('design-review/review.json',lambda d:d['slides'][0].update(layout=bind(self.u,rel)))
        self.fails('G08')

    def test_69_missing_objectives_box(self):
        rel='design-review/objectives-candidate.json'
        self.mutate(rel,lambda d:d['objects'].pop())
        self.mutate('design-review/review.json',lambda d:next(r for r in d['slides'] if r['type']=='objectives').update(layout=bind(self.u,rel)))
        self.fails('G08')

    def test_70_font_substitution_fails(self):
        rel='design-review/cover-candidate.json'
        self.mutate(rel,lambda d:d['objects'][0].update(font_family='Arial'))
        self.mutate('design-review/review.json',lambda d:d['slides'][0].update(layout=bind(self.u,rel)))
        self.fails('G08')


    def test_71_failed_reference_blocks_figma_preview(self):
        self.mutate('design-review/review.json',lambda d:d['slides'][0]['criteria']['layout_fidelity'].update(status='failed'))
        report=self.e.tool_preflight('figma-preview')
        self.assertFalse(report['passed'])
        self.assertIn('G08',[r['id'] for r in report['results'] if r['status']=='failed'])

    def test_72_unknown_tool_action_denied(self):
        with self.assertRaises(ValueError):self.e.tool_preflight('upload-anyway')

    def test_73_tsherpa_logo_visible_size_must_match_reference(self):
        rel='design-review/cover-candidate.json'
        self.mutate(rel,lambda d:next(o for o in d['objects'] if o['role']=='tsherpa_logo').update(visible_bbox=[0.8,0.04,0.2,0.06]))
        self.mutate('design-review/review.json',lambda d:d['slides'][0].update(layout=bind(self.u,rel)))
        self.assertIn('T-sherpa',self.fails('G08')['results'][0]['detail'])

    def test_74_tsherpa_logo_on_noncover_rejected(self):
        rel='design-review/part-candidate.json'
        self.mutate(rel,lambda d:d['objects'][0].update(role='tsherpa_logo'))
        self.mutate('design-review/review.json',lambda d:d['slides'][1].update(layout=bind(self.u,rel)))
        self.fails('G08')

    def test_75_tsherpa_logo_cannot_be_missing_on_cover(self):
        rel='design-review/cover-candidate.json'
        self.mutate(rel,lambda d:d.update(objects=[o for o in d['objects'] if o['role']!='tsherpa_logo']))
        self.mutate('design-review/review.json',lambda d:d['slides'][0].update(layout=bind(self.u,rel)))
        self.fails('G08')

    def test_76_full_deck_noncover_logo_rejected(self):
        rel='checks/layout02.json'
        self.mutate(rel,lambda d:d.update(objects=[{'role':'tsherpa_logo'}]))
        self.mutate('checks/reviews.json',lambda d:d['slides'][1].update(layout=bind(self.u,rel)))
        self.assertIn('absent after first',self.fails('G06')['results'][0]['detail'])

    def test_77_full_deck_cover_logo_missing(self):
        rel='checks/layout01.json'
        self.mutate(rel,lambda d:d.update(objects=[]))
        self.mutate('checks/reviews.json',lambda d:d['slides'][0].update(layout=bind(self.u,rel)))
        self.fails('G06')

    def test_78_full_deck_logo_wrong_visible_size(self):
        rel='checks/layout01.json'
        self.mutate(rel,lambda d:next(o for o in d['objects'] if o['role']=='tsherpa_logo').update(visible_bbox=[0,0,1,1]))
        self.mutate('checks/reviews.json',lambda d:d['slides'][0].update(layout=bind(self.u,rel)))
        self.fails('G06')

    def test_79_legacy_feedback_is_not_silently_resolved(self):
        save(self.u/'design-review/feedback.json',{'items':[{'id':'OLD1','status':'revised','human_confirmation':None}]})
        self.fails('G09')


def plan_data(unit):
    from gate import plan
    return plan(unit)


def main():
    ap=argparse.ArgumentParser(); ap.add_argument('--source',required=True); ap.add_argument('--renders',required=True)
    ap.add_argument('--out',default=str(ROOT/'harness/validation')); args=ap.parse_args()
    original=Path(args.source).resolve(); before=digest(original); out=Path(args.out).resolve(); out.mkdir(parents=True,exist_ok=True)
    runid=time.strftime('%Y%m%dT%H%M%S',time.gmtime())
    session=out/runid; session.mkdir(exist_ok=False)
    e=build_fixture(session,original,Path(args.renders).resolve(),ROOT/'harness/rules.json')
    GatesTest.template=session
    suite=unittest.defaultTestLoader.loadTestsFromTestCase(GatesTest)
    with (session/'tests.log').open('w',encoding='utf-8') as log:
        result=unittest.TextTestRunner(stream=log,verbosity=2).run(suite)
    positive=e.check(list(e.rules['gates'])); save(session/'simulation-report.json',positive)
    # Audit an untouched copy without mock approval/reviews or newly invented sources.
    audit=session/'reference-audit'; (audit/'drafts').mkdir(parents=True)
    shutil.copy2(original,audit/'drafts/deck.pptx')
    ae=Engine(audit,control=session/'audit-control'); ae.baseline([original])
    audit_report=ae.check(list(ae.rules['gates'])); save(audit/'checks/report.json',audit_report)
    actual=ppt_info(audit/'drafts/deck.pptx')
    after=digest(original)
    summary={'run_id':runid,'rules_version':e.rules['version'],'rules_sha256':digest(e.rules_path),
             'source':str(original),'source_before':before,'source_after':after,'source_unchanged':before==after,
             'reference_slides':len(actual),'reference_slides_with_source_notes':sum(bool(__import__('re').search(r'Source:\s*\S',s['notes'])) for s in actual),
             'tests_run':result.testsRun,'failures':len(result.failures),'errors':len(result.errors),
             'skipped':len(result.skipped),'expected_results_match':result.wasSuccessful() and not result.skipped,
             'simulation_all_gates_passed':positive['passed'],'reference_copy_all_gates_passed':audit_report['passed'],
             'figma_uploaded':False,'records':GatesTest.records,
             'limits':['Simulated consent/review/Figma are parser fixtures, not actual approvals or scientific review.',
                       'Guarded writes constrain harness-managed file operations only, not arbitrary shell/app access.',
                       'Local evidence validates provenance records, not human identity or live Figma cloud state.']}
    save(session/'summary.json',summary)
    save(out/'latest.json',{'session':str(session),'summary':str(session/'summary.json')})
    print(json.dumps({k:v for k,v in summary.items() if k!='records'},ensure_ascii=True,indent=2))
    return 0 if summary['expected_results_match'] and before==after and positive['passed'] else 1


if __name__=='__main__': sys.exit(main())
