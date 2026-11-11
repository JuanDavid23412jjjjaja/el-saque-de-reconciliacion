// world.js - Coliseo SBL: duela, cancha transformable (tradicional 18x9 -> sentado 10x6), red de altura
// variable (2.43 -> 1.15 m), pantalla LED, pendones con el logo, graderia, luces y efectos.
import { lerp, clamp, hash } from './lib.js';
const THREE = window.THREE;

const canvasTex = (w, h, draw, opts = {}) => {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const tex = new THREE.CanvasTexture(c);
  tex.encoding = THREE.sRGBEncoding; tex.anisotropy = 8;
  if (opts.repeat) { tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.repeat.set(opts.repeat[0], opts.repeat[1]); }
  return tex;
};

export class World {
  static lin(hex) { return new THREE.Color(hex).convertSRGBToLinear().getHex(); }
  constructor(scene, logoImg) {
    this.scene = scene; this.logo = logoImg;
    this.g = new THREE.Group(); scene.add(this.g);
    this._lights(); this._floor(); this._court(); this._net(); this._arena(); this._ball(); this._vfx();
    this.setCourt(1); this.setNet(1.15);
  }

  _lights() {
    const s = this.scene;
    s.add(new THREE.HemisphereLight(0xc4d6ff, 0x2a1c10, 0.52));
    const key = new THREE.DirectionalLight(0xfff0dc, 1.2);
    key.position.set(7, 13, 9); key.castShadow = true;
    key.shadow.mapSize.set(4096, 4096);
    const c = key.shadow.camera; c.near = 1; c.far = 40; c.left = -13; c.right = 13; c.top = 13; c.bottom = -13;
    key.shadow.bias = -0.0004; key.shadow.normalBias = 0.02; key.shadow.radius = 3;
    s.add(key); this.key = key;
    const rimC = new THREE.DirectionalLight(0x6fb4ff, 0.5); rimC.position.set(-8, 6, -7); s.add(rimC);
    const rimG = new THREE.DirectionalLight(0xffc860, 0.38); rimG.position.set(8, 5, -8); s.add(rimG);
    const front = new THREE.DirectionalLight(0xffffff, 0.22); front.position.set(0, 3, 10); s.add(front);
  }

