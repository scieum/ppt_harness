"""Fail-closed local gate engine. Stdlib only. See README.md for evidence boundaries."""
import argparse
import datetime as dt
import hashlib
import json
import os
from pathlib import Path
import re
import shutil
import sys
import uuid
import zipfile
import xml.etree.ElementTree as ET

HERE = Path(__file__).resolve().parent
NS = {"p": "http://schemas.openxmlformats.org/presentationml/2006/main",
      "a": "http://schemas.openxmlformats.org/drawingml/2006/main",
      "r": "http://schemas.openxmlformats.org/officeDocument/2006/relationships",
      "w": "http://schemas.openxmlformats.org/wordprocessingml/2006/main"}


def digest(path):
    h = hashlib.sha256()
    with Path(path).open('rb') as f:
        for block in iter(lambda: f.read(1024 * 1024), b''):
            h.update(block)
    return h.hexdigest()


def canonical(value):
    return hashlib.sha256(json.dumps(value, ensure_ascii=False, sort_keys=True,
                                    separators=(',', ':')).encode()).hexdigest()


def read(path):
    return json.loads(Path(path).read_text(encoding='utf-8-sig'))


def save(path, value):
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp = path.with_name(path.name + '.tmp')
    tmp.write_text(json.dumps(value, ensure_ascii=False, indent=2), encoding='utf-8')
    os.replace(tmp, path)


def require(condition, message):
    if not condition:
        raise ValueError(message)


def local(root, rel):
    require(isinstance(rel, str) and rel and not Path(rel).is_absolute(), 'relative path required')
    require(':' not in rel and '\\' not in rel, 'use portable relative paths without ADS')
    root = Path(root).resolve()
    p = (root / rel).resolve()
    require(p.is_relative_to(root) and p != root, 'path escapes unit')
    return p


def evidence(root, item):
    p = local(root, item['path'])
    require(p.is_file() and digest(p) == item['sha256'], 'missing/stale evidence: ' + item['path'])
    return p


def plan(root):
    text = (root / 'plan.md').read_text(encoding='utf-8-sig')
    blocks = re.findall(r'```harness-plan\s*\n(.*?)\n```', text, re.S)
    require(len(blocks) == 1, 'plan.md must contain exactly one harness-plan JSON block')
    return json.loads(blocks[0])


def plan_hash(root):
    p = plan(root)
    # Layout, equivalent wording and asset replacement do not invalidate approval.
    keys = ['unit', 'curriculum', 'objectives', 'target_slides', 'minutes', 'supplementary']
    essential = {k: p.get(k) for k in keys}
    essential['slides'] = [{k: s.get(k) for k in ['number', 'message', 'content_ids']}
                           for s in p['slides']]
    essential['content'] = read(root / 'research/content-map.json')
    return canonical(essential)


def protected_snapshot(paths):
    out = {}
    for raw in paths:
        p = Path(raw).resolve()
        require(p.exists(), 'protected root missing: ' + str(p))
        if p.is_dir():
            out[str(p)] = {'kind': 'directory'}
            for f in sorted(p.rglob('*')):
                if f.is_file():
                    out[str(f.resolve())] = {'kind': 'file', 'sha256': digest(f)}
        else:
            out[str(p)] = {'kind': 'file', 'sha256': digest(p)}
    require(out, 'empty protection baseline')
    return out


