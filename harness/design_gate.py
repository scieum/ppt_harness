"""Reference-bound design evidence checks. No automated aesthetic judgement."""
import json
import hashlib
from pathlib import Path


def canonical(value):
    return hashlib.sha256(json.dumps(value, ensure_ascii=False, sort_keys=True,
                                    separators=(',', ':')).encode()).hexdigest()


def need(condition, message):
    if not condition:
        raise ValueError(message)


def feedback(engine, version, approval_ref=None):
    from gate import read, evidence
    data = read(engine.unit / 'design-review/feedback.json')
    if isinstance(data, dict):
        data = data.get('items')
    need(isinstance(data, list), 'design feedback must be explicitly recorded, including empty list')
    ids = [r['id'] for r in data]
    need(all(ids) and len(ids) == len(set(ids)), 'duplicate/empty feedback ID')
    for row in data:
        need(row.get('scope') in ['global', 'local'] and row.get('text') and row.get('message_ref'),
             'feedback scope/text/user response missing')
        evidence(engine.unit, row['evidence'])
        need(row.get('status') == 'resolved', 'unresolved design feedback: ' + row['id'])
        need(row.get('resolution_version') == version and row.get('resolution_reason'),
             'feedback resolution not bound to current design version')
        evidence(engine.unit, row['resolution_evidence'])
        if row['scope'] == 'global':
            need(approval_ref and row.get('confirmation_ref') == approval_ref,
                 'global rejection needs current human design confirmation; local fix cannot close it')


def review(engine, current_plan_hash):
    from gate import read, evidence
    root = engine.unit
    cfg = engine.rules['design_review']
    lock = read(root / 'design-review/reference-lock.json')
    data = read(root / 'design-review/review.json')
    unit = read(root / 'input.json')['unit']
    need(lock.get('unit') == unit and data.get('unit') == unit, 'wrong design-review unit')
    need(data.get('plan_hash') == current_plan_hash, 'design review uses stale plan')
    need(data.get('version') and data.get('reference_hash') == canonical(lock), 'stale reference lock')
    need(engine.test or not data.get('simulation', False), 'simulated design review in production')
    refs = lock.get('templates', [])
    rows = data.get('slides', [])
    types = cfg['types']
    need(len(refs) == len(types) and sorted(r['type'] for r in refs) == sorted(types),
         'reference must cover each of seven types exactly once')
    need(len(rows) == len(types) and sorted(r['type'] for r in rows) == sorted(types),
         'candidate must cover each of seven types exactly once')
    need(len({r['id'] for r in refs}) == len(refs), 'duplicate reference ID')
    need(len({r['id'] for r in rows}) == len(rows), 'duplicate candidate ID')
    refs = {r['type']: r for r in refs}
    for row in rows:
        ref = refs[row['type']]
        need(row.get('reference_id') == ref['id'], 'candidate substituted reference')
        need(type(ref.get('slide')) is int and ref['slide'] > 0, 'reference source slide missing')
        for key in ['source', 'render', 'layout']:
            evidence(root, ref[key])
        need(row.get('reviewer') and row.get('reason'), 'design judgement missing')
        need(engine.test or not row.get('simulation', False), 'simulated design row in production')
        for key in ['artifact', 'render', 'layout', 'comparison']:
            evidence(root, row[key])
        source_layout = read(evidence(root, ref['layout']))
        candidate_layout = read(evidence(root, row['layout']))
        for snapshot, binding in [(source_layout, ref), (candidate_layout, row)]:
            need(snapshot.get('artifact_sha256') == binding.get('artifact', binding.get('source'))['sha256'],
                 'layout export not bound to current source/candidate artifact')
            need(snapshot.get('render_sha256') == binding['render']['sha256'],
                 'layout export not bound to inspected render')
            need(snapshot.get('exporter') and snapshot.get('canvas') == [1920, 1080],
                 'normalised layout export required')
        a, b = source_layout.get('objects', []), candidate_layout.get('objects', [])
        need(a and b and len(a) == len(b), 'reference object count changed')
        need(len({o['role'] for o in a}) == len(a) and len({o['role'] for o in b}) == len(b),
             'duplicate object role')
        a, b = {o['role']: o for o in a}, {o['role']: o for o in b}
        need(set(a) == set(b), 'reference object role omitted or invented')
        need(set(cfg['required_roles'][row['type']]) <= set(a), 'mandatory template role missing from reference lock')
        brand = cfg['branding']
        if row['type'] != brand['cover_type']:
            need(brand['role'] not in b, 'T-sherpa logo is allowed on the first cover only')
        else:
            need(row.get('slide') == 1 and ref['slide'] == 1, 'T-sherpa cover must be first slide')
            for key in brand['locked_properties']:
                need(key in a[brand['role']] and key in b[brand['role']] and
                     a[brand['role']][key] == b[brand['role']][key],
                     'reference T-sherpa visible size/position/asset mismatch: ' + key)
        for role in a:
            left, right = a[role], b[role]
            for key in cfg['locked_properties']:
                need(key in left and key in right, 'layout property missing: ' + role + '/' + key)
                if key == 'bbox':
                    need(isinstance(left[key], list) and isinstance(right[key], list) and len(left[key]) == len(right[key]) == 4,
                         'four-value normalised bbox required')
                    need(all(type(v) in [int, float] for v in left[key] + right[key]), 'invalid bbox number')
                    need(all(abs(x-y) <= cfg['bbox_tolerance'] for x,y in zip(left[key], right[key])),
                         'reference position/scale mismatch: ' + role)
                else:
                    need(left[key] == right[key], 'reference ' + key + ' mismatch: ' + role)
        criteria = row.get('criteria', {})
        need(set(criteria) == set(cfg['criteria']), 'design criteria missing/unknown')
        for category, result in criteria.items():
            need(result.get('status') in ['passed', 'not_applicable'], 'failed/unverified design item: ' + category)
            need(result.get('reason') and result.get('reviewer'), 'design criterion reason/reviewer missing')
            need(engine.test or not result.get('simulation', False), 'simulated design judgement in production')
            if result['status'] == 'not_applicable':
                need(category in cfg['optional_criteria'], 'mandatory design item cannot be not_applicable')
            evidence(root, result['evidence'])
    return data


