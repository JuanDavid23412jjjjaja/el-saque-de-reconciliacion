"""
render.py - Render offline determinista con Chromium (Playwright) + ffmpeg.

    python render.py shots 12.5 40 88.2        -> guarda fotogramas de revision en out/shots/
    python render.py seg  <t0> <t1> <archivo>  -> renderiza un tramo a mp4 (sin audio)
    python render.py video [workers]           -> render completo en paralelo + mezcla con out/mix.wav
"""
import asyncio, base64, functools, http.server, os, subprocess, sys, threading, time
from playwright.async_api import async_playwright

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "out")
import json, re
FPS, PORT = 30, 8147
DUR = float(re.search(r'"dur":([0-9.]+)', open(os.path.join(HERE, "timeline.js"), encoding="utf8").read()).group(1))
FINAL = os.path.join(OUT, "Nagahiro_Video_Debate.mp4")


def serve(port):
    class Quiet(http.server.SimpleHTTPRequestHandler):
        def log_message(self, *a, **k):
            pass
    handler = functools.partial(Quiet, directory=HERE)
    srv = http.server.ThreadingHTTPServer(("127.0.0.1", port), handler)
    srv.daemon_threads = True
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    return srv


async def open_page(pw, port):
    br = await pw.chromium.launch(headless=True, args=[
        "--use-angle=d3d11", "--enable-gpu", "--ignore-gpu-blocklist", "--enable-webgl",
        "--disable-gpu-vsync", "--force-device-scale-factor=1"])
    page = await br.new_page(viewport={"width": 1920, "height": 1080})
    page.on("console", lambda m: print("  [js]", m.text) if m.type in ("error", "warning") else None)
    page.on("pageerror", lambda e: print("  [pageerror]", e))
    await page.goto(f"http://127.0.0.1:{port}/index.html?render=1")
    await page.wait_for_function("window.READY === true || window.BOOT_ERROR", timeout=120000)
    err = await page.evaluate("window.BOOT_ERROR || ''")
    if err:
        raise SystemExit("BOOT_ERROR: " + err)
    return br, page


GPU_JS = """(() => { const g = document.createElement('canvas').getContext('webgl');
  const e = g.getExtension('WEBGL_debug_renderer_info'); return e ? g.getParameter(e.UNMASKED_RENDERER_WEBGL) : '?'; })()"""


async def shots(times):
    srv = serve(PORT)
    os.makedirs(os.path.join(OUT, "shots"), exist_ok=True)
    async with async_playwright() as pw:
        br, page = await open_page(pw, PORT)
        print("GPU:", await page.evaluate(GPU_JS))
        for t in times:
            t0 = time.time()
            b64 = await page.evaluate("t => window.frame(t, 0.9)", t)
            p = os.path.join(OUT, "shots", f"f_{t:07.2f}.jpg")
            with open(p, "wb") as f:
                f.write(base64.b64decode(b64))
            print(f"  {t:7.2f}s -> {os.path.basename(p)} ({time.time() - t0:.2f}s)")
        await br.close()
    srv.shutdown()


async def segment(t0, t1, path, port=PORT):
    srv = serve(port)
    f0, f1 = round(t0 * FPS), round(t1 * FPS)
    ff = subprocess.Popen(["ffmpeg", "-y", "-v", "error", "-f", "image2pipe", "-framerate", str(FPS), "-c:v", "mjpeg", "-i", "-",
                           "-c:v", "libx264", "-preset", "medium", "-crf", "16", "-pix_fmt", "yuv420p", "-r", str(FPS), path],
                          stdin=subprocess.PIPE)
    async with async_playwright() as pw:
        br, page = await open_page(pw, port)
        st = time.time()
        for f in range(f0, f1):
            b64 = await page.evaluate("t => window.frame(t)", f / FPS)
            ff.stdin.write(base64.b64decode(b64))
            if (f - f0) % 150 == 0:
                print(f"  [{os.path.basename(path)}] {f - f0}/{f1 - f0}  {(f - f0) / max(1e-3, time.time() - st):.1f} fps", flush=True)
        await br.close()
    ff.stdin.close()
    ff.wait()
    srv.shutdown()


def video(workers):
    os.makedirs(os.path.join(OUT, "segs"), exist_ok=True)
    step = DUR / workers
    procs = []
    for i in range(workers):
        p = os.path.join(OUT, "segs", f"seg_{i:02d}.mp4")
        procs.append(subprocess.Popen([sys.executable, os.path.abspath(__file__), "seg",
                                       f"{i * step:.6f}", f"{(i + 1) * step:.6f}", p, str(PORT + 1 + i)]))
    codes = [p.wait() for p in procs]
    if any(codes):
        raise SystemExit(f"fallo un segmento: {codes}")
    lst = os.path.join(OUT, "segs", "list.txt")
    with open(lst, "w") as f:
        f.write("".join(f"file 'seg_{i:02d}.mp4'\n" for i in range(workers)))
    subprocess.run(["ffmpeg", "-y", "-v", "error", "-f", "concat", "-safe", "0", "-i", lst, "-i", os.path.join(OUT, "mix.wav"),
                    "-c:v", "copy", "-c:a", "aac", "-b:a", "256k", "-shortest", "-movflags", "+faststart", FINAL], check=True)
    print("VIDEO FINAL:", FINAL)


def sheet(name, times):
    """hoja de contactos 3x3 para revisar muchos fotogramas de un vistazo"""
    asyncio.run(shots(times))
    d = os.path.join(OUT, "shots")
    lst = os.path.join(d, "_l.txt")
    with open(lst, "w") as f:
        f.write("".join("file 'f_%07.2f.jpg'" % t + chr(10) for t in times))
    subprocess.run(["ffmpeg", "-y", "-v", "error", "-f", "concat", "-safe", "0", "-i", lst, "-vf",
                    "scale=640:360,tile=3x3", "-frames:v", "1", "-q:v", "3", os.path.join(d, f"sheet_{name}.jpg")], check=True)


if __name__ == "__main__":
    cmd = sys.argv[1]
    if cmd == "shots":
        asyncio.run(shots([float(x) for x in sys.argv[2:]]))
    elif cmd == "seg":
        asyncio.run(segment(float(sys.argv[2]), float(sys.argv[3]), sys.argv[4], int(sys.argv[5]) if len(sys.argv) > 5 else PORT))
    elif cmd == "sheet":
        sheet(sys.argv[2], [float(x) for x in sys.argv[3:]])
    elif cmd == "video":
        video(int(sys.argv[2]) if len(sys.argv) > 2 else 4)