def ppt_info(path):
    import posixpath
    with zipfile.ZipFile(path) as z:
        require(z.testzip() is None, 'corrupt PPTX')
        rels = {x.attrib['Id']: x.attrib for x in ET.fromstring(z.read('ppt/_rels/presentation.xml.rels'))}
        ids = ET.fromstring(z.read('ppt/presentation.xml')).findall('p:sldIdLst/p:sldId', NS)
        result = []
        for node in ids:
            rel = rels[node.attrib['{' + NS['r'] + '}id']]
            require(rel.get('TargetMode') != 'External', 'external slide relationship')
            target = rel['Target']
            name = target.lstrip('/') if target.startswith('/') else posixpath.normpath('ppt/' + target)
            slide = ET.fromstring(z.read(name))
            relname = posixpath.dirname(name) + '/_rels/' + posixpath.basename(name) + '.rels'
            notes = []
            if relname in z.namelist():
                for r in ET.fromstring(z.read(relname)):
                    if r.attrib.get('Type', '').endswith('/notesSlide'):
                        require(r.attrib.get('TargetMode') != 'External', 'external notes')
                        t = r.attrib['Target']
                        n = t.lstrip('/') if t.startswith('/') else posixpath.normpath(posixpath.dirname(name) + '/' + t)
                        nr = ET.fromstring(z.read(n))
                        for shape in nr.findall('.//p:sp', NS):
                            ph = shape.find('p:nvSpPr/p:nvPr/p:ph', NS)
                            if ph is not None and ph.get('type') in ['sldNum', 'hdr', 'ftr', 'dt']:
                                continue
                            notes += [x.text for x in shape.findall('.//a:t', NS) if x.text]
            result.append({'name': name, 'notes': '\n'.join(notes),
                           'texts': [x.text for x in slide.findall('.//a:t', NS) if x.text]})
        require(result, 'empty presentation')
        return result


