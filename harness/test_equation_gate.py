"""Synthetic fixtures only; these tests are not a real slide review."""
import json, tempfile, unittest, zipfile
from pathlib import Path
from types import SimpleNamespace
from PIL import Image
from gate import digest
from equation_gate import review

class EquationGateTests(unittest.TestCase):
    def setUp(self):
        self.tmp=tempfile.TemporaryDirectory(); self.root=Path(self.tmp.name)
        (self.root/'checks').mkdir(); (self.root/'proof.txt').write_text('Synthetic test evidence')
        im=Image.new('RGBA',(100,40),(0,0,0,0))
        for x in range(10,90):
            for y in range(10,30):im.putpixel((x,y),(255,255,255,255))
        im.save(self.root/'eq.png')
        self.engine=SimpleNamespace(unit=self.root,test=True)
        self.package()
        ev=lambda f:{'path':f,'sha256':digest(self.root/f)}
        checks=['coefficients','elements','charges','states','subscripts','direction','enthalpy_sign_values','italic_enthalpy_H','upright_elements_parentheses','italic_states','serif_visual']
        self.item={'picture_id':'7','asset':ev('eq.png'),'generation_record':ev('proof.txt'),'source_comparison':ev('proof.txt'),'visual_review':ev('proof.txt'),'producer':'image_gen','style':'textbook-serif','reviewer':'simulation','expected_expression':'test','checks':dict.fromkeys(checks,True),'reference_glyph_height_px':20,'simulation':True}
        self.data={'schema_version':1,'theme':'black','deck':ev('deck.pptx'),'open_issues':[],'simulation':True,'slides':[{'number':1,'render':ev('proof.txt'),'inventory_review':ev('proof.txt'),'reviewer':'simulation','equations':[self.item],'non_equation_images':[],'inline_or_science_labels':[]}]}
    def tearDown(self):self.tmp.cleanup()
    def package(self, height=400):
        ns='xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"'
        with zipfile.ZipFile(self.root/'deck.pptx','w') as z:
            z.writestr('ppt/presentation.xml',f'<p:presentation {ns}><p:sldIdLst><p:sldId id="1" r:id="r1"/></p:sldIdLst></p:presentation>')
            z.writestr('ppt/_rels/presentation.xml.rels','<Relationships><Relationship Id="r1" Target="slides/slide1.xml"/></Relationships>')
            z.writestr('ppt/slides/slide1.xml',f'<p:sld {ns}><p:pic><p:nvPicPr><p:cNvPr id="7"/></p:nvPicPr><p:blipFill><a:blip r:embed="r2"/></p:blipFill><p:spPr><a:xfrm><a:ext cx="1000" cy="{height}"/></a:xfrm></p:spPr></p:pic></p:sld>')
            z.writestr('ppt/slides/_rels/slide1.xml.rels','<Relationships><Relationship Id="r2" Target="../media/eq.png"/></Relationships>')
            z.write(self.root/'eq.png','ppt/media/eq.png')
    def run_gate(self):
        (self.root/'checks/equations.json').write_text(json.dumps(self.data));return review(self.engine)
    def test_complete_fixture(self):self.assertEqual(self.run_gate()['status'],'passed')
    def test_missing_image_inventory(self):
        self.data['slides'][0]['equations']=[]
        with self.assertRaisesRegex(ValueError,'unclassified image'):self.run_gate()
    def test_stale_asset(self):
        (self.root/'eq.png').write_bytes(b'changed')
        with self.assertRaisesRegex(ValueError,'stale evidence'):self.run_gate()
    def test_black_ink_rejected(self):
        im=Image.open(self.root/'eq.png').convert('RGBA');im.putdata([(0,0,0,a) for r,g,b,a in im.getdata()]);im.save(self.root/'eq.png')
        self.item['asset']['sha256']=digest(self.root/'eq.png')
        with self.assertRaisesRegex(ValueError,'white equation'):self.run_gate()
    def test_stretch_rejected(self):
        self.package(height=800);self.data['deck']['sha256']=digest(self.root/'deck.pptx')
        with self.assertRaisesRegex(ValueError,'stretched'):self.run_gate()
    def test_review_missing(self):
        self.item['checks']['serif_visual']=False
        with self.assertRaisesRegex(ValueError,'incomplete'):self.run_gate()
    def test_preserved_source_requires_evidence(self):
        self.item.update(producer='preserved-source-color-correction', glyphs_unchanged=True)
        with self.assertRaises(KeyError):self.run_gate()
    def test_preserved_source_requires_unchanged_glyphs(self):
        proof={'path':'proof.txt','sha256':digest(self.root/'proof.txt')}
        self.item.update(producer='preserved-source-color-correction',preserved_source=proof,preservation_record=proof,glyphs_unchanged=False)
        with self.assertRaisesRegex(ValueError,'cannot change glyphs'):self.run_gate()
    def test_simulation_forbidden(self):
        self.engine.test=False
        with self.assertRaisesRegex(ValueError,'simulated'):self.run_gate()
if __name__=='__main__':unittest.main()
