#!/usr/bin/env python3
"""Build a page's narration one line at a time, then join them.

Long input makes the TTS engine degrade: on a whole page it mangles the
ending of the word before a full stop (إِخْوَتِهِ came out "ikhwataha").
The same line on its own is read correctly. So each line is synthesised
separately and the clips are concatenated.

The cues fall out of that for free. Because each line is its own clip, its
start is the sum of the lengths before it — arithmetic, not a guess. That
replaces measure-timings.ts's silence detection, which is wrong about one
time in four and needs an ear every round.

Usage: python scripts/build-audio.py <slug> <page> [<page> ...]
"""
import json, os, re, subprocess, sys, tempfile, urllib.request

SPACE = "https://nightprince-fasih-tts.hf.space"
GAP = 0.45          # seconds of silence between lines
TEMPERATURE = 0.3   # lower tracks the supplied tashkeel more closely
TOKEN_FILE = os.path.expanduser("~/.hf_token")
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def headers():
    h = {"Content-Type": "application/json"}
    if os.path.exists(TOKEN_FILE):
        h["Authorization"] = f"Bearer {open(TOKEN_FILE).read().strip()}"
    return h


def page_lines(slug, page):
    """The Arabic lines of one page, from the '## Page N' block."""
    md = open(os.path.join(ROOT, "content", "data", f"{slug}.pages.md"), encoding="utf-8").read()
    m = re.search(rf"^## Page {page}\s*$(.*?)(?=^## Page |\Z)", md, re.M | re.S)
    if not m:
        sys.exit(f"page {page} not found in {slug}.pages.md")
    return [l[1:].strip() for l in m.group(1).splitlines() if l.startswith(">") and l[1:].strip()]


def synth(text, dest):
    body = json.dumps({"data": [text, False, TEMPERATURE]}).encode()
    req = urllib.request.Request(f"{SPACE}/gradio_api/call/predict", data=body, headers=headers())
    eid = json.loads(urllib.request.urlopen(req, timeout=180).read())["event_id"]
    req2 = urllib.request.Request(f"{SPACE}/gradio_api/call/predict/{eid}", headers=headers())
    url = None
    with urllib.request.urlopen(req2, timeout=600) as r:
        for raw in r:
            line = raw.decode("utf-8", "replace").strip()
            if line.startswith("data:"):
                p = line[5:].strip()
                if p and p != "null":
                    d = json.loads(p)
                    if isinstance(d, dict) and "error" in d:
                        sys.exit(f"TTS error: {str(d['error'])[:200]}")
                    url = d[0]["url"] if isinstance(d, list) else d["url"]
                    break
    if not url:
        sys.exit("no audio returned")
    urllib.request.urlretrieve(url, dest)


def duration(path):
    out = subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", path],
        capture_output=True, text=True, check=True).stdout.strip()
    return float(out)


def build(slug, page, tmp):
    lines = page_lines(slug, page)
    parts, cues, at = [], [], 0.0
    for i, line in enumerate(lines):
        wav = os.path.join(tmp, f"{slug}_p{page}_{i:02d}.wav")
        synth(line, wav)
        cues.append(round(at, 2))
        at += duration(wav) + GAP
        parts.append(wav)
        print(f"    line {i + 1}/{len(lines)}  {duration(wav):5.2f}s", flush=True)

    silence = os.path.join(tmp, "gap.wav")
    subprocess.run(["ffmpeg", "-y", "-f", "lavfi", "-i",
                    f"anullsrc=r=24000:cl=mono:d={GAP}", silence, "-loglevel", "error"], check=True)

    listfile = os.path.join(tmp, f"list_p{page}.txt")
    with open(listfile, "w", encoding="utf-8") as f:
        for i, p in enumerate(parts):
            if i:
                f.write(f"file '{silence}'\n")
            f.write(f"file '{p}'\n")

    outdir = os.path.join(ROOT, "public", "audio", slug)
    os.makedirs(outdir, exist_ok=True)
    out = os.path.join(outdir, f"p{page}.mp3")
    subprocess.run(["ffmpeg", "-y", "-f", "concat", "-safe", "0", "-i", listfile,
                    "-ac", "1", "-b:a", "96k", out, "-loglevel", "error"], check=True)
    return cues, out


def main():
    if len(sys.argv) < 3:
        sys.exit(__doc__)
    slug, pages = sys.argv[1], [int(p) for p in sys.argv[2:]]
    tfile = os.path.join(ROOT, "content", "data", f"{slug}.timings.json")
    timings = json.load(open(tfile, encoding="utf-8")) if os.path.exists(tfile) else {}

    with tempfile.TemporaryDirectory() as tmp:
        for page in pages:
            print(f"  page {page}", flush=True)
            cues, out = build(slug, page, tmp)
            timings[str(page)] = cues
            print(f"    -> {os.path.relpath(out, ROOT)}  cues={cues}", flush=True)

    ordered = {k: timings[k] for k in sorted(timings, key=int)}
    with open(tfile, "w", encoding="utf-8") as f:
        json.dump(ordered, f, ensure_ascii=False, indent=1)
        f.write("\n")
    print(f"wrote {os.path.relpath(tfile, ROOT)}")


if __name__ == "__main__":
    main()
