""" Debug model loading """
import sys
import os

_cache_dir = os.path.join(os.environ["TEMP"], "silero_cache")
os.makedirs(_cache_dir, exist_ok=True)
os.environ["TORCH_HOME"] = _cache_dir

import torch
torch.hub.set_dir(os.path.join(_cache_dir, "hub"))

try:
    model, example_text = torch.hub.load(
        repo_or_dir="snakers4/silero-models",
        model="silero_tts",
        language="ru",
        speaker="v3_1_ru",
        trust_repo="force",
    )
    print(f"Model type: {type(model)}", file=sys.stderr)
    print(f"Example text: {example_text}", file=sys.stderr)
    print(f"Has apply_tts: {hasattr(model, 'apply_tts')}", file=sys.stderr)
    print(f"Dir model: {[a for a in dir(model) if not a.startswith('_')]}", file=sys.stderr)
    sys.stderr.flush()
except Exception as e:
    print(f"FAIL: {e}", file=sys.stderr)
    import traceback
    traceback.print_exc(file=sys.stderr)
    sys.exit(1)