class Engine:
    def __init__(self, unit, rules=None, control=None, test=False):
        self.unit = Path(unit).resolve()
        self.rules_path = Path(rules or HERE / 'rules.json').resolve()
        self.rules = read(self.rules_path)
        require(self.rules['schema_version'] == 1, 'unsupported rules schema')
        require(set(self.rules['gates']) == {f'G{i:02}' for i in range(1, 10)}, 'invalid gate set')
        self.control = Path(control or HERE / 'control').resolve()
        require(not self.control.is_relative_to(self.unit), 'control must be outside worker unit')
        self.control = self.control / canonical(str(self.unit))[:20]
        self.test = test
        if test:
            require((self.unit / '.harness-test').is_file(), 'test mode requires isolated fixture marker')

    def baseline(self, paths):
        p = self.control / 'protected.json'
        require(not p.exists(), 'baseline exists; refusing silent replacement')
        for raw in paths:
            require(not self.control.is_relative_to(Path(raw).resolve()), 'baseline cannot contain control storage')
        save(p, {'unit': str(self.unit), 'roots': [str(Path(x).resolve()) for x in paths],
                 'files': protected_snapshot(paths)})

    def G01(self):
        sources = read(self.unit / 'research/sources.json')
        content = read(self.unit / 'research/content-map.json')
        require(isinstance(sources, list) and sources and isinstance(content, list) and content, 'empty research')
        ids = [s['id'] for s in sources]
        require(len(ids) == len(set(ids)), 'duplicate source ID')
        require(set(self.rules['source_roles']) <= {s.get('role') for s in sources},
                'primary/secondary/comparison/standard source role missing')
        for s in sources:
            require(s.get('citation') and s.get('curriculum'), 'source citation/curriculum missing')
            evidence(self.unit, s['evidence'])
        cids = [c['id'] for c in content]
        require(len(cids) == len(set(cids)), 'duplicate content ID')
        for c in content:
            require(c.get('scope') in self.rules['allowed_scope'], 'unclassified curriculum content')
            require(c.get('claim') and c.get('standard') and c.get('rationale'), 'content reasoning missing')
            require(c.get('standard_source_id') in {s['id'] for s in sources if s.get('role') == 'standard'},
                    'achievement standard evidence missing')
            require(c.get('source_ids') and set(c['source_ids']) <= set(ids), 'unknown/empty source IDs')
            if c['scope'] == '보충·심화':
                require(c.get('inclusion_reason') and c.get('separation'), 'supplementary justification missing')

    def G02(self):
        self.G01()
        p = plan(self.unit)
        inp = read(self.unit / 'input.json')
        require(all(p.get(k) for k in self.rules['plan_fields']), 'plan required fields missing')
        n = p['target_slides']
        require(type(n) is int and n > 0 and len(p['slides']) == n, 'slide count mismatch')
        require(type(p['minutes']) in [int, float] and p['minutes'] > 0, 'invalid minutes')
        require(p['unit'] == inp['unit'] and p['curriculum'] == inp['curriculum'] and
                n == inp['target_slides'] and p['minutes'] == inp['minutes'], 'input-plan mismatch')
        require([s['number'] for s in p['slides']] == list(range(1, n + 1)), 'slide numbering mismatch')
        content = read(self.unit / 'research/content-map.json')
        included = {c['id'] for c in content if c['scope'] != '제외'}
        used = set()
        sources = {s['id'] for s in read(self.unit / 'research/sources.json')}
        for s in p['slides']:
            require(all(k in s and s[k] is not None for k in self.rules['slide_fields']), 'slide fields missing')
            require(s['title'] and s['message'] and s['layout'], 'empty slide description')
            require(s['content_ids'] and set(s['content_ids']) <= included, 'excluded/unknown content in plan')
            require(s['source_ids'] and set(s['source_ids']) <= sources, 'slide source missing')
            require(isinstance(s['visual'], list), 'visual must be asset ID list')
            used.update(s['content_ids'])
        require(used == included, 'included content missing from plan')
        supplement = {c['id']: {k: c[k] for k in ['inclusion_reason', 'separation', 'source_ids']}
                      for c in content if c['scope'] == '보충·심화'}
        require(p.get('supplementary', {}) == supplement, 'supplementary scope not embedded in plan')

    def G03(self):
        self.G02()
        approvals = read(self.unit / 'approvals.json')
        require(isinstance(approvals, list), 'approvals must be a list')
        for a in approvals:
            if a.get('unit') != read(self.unit / 'input.json')['unit'] or a.get('plan_hash') != plan_hash(self.unit):
                continue
            if a.get('actor') != 'human' or a.get('decision') != 'approve' or not a.get('message_ref'):
                continue
            if a.get('simulation', False) and not self.test:
                continue
            evidence(self.unit, a['evidence'])
            return
        raise ValueError('no valid human approval for current plan')

    def G04(self):
        self.G03()
        assets = read(self.unit / 'assets/manifest.json')
        expected = {x for s in plan(self.unit)['slides'] for x in s['visual']}
        require(isinstance(assets, list) and assets and expected, 'empty asset denominator')
        require(len({a['id'] for a in assets}) == len(assets) and {a['id'] for a in assets} == expected,
                'planned asset IDs mismatch')
        sources = {s['id'] for s in read(self.unit / 'research/sources.json')}
        for a in assets:
            evidence(self.unit, a['file'])
            require(a.get('purpose') and a.get('kind') in ['crop', 'generated', 'existing'], 'asset metadata missing')
            require(a.get('review') == 'passed' and a.get('reviewer'), 'asset review incomplete')
            if a['kind'] == 'crop':
                require(a.get('source_id') in sources and a.get('page'), 'crop source missing')
            else:
                require(a.get('provenance'), 'asset provenance missing')

    def G05(self):
        self.G04()
        slides = ppt_info(self.unit / 'drafts/deck.pptx')
        require(len(slides) == plan(self.unit)['target_slides'], 'PPT slide count mismatch')
        for i, s in enumerate(slides, 1):
            require(s['notes'].strip() and re.search(r'(?:Source|출처):\s*\S', s['notes']), f'notes/source missing: slide {i}')
            require(re.sub(r'(?:Source|출처):[^\n]*', '', s['notes']).strip(), f'notes contain only source: slide {i}')
        with zipfile.ZipFile(self.unit / 'drafts/script.docx') as z:
            require(z.testzip() is None, 'corrupt DOCX')
            root = ET.fromstring(z.read('word/document.xml'))
            texts = [''.join(t.text or '' for t in p.findall('.//w:t', NS)) for p in root.findall('.//w:p', NS)]
            headers = [int(m.group(1)) for t in texts if (m := re.fullmatch(r'Slide (\d+)', t.strip()))]
            require(headers == list(range(1, len(slides) + 1)), 'DOCX slide section sequence mismatch')
            for i, h in enumerate(headers):
                start = texts.index('Slide ' + str(h))
                end = texts.index('Slide ' + str(headers[i + 1])) if i + 1 < len(headers) else len(texts)
                body = '\n'.join(texts[start + 1:end])
                require(body.strip() and re.search(r'(?:Source|출처):\s*\S', body), 'empty/script source missing')
                require(re.sub(r'(?:Source|출처):[^\n]*', '', body).strip(), 'script contains only source')

    def G06(self):
        self.G05()
        self.G09()
        reviews = read(self.unit / 'checks/reviews.json')
        binding = {p: digest(self.unit / p) for p in ['drafts/deck.pptx', 'drafts/script.docx']}
        require(reviews.get('artifacts') == binding, 'reviews refer to stale artifacts')
        require(reviews.get('plan_hash') == plan_hash(self.unit), 'reviews refer to stale plan')
        require(reviews.get('open_issues') == [], 'open/unrecorded issues')
        n = plan(self.unit)['target_slides']
        rows = reviews['slides']
        require([r['number'] for r in rows] == list(range(1, n + 1)), 'review coverage mismatch')
        for r in rows:
            evidence(self.unit, r['render'])
            for category in self.rules['review_categories']:
                rev = r[category]
                require(rev.get('status') == 'passed' and rev.get('reviewer') and rev.get('comment'),
                        f'incomplete {category} review')
                evidence(self.unit, rev['evidence'])
                require(self.test or not rev.get('simulation', False), 'simulated review in production')
        from design_gate import full_deck_branding
        full_deck_branding(self, rows, binding['drafts/deck.pptx'])
        mapping = read(self.unit / 'figma/mapping.json')
        require(mapping.get('deck_sha256') == binding['drafts/deck.pptx'], 'stale Figma mapping')
        require(re.match(r'^https://(?:www\.)?figma\.com/(?:design|file)/[^/]+', mapping.get('url', '')), 'Figma URL missing')
        require([r['slide'] for r in mapping['frames']] == list(range(1, n + 1)), 'Figma coverage mismatch')
        nodes = [r['node_id'] for r in mapping['frames']]
        require(all(nodes) and len(set(nodes)) == n, 'duplicate/empty Figma nodes')
        require(mapping.get('status') == 'verified' and mapping.get('reviewer'), 'Figma verification missing')
        require(self.test or not mapping.get('simulation', False), 'simulated Figma in production')
        evidence(self.unit, mapping['evidence'])

    def G07(self):
        b = read(self.control / 'protected.json')
        require(b['unit'] == str(self.unit) and b['files'], 'invalid protection baseline')
        require(protected_snapshot(b['roots']) == b['files'], 'protected path/content changed')

    def G08(self):
        from design_gate import review
        self.G04()
        review(self, plan_hash(self.unit))

    def G09(self):
        from design_gate import approve
        self.G08()
        approve(self, plan_hash(self.unit))

    def preflight(self, stage):
        require(stage in self.rules['stages'], 'unknown stage')
        report = self.check(self.rules['stages'][stage]['pre'])
        statep = self.unit / 'state.json'
        state = read(statep) if statep.exists() else {'stages': {}}
        state.setdefault('stages', {})[stage] = {
            'status': 'running' if report['passed'] else 'failed', 'run_id': report['run_id']}
        failed = [r for r in report['results'] if r['status'] == 'failed']
        if failed:
            # Preserve results; rollback invalidates dependent statuses, never approves a failure.
            targets = [r['rollback'] for r in failed]
            state['rollback'] = {'targets': targets, 'run_id': report['run_id']}
            stages = list(self.rules['stages'])
            known = [x for x in targets if x in stages]
            if known:
                first = min(stages.index(x) for x in known)
                for next_stage in stages[first:]:
                    if next_stage != stage:
                        state['stages'][next_stage] = {'status': 'pending', 'reason': 'failed preflight rollback'}
        save(statep, state)
        self.record(report)
        return report

    def check(self, ids):
        rows = []
        for gid in ids:
            require(gid in self.rules['gates'], 'unknown gate')
            try:
                getattr(self, gid)()
                rows.append({'id': gid, 'status': 'passed', 'detail': 'conditions satisfied'})
            except (OSError, ValueError, KeyError, TypeError, AttributeError, IndexError, zipfile.BadZipFile, ET.ParseError) as e:
                rows.append({'id': gid, 'status': 'failed', 'detail': str(e),
                             'rollback': self.rules['gates'][gid]['rollback']})
        return {'run_id': uuid.uuid4().hex, 'time_utc': dt.datetime.now(dt.timezone.utc).isoformat(),
                'mode': 'simulation' if self.test else 'production', 'rules_version': self.rules['version'],
                'rules_sha256': digest(self.rules_path), 'unit': str(self.unit), 'results': rows,
                'passed': bool(rows) and all(r['status'] == 'passed' for r in rows)}

    def tool_preflight(self, action):
        require(action in self.rules['tool_gates'], 'unknown tool action')
        report = self.check(self.rules['tool_gates'][action])
        report['action'] = action
        self.record(report)
        return report

    def fingerprint(self, stage):
        deps = {
            'research': ['input.json', 'research'],
            'plan': ['input.json', 'research', 'plan.md'],
            'image': ['input.json', 'research', 'plan.md', 'approvals.json', 'assets'],
            'production': ['input.json', 'research', 'plan.md', 'approvals.json', 'assets', 'drafts'],
            'review': ['input.json', 'research', 'plan.md', 'approvals.json', 'assets', 'drafts',
                       'renders', 'checks/reviews.json', 'figma']}
        deps['prototype'] = ['input.json', 'research', 'plan.md', 'approvals.json', 'assets',
                             'drafts/representatives', 'design-review/reference-lock.json', 'design-review/review.json']
        deps['design_confirmation'] = deps['prototype'] + ['design-review']
        for key in ['production', 'review']:
            deps[key] += ['design-review']
        out = {'rules': digest(self.rules_path), 'engine': digest(Path(__file__)),
               'design_engine': digest(HERE / 'design_gate.py')}

        for rel in deps[stage]:
            p = self.unit / rel
            require(p.exists(), 'fingerprint input/output missing: ' + rel)
            for f in sorted(p.rglob('*')) if p.is_dir() else [p]:
                if f.is_file():
                    require(f.resolve().is_relative_to(self.unit), 'fingerprint symlink escape')
                    out[f.relative_to(self.unit).as_posix()] = digest(f)
        return out

    def checkpoint(self, stage):
        report = self.check(self.rules['stages'][stage]['post'])
        state = read(self.unit / 'state.json') if (self.unit / 'state.json').exists() else {'stages': {}}
        state['stages'][stage] = {'status': 'passed' if report['passed'] else 'failed',
                                  'run_id': report['run_id'], 'fingerprint': self.fingerprint(stage) if report['passed'] else None}
        save(self.unit / 'state.json', state)
        self.record(report)
        return report

    def record(self, report):
        save(self.unit / 'checks/runs' / (report['run_id'] + '.json'), report)
        save(self.unit / 'checks/report.json', report)

    def resume(self):
        state = read(self.unit / 'state.json')
        stages = list(self.rules['stages'])
        first = None
        for stage in stages:
            row = state.get('stages', {}).get(stage, {})
            try:
                valid = row.get('status') == 'passed' and row.get('fingerprint') == self.fingerprint(stage)
                valid = valid and self.check(self.rules['stages'][stage]['post'])['passed']
            except (OSError, ValueError, KeyError):
                valid = False
            if not valid:
                first = stage
                break
        if first:
            for stage in stages[stages.index(first):]:
                state.setdefault('stages', {})[stage] = {'status': 'pending', 'reason': 'resume invalidation'}
            save(self.unit / 'state.json', state)
        return {'resume_from': first, 'complete': first is None, 'mode': 'simulation' if self.test else 'production'}

    def retry(self, stage, error_id):
        require(stage in self.rules['stages'] and error_id, 'invalid retry target')
        p = self.unit / 'state.json'
        state = read(p) if p.exists() else {'stages': {}}
        key = stage + ':' + error_id
        count = state.setdefault('retries', {}).get(key, 0)
        require(count < self.rules['max_retries'], 'retry limit reached')
        state['retries'][key] = count + 1
        save(p, state)
        return count + 1

    def write(self, role, rel, data):
        try:
            target = local(self.unit, rel)
            allowed = self.rules['roles'].get(role, [])
            require(any(target.is_relative_to(self.unit / d) for d in allowed), 'role write denied')
            baseline = read(self.control / 'protected.json')
            require(not any(target == Path(p) or (row['kind'] == 'directory' and target.is_relative_to(Path(p)))
                            for p, row in baseline['files'].items()), 'write to protected target denied')
        except ValueError as err:
            log = self.unit / 'checks/access.jsonl'
            log.parent.mkdir(parents=True, exist_ok=True)
            with log.open('a', encoding='utf-8') as f:
                f.write(json.dumps({'role': role, 'path': rel, 'denied': str(err)}) + '\n')
            raise
        stage = {'analysis': 'research', 'image': 'image', 'sample': 'prototype', 'production': 'production'}.get(role)
        require(stage is not None, 'read-only/unknown role')
        pre = self.preflight(stage)
        log = self.unit / 'checks/access.jsonl'
        log.parent.mkdir(parents=True, exist_ok=True)
        with log.open('a', encoding='utf-8') as f:
            f.write(json.dumps({'role': role, 'path': rel, 'preflight': pre['passed']}) + '\n')
        require(pre['passed'], 'stage preflight denied: ' + str(pre['results']))
        statep = self.unit / 'state.json'
        state = read(statep) if statep.exists() else {'stages': {}}
        state.setdefault('stages', {})[stage] = {'status': 'running'}
        save(statep, state)
        if target.exists():
            backup = self.unit / 'history' / uuid.uuid4().hex / rel
            backup.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(target, backup)
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_bytes(data)
        self.G07()

    def finalize(self):
        require(not self.test, 'simulation may not publish final deliverables')
        report = self.check(list(self.rules['gates']))
        require(report['passed'], 'final gates failed')
        require(self.resume()['complete'], 'stage checkpoints incomplete or stale')
        for name in ['deck.pptx', 'script.docx']:
            target = self.unit / 'final' / name
            if target.exists():
                backup = self.unit / 'history' / report['run_id'] / 'final' / name
                backup.parent.mkdir(parents=True, exist_ok=True)
                shutil.copy2(target, backup)
            target.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(self.unit / 'drafts' / name, target)
        self.record(report)
        return {'complete': True, 'run_id': report['run_id']}


