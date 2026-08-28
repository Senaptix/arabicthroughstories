#!/usr/bin/env python3
"""Master a human narration recording for the site.

For recordings read by a person. TTS pages are built by build-audio.py
instead, which synthesises line by line; this script never regenerates
anything — the recording already carries the authoritative pronunciation.

    raw take
      -> ClearVoice MossFormer2_SE_48K   speech enhancement, 48 kHz
      -> Praat PSOLA                     pitch, formants preserved
      -> ffmpeg                          EQ, de-ess, compress, loudnorm
      -> mp3                             96 kbps mono, the site's convention

What this deliberately does NOT do, and why:

  * No transcription, synthesis or voice cloning. The pronunciation in the
    take is the product — a graded reader teaching case endings cannot have
    a model second-guessing them.
  * No silence or filler removal. Pauses between Arabic sentences are the
    reader's, and an English-trained filler detector would hear an Arabic
    sound as an "um" and cut it.
  * No change of duration. Cues are measured against these files, and every
    stage here is length-preserving, so a re-master does not invalidate them
    (the pitch shift moves formants, not time).

Pitch: PSOLA rather than a phase vocoder. rubberband was tried first and
rejected by ear as sounding like a voice changer even with formants
preserved; PSOLA works on pitch periods directly and keeps the speaker
sounding like themselves. See AUDIO_PLAN.md in the book repo.

CALIBRATION, unresolved. The settings below were tuned against Yusuf 3-5,
which the reader had already edited in Audio Evolution — so the compressor
was acting on audio that had been levelled once already. Later takes are
expected to arrive raw. Raw is the better input (one processing stage, and
this chain levels every page identically, which is what evened the volume
across 3-5), but a compressor tuned on pre-flattened audio has more range
to act on than it was set for. Run the first raw take through and compare
against the approved sound before batching the rest.

Usage: python scripts/master-narration.py <slug> <page>=<take.wav> ...
  e.g. python scripts/master-narration.py yusuf 3=../raw/YusufPg3.wav
"""
import os
import shutil
import subprocess
import sys
import tempfile

SEMITONES = -1.0  # a deeper read; small on purpose, artefacts grow past ~2
BITRATE = "96k"   # mono spoken word — WEBSITE_BUILD.md's audio convention
LUFS = -16        # every page lands here, so volume is even across the book

MASTER = (
    "highpass=f=90,"                                    # rumble, mic handling
    "deesser=i=0.15,"                                   # sibilance
    "equalizer=f=3500:t=q:w=1.5:g=3,"                   # consonant clarity
    "acompressor=threshold=-18dB:ratio=3:attack=5:release=50,"
    f"loudnorm=I={LUFS}:TP=-1.5:LRA=11"                 # EBU R128
)

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def enhance(src, dest):
    """ClearVoice speech enhancement, via the community Space.

    The Alibaba original sits in RUNTIME_ERROR; mmwmm's fork is the one that
    runs. Local install needs torch + torchvision + opencv (~3 GB) and is the
    better home for this if the Space ever goes the same way.
    """
    from gradio_client import Client, handle_file

    token_file = os.path.expanduser("~/.hf_token")
    token = open(token_file).read().strip() if os.path.exists(token_file) else None
    client = Client("mmwmm/ClearVoice", token=token)
    out = client.predict(handle_file(src), "48000 Hz", api_name="/predict")
    shutil.copy(out if isinstance(out, str) else out[0], dest)


def shift_pitch(src, dest):
    import parselmouth
    from parselmouth.praat import call

    sound = parselmouth.Sound(src)
    pitch = call(sound, "To Pitch", 0.0, 75, 600)
    median = call(pitch, "Get quantile", 0, 0, 0.5, "Hertz")
    target = median * (2 ** (SEMITONES / 12))
    # "Change gender" with a formant ratio of 1.0 moves pitch alone.
    call(sound, "Change gender", 75, 600, 1.0, target, 1.0, 1.0).save(dest, "WAV")
    return median, target


def run(args):
    subprocess.run(args, check=True)


def duration(path):
    out = subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration",
         "-of", "csv=p=0", path],
        capture_output=True, text=True, check=True).stdout.strip()
    return float(out)


def main():
    if len(sys.argv) < 3:
        sys.exit(__doc__)
    slug = sys.argv[1]
    jobs = []
    for arg in sys.argv[2:]:
        page, _, path = arg.partition("=")
        if not path:
            sys.exit(f"expected <page>=<file>, got {arg!r}")
        if not os.path.exists(path):
            sys.exit(f"no such take: {path}")
        jobs.append((int(page), path))

    outdir = os.path.join(ROOT, "public", "audio", slug)
    os.makedirs(outdir, exist_ok=True)

    with tempfile.TemporaryDirectory() as tmp:
        for page, take in jobs:
            print(f"  page {page}  {os.path.basename(take)}", flush=True)
            before = duration(take)

            cleaned = os.path.join(tmp, f"p{page}_clean.wav")
            enhance(take, cleaned)
            print("    enhanced", flush=True)

            shifted = os.path.join(tmp, f"p{page}_pitch.wav")
            median, target = shift_pitch(cleaned, shifted)
            print(f"    pitch {median:.1f} -> {target:.1f} Hz", flush=True)

            out = os.path.join(outdir, f"p{page}.mp3")
            run(["ffmpeg", "-y", "-i", shifted, "-af", MASTER,
                 "-ac", "1", "-b:a", BITRATE, out, "-loglevel", "error"])

            after = duration(out)
            # Length must survive the chain or the committed cues are lies.
            if abs(after - before) > 0.05:
                sys.exit(f"page {page}: duration moved {before:.2f} -> {after:.2f}")
            print(f"    -> {os.path.relpath(out, ROOT)}  {after:.2f}s", flush=True)

    print("\nRe-measure cues before committing: "
          "npx tsx scripts/measure-timings.ts " + slug)


if __name__ == "__main__":
    main()
