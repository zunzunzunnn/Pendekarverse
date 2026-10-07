import base64, io, math, os, re, json, urllib.request
from PIL import Image

FILES = {
 "sleep1":"1MNqtXeGksDcfkVF4980zvU_06a_VkPpp","sleep2":"1AZSBdGggNFQtNo-8Gy9uVblfmzfa1qxt",
 "sleep3":"1rsg6AOMjh9nY7lwZ5_lX_1XRQnCRGSLG","sleep4":"1rhFez_wRtoLRN6BhRcmXPMXKJd22Umm8",
 "eat1":"1LSC4b6jtlGt14fUqSp7wHRrT1SFSlAdJ","eat2":"17lNGAUBtykxjotgTYqx6TL3E9XtsWU62",
 "eat3":"15J6r_2-YGFsRIxYb6G3l_8o7ekjrQ1vj","eat4":"1VkBaby5_wTKqZEK2Y5taiy7MIuEg0F1a",
 "trans12":"1-NcK4aSIQoP3eoOfmlzZpXaX5ZnIGBme","trans23":"1Q-RZiBp4J9qz6TuOasCfke-VTqec4tLs",
 "trans34":"1XsMcFjnQF7wUN73j2OFQZw-wrzOf8fJ4","trans45":"1kWuyPpR0c3GXefjKdCkA_fABFES2ALe0"
}
OUT="public/gimmy/sprites2"; os.makedirs(OUT,exist_ok=True)
manifest={}
pat=re.compile(r'"base64"\s*:\s*"data:image/png;base64,([^"]+)"')
for name,fid in FILES.items():
    src=f"/tmp/{name}.json"
    url=f"https://drive.usercontent.google.com/download?id={fid}&export=download&confirm=t"
    print("Downloading",name,flush=True); urllib.request.urlretrieve(url,src)
    count=0
    with open(src,"r",encoding="utf-8") as f:
        for line in f:
            if '"base64"' in line: count += 1
    if not count: raise RuntimeError(f"No frames found in {name}")
    fw=fh=384; cols=8; rows=math.ceil(count/cols)
    sheet=Image.new("RGBA",(cols*fw,rows*fh),(0,0,0,0)); first=None; idx=0
    with open(src,"r",encoding="utf-8") as f:
        for line in f:
            if '"base64"' not in line: continue
            m=pat.search(line)
            if not m: continue
            im=Image.open(io.BytesIO(base64.b64decode(m.group(1)))).convert("RGBA")
            im.thumbnail((fw,fh),Image.Resampling.LANCZOS)
            frame=Image.new("RGBA",(fw,fh),(0,0,0,0))
            frame.alpha_composite(im,((fw-im.width)//2,(fh-im.height)//2))
            if first is None: first=frame.copy()
            sheet.alpha_composite(frame,((idx%cols)*fw,(idx//cols)*fh)); idx+=1
    if idx != count: raise RuntimeError(f"{name}: expected {count}, decoded {idx}")
    sheet.save(f"{OUT}/{name}.webp","WEBP",quality=82,method=4)
    first.save(f"{OUT}/{name}-still.webp","WEBP",quality=88,method=4)
    manifest[name]={"width":fw,"height":fh,"count":count,"cols":cols,"fps":24}
    os.remove(src); print(name,count,flush=True)
with open("src/gimmy/sprite-manifest2.json","w") as f: json.dump(manifest,f,indent=2)