def main():
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument('--unit', required=True)
    ap.add_argument('--rules')
    ap.add_argument('--control')
    ap.add_argument('--test-mode', action='store_true')
    sub = ap.add_subparsers(dest='cmd', required=True)
    c = sub.add_parser('check'); c.add_argument('--gate', action='append'); c.add_argument('--report', action='store_true')
    c = sub.add_parser('baseline'); c.add_argument('--protect', action='append', required=True)
    c = sub.add_parser('plan-hash')
    c = sub.add_parser('checkpoint'); c.add_argument('stage')
    c = sub.add_parser('preflight'); c.add_argument('stage')
    c = sub.add_parser('tool-preflight'); c.add_argument('action')
    sub.add_parser('resume')
    sub.add_parser('finalize')
    c = sub.add_parser('retry'); c.add_argument('stage'); c.add_argument('error_id')
    c = sub.add_parser('write'); c.add_argument('role'); c.add_argument('target'); c.add_argument('--from-file', required=True)
    args = ap.parse_args()
    try:
        e = Engine(args.unit, args.rules, args.control, args.test_mode)
        if args.cmd == 'check':
            result = e.check(args.gate or list(e.rules['gates']))
            if args.report:
                e.record(result)
        elif args.cmd == 'baseline':
            e.baseline(args.protect); result = {'baseline': 'created'}
        elif args.cmd == 'plan-hash':
            result = {'plan_hash': plan_hash(e.unit)}
        elif args.cmd == 'tool-preflight':
            result = e.tool_preflight(args.action)
        elif args.cmd == 'preflight':
            result = e.preflight(args.stage)
        elif args.cmd == 'checkpoint':
            result = e.checkpoint(args.stage)
        elif args.cmd == 'resume':
            result = e.resume()
        elif args.cmd == 'finalize':
            result = e.finalize()
        elif args.cmd == 'retry':
            result = {'attempt': e.retry(args.stage, args.error_id)}
        else:
            e.write(args.role, args.target, Path(args.from_file).read_bytes()); result = {'written': args.target}
        print(json.dumps(result, ensure_ascii=True, indent=2))
        return 1 if result.get('passed') is False else 0
    except (OSError, ValueError, KeyError, TypeError) as err:
        print(json.dumps({'status': 'blocked', 'error': str(err)}, ensure_ascii=True))
        return 2


if __name__ == '__main__':
    sys.exit(main())
