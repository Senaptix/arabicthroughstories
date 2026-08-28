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


_MODEL = None


def enhance(src, dest):
    """ClearVoice speech enhancement — MossFormer2_SE_48K, run locally.

    Was called through the community Space. It stopped returning audio
    mid-batch: HTTP answered in under a second while the job never came back,
    and the Alibaba original had already been sitting in RUNTIME_ERROR. Two of
    the three hosted enhancers tried for this pipeline failed the same way, so
    the model runs here now. The checkpoint downloads once (~200 MB, cached in
    ~/.cache/huggingface) and nothing about the sound changes — same model,
    same weights.

    Slower than a GPU Space when that Space is healthy. That is the trade: a
    minute or two per page against a dependency that can vanish mid-book.
    """
    global _MODEL
    import tempfile

    from clearvoice import ClearVoice

    if _MODEL is None:
        _MODEL = ClearVoice(
            task="speech_enhancement", model_names=["MossFormer2_SE_48K"]
        )

    # output_path is a DIRECTORY, not a file: the result lands at
    # <dir>/<model>/<input filename>, keeping the input's extension whatever
    # the content is. Paths are absolutised — a relative one resolves against
    # the library's cwd rather than ours, and the file appears elsewhere.
    with tempfile.TemporaryDirectory() as staging:
        _MODEL(
            input_path=os.path.abspath(src),
            online_write=True,
            output_path=staging,
        )
        produced = os.path.join(
            staging, "MossFormer2_SE_48K", os.path.basename(src)
        )
        if not os.path.exists(produced):
            found = [
                os.path.join(r, f) for r, _, fs in os.walk(staging) for f in fs
            ]
            raise RuntimeError(
                f"ClearVoice wrote nothing for {src}; staging held {found}"
            )
        # Transcode rather than copy: the file carries the input's extension
        # regardless of content, so a copy to dest.wav leaves MP3 bytes behind
        # a .wav name and Praat refuses to open it. Fold to mono here too —
        # Praat's pitch shift takes mono only, and the page ships mono.
        subprocess.run(
            ["ffmpeg", "-y", "-i", produced, "-ac", "1", dest, "-loglevel", "error"],
            check=True,
        )


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
