"""Packs galileo-embed.zip: galileo.js with the engine and libraries, to keep next to
your own pages (or on a USB stick). Its example.html loads the copy next to it."""
import pathlib
import sys
import zipfile

embed = pathlib.Path(sys.argv[1])
names = ["galileo.js", "galileo.wasm", "galileo.wasm.js"]
with zipfile.ZipFile(embed / "galileo-embed.zip", "w", zipfile.ZIP_DEFLATED) as z:
    for n in names:
        z.write(embed / n, "galileo/" + n)
    for f in sorted((embed / "vendor").rglob("*")):
        if f.is_file():
            z.write(f, "galileo/" + f.relative_to(embed).as_posix())
    page = (embed / "example.html").read_text()
    page = page.replace("https://cascala.github.io/igalileo/embed/galileo.js", "galileo.js")
    z.writestr("galileo/example.html", page)
print((embed / "galileo-embed.zip").stat().st_size // 1024, "KB")