  _floor() {
    const wood = canvasTex(1024, 1024, (x, w, h) => {
      x.fillStyle = '#b9824c'; x.fillRect(0, 0, w, h);
      const pw = w / 16;
      for (let i = 0; i < 16; i++) {
        let y = -hash(i * 7.3) * 300;
        let j = 0;
        while (y < h) {
          const len = 240 + hash(i * 13.1 + j * 3.7) * 260, tone = hash(i * 5.7 + j * 9.1);
          x.fillStyle = `hsl(${27 + tone * 7}, ${44 + tone * 12}%, ${50 + tone * 11}%)`;
          x.fillRect(i * pw, y, pw, len);
          x.fillStyle = 'rgba(60,30,10,0.35)'; x.fillRect(i * pw, y + len - 2, pw, 2);
          y += len; j++;
        }
        x.fillStyle = 'rgba(60,30,10,0.28)'; x.fillRect(i * pw, 0, 1.5, h);
      }
      for (let k = 0; k < 2600; k++) {               // veta
        x.fillStyle = `rgba(${hash(k) > .5 ? '255,235,200' : '70,35,10'},${0.03 + hash(k * 2.1) * 0.05})`;
        x.fillRect(hash(k * 1.3) * w, hash(k * 4.7) * h, 1, 20 + hash(k * 9.9) * 90);
      }
    }, { repeat: [7, 6] });
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(44, 34), new THREE.MeshStandardMaterial({ map: wood, roughness: 0.42, metalness: 0.02 }));
    floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; this.g.add(floor);
  }

  _court() {
    const flat = (color, y, rough = 0.5) => {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: 0.02 }));
      m.rotation.x = -Math.PI / 2; m.position.y = y; m.receiveShadow = true; this.g.add(m); return m;
    };
    this.free = flat(0x0f2a66, 0.002, 0.55);
    this.infield = flat(0x1c52c8, 0.004, 0.45);
    this.atkA = flat(0x1a46a8, 0.006, 0.45); this.atkB = flat(0x1a46a8, 0.006, 0.45);
    const lm = new THREE.MeshBasicMaterial({ color: 0xf4f7ff });
    const line = () => { const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), lm); m.rotation.x = -Math.PI / 2; m.position.y = 0.008; this.g.add(m); return m; };
    this.L = { sl: line(), sr: line(), ef: line(), eb: line(), c: line(), af: line(), ab: line() };
  }

  // k = 0 cancha tradicional (18 x 9, ataque a 3 m) ; k = 1 voleibol sentado (10 x 6, ataque a 2 m)
  setCourt(k) {
    const hw = lerp(4.5, 3, k), hl = lerp(9, 5, k), at = lerp(3, 2, k), w = 0.06;
    this.hw = hw; this.hl = hl; this.at = at;
    this.free.scale.set(hw * 2 + 5, hl * 2 + 5, 1);
    this.infield.scale.set(hw * 2, hl * 2, 1);
    this.atkA.scale.set(hw * 2, at, 1); this.atkA.position.z = at / 2;
    this.atkB.scale.set(hw * 2, at, 1); this.atkB.position.z = -at / 2;
    const L = this.L;
    L.sl.scale.set(w, hl * 2 + w, 1); L.sl.position.x = -hw; L.sr.scale.set(w, hl * 2 + w, 1); L.sr.position.x = hw;
    L.ef.scale.set(hw * 2 + w, w, 1); L.ef.position.z = hl; L.eb.scale.set(hw * 2 + w, w, 1); L.eb.position.z = -hl;
    L.c.scale.set(hw * 2, w, 1);
    L.af.scale.set(hw * 2, w, 1); L.af.position.z = at; L.ab.scale.set(hw * 2, w, 1); L.ab.position.z = -at;
    if (this.netH) this.setNet(this.netH);
  }

  _net() {
    const n = new THREE.Group(); this.g.add(n);
    const pm = new THREE.MeshStandardMaterial({ color: 0xaab6c8, metalness: 0.8, roughness: 0.25 });
    const pg = new THREE.CylinderGeometry(0.055, 0.055, 1, 14);
    this.postL = new THREE.Mesh(pg, pm); this.postR = new THREE.Mesh(pg, pm);
    const padM = new THREE.MeshStandardMaterial({ color: 0xd8102a, roughness: 0.6 });
    const padG = new THREE.CylinderGeometry(0.11, 0.11, 1, 14);
    this.padL = new THREE.Mesh(padG, padM); this.padR = new THREE.Mesh(padG, padM);
    this.netTex = canvasTex(128, 128, (x) => {
      x.clearRect(0, 0, 128, 128); x.strokeStyle = 'rgba(255,255,255,0.85)'; x.lineWidth = 5;
      x.strokeRect(0, 0, 128, 128);
    }, { repeat: [70, 9] });
    this.netMesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: this.netTex, transparent: true, opacity: 0.5, side: THREE.DoubleSide, depthWrite: false, color: 0xdfe8ff }));
    const bm = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.5 });
    this.band = new THREE.Mesh(new THREE.BoxGeometry(1, 0.07, 0.03), bm);
    this.bandLow = new THREE.Mesh(new THREE.BoxGeometry(1, 0.045, 0.025), bm);
    const antTex = canvasTex(8, 64, (x) => { for (let i = 0; i < 8; i++) { x.fillStyle = i % 2 ? '#ffffff' : '#e8102a'; x.fillRect(0, i * 8, 8, 8); } });
    const am = new THREE.MeshStandardMaterial({ map: antTex, roughness: 0.5 });
    const ag = new THREE.CylinderGeometry(0.014, 0.014, 1.8, 8);
    this.antL = new THREE.Mesh(ag, am); this.antR = new THREE.Mesh(ag, am);
    const sideM = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.5 });
    this.sideL = new THREE.Mesh(new THREE.BoxGeometry(0.05, 1, 0.02), sideM); this.sideR = new THREE.Mesh(new THREE.BoxGeometry(0.05, 1, 0.02), sideM);
    [this.postL, this.postR, this.padL, this.padR, this.band, this.bandLow, this.antL, this.antR, this.sideL, this.sideR].forEach(m => { m.castShadow = true; n.add(m); });
    n.add(this.netMesh);
  }

  setNet(h) {
    this.netH = h;
    const hw = this.hw, px = hw + 0.75, nh = 0.95, w = hw * 2 + 0.6;
    for (const [p, pad, s] of [[this.postL, this.padL, -1], [this.postR, this.padR, 1]]) {
      p.scale.y = h + 0.12; p.position.set(s * px, (h + 0.12) / 2, 0);
      const ph = Math.min(1.6, h * 0.75); pad.scale.y = ph; pad.position.set(s * px, ph / 2 + 0.02, 0);
    }
    this.netMesh.scale.set(w + 0.9, nh, 1); this.netMesh.position.set(0, h - nh / 2, 0);
    this.netTex.repeat.set((w + 0.9) * 9, nh * 9);
    this.band.scale.x = w + 0.9; this.band.position.set(0, h - 0.035, 0);
    this.bandLow.scale.x = w + 0.9; this.bandLow.position.set(0, h - nh, 0);
    this.antL.position.set(-hw, h - 0.1, 0.02); this.antR.position.set(hw, h - 0.1, 0.02);
    this.sideL.scale.y = nh; this.sideL.position.set(-hw, h - nh / 2, 0); this.sideR.scale.y = nh; this.sideR.position.set(hw, h - nh / 2, 0);
  }

  _arena() {
    const g = this.g, logo = this.logo;
    const wallM = new THREE.MeshStandardMaterial({ color: 0x101c3c, roughness: 0.9 });
    const wall = (w, h, x, y, z, ry) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), wallM); m.position.set(x, y, z); m.rotation.y = ry; g.add(m); return m; };
    wall(44, 13, 0, 6.5, -16, 0); wall(44, 13, 0, 6.5, 16, Math.PI); wall(34, 13, -19, 6.5, 0, Math.PI / 2); wall(34, 13, 19, 6.5, 0, -Math.PI / 2);
    const stripe = (color, y, hgt) => {
      const m = new THREE.MeshStandardMaterial({ color, roughness: 0.7 });
      const mk = (w, x, z, ry) => { const b = new THREE.Mesh(new THREE.PlaneGeometry(w, hgt), m); b.position.set(x, y, z); b.rotation.y = ry; g.add(b); };
      mk(44, 0, -15.97, 0); mk(44, 0, 15.97, Math.PI); mk(34, -18.97, 0, Math.PI / 2); mk(34, 18.97, 0, -Math.PI / 2);
    };
    stripe(0xd8102a, 1.55, 0.7); stripe(0xf2f4f8, 2.0, 0.16); stripe(0x77787b, 1.12, 0.14);
    const ceil = new THREE.Mesh(new THREE.PlaneGeometry(44, 34), new THREE.MeshBasicMaterial({ color: 0x05070d }));
    ceil.rotation.x = Math.PI / 2; ceil.position.y = 13; g.add(ceil);

    // Pantalla LED (su contenido lo dibuja overlay.js cada fotograma)
    this.boardCanvas = document.createElement('canvas'); this.boardCanvas.width = 1280; this.boardCanvas.height = 720;
    this.boardTex = new THREE.CanvasTexture(this.boardCanvas); this.boardTex.encoding = THREE.sRGBEncoding; this.boardTex.anisotropy = 8;
    const board = new THREE.Mesh(new THREE.PlaneGeometry(10.4, 5.85), new THREE.MeshBasicMaterial({ map: this.boardTex, toneMapped: false }));
    board.position.set(0, 5.6, -15.6); g.add(board); this.board = board;
    const frame = new THREE.Mesh(new THREE.BoxGeometry(10.9, 6.35, 0.3), new THREE.MeshStandardMaterial({ color: 0x0a0d14, roughness: 0.4, metalness: 0.6 }));
    frame.position.set(0, 5.6, -15.8); g.add(frame);
    const glow = new THREE.Mesh(new THREE.PlaneGeometry(16, 9), new THREE.MeshBasicMaterial({ map: canvasTex(64, 64, (x) => {
      const gr = x.createRadialGradient(32, 32, 4, 32, 32, 32); gr.addColorStop(0, 'rgba(90,150,255,0.55)'); gr.addColorStop(1, 'rgba(90,150,255,0)');
      x.fillStyle = gr; x.fillRect(0, 0, 64, 64);
    }), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
    glow.position.set(0, 5.6, -15.9); g.add(glow);

    // Pendones con el logo del colegio
    const banner = canvasTex(512, 1024, (x, w, h) => {
      x.fillStyle = '#ffffff'; x.fillRect(0, 0, w, h);
      x.fillStyle = '#e8102a'; x.fillRect(0, h - 190, w, 190); x.fillStyle = '#77787b'; x.fillRect(0, h - 206, w, 16);
      const lw = 440, lh = lw * logo.height / logo.width; x.drawImage(logo, (w - lw) / 2, 250, lw, lh);
      x.fillStyle = '#ffffff'; x.textAlign = 'center'; x.font = 'italic 900 78px "Barlow Condensed"'; x.fillText('GRADO 10°', w / 2, h - 96);
      x.font = '700 30px "JetBrains Mono"'; x.fillText('CICLO PROYECTIVO 2026', w / 2, h - 46);
      x.fillStyle = '#e8102a'; x.fillRect(0, 0, w, 26);
    });
    for (const sx of [-8.6, 8.6]) {
      const b = new THREE.Mesh(new THREE.PlaneGeometry(2.9, 5.8), new THREE.MeshStandardMaterial({ map: banner, roughness: 0.8 }));
      b.position.set(sx, 5.6, -15.9); g.add(b);
    }
    const words = ['COOPERACIÓN', 'EMPATÍA', 'INCLUSIÓN', 'RESPETO', 'RECONCILIACIÓN', 'EQUIPO'];
    words.forEach((wd, i) => {
      const tex = canvasTex(256, 1024, (x, w, h) => {
        x.fillStyle = i % 2 ? '#0f2a66' : '#e8102a'; x.fillRect(0, 0, w, h);
        x.fillStyle = '#ffd21f'; x.fillRect(0, 0, w, 20); x.fillRect(0, h - 20, w, 20);
        x.save(); x.translate(w / 2 + 34, h / 2); x.rotate(-Math.PI / 2);
        x.fillStyle = '#ffffff'; x.textAlign = 'center'; x.font = 'italic 900 118px "Barlow Condensed"'; x.fillText(wd, 0, 0); x.restore();
      });
      const side = i < 3 ? -1 : 1, k = i % 3;
      const b = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 6), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.85 }));
      b.position.set(side * 18.9, 6.4, -8 + k * 8); b.rotation.y = -side * Math.PI / 2; g.add(b);
    });

    // Graderia (pared frontal)
    const stepM = new THREE.MeshStandardMaterial({ color: 0x1a2236, roughness: 0.85 });
    const seatG = new THREE.BoxGeometry(0.62, 0.1, 0.5), backG = new THREE.BoxGeometry(0.62, 0.42, 0.08);
    const cols = [0xd8102a, 0xd8102a, 0x8a8c90, 0xf0f2f6];
    const seatMats = cols.map(c => new THREE.MeshStandardMaterial({ color: c, roughness: 0.6 }));
    const rows = 6, per = 34;
    const inst = seatMats.map(m => [new THREE.InstancedMesh(seatG, m, rows * per), new THREE.InstancedMesh(backG, m, rows * per)]);
    const cnt = [0, 0, 0, 0], mtx = new THREE.Matrix4();
    for (let r = 0; r < rows; r++) {
      const y = 0.45 * (r + 1), z = 11.2 + r * 0.82;
      const st = new THREE.Mesh(new THREE.BoxGeometry(30, y, 0.82), stepM); st.position.set(0, y / 2, z); st.receiveShadow = true; g.add(st);
      for (let i = 0; i < per; i++) {
        const x = (i - (per - 1) / 2) * 0.8, block = Math.floor(i / 6) + r;
        const ci = Math.floor(hash(block * 3.1) * 4) % 4, n = cnt[ci]++;
        mtx.makeTranslation(x, y + 0.06, z - 0.05); inst[ci][0].setMatrixAt(n, mtx);
        mtx.makeTranslation(x, y + 0.3, z + 0.22); inst[ci][1].setMatrixAt(n, mtx);
      }
    }
    inst.forEach(([a, b], i) => { a.count = b.count = cnt[i]; g.add(a, b); });

    // Bancas laterales
    for (const sx of [-1, 1]) {
      const bench = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.42, 5), new THREE.MeshStandardMaterial({ color: 0xe9edf5, roughness: 0.6 }));
      bench.position.set(sx * 9.2, 0.21, 0); bench.castShadow = true; bench.receiveShadow = true; g.add(bench);
    }

    // Cerchas, luminarias y conos de luz
    const trussM = new THREE.MeshStandardMaterial({ color: 0x1b2130, roughness: 0.6, metalness: 0.5 });
    const coneTex = canvasTex(8, 128, (x) => { const gr = x.createLinearGradient(0, 0, 0, 128); gr.addColorStop(0, 'rgba(255,255,255,0.0)'); gr.addColorStop(0.08, 'rgba(255,255,255,0.9)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = gr; x.fillRect(0, 0, 8, 128); });
    const coneM = new THREE.MeshBasicMaterial({ map: coneTex, color: 0xbfd6ff, transparent: true, opacity: 0.05, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
    const lampM = new THREE.MeshBasicMaterial({ color: 0xffffff });
    for (const z of [-9, -3, 3, 9]) {
      const tr = new THREE.Mesh(new THREE.BoxGeometry(34, 0.35, 0.35), trussM); tr.position.set(0, 11.2, z); g.add(tr);
      for (const x of [-9, -3, 3, 9]) {
        const lamp = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.12, 0.7), lampM); lamp.position.set(x, 10.95, z); g.add(lamp);
        const cone = new THREE.Mesh(new THREE.ConeGeometry(3.4, 11, 20, 1, true), coneM); cone.position.set(x, 5.5, z); g.add(cone);
      }
    }
  }

  _ball() {
    const tex = canvasTex(512, 256, (x, w, h) => {
      x.fillStyle = '#ffd21f'; x.fillRect(0, 0, w, h);
      for (let k = 0; k < 3; k++) {
        x.beginPath();
        for (let i = 0; i <= w; i += 4) { const y = h * (0.2 + k * 0.3) + Math.sin(i / w * Math.PI * 4 + k * 2) * 34; i ? x.lineTo(i, y) : x.moveTo(i, y); }
        for (let i = w; i >= 0; i -= 4) { const y = h * (0.2 + k * 0.3) + Math.sin(i / w * Math.PI * 4 + k * 2) * 34 + 36; x.lineTo(i, y); }
        x.closePath(); x.fillStyle = k === 1 ? '#f6f8ff' : '#1747c0'; x.fill();
      }
    });
    this.ball = new THREE.Group();
    this.ballMesh = new THREE.Mesh(new THREE.IcosahedronGeometry(0.115, 2), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.42, flatShading: true }));
    this.ballMesh.castShadow = true; this.ball.add(this.ballMesh); this.scene.add(this.ball);
    this.trail = [];
    const tg = new THREE.SphereGeometry(0.1, 10, 8);
    for (let i = 0; i < 14; i++) {
      const m = new THREE.Mesh(tg, new THREE.MeshBasicMaterial({ color: i < 5 ? 0xfff0a0 : 0x7fdcff, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }));
      this.scene.add(m); this.trail.push(m);
    }
  }

  _vfx() {
    this.rings = [];
    const rg = new THREE.RingGeometry(0.86, 1, 48);
    for (let i = 0; i < 8; i++) {
      const m = new THREE.Mesh(rg, new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
      m.rotation.x = -Math.PI / 2; m.position.y = 0.02; m.visible = false; this.scene.add(m); this.rings.push(m);
    }
    this.discs = [];
    const dg = new THREE.CircleGeometry(1, 40);
    for (let i = 0; i < 3; i++) {
      const m = new THREE.Mesh(dg, new THREE.MeshBasicMaterial({ color: 0x35f0a0, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }));
      m.rotation.x = -Math.PI / 2; m.position.y = 0.015; m.visible = false; this.scene.add(m); this.discs.push(m);
    }
  }
  resetVfx() { for (const r of this.rings) r.visible = false; for (const d of this.discs) d.visible = false; this._ri = 0; }
  ring(x, z, radius, opacity, color = 0xffffff) {
    color = World.lin(color);
    if (opacity <= 0.003 || this._ri >= this.rings.length) return;
    const r = this.rings[this._ri++]; r.visible = true; r.position.x = x; r.position.z = z; r.scale.setScalar(radius);
    r.material.opacity = clamp(opacity); r.material.color.setHex(color);
  }
  disc(i, x, z, radius, opacity) { const d = this.discs[i]; d.visible = opacity > 0.003; d.position.x = x; d.position.z = z; d.scale.setScalar(radius); d.material.opacity = opacity; }
}
