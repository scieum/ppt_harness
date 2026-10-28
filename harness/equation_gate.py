"""G10: current-deck equation evidence and measurable image/placement checks.

Typeface and scientific correctness require a hashed visual review, never inferred
from a font name or a declaration that an image was generated.
"""
import math
import hashlib
import posixpath
import re
import zipfile
import xml.etree.ElementTree as ET


def review(engine):
    from gate import read, evidence, require, digest, ppt_info, NS
    try:
        from PIL import Image
    except ImportError as exc:
        raise ValueError('G10 requires Pillow; use the bundled Python runtime') from exc
    root = engine.unit
    data = read(root / 'checks/equations.json')
    require(data.get('schema_version') == 1, 'G10 schema_version must be 1')
    deck = evidence(root, data['deck'])
    require(str(deck).endswith('.pptx'), 'G10 requires PPTX binding')
    pages = ppt_info(deck)
    require(data.get('theme') in ('black', 'light'), 'G10 theme missing')
    require(data.get('open_issues') == [], 'G10 unresolved equation issues')
    rows = data.get('slides', [])
    require([r.get('number') for r in rows] == list(range(1, len(pages)+1)),
            'G10 every slide needs explicit equation inventory')
    require(engine.test or not data.get('simulation'), 'G10 simulated review forbidden')
    with zipfile.ZipFile(deck) as archive:
        for row, page in zip(rows, pages):
            n = row['number']
            evidence(root, row['render'])
            evidence(root, row['inventory_review'])
            require(row.get('reviewer'), f'G10 slide {n}: reviewer missing')
            tree = ET.fromstring(archive.read(page['name']))
            pictures = {p.find('p:nvPicPr/p:cNvPr', NS).get('id')
                        for p in tree.findall('.//p:pic', NS)}
            relpath = posixpath.join(posixpath.dirname(page['name']), '_rels', posixpath.basename(page['name'])+'.rels')
            rels = {r.get('Id'): r.get('Target') for r in ET.fromstring(archive.read(relpath))}
            formula_text = {}
            for shape in tree.findall('.//p:sp', NS):
                label = ''.join(t.text or '' for t in shape.findall('.//a:t', NS))
                if re.search(r'Δ|Σ|[=×]|[A-Z][₀-₉]|Q\s*=', label):
                    formula_text[shape.find('p:nvSpPr/p:cNvPr', NS).get('id')] = label
            exceptions = row.get('inline_or_science_labels', [])
            require({str(x['shape_id']) for x in exceptions} == set(formula_text),
                    f'G10 slide {n}: unclassified native formula text')
            for x in exceptions:
                require(x.get('reason') and x.get('role') in ('inline-explanation', 'science-figure-label'),
                        f'G10 slide {n}: native calculation is not an exception')
                require(x.get('text') == formula_text[str(x['shape_id'])], 'G10 stale native label')
                require(not re.search(r'[=×→]', x['text']), 'G10 calculation must be an image')
            groups = {}
            covered = set()
            for item in row.get('equations', []):
                pid = str(item['picture_id'])
                require(pid in pictures and pid not in covered, 'G10 missing/duplicate equation picture')
                covered.add(pid)
                asset = evidence(root, item['asset'])
                evidence(root, item['generation_record'])
                evidence(root, item['source_comparison'])
                evidence(root, item['visual_review'])
                producer = item.get('producer')
                require(producer in ('image_gen', 'preserved-source-color-correction'), 'G10 equations must be generated or explicitly preserved source images')
                if producer == 'preserved-source-color-correction':
                    evidence(root, item['preserved_source'])
                    evidence(root, item['preservation_record'])
                    require(item.get('glyphs_unchanged') is True, 'G10 preserved source cannot change glyphs')
                require(item.get('style') == 'textbook-serif', 'G10 textbook serif style required')
                require(item.get('reviewer') and item.get('expected_expression'), 'G10 review/expression missing')
                required = ['coefficients', 'elements', 'charges', 'states', 'subscripts',
                            'direction', 'enthalpy_sign_values', 'italic_enthalpy_H',
                            'upright_elements_parentheses', 'italic_states', 'serif_visual']
                require(all(item.get('checks', {}).get(k) is True for k in required),
                        'G10 incomplete scientific/typographic review')
                require(engine.test or not item.get('simulation'), 'G10 simulated equation review')
                im = Image.open(asset).convert('RGBA')
                pixels = list(im.getdata())
                ink = [p for p in pixels if p[3] >= 200]
                require(len(ink) >= 20, 'G10 empty equation asset')
                require(sum(p[3] == 0 for p in pixels) / len(pixels) >= .01,
                        'G10 PNG must have real transparent background')
                if data['theme'] == 'black':
                    require(sum(min(p[:3]) >= 240 for p in ink) / len(ink) >= .98,
                            'G10 black theme requires white equation ink')
                pic = next(p for p in tree.findall('.//p:pic', NS)
                           if p.find('p:nvPicPr/p:cNvPr', NS).get('id') == pid)
                rid = pic.find('.//a:blip', NS).get('{'+NS['r']+'}embed')
                target = rels[rid]
                member = target.lstrip('/') if target.startswith('/') else posixpath.normpath(posixpath.join(posixpath.dirname(page['name']), target))
                require(hashlib.sha256(archive.read(member)).hexdigest() == digest(asset),
                        'G10 asset differs from embedded equation picture')
                crop = pic.find('.//a:srcRect', NS)
                require(crop is None or all(int(v)==0 for v in crop.attrib.values()),
                        'G10 equation must use uncropped verified asset')
                ext = pic.find('p:spPr/a:xfrm/a:ext', NS)
                require(ext is not None, 'G10 picture placement missing')
                w, h = float(ext.get('cx')), float(ext.get('cy'))
                require(abs((w/h)/(im.width/im.height)-1) <= .015,
                        'G10 equation image stretched')
                glyph = item.get('reference_glyph_height_px')
                require(isinstance(glyph, (int, float)) and math.isfinite(glyph) and 0 < glyph <= im.height,
                        'G10 measured reference glyph height missing')
                # Actual picture height in EMU gives an export-independent scale.
                groups.setdefault(item.get('size_group', 'slide'), []).append(glyph*h/im.height)
            other = row.get('non_equation_images', [])
            other_ids = {str(x['picture_id']) for x in other}
            require(len(other_ids) == len(other) and not covered.intersection(other_ids),
                    'G10 duplicate or conflicting image classification')
            require(covered.union(other_ids) == pictures,
                    f'G10 slide {n}: unclassified image could contain an equation')
            require(all(x.get('reason') for x in other), 'G10 other image classification needs reason')
            for values in groups.values():
                require(max(values)/min(values) <= 1.05, f'G10 slide {n}: visible glyph sizes differ >5%')
    return {'deck_sha256': digest(deck), 'slides': len(rows), 'status': 'passed'}
