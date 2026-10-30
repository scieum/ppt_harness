import concurrent.futures,subprocess,os
node='/Users/keemhayeon/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node'
env={**os.environ,'RUNTIME_NODE_MODULES':'/Users/keemhayeon/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules','HESS_RENDER_ONLY':'1'}
def run(n):
 with open(f'/private/tmp/render31-{n}.log','w') as f:
  r=subprocess.run([node,'units/3-02_헤스법칙/drafts/full-v01/build/build.mjs'],env={**env,'HESS_ONLY_SLIDE':str(n)},stdout=f,stderr=f)
 return n,r.returncode
with concurrent.futures.ThreadPoolExecutor(max_workers=3) as pool:
 for n,c in pool.map(run,[8,9,16,17,19,22,26,27,28,36,42,44,45,46,47,48,49,50]):print(n,c,flush=True)
