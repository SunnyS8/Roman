""" Silero TTS: generate speech from text, output WAV to stdout (unbuffered) """

import sys
import os
import wave
import io

# Use TEMP (8.3 short path, no Cyrillic) for torch cache
_cache_dir = os.path.join(os.environ["TEMP"], "silero_cache")
os.makedirs(_cache_dir, exist_ok=True)
os.environ["TORCH_HOME"] = _cache_dir

import torch
torch.hub.set_dir(os.path.join(_cache_dir, "hub"))


def main():
    if len(sys.argv) < 2:
        sys.stderr.write("Usage: python silero-tts.py <text> [speaker]\n")
        sys.exit(1)

    text = sys.argv[1]
    speaker = sys.argv[2] if len(sys.argv) > 2 else "baya"

    sys.stderr.flush()

    try:
        model, example_text = torch.hub.load(
            repo_or_dir="snakers4/silero-models",
            model="silero_tts",
            language="ru",
            speaker="v3_1_ru",
            trust_repo="force",
        )
        model.to("cpu")

        audio = model.apply_tts(
            text=text,
            speaker=speaker,
            sample_rate=48000,
        )

        audio_np = (audio * 32767).to(torch.int16).cpu().numpy()

        buf = io.BytesIO()
        with wave.open(buf, "wb") as wf:
            wf.setnchannels(1)
            wf.setsampwidth(2)
            wf.setframerate(48000)
            wf.writeframes(audio_np.tobytes())

        sys.stdout.buffer.write(buf.getvalue())
        sys.stdout.buffer.flush()
    except Exception:
        import traceback
        traceback.print_exc(file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
