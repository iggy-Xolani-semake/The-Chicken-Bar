from pathlib import Path
from PIL import Image

project_root = Path("/home/ubuntu/the-chicken-bar")
source_path = project_root / "public/admin/icon-source.png"
output_dir = project_root / "public/admin"

source = Image.open(source_path).convert("RGBA")
for name, size in (("icon-192.png", 192), ("icon-512.png", 512), ("icon-maskable-512.png", 512)):
    resized = source.resize((size, size), Image.Resampling.LANCZOS)
    resized.save(output_dir / name, format="PNG", optimize=True)
