// debaters.js - Samuel y Tomas: mismos principios low-poly de characters.js (mismo esqueleto que usa rig.js),
// con atuendo de debate: blazer azul noche con escudo SBL, camisa blanca, corbata roja SBL y pantalon gris.
import { CharacterBuilder } from './characters.js';

export class DebateBuilder extends CharacterBuilder {
  constructor(THREE, logo) {
    super(THREE);
    const M = (c, r = 0.6, o = {}) => new THREE.MeshStandardMaterial(Object.assign({ color: c, roughness: r, flatShading: true }, o));
    this.logo = logo;
    Object.assign(this.mats, {
      skinSam: M(0xe9b58f, 0.55), skinTom: M(0xd9a27a, 0.55),
      hairSam: M(0x141012, 0.7), hairTom: M(0x3b2416, 0.75),
      blazer: M(0x16213d, 0.7), blazerDark: M(0x0e1529, 0.7), shirt: M(0xf2f3f6, 0.5),
      tie: M(0xc8102e, 0.45), trousers: M(0x3a3e46, 0.75), shoe: M(0x15161a, 0.35), sole: M(0x2a2b30, 0.6),
      frame: M(0x1b1c20, 0.3, { metalness: 0.4 }), lens: new THREE.MeshBasicMaterial({ color: 0xbfd8ff, transparent: true, opacity: 0.18 }),
      pin: M(0xd7d8db, 0.3, { metalness: 0.7 }),
    });
  }

  // textura del frente del blazer: solapas, botones y escudo SBL en el bolsillo
  blazerTex(accent) {
    const c = document.createElement('canvas'); c.width = c.height = 256;
    const x = c.getContext('2d');
    x.fillStyle = '#16213d'; x.fillRect(0, 0, 256, 256);
    // camisa visible en V + corbata
    x.fillStyle = '#f2f3f6'; x.beginPath(); x.moveTo(84, 0); x.lineTo(172, 0); x.lineTo(128, 120); x.closePath(); x.fill();
    x.fillStyle = '#c8102e'; x.beginPath(); x.moveTo(118, 0); x.lineTo(138, 0); x.lineTo(142, 92); x.lineTo(128, 112); x.lineTo(114, 92); x.closePath(); x.fill();
    // solapas
    x.fillStyle = '#0e1529';
    x.beginPath(); x.moveTo(84, 0); x.lineTo(60, 0); x.lineTo(118, 150); x.lineTo(128, 120); x.closePath(); x.fill();
    x.beginPath(); x.moveTo(172, 0); x.lineTo(196, 0); x.lineTo(138, 150); x.lineTo(128, 120); x.closePath(); x.fill();
    x.strokeStyle = 'rgba(255,255,255,0.18)'; x.lineWidth = 2;
    x.beginPath(); x.moveTo(128, 150); x.lineTo(128, 256); x.stroke();
    x.fillStyle = '#c9ccd3'; for (const yy of [176, 214]) { x.beginPath(); x.arc(138, yy, 4, 0, 7); x.fill(); }
    // escudo
    if (this.logo) x.drawImage(this.logo, 168, 60, 52, 52 * this.logo.height / this.logo.width);
    x.fillStyle = accent; x.fillRect(166, 128, 56, 3);
    const t = new this.THREE.CanvasTexture(c); return t;
  }

