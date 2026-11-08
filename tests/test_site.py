"""Local Chromium checks. SDK stubs exercise presentation, never a real account or payment."""
import json, os, re, unittest
from pathlib import Path
from playwright.sync_api import sync_playwright
BASE=os.environ.get('SITE_URL','http://127.0.0.1:8008/')
ROOT=Path(__file__).resolve().parents[1]

class PolicySiteTest(unittest.TestCase):
 @classmethod
 def setUpClass(cls):
  cls.p=sync_playwright().start()
  cls.browser=cls.p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox'])
 @classmethod
 def tearDownClass(cls):cls.browser.close();cls.p.stop()
 def setUp(self):
  self.context=self.browser.new_context(viewport={'width':390,'height':844})
  self.page=self.context.new_page()
 def tearDown(self):self.context.close()
 def test_01_bilingual_responsive_policy_pages_and_links(self):
  for width,dark in [(360,False),(390,False),(430,True)]:
   self.page.set_viewport_size({'width':width,'height':844})
   self.page.emulate_media(color_scheme='dark' if dark else 'light')
   for path in ['privacy-policy.html','subscription-terms.html','account-deletion.html']:
    self.page.goto(BASE+path)
    for lang in ['en','hi']:
     self.page.locator(f'[data-language="{lang}"]').click()
     self.assertEqual(self.page.locator('html').get_attribute('lang'),lang)
     self.assertEqual(self.page.locator('article:visible').count(),1)
     self.assertLessEqual(self.page.evaluate('document.documentElement.scrollWidth'),width)
     self.assertTrue(self.page.locator('h1:visible').inner_text())
     self.assertEqual(self.page.locator('.updated:visible').inner_text(),'8 नवंबर 2026' if lang=='hi' else '8 November 2026')
     if width==390:
      self.page.screenshot(path=str(ROOT/'docs/evidence'/f'{lang}-{path[:-5]}.png'),full_page=True)
    for href in self.page.locator('a[href]').evaluate_all('(xs)=>xs.map(x=>x.getAttribute("href"))'):
     if not href.startswith(('https:','#')):self.assertTrue((ROOT/href).exists(),href)
 def test_02_missing_configuration_never_claims_deletion(self):
  requests=[]
  self.page.on('request',lambda request:requests.append(request.url))
  self.page.goto(BASE+'account-deletion.html')
  self.fill()
  self.page.locator('button[type=submit]').click()
  self.page.locator('#delete-status').filter(has_text='not configured').wait_for()
  self.assertFalse(any('gstatic' in url for url in requests))
  self.assertEqual(self.page.locator('#password').input_value(),'')
  self.assertTrue(self.page.locator('button[type=submit]').is_enabled())
  self.page.locator('[data-language=hi]').click()
  self.assertIn('कॉन्फिगर',self.page.locator('#delete-status').inner_text())
 def fill(self):
  self.page.locator('#email').fill('fixture@example.test')
  self.page.locator('#password').fill('test-only-never-real-password')
  self.page.locator('#confirm').check()
 def mock_services(self,fail=False):
  self.page.route('**/firebase-config.json',lambda route:route.fulfill(json={'firebase':{'apiKey':'fixture','projectId':'demo-daily-panchang','appId':'fixture'},'appCheckSiteKey':'fixture-public-site-key'}))
  modules={
   'firebase-app.js':'export function initializeApp(c,n){window.fixtureConfig=c;return {}}',
   'firebase-app-check.js':'export class ReCaptchaEnterpriseProvider{};export function initializeAppCheck(){}',
   'firebase-auth.js':'''export const inMemoryPersistence={};export function initializeAuth(a,c){window.fixtureMemory=c.persistence===inMemoryPersistence;return {}}
export async function signInWithEmailAndPassword(a,e,p){window.fixtureAuthenticated=true;return {user:{uid:'fixture'}}}
export async function signOut(){window.fixtureSignedOut=true}
export async function sendPasswordResetEmail(){window.fixtureReset=true}''',
   'firebase-functions.js':f'''export function getFunctions(a,r){{window.fixtureRegion=r;return {{}}}}
export function httpsCallable(f,n){{window.fixtureCallable=n;return async(data)=>{{window.fixtureBody=data;{'throw new Error("fixture unavailable")' if fail else 'return {data:{deleted:true}}'};}}}}'''
  }
  def route_module(route):
   name=route.request.url.split('/')[-1]
   route.fulfill(status=200,content_type='text/javascript',headers={'Access-Control-Allow-Origin':'*'},body=modules[name])
  self.page.route('https://www.gstatic.com/firebasejs/**',route_module)
 def test_03_authenticated_delete_uses_server_uid_and_memory_only(self):
  self.mock_services();self.page.goto(BASE+'account-deletion.html');self.fill()
  self.page.locator('button[type=submit]').click()
  self.page.locator('#delete-status').filter(has_text='has been deleted').wait_for()
  self.page.wait_for_function('window.fixtureSignedOut===true')
  self.assertTrue(self.page.evaluate('window.fixtureAuthenticated && window.fixtureMemory'))
  self.assertEqual(self.page.evaluate('window.fixtureBody'),{})
  self.assertEqual(self.page.evaluate('window.fixtureCallable'),'deleteOwnAccount')
  self.assertEqual(self.page.evaluate('window.fixtureRegion'),'asia-south1')
  self.assertEqual(self.page.evaluate('localStorage.length'),0)
  self.assertEqual(self.page.locator('#password').input_value(),'')
  self.assertTrue(self.page.locator('button[type=submit]').is_disabled())
 def test_04_backend_failure_keeps_retry_available(self):
  self.mock_services(fail=True);self.page.goto(BASE+'account-deletion.html');self.fill()
  self.page.locator('button[type=submit]').click()
  self.page.locator('#delete-status').filter(has_text='No successful deletion').wait_for()
  self.assertTrue(self.page.locator('button[type=submit]').is_enabled())
  self.page.wait_for_function('window.fixtureSignedOut===true')
 def test_05_reset_does_not_require_delete_confirmation(self):
  self.mock_services();self.page.goto(BASE+'account-deletion.html');self.page.locator('#email').fill('fixture@example.test')
  self.page.locator('#reset-password').click()
  self.page.locator('#delete-status').filter(has_text='password-reset email').wait_for()
  self.assertTrue(self.page.evaluate('window.fixtureReset'))
  self.assertIsNone(self.page.evaluate('window.fixtureAuthenticated'))
 def test_06_publisher_record_and_no_tracking(self):
  self.assertEqual((ROOT/'app-ads.txt').read_text().strip(),'google.com, pub-4985658778761322, DIRECT, f08c47fec0942fa0')
  for page in ROOT.glob('*.html'):
   self.assertNotRegex(page.read_text(),r'gtag\(|google-analytics|googletagmanager')

if __name__=='__main__':unittest.main(verbosity=2)
