""" Test Silero model loading """
import os
import sys
import torch

# Get user profile from env
home = os.environ.get("USERPROFILE", "")
print(f"USERPROFILE env: {repr(home)}", file=sys.stderr)

hub_dir = os.path.join(home, ".cache", "torch", "hub")
model_path = os.path.join(
    hub_dir,
    "snakers4_silero-models_master",
    "src", "silero", "model", "v3_1_ru.pt",
)
print(f"Model path: {repr(model_path)}", file=sys.stderr)
print(f"Exists: {os.path.isfile(model_path)}", file=sys.stderr)

# Try to read first few bytes
with open(model_path, "rb") as f:
    header = f.read(4)
    print(f"Header bytes: {header.hex()}", file=sys.stderr)

sys.stderr.flush()

try:
    imp = torch.package.PackageImporter(model_path)
    model = imp.load_pickle("tts_models", "model")
    print("OK", file=sys.stderr)
except Exception as e:
    print(f"FAIL: {e}", file=sys.stderr)
    sys.exit(1)
