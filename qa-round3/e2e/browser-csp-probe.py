# Isolated synthetic Chromium CSP probe. NO real user/employee data, or Supabase credentials.
# Requires Python Playwright and /usr/bin/chromium. Every HTTP request is aborted.
# Distinct from full application E2E: uses about:blank + set_content.
from playwright.sync_api import sync_playwright

REF = 'q' * 20
QA = f'https://{REF}.supabase.co'
OTHER = 'https://' + 'r' * 20 + '.supabase.co'
BLOCKED = 'https://blocked-test.invalid'
CDN = 'https://cdn.jsdelivr.net/npm/fake-qa-csp-probe.js'
CSP = '; '.join([
    "default-src 'none'", "base-uri 'self'", "form-action 'self'",
    "script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net",
    "style-src 'self' 'unsafe-inline'", "img-src 'self' data: blob:",
    "font-src 'self' data:", f"connect-src 'self' {QA} wss://{REF}.supabase.co",
    "manifest-src 'self'", "media-src 'self' blob:",
    "worker-src 'none'", "frame-src 'none'", "object-src 'none'"
])
HTML = '<!DOCTYPE html><html lang="ko"><head><meta http-equiv="Content-Security-Policy" content="' + CSP + '"><title>isolated QA synthetic</title><script>window.inlineCheck=42</script></head><body><h1>offline fixture</h1></body></html>'

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(executable_path='/usr/bin/chromium', headless=True, args=['--no-sandbox', '--disable-dev-shm-usage'])
        page = browser.new_page()
        page.set_default_timeout(4500)
        page.set_default_navigation_timeout(4500)
        requests = []
        # Route all traffic to a local abort handler; zero real internet/backend traffic.
        page.route('**/*', lambda route: route.abort('blockedbyclient'))
        page.goto('about:blank')
        page.set_content(HTML, timeout=12000)
        page.evaluate("""() => document.addEventListener('securitypolicyviolation', e => {
            window.__violations = (window.__violations || []).concat([{directive:e.violatedDirective,uri:e.blockedURI}]);
        })""")
        page.on('request', lambda req: requests.append(req.url))
        results = []
        def check(name, condition):
            results.append((name, bool(condition)))
        def violation(uri, directive):
            return any(v['uri'].startswith(uri) and v['directive'] == directive
                       for v in page.evaluate('window.__violations || []'))
        def attempt_fetch(uri):
            page.evaluate("""async uri => {
                await Promise.race([fetch(uri,{mode:'no-cors'}).catch(()=>{}),
                    new Promise(done=>setTimeout(done,1200))]);
            }""", uri)
            page.wait_for_timeout(90)
        check('inline UI script permitted', page.evaluate('window.inlineCheck') == 42)
        attempt_fetch(BLOCKED + '/rest/v1/rpc/fake')
        check('non-QA RPC blocked', violation(BLOCKED, 'connect-src') and not any(BLOCKED in u for u in requests))
        attempt_fetch(OTHER + '/rest/v1/rpc/fake')
        check('different QA project blocked', violation(OTHER, 'connect-src') and not any(OTHER in u for u in requests))
        attempt_fetch(QA + '/rest/v1/rpc/fake')
        check('QA HTTPS routed to synthetic abort handler', any(u.startswith(QA) for u in requests))
        attempt_fetch('https://cdn.jsdelivr.net/probe-non-api')
        check('CDN cannot call network APIs', violation('https://cdn.jsdelivr.net', 'connect-src'))
        page.evaluate("""() => {
            let el=document.createElement('script');
            el.src='https://cdn.jsdelivr.net/npm/fake-qa-csp-probe.js';
            document.head.appendChild(el);
        }""")
        page.wait_for_timeout(120)
        check('CDN script host allowed', CDN in requests)
        page.evaluate("""() => {
            let el=document.createElement('script');
            el.src='https://blocked-test.invalid/fake.js';
            document.head.appendChild(el);
        }""")
        page.wait_for_timeout(100)
        check('unknown script rejected', violation(BLOCKED, 'script-src-elem') or violation(BLOCKED, 'script-src'))
        png = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9aUKh9oAAAAASUVORK5CYII='
        check('data URL image preview allowed', page.evaluate("""uri => new Promise(done => {
            let img=new Image(); img.onload=()=>done(true);img.onerror=()=>done(false);img.src=uri;
        })""", png))
        page.evaluate("""() => {let img=new Image();img.src='https://blocked-test.invalid/private-photo.png';document.body.appendChild(img)}""")
        page.wait_for_timeout(90)
        check('external image rejected', violation(BLOCKED, 'img-src'))
        page.evaluate("""() => {let f=document.createElement('iframe');f.src='https://blocked-test.invalid/frame';document.body.appendChild(f)}""")
        page.wait_for_timeout(90)
        check('external frame rejected', violation(BLOCKED, 'frame-src'))
        page.evaluate("""() => {
            try { let blob=new Blob(['postMessage(1)'],{type:'application/javascript'});
                new Worker(URL.createObjectURL(blob)); } catch(_) {}
        }""")
        page.wait_for_timeout(120)
        check('worker rejected', any(v['directive']=='worker-src' for v in page.evaluate('window.__violations || []')))
        for name, success in results:
            print(('PASS' if success else 'FAIL'), name, flush=True)
        print(f"RESULT {sum(success for _,success in results)}/{len(results)} Chromium {browser.version}; "
              "all network requests intercepted/aborted", flush=True)
        browser.close()
        if not all(success for _,success in results):
            raise SystemExit(1)

if __name__ == '__main__':
    run()