  buildDebater(o) {
    const THREE = this.THREE, m = this.mats;
    const root = new THREE.Group(); root.name = o.id;
    const skin = o.skin, hair = o.hair;
    root.scale.setScalar(o.scale || 1);

    const pelvis = new THREE.Group(); pelvis.position.y = 0.94; root.add(pelvis);
    pelvis.add(new THREE.Mesh(new THREE.BoxGeometry(0.31, 0.19, 0.23), m.trousers));
    const belt = new THREE.Mesh(new THREE.BoxGeometry(0.315, 0.03, 0.235), m.shoe); belt.position.y = 0.08; pelvis.add(belt);

    const spine = new THREE.Group(); spine.position.y = 0.095; pelvis.add(spine);
    const front = new THREE.MeshStandardMaterial({ map: this.blazerTex(o.accent), roughness: 0.7, flatShading: true });
    const torsoMats = [m.blazer, m.blazer, m.blazer, m.blazer, front, m.blazer];
    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.42, 0.22), torsoMats); torso.position.y = 0.2; spine.add(torso);
    const hem = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.07, 0.23), m.blazer); hem.position.y = -0.03; spine.add(hem);
    const collar = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.04, 0.19), m.shirt); collar.position.set(0, 0.41, 0.005); spine.add(collar);
    const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.072, 0.078, 0.1, 8), skin); neck.position.y = 0.45; spine.add(neck);

    const head = new THREE.Group(); head.position.y = 0.59; spine.add(head);
    head.add(new THREE.Mesh(new THREE.BoxGeometry(0.235, 0.25, 0.225), skin));
    const jaw = new THREE.Mesh(new THREE.CylinderGeometry(0.115, 0.085, 0.08, 6), skin); jaw.position.y = -0.125; head.add(jaw);
    const nose = new THREE.Mesh(new THREE.ConeGeometry(0.022, 0.048, 4), skin); nose.rotation.x = Math.PI / 2; nose.position.set(0, 0.0, 0.128); head.add(nose);
    const earG = new THREE.BoxGeometry(0.025, 0.06, 0.045);
    const earL = new THREE.Mesh(earG, skin); earL.position.set(-0.122, 0.0, 0); const earR = earL.clone(); earR.position.x = 0.122; head.add(earL, earR);
    const eyeL = this.createEye(o.iris, false); eyeL.position.set(-0.058, 0.03, 0.116); head.add(eyeL);
    const eyeR = this.createEye(o.iris, false); eyeR.position.set(0.058, 0.03, 0.116); head.add(eyeR);
    const browG = new THREE.BoxGeometry(0.056, 0.015, 0.01);
    const browL = new THREE.Mesh(browG, m.eyebrow); browL.position.set(-0.058, 0.072, 0.12); browL.rotation.z = -0.05;
    const browR = new THREE.Mesh(browG, m.eyebrow); browR.position.set(0.058, 0.072, 0.12); browR.rotation.z = 0.05;
    head.add(browL, browR);
    const mouth = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.01, 0.01), m.mouthLip); mouth.position.set(0, -0.06, 0.118); head.add(mouth);

    if (o.glasses) {
      const g = new THREE.Group(); g.position.set(0, 0.03, 0.128);
      for (const sx of [-1, 1]) {
        const ring = new THREE.Mesh(new THREE.TorusGeometry(0.031, 0.0045, 4, 10), m.frame); ring.scale.y = 0.8; ring.position.x = sx * 0.058; g.add(ring);
        const lens = new THREE.Mesh(new THREE.CircleGeometry(0.03, 10), m.lens); lens.scale.y = 0.8; lens.position.set(sx * 0.058, 0, -0.001); g.add(lens);
        const arm = new THREE.Mesh(new THREE.BoxGeometry(0.006, 0.006, 0.13), m.frame); arm.position.set(sx * 0.115, 0.004, -0.065); g.add(arm);
      }
      const bridge = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.006, 0.006), m.frame); g.add(bridge);
      head.add(g);
    }

    // peinados
    const cap = new THREE.Group(); head.add(cap);
    if (o.hairStyle === 'crop') {
      // Samuel: corte corto con raya lateral y frente levantada
      const crown = new THREE.Mesh(new THREE.BoxGeometry(0.248, 0.085, 0.238), hair); crown.position.set(0, 0.115, -0.004); cap.add(crown);
      const quiff = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.06, 0.07), hair); quiff.position.set(0.02, 0.15, 0.085); quiff.rotation.x = -0.25; quiff.rotation.z = -0.08; cap.add(quiff);
      const sideL = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.12, 0.19), hair); sideL.position.set(-0.122, 0.06, -0.02); cap.add(sideL);
      const sideR = sideL.clone(); sideR.position.x = 0.122; cap.add(sideR);
      const back = new THREE.Mesh(new THREE.BoxGeometry(0.245, 0.16, 0.04), hair); back.position.set(0, 0.04, -0.113); cap.add(back);
    } else {
      // Tomas: pelo ondulado con volumen (racimos de poliedros)
      const base = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.08, 0.24), hair); base.position.set(0, 0.11, -0.005); cap.add(base);
      let k = 0;
      for (let ix = -2; ix <= 2; ix++) for (let iz = -2; iz <= 2; iz++) {
        const r = 0.05 + ((k * 37) % 7) * 0.003; k++;
        const blob = new THREE.Mesh(new THREE.DodecahedronGeometry(r, 0), hair);
        blob.position.set(ix * 0.05, 0.16 + Math.cos(ix * 0.6) * 0.012 - Math.abs(iz) * 0.006, iz * 0.05 - 0.005);
        blob.rotation.set(k, k * 2, k * 3); cap.add(blob);
      }
      for (let ix = -2; ix <= 2; ix++) {
        const f = new THREE.Mesh(new THREE.DodecahedronGeometry(0.035, 0), hair); f.position.set(ix * 0.048, 0.125, 0.11); cap.add(f);
      }
      const sideL = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.13, 0.2), hair); sideL.position.set(-0.122, 0.07, -0.02); cap.add(sideL);
      const sideR = sideL.clone(); sideR.position.x = 0.122; cap.add(sideR);
      const back = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.18, 0.05), hair); back.position.set(0, 0.04, -0.112); cap.add(back);
    }

    // brazos (mangas del blazer + punos de camisa)
    const arm = (sx) => {
      const g = new THREE.Group(); g.position.set(sx * 0.235, 0.36, 0); spine.add(g);
      const sh = new THREE.Mesh(new THREE.DodecahedronGeometry(0.068, 0), m.blazer); sh.scale.set(1, 0.85, 1); g.add(sh);
      const up = new THREE.Mesh(new THREE.CylinderGeometry(0.056, 0.05, 0.25, 6), m.blazer); up.position.y = -0.12; g.add(up);
      const fo = new THREE.Group(); fo.position.y = -0.24; g.add(fo);
      const lo = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.045, 0.22, 6), m.blazer); lo.position.y = -0.11; fo.add(lo);
      const cuff = new THREE.Mesh(new THREE.CylinderGeometry(0.042, 0.042, 0.03, 6), m.shirt); cuff.position.y = -0.225; fo.add(cuff);
      const hand = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.085, 0.032), skin); hand.position.y = -0.27; fo.add(hand);
      const th = new THREE.Mesh(new THREE.BoxGeometry(0.018, 0.04, 0.02), skin); th.position.set(-sx * 0.034, -0.255, 0.012); fo.add(th);
      return [g, fo];
    };
    const [leftArm, lForearm] = arm(-1), [rightArm, rForearm] = arm(1);

    // piernas: pantalon + zapato de vestir (el zapato debe ser el ULTIMO hijo de la rodilla: rig.js lo usa como tobillo)
    const leg = (sx) => {
      const g = new THREE.Group(); g.position.set(sx * 0.095, -0.095, 0); pelvis.add(g);
      const th = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.064, 0.4, 6), m.trousers); th.position.y = -0.2; g.add(th);
      const kn = new THREE.Group(); kn.position.y = -0.4; g.add(kn);
      const ca = new THREE.Mesh(new THREE.CylinderGeometry(0.062, 0.056, 0.4, 6), m.trousers); ca.position.y = -0.2; kn.add(ca);
      const shoe = new THREE.Group();
      const sole = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.03, 0.25), m.sole); sole.position.y = 0.015; shoe.add(sole);
      const up = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.06, 0.22), m.shoe); up.position.set(0, 0.055, 0.0); shoe.add(up);
      const toe = new THREE.Mesh(new THREE.BoxGeometry(0.096, 0.045, 0.06), m.shoe); toe.position.set(0, 0.045, 0.1); shoe.add(toe);
      shoe.position.set(0, -0.4, 0.03); kn.add(shoe);
      return [g, kn];
    };
    const [leftLeg, lKnee] = leg(-1), [rightLeg, rKnee] = leg(1);

    root.userData = {
      id: o.id, name: o.name, pelvis, spine, head, leftArm, rightArm,
      leftForearm: lForearm, rightForearm: rForearm, leftLeg, rightLeg, leftKnee: lKnee, rightKnee: rKnee,
    };
    this.attachExpressionHelpers(root, mouth, eyeL, eyeR, -0.06);
    return root;
  }

  buildSamuel() {
    return this.buildDebater({ id: 'samuel', name: 'Samuel Alejandro Losada Bravo', skin: this.mats.skinSam, hair: this.mats.hairSam,
      iris: this.mats.eyeDark, hairStyle: 'crop', glasses: true, accent: '#e8102a', scale: 1.03 });
  }
  buildTomas() {
    return this.buildDebater({ id: 'tomas', name: 'Tomás Alejandro Homez Barragán', skin: this.mats.skinTom, hair: this.mats.hairTom,
      iris: this.mats.eyeAmber, hairStyle: 'wavy', glasses: false, accent: '#9aa0a8', scale: 1.0 });
  }
}