def approve(engine, current_plan_hash):
    from gate import read, evidence
    data = review(engine, current_plan_hash)
    approvals = read(engine.unit / 'design-review/approvals.json')
    need(isinstance(approvals, list), 'design approvals must be an array')
    valid = None
    for row in approvals:
        if row.get('unit') != data['unit'] or row.get('version') != data['version']:
            continue
        if row.get('review_hash') != canonical(data) or row.get('reference_hash') != data['reference_hash']:
            continue
        if row.get('actor') != 'human' or row.get('decision') != 'approve_design' or not row.get('message_ref'):
            continue
        if row.get('simulation', False) and not engine.test:
            continue
        evidence(engine.unit, row['evidence'])
        valid = row
        break
    need(valid, 'no actual human design confirmation for current seven-type reference/candidate version')
    feedback(engine, data['version'], valid['message_ref'])
    return valid


def full_deck_branding(engine, rows, deck_hash):
    """Fail closed on every slide's current exporter evidence, not just representatives."""
    from gate import read, evidence
    cfg = engine.rules['design_review']
    lock = read(engine.unit / 'design-review/reference-lock.json')
    cover = next(x for x in lock['templates'] if x['type'] == cfg['branding']['cover_type'])
    reference = read(evidence(engine.unit, cover['layout']))
    expected = next(o for o in reference['objects'] if o['role'] == cfg['branding']['role'])
    for row in rows:
        snapshot = read(evidence(engine.unit, row['layout']))
        need(snapshot.get('artifact_sha256') == deck_hash and snapshot.get('render_sha256') == row['render']['sha256'],
             'full-slide branding layout is stale')
        need(snapshot.get('exporter') and snapshot.get('canvas') == [1920,1080], 'full-slide layout export missing')
        logos = [o for o in snapshot['objects'] if o['role'] == cfg['branding']['role']]
        if row['number'] == 1:
            need(len(logos) == 1, 'first slide must contain exactly one T-sherpa logo')
            for key in cfg['branding']['locked_properties']:
                need(logos[0].get(key) == expected[key], 'full-deck T-sherpa reference mismatch: ' + key)
        else:
            need(not logos, 'T-sherpa must be absent after first slide: ' + str(row['number']))
