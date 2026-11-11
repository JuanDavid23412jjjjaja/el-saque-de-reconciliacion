// characters.js - Stylized High-Craft Low-Poly 3D Characters for Sofía, Juan Diego & Martín
// With custom athletic jerseys (names & numbers), sculpted polygonal faces, expressive eyes, and tailored hairstyles.

export class CharacterBuilder {
  constructor(THREE) {
    this.THREE = THREE;

    // Premium Stylized Material Palette
    this.mats = {
      // Natural warm skin tones with flat-shading
      skinSofia: new THREE.MeshStandardMaterial({ color: 0xffd5bc, roughness: 0.55, flatShading: true }),
      skinJuan: new THREE.MeshStandardMaterial({ color: 0xf4c19d, roughness: 0.55, flatShading: true }),
      skinMartin: new THREE.MeshStandardMaterial({ color: 0xebb48e, roughness: 0.55, flatShading: true }),

      // Blush
      blushSofia: new THREE.MeshBasicMaterial({ color: 0xff7b7b, transparent: true, opacity: 0.45 }),

      // Hair
      hairSofia: new THREE.MeshStandardMaterial({ color: 0x3e2214, roughness: 0.7, flatShading: true }),
      hairJuan: new THREE.MeshStandardMaterial({ color: 0x161311, roughness: 0.7, flatShading: true }),
      hairMartin: new THREE.MeshStandardMaterial({ color: 0x482916, roughness: 0.75, flatShading: true }),

      // Eyes
      eyeSclera: new THREE.MeshBasicMaterial({ color: 0xffffff }),
      eyeHazel: new THREE.MeshStandardMaterial({ color: 0x467c30, roughness: 0.2, flatShading: true }),
      eyeDark: new THREE.MeshStandardMaterial({ color: 0x221812, roughness: 0.2, flatShading: true }),
      eyeAmber: new THREE.MeshStandardMaterial({ color: 0x8c5622, roughness: 0.2, flatShading: true }),
      eyePupil: new THREE.MeshBasicMaterial({ color: 0x050505 }),
      eyeGlint: new THREE.MeshBasicMaterial({ color: 0xffffff }),
      eyebrow: new THREE.MeshStandardMaterial({ color: 0x1c1410, roughness: 0.85, flatShading: true }),
      mouthLip: new THREE.MeshStandardMaterial({ color: 0xd06868, roughness: 0.55, flatShading: true }),

      // SBL Athletic Colors
      sblBlue: new THREE.MeshStandardMaterial({ color: 0x143ea6, roughness: 0.5, flatShading: true }),
      sblNavy: new THREE.MeshStandardMaterial({ color: 0x0d2054, roughness: 0.55, flatShading: true }),
      sblGold: new THREE.MeshStandardMaterial({ color: 0xffd400, roughness: 0.35, metalness: 0.25, flatShading: true }),
      sblWhite: new THREE.MeshStandardMaterial({ color: 0xf5f7fb, roughness: 0.45, flatShading: true }),
      
      // Volleyball Gear
      shortsBlue: new THREE.MeshStandardMaterial({ color: 0x0e1b38, roughness: 0.6, flatShading: true }),
      kneePadOuter: new THREE.MeshStandardMaterial({ color: 0x181e28, roughness: 0.45, flatShading: true }),
      kneePadPad: new THREE.MeshStandardMaterial({ color: 0x2a3545, roughness: 0.5, flatShading: true }),
      
      // Shoes
      soleWhite: new THREE.MeshStandardMaterial({ color: 0xf4f6fa, roughness: 0.35, flatShading: true }),
      shoeAccentGold: new THREE.MeshStandardMaterial({ color: 0xffbe00, roughness: 0.45, flatShading: true }),
      shoeAccentCyan: new THREE.MeshStandardMaterial({ color: 0x00c4d8, roughness: 0.45, flatShading: true }),
      compressionSleeve: new THREE.MeshStandardMaterial({ color: 0x181c24, roughness: 0.5, flatShading: true }),

      // Wheelchair Materials
      chairFrame: new THREE.MeshStandardMaterial({ color: 0x222834, roughness: 0.35, metalness: 0.8, flatShading: true }),
      chairGold: new THREE.MeshStandardMaterial({ color: 0xffd400, roughness: 0.3, metalness: 0.6, flatShading: true }),
      chairCyan: new THREE.MeshStandardMaterial({ color: 0x3fd8ff, roughness: 0.3, metalness: 0.5, flatShading: true }),
      chairSeat: new THREE.MeshStandardMaterial({ color: 0x121824, roughness: 0.7, flatShading: true }),
      chairTire: new THREE.MeshStandardMaterial({ color: 0x111317, roughness: 0.85, flatShading: true }),
      chairRim: new THREE.MeshStandardMaterial({ color: 0xd8e0ea, roughness: 0.25, metalness: 0.9, flatShading: true }),
      chairSpoke: new THREE.MeshBasicMaterial({ color: 0x8898aa }),
      chairFootrest: new THREE.MeshStandardMaterial({ color: 0x2a313d, roughness: 0.5, metalness: 0.7, flatShading: true })
    };
  }

  // --- Wheelchair Builder (Sport Wheelchair / Silla de Ruedas Deportiva SBL) ---
  createWheelchair(accentColor = 'gold') {
    const THREE = this.THREE;
    const chair = new THREE.Group();
    chair.name = 'Wheelchair';

    const accentMat = accentColor === 'cyan' ? this.mats.chairCyan : this.mats.chairGold;

    // 1. Seat Base & Cushion (y around 0.46)
    const seatGeo = new THREE.BoxGeometry(0.48, 0.05, 0.46);
    const seat = new THREE.Mesh(seatGeo, this.mats.chairSeat);
    seat.position.set(0, 0.46, -0.04);
    seat.castShadow = true;
    seat.receiveShadow = true;
    chair.add(seat);

    // Cushion top
    const cushionGeo = new THREE.BoxGeometry(0.44, 0.035, 0.42);
    const cushion = new THREE.Mesh(cushionGeo, accentMat);
    cushion.position.set(0, 0.49, -0.04);
    chair.add(cushion);

    // 2. Backrest (Low athletic backrest for mobility)
    const backrestGeo = new THREE.BoxGeometry(0.44, 0.32, 0.04);
    const backrest = new THREE.Mesh(backrestGeo, this.mats.chairSeat);
    backrest.position.set(0, 0.66, -0.25);
    backrest.rotation.x = -0.08;
    backrest.castShadow = true;
    chair.add(backrest);

    // Backrest tubes (left and right)
    const tubeGeo = new THREE.CylinderGeometry(0.016, 0.016, 0.42, 8);
    const tubeL = new THREE.Mesh(tubeGeo, this.mats.chairFrame);
    tubeL.position.set(-0.21, 0.62, -0.25);
    tubeL.rotation.x = -0.08;
    const tubeR = new THREE.Mesh(tubeGeo, this.mats.chairFrame);
    tubeR.position.set(0.21, 0.62, -0.25);
    tubeR.rotation.x = -0.08;
    chair.add(tubeL, tubeR);

    // 3. Lower Frame Structure
    // Side bottom tubes connecting front casters to main axle
    const sideBarGeo = new THREE.BoxGeometry(0.03, 0.03, 0.48);
    const sideBarL = new THREE.Mesh(sideBarGeo, this.mats.chairFrame);
    sideBarL.position.set(-0.21, 0.22, 0.02);
    const sideBarR = new THREE.Mesh(sideBarGeo, this.mats.chairFrame);
    sideBarR.position.set(0.21, 0.22, 0.02);
    chair.add(sideBarL, sideBarR);

    // Vertical frame struts to seat
    const vertStrutGeo = new THREE.BoxGeometry(0.03, 0.24, 0.03);
    const vs1 = new THREE.Mesh(vertStrutGeo, this.mats.chairFrame);
    vs1.position.set(-0.21, 0.34, -0.18);
    const vs2 = new THREE.Mesh(vertStrutGeo, this.mats.chairFrame);
    vs2.position.set(0.21, 0.34, -0.18);
    const vs3 = new THREE.Mesh(vertStrutGeo, this.mats.chairFrame);
    vs3.position.set(-0.21, 0.34, 0.12);
    const vs4 = new THREE.Mesh(vertStrutGeo, this.mats.chairFrame);
    vs4.position.set(0.21, 0.34, 0.12);
    chair.add(vs1, vs2, vs3, vs4);

    // Main rear cross axle
    const axleGeo = new THREE.CylinderGeometry(0.018, 0.018, 0.54, 8);
    const axle = new THREE.Mesh(axleGeo, this.mats.chairFrame);
    axle.rotation.z = Math.PI / 2;
    axle.position.set(0, 0.34, -0.15);
    chair.add(axle);

    // 4. Large Rear Wheels with Athletic Camber (~12 degrees inward)
    const createLargeWheel = (isLeft) => {
      const wheel = new THREE.Group();
      const camber = isLeft ? 0.18 : -0.18; // Inward tilt for athletic sport chairs

      // Outer Tire
      const tireGeo = new THREE.TorusGeometry(0.32, 0.028, 8, 24);
      const tire = new THREE.Mesh(tireGeo, this.mats.chairTire);
      tire.castShadow = true;
      wheel.add(tire);

      // Inner Metallic Rim
      const rimGeo = new THREE.TorusGeometry(0.30, 0.014, 8, 24);
      const rim = new THREE.Mesh(rimGeo, this.mats.chairRim);
      wheel.add(rim);

      // Push rim (hand rim for propulsion)
      const pushRimGeo = new THREE.TorusGeometry(0.27, 0.011, 8, 24);
      const pushRim = new THREE.Mesh(pushRimGeo, accentMat);
      pushRim.position.z = isLeft ? -0.035 : 0.035;
      wheel.add(pushRim);

      // Central Hub
      const hubGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.05, 10);
      const hub = new THREE.Mesh(hubGeo, this.mats.chairRim);
      hub.rotation.x = Math.PI / 2;
      wheel.add(hub);

      // Spokes (8 radial spokes)
      for (let i = 0; i < 8; i++) {
        const spokeGeo = new THREE.CylinderGeometry(0.004, 0.004, 0.58, 4);
        const spoke = new THREE.Mesh(spokeGeo, this.mats.chairSpoke);
        spoke.rotation.z = (i * Math.PI) / 8;
        wheel.add(spoke);
      }

      wheel.rotation.y = Math.PI / 2;
      wheel.rotation.x = camber;
      return wheel;
    };

    const leftWheel = createLargeWheel(true);
    leftWheel.position.set(-0.29, 0.34, -0.15);
    const rightWheel = createLargeWheel(false);
    rightWheel.position.set(0.29, 0.34, -0.15);
    chair.add(leftWheel, rightWheel);

    // 5. Front Small Caster Wheels
    const createCaster = (x) => {
      const caster = new THREE.Group();
      caster.position.set(x, 0.09, 0.22);

      // Fork
      const forkGeo = new THREE.BoxGeometry(0.04, 0.12, 0.04);
      const fork = new THREE.Mesh(forkGeo, this.mats.chairFrame);
      fork.position.y = 0.04;
      caster.add(fork);

      // Small Wheel
      const cWheelGeo = new THREE.CylinderGeometry(0.065, 0.065, 0.03, 12);
      const cWheel = new THREE.Mesh(cWheelGeo, this.mats.chairTire);
      cWheel.rotation.z = Math.PI / 2;
      caster.add(cWheel);

      return caster;
    };

    chair.add(createCaster(-0.19), createCaster(0.19));

    // 6. Natural Footrest Bar (supports feet resting naturally at y ≈ 0.12)
    const footrestGroup = new THREE.Group();
    footrestGroup.position.set(0, 0.12, 0.26);

    // Footplate
    const plateGeo = new THREE.BoxGeometry(0.32, 0.02, 0.18);
    const plate = new THREE.Mesh(plateGeo, this.mats.chairFootrest);
    plate.castShadow = true;
    plate.receiveShadow = true;
    footrestGroup.add(plate);

    // Heel loop / retaining strap
    const strapGeo = new THREE.BoxGeometry(0.32, 0.035, 0.015);
    const strap = new THREE.Mesh(strapGeo, accentMat);
    strap.position.set(0, 0.025, -0.08);
    footrestGroup.add(strap);

    // Diagonal support tubes from frame to footrest
    const fTubeGeo = new THREE.CylinderGeometry(0.014, 0.014, 0.28, 6);
    const fTubeL = new THREE.Mesh(fTubeGeo, this.mats.chairFrame);
    fTubeL.position.set(-0.15, 0.09, -0.06);
    fTubeL.rotation.x = -0.55;
    const fTubeR = new THREE.Mesh(fTubeGeo, this.mats.chairFrame);
    fTubeR.position.set(0.15, 0.09, -0.06);
    fTubeR.rotation.x = -0.55;
    footrestGroup.add(fTubeL, fTubeR);

    chair.add(footrestGroup);

    return chair;
  }

  // Helper: Create Custom Athletic Jersey Texture (with school name, student name, and number)
  createJerseyTexture(name, number) {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    // Royal Navy Blue Background
    ctx.fillStyle = '#123ca6';
    ctx.fillRect(0, 0, 512, 512);

    // Gold Side Stripes
    ctx.fillStyle = '#ffd400';
    ctx.fillRect(0, 0, 42, 512);
    ctx.fillRect(512 - 42, 0, 42, 512);

    // White Trim Line
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(42, 0, 10, 512);
    ctx.fillRect(512 - 52, 0, 10, 512);

    // School Banner
    ctx.fillStyle = '#ffffff';
    ctx.font = '900 24px "Inter", sans-serif';
    ctx.textAlign = 'center';
    ctx.letterSpacing = '2px';
    ctx.fillText('SAN BONIFACIO', 256, 75);

    ctx.fillStyle = '#ffd400';
    ctx.font = '700 13px "JetBrains Mono", monospace';
    ctx.fillText('VOLEIBOL SENTADO // GRADO 10°', 256, 105);

    // Big Varsity Athletic Number
    ctx.fillStyle = '#ffd400';
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 14;
    ctx.lineJoin = 'miter';
    ctx.font = '900 200px "JetBrains Mono", monospace';
    ctx.strokeText(number, 256, 285);
    ctx.fillText(number, 256, 285);

    // Name Plate
    ctx.fillStyle = '#ffffff';
    ctx.font = '900 38px "Inter", sans-serif';
    ctx.letterSpacing = '3px';
    ctx.fillText(name.toUpperCase(), 256, 360);

    // Subtitle Rule
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.fillRect(100, 395, 312, 3);

    ctx.fillStyle = '#ffd400';
    ctx.font = '700 15px "JetBrains Mono", monospace';
    ctx.fillText('RECONCILIACIÓN 2026', 256, 435);

    const texture = new this.THREE.CanvasTexture(canvas);
    texture.colorSpace = this.THREE.SRGBColorSpace;
    return texture;
  }

  createJerseyMaterial(name, number) {
    const tex = this.createJerseyTexture(name, number);
    return new this.THREE.MeshStandardMaterial({
      map: tex,
      roughness: 0.5,
      flatShading: true
    });
  }

  // Expressive Polygonal Eye
  createEye(irisMat, isFemale = false) {
    const THREE = this.THREE;
    const eye = new THREE.Group();

    // Sclera
    const scleraGeo = new THREE.BoxGeometry(0.065, isFemale ? 0.052 : 0.046, 0.012);
    const sclera = new THREE.Mesh(scleraGeo, this.mats.eyeSclera);
    eye.add(sclera);

    // Iris (Faceted octagonal ring)
    const irisGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.006, 8);
    const iris = new THREE.Mesh(irisGeo, irisMat);
    iris.rotation.x = Math.PI / 2;
    iris.position.z = 0.006;
    eye.add(iris);

    // Pupil
    const pupilGeo = new THREE.CylinderGeometry(0.011, 0.011, 0.007, 8);
    const pupil = new THREE.Mesh(pupilGeo, this.mats.eyePupil);
    pupil.rotation.x = Math.PI / 2;
    pupil.position.z = 0.008;
    eye.add(pupil);

    // Glint
    const glintGeo = new THREE.BoxGeometry(0.008, 0.008, 0.005);
    const glint = new THREE.Mesh(glintGeo, this.mats.eyeGlint);
    glint.position.set(0.007, 0.007, 0.01);
    eye.add(glint);

    // Eyelash upper line for female (Sofía)
    if (isFemale) {
      const lashGeo = new THREE.BoxGeometry(0.072, 0.012, 0.015);
      const lash = new THREE.Mesh(lashGeo, this.mats.eyebrow);
      lash.position.set(0, 0.026, 0.006);
      eye.add(lash);
    }

    return eye;
  }

  // Low-Poly Sneaker
  createSneaker(accentMat) {
    const THREE = this.THREE;
    const shoe = new THREE.Group();

    const soleGeo = new THREE.BoxGeometry(0.12, 0.038, 0.25);
    const sole = new THREE.Mesh(soleGeo, this.mats.soleWhite);
    sole.position.y = 0.019;
    shoe.add(sole);

    const upperGeo = new THREE.BoxGeometry(0.11, 0.07, 0.22);
    const upper = new THREE.Mesh(upperGeo, this.mats.sblBlue);
    upper.position.set(0, 0.065, -0.01);
    shoe.add(upper);

    const toeGeo = new THREE.BoxGeometry(0.106, 0.055, 0.075);
    const toe = new THREE.Mesh(toeGeo, accentMat);
    toe.position.set(0, 0.052, 0.075);
    shoe.add(toe);

    const tongueGeo = new THREE.BoxGeometry(0.065, 0.06, 0.1);
    const tongue = new THREE.Mesh(tongueGeo, this.mats.sblWhite);
    tongue.position.set(0, 0.08, 0.01);
    tongue.rotation.x = 0.22;
    shoe.add(tongue);

    return shoe;
  }

  // Low-Poly Knee Pad
  createKneePad(accentMat = this.mats.sblGold) {
    const THREE = this.THREE;
    const pad = new THREE.Group();

    const bandGeo = new THREE.CylinderGeometry(0.075, 0.072, 0.12, 8);
    const band = new THREE.Mesh(bandGeo, this.mats.kneePadOuter);
    pad.add(band);

    const cushionGeo = new THREE.BoxGeometry(0.092, 0.09, 0.05);
    const cushion = new THREE.Mesh(cushionGeo, this.mats.kneePadPad);
    cushion.position.set(0, 0, 0.055);
    pad.add(cushion);

    const stripeGeo = new THREE.BoxGeometry(0.094, 0.02, 0.052);
    const stripe = new THREE.Mesh(stripeGeo, accentMat);
    stripe.position.set(0, 0, 0.056);
    pad.add(stripe);

    return pad;
  }

  // -------------------------------------------------------------
  // 1. SOFÍA (Sofía Lara Mora) - Captain (#4)
  // -------------------------------------------------------------
  buildSofia() {
    const THREE = this.THREE;
    const root = new THREE.Group();
    root.name = 'Sofia';

    const skin = this.mats.skinSofia;
    const hair = this.mats.hairSofia;
    const eyeIris = this.mats.eyeHazel;

    const H_SCALE = 0.94;
    root.scale.set(H_SCALE, H_SCALE, H_SCALE);

    // Pelvis Group
    const pelvis = new THREE.Group();
    pelvis.position.y = 0.88;
    root.add(pelvis);

    const hipsGeo = new THREE.BoxGeometry(0.28, 0.18, 0.22);
    const hips = new THREE.Mesh(hipsGeo, this.mats.shortsBlue);
    pelvis.add(hips);

    const pipeL = new THREE.Mesh(new THREE.BoxGeometry(0.015, 0.182, 0.222), this.mats.sblWhite);
    pipeL.position.x = -0.14;
    const pipeR = new THREE.Mesh(new THREE.BoxGeometry(0.015, 0.182, 0.222), this.mats.sblWhite);
    pipeR.position.x = 0.14;
    pelvis.add(pipeL, pipeR);

    // Spine & Torso
    const spine = new THREE.Group();
    spine.position.y = 0.09;
    pelvis.add(spine);

    // Torso with custom SBL jersey texture
    const torsoMat = this.createJerseyMaterial('Sofía', '4');
    const torsoGeo = new THREE.BoxGeometry(0.28, 0.36, 0.2);
    const torso = new THREE.Mesh(torsoGeo, torsoMat);
    torso.position.y = 0.18;
    spine.add(torso);

    // Gold V-Neck Collar
    const collar = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.035, 0.18), this.mats.sblGold);
    collar.position.set(0, 0.36, 0);
    spine.add(collar);

    // Neck (Clean skin, no shadows)
    const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.07, 0.09, 8), skin);
    neck.position.y = 0.39;
    spine.add(neck);

    // Head
    const head = new THREE.Group();
    head.position.y = 0.53;
    spine.add(head);

    // Clean Sculpted Polygonal Head (Single continuous piece without harsh chin breaks)
    const headGeo = new THREE.BoxGeometry(0.22, 0.24, 0.22);
    const headMesh = new THREE.Mesh(headGeo, skin);
    head.add(headMesh);

    // Cheeks / Jaw smoothly tapered
    const jawGeo = new THREE.CylinderGeometry(0.11, 0.08, 0.07, 6);
    const jaw = new THREE.Mesh(jawGeo, skin);
    jaw.position.y = -0.12;
    head.add(jaw);

    // Blush Cheeks
    const blushGeo = new THREE.PlaneGeometry(0.045, 0.025);
    const blushL = new THREE.Mesh(blushGeo, this.mats.blushSofia);
    blushL.position.set(-0.065, -0.01, 0.112);
    const blushR = new THREE.Mesh(blushGeo, this.mats.blushSofia);
    blushR.position.set(0.065, -0.01, 0.112);
    head.add(blushL, blushR);

    // Nose
    const noseGeo = new THREE.ConeGeometry(0.018, 0.038, 4);
    const nose = new THREE.Mesh(noseGeo, skin);
    nose.rotation.x = Math.PI / 2;
    nose.position.set(0, 0.005, 0.125);
    head.add(nose);

    // Eyes
    const eyeL = this.createEye(eyeIris, true);
    eyeL.position.set(-0.055, 0.025, 0.112);
    head.add(eyeL);

    const eyeR = this.createEye(eyeIris, true);
    eyeR.position.set(0.055, 0.025, 0.112);
    head.add(eyeR);

    // Eyebrows
    const browGeo = new THREE.BoxGeometry(0.05, 0.01, 0.01);
    const browL = new THREE.Mesh(browGeo, this.mats.eyebrow);
    browL.position.set(-0.055, 0.065, 0.115);
    browL.rotation.z = 0.08;
    const browR = new THREE.Mesh(browGeo, this.mats.eyebrow);
    browR.position.set(0.055, 0.065, 0.115);
    browR.rotation.z = -0.08;
    head.add(browL, browR);

    // Smile
    const mouthGeo = new THREE.BoxGeometry(0.045, 0.01, 0.01);
    const mouth = new THREE.Mesh(mouthGeo, this.mats.mouthLip);
    mouth.position.set(0, -0.055, 0.114);
    head.add(mouth);

    // --- SOFÍA'S HAIR: High Ponytail peaking visibly over shoulder! ---
    const hairCap = new THREE.Group();
    head.add(hairCap);

    const crownGeo = new THREE.BoxGeometry(0.23, 0.13, 0.23);
    const crown = new THREE.Mesh(crownGeo, hair);
    crown.position.set(0, 0.08, -0.01);
    hairCap.add(crown);

    const bangGeo = new THREE.BoxGeometry(0.045, 0.11, 0.03);
    const bangL = new THREE.Mesh(bangGeo, hair);
    bangL.position.set(-0.105, 0.03, 0.1);
    bangL.rotation.z = -0.15;
    const bangR = new THREE.Mesh(bangGeo, hair);
    bangR.position.set(0.105, 0.03, 0.1);
    bangR.rotation.z = 0.15;
    hairCap.add(bangL, bangR);

    const fringeGeo = new THREE.BoxGeometry(0.1, 0.035, 0.03);
    const fringe = new THREE.Mesh(fringeGeo, hair);
    fringe.position.set(0, 0.11, 0.1);
    hairCap.add(fringe);

    const backGeo = new THREE.BoxGeometry(0.225, 0.17, 0.07);
    const backHair = new THREE.Mesh(backGeo, hair);
    backHair.position.set(0, 0.02, -0.1);
    hairCap.add(backHair);

    // Gold Tie
    const tieGeo = new THREE.CylinderGeometry(0.038, 0.038, 0.035, 8);
    const tie = new THREE.Mesh(tieGeo, this.mats.sblGold);
    tie.rotation.set(Math.PI / 4, 0, -0.35);
    tie.position.set(-0.06, 0.14, -0.12);
    hairCap.add(tie);

    // Ponytail angled to the left so it sweeps gracefully forward!
    const pony = new THREE.Group();
    pony.position.set(-0.07, 0.14, -0.13);
    pony.rotation.set(-0.15, 0.2, -0.5);
    hairCap.add(pony);

    const pLock1 = new THREE.Mesh(new THREE.ConeGeometry(0.065, 0.24, 6), hair);
    pLock1.rotation.x = -Math.PI / 2.5;
    pLock1.position.set(0, -0.07, -0.07);
    pony.add(pLock1);

    const pLock2 = new THREE.Mesh(new THREE.ConeGeometry(0.048, 0.2, 6), hair);
    pLock2.rotation.x = -Math.PI / 2.7;
    pLock2.position.set(0, -0.2, -0.14);
    pony.add(pLock2);

    // Arms
    const leftArm = new THREE.Group();
    leftArm.position.set(-0.2, 0.32, 0);
    spine.add(leftArm);

    const lShoulder = new THREE.Mesh(new THREE.DodecahedronGeometry(0.052, 0), this.mats.sblBlue);
    leftArm.add(lShoulder);

    const lUpperArm = new THREE.Mesh(new THREE.CylinderGeometry(0.042, 0.038, 0.22, 6), skin);
    lUpperArm.position.y = -0.11;
    leftArm.add(lUpperArm);

    // Captain Band
    const band = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.055, 8), this.mats.sblGold);
    band.position.y = -0.08;
    leftArm.add(band);

    const lForearm = new THREE.Group();
    lForearm.position.y = -0.22;
    leftArm.add(lForearm);

    const lArmLower = new THREE.Mesh(new THREE.CylinderGeometry(0.038, 0.034, 0.22, 6), skin);
    lArmLower.position.y = -0.11;
    lForearm.add(lArmLower);

    const lWrist = new THREE.Mesh(new THREE.CylinderGeometry(0.036, 0.036, 0.035, 6), this.mats.sblWhite);
    lWrist.position.y = -0.18;
    lForearm.add(lWrist);

    const lHand = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.08, 0.025), skin);
    lHand.position.y = -0.25;
    lForearm.add(lHand);

    // Right Arm
    const rightArm = new THREE.Group();
    rightArm.position.set(0.2, 0.32, 0);
    spine.add(rightArm);

    const rShoulder = new THREE.Mesh(new THREE.DodecahedronGeometry(0.052, 0), this.mats.sblBlue);
    rightArm.add(rShoulder);

    const rUpperArm = new THREE.Mesh(new THREE.CylinderGeometry(0.042, 0.038, 0.22, 6), skin);
    rUpperArm.position.y = -0.11;
    rightArm.add(rUpperArm);

    const rForearm = new THREE.Group();
    rForearm.position.y = -0.22;
    rightArm.add(rForearm);

    const rArmLower = new THREE.Mesh(new THREE.CylinderGeometry(0.038, 0.034, 0.22, 6), skin);
    rArmLower.position.y = -0.11;
    rForearm.add(rArmLower);

    const rHand = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.08, 0.025), skin);
    rHand.position.y = -0.25;
    rForearm.add(rHand);

    // Legs
    const leftLeg = new THREE.Group();
    leftLeg.position.set(-0.09, -0.09, 0);
    pelvis.add(leftLeg);

    const lThigh = new THREE.Mesh(new THREE.CylinderGeometry(0.062, 0.052, 0.36, 6), skin);
    lThigh.position.y = -0.18;
    leftLeg.add(lThigh);

    const lKnee = new THREE.Group();
    lKnee.position.y = -0.36;
    leftLeg.add(lKnee);

    const lPad = this.createKneePad(this.mats.sblGold);
    lKnee.add(lPad);

    const lCalf = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.04, 0.36, 6), skin);
    lCalf.position.y = -0.18;
    lKnee.add(lCalf);

    const lSneaker = this.createSneaker(this.mats.shoeAccentGold);
    lSneaker.position.set(0, -0.36, 0.03);
    lKnee.add(lSneaker);

    const rightLeg = new THREE.Group();
    rightLeg.position.set(0.09, -0.09, 0);
    pelvis.add(rightLeg);

    const rThigh = new THREE.Mesh(new THREE.CylinderGeometry(0.062, 0.052, 0.36, 6), skin);
    rThigh.position.y = -0.18;
    rightLeg.add(rThigh);

    const rKnee = new THREE.Group();
    rKnee.position.y = -0.36;
    rightLeg.add(rKnee);

    const rPad = this.createKneePad(this.mats.sblGold);
    rKnee.add(rPad);

    const rCalf = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.04, 0.36, 6), skin);
    rCalf.position.y = -0.18;
    rKnee.add(rCalf);

    const rSneaker = this.createSneaker(this.mats.shoeAccentGold);
    rSneaker.position.set(0, -0.36, 0.03);
    rKnee.add(rSneaker);

    root.userData = {
      id: 'sofia',
      name: 'Sofía Lara Mora',
      role: 'Capitana / Coordinación de Proyecto',
      number: 4,
      pelvis, spine, head,
      leftArm, rightArm,
      leftForearm: lForearm, rightForearm: rForearm,
      leftLeg, rightLeg,
      leftKnee: lKnee, rightKnee: rKnee,
      pony
    };

    return root;
  }

  // -------------------------------------------------------------
  // 2. JUAN DIEGO (Juan Diego Núñez) - Spiker (#7)
  // -------------------------------------------------------------
  buildJuanDiego() {
    const THREE = this.THREE;
    const root = new THREE.Group();
    root.name = 'JuanDiego';

    const skin = this.mats.skinJuan;
    const hair = this.mats.hairJuan;
    const eyeIris = this.mats.eyeDark;

    const H_SCALE = 1.02;
    root.scale.set(H_SCALE, H_SCALE, H_SCALE);

    const pelvis = new THREE.Group();
    pelvis.position.y = 0.94;
    root.add(pelvis);

    const hipsGeo = new THREE.BoxGeometry(0.31, 0.19, 0.23);
    const hips = new THREE.Mesh(hipsGeo, this.mats.shortsBlue);
    pelvis.add(hips);

    const spine = new THREE.Group();
    spine.position.y = 0.095;
    pelvis.add(spine);

    // Torso with custom SBL jersey texture
    const torsoMat = this.createJerseyMaterial('Juan Diego', '7');
    const torsoGeo = new THREE.BoxGeometry(0.33, 0.4, 0.22);
    const torso = new THREE.Mesh(torsoGeo, torsoMat);
    torso.position.y = 0.2;
    spine.add(torso);

    const collar = new THREE.Mesh(new THREE.BoxGeometry(0.19, 0.035, 0.19), this.mats.sblGold);
    collar.position.set(0, 0.4, 0);
    spine.add(collar);

    const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.08, 0.1, 8), skin);
    neck.position.y = 0.44;
    spine.add(neck);

    const head = new THREE.Group();
    head.position.y = 0.58;
    spine.add(head);

    // Sculpted Head
    const headGeo = new THREE.BoxGeometry(0.24, 0.25, 0.23);
    const headMesh = new THREE.Mesh(headGeo, skin);
    head.add(headMesh);

    const jawGeo = new THREE.CylinderGeometry(0.12, 0.09, 0.08, 6);
    const jaw = new THREE.Mesh(jawGeo, skin);
    jaw.position.y = -0.125;
    head.add(jaw);

    const noseGeo = new THREE.ConeGeometry(0.022, 0.045, 4);
    const nose = new THREE.Mesh(noseGeo, skin);
    nose.rotation.x = Math.PI / 2;
    nose.position.set(0, 0.01, 0.13);
    head.add(nose);

    const eyeL = this.createEye(eyeIris, false);
    eyeL.position.set(-0.06, 0.03, 0.118);
    head.add(eyeL);

    const eyeR = this.createEye(eyeIris, false);
    eyeR.position.set(0.06, 0.03, 0.118);
    head.add(eyeR);

    const browGeo = new THREE.BoxGeometry(0.055, 0.014, 0.01);
    const browL = new THREE.Mesh(browGeo, this.mats.eyebrow);
    browL.position.set(-0.06, 0.07, 0.122);
    browL.rotation.z = -0.06;
    const browR = new THREE.Mesh(browGeo, this.mats.eyebrow);
    browR.position.set(0.06, 0.07, 0.122);
    browR.rotation.z = 0.06;
    head.add(browL, browR);

    const mouthGeo = new THREE.BoxGeometry(0.05, 0.01, 0.01);
    const mouth = new THREE.Mesh(mouthGeo, this.mats.mouthLip);
    mouth.position.set(0, -0.06, 0.12);
    head.add(mouth);

    // --- JUAN DIEGO'S HAIR: Textured Modern Undercut ---
    const hairCap = new THREE.Group();
    head.add(hairCap);

    const crownGeo = new THREE.BoxGeometry(0.25, 0.12, 0.24);
    const crown = new THREE.Mesh(crownGeo, hair);
    crown.position.set(0, 0.09, 0);
    hairCap.add(crown);

    for (let i = -2; i <= 2; i++) {
      const spike = new THREE.Mesh(new THREE.ConeGeometry(0.035, 0.12, 5), hair);
      spike.position.set(i * 0.04, 0.17, 0.04 - Math.abs(i) * 0.02);
      spike.rotation.x = -0.35;
      spike.rotation.z = -i * 0.12;
      hairCap.add(spike);
    }

    const backGeo = new THREE.BoxGeometry(0.245, 0.15, 0.06);
    const backHair = new THREE.Mesh(backGeo, hair);
    backHair.position.set(0, 0.03, -0.11);
    hairCap.add(backHair);

    // Arms
    const leftArm = new THREE.Group();
    leftArm.position.set(-0.24, 0.35, 0);
    spine.add(leftArm);

    const lShoulder = new THREE.Mesh(new THREE.DodecahedronGeometry(0.062, 0), this.mats.sblBlue);
    leftArm.add(lShoulder);

    const lUpperArm = new THREE.Mesh(new THREE.CylinderGeometry(0.048, 0.042, 0.24, 6), skin);
    lUpperArm.position.y = -0.12;
    leftArm.add(lUpperArm);

    const lForearm = new THREE.Group();
    lForearm.position.y = -0.24;
    leftArm.add(lForearm);

    const lArmLower = new THREE.Mesh(new THREE.CylinderGeometry(0.042, 0.036, 0.24, 6), skin);
    lArmLower.position.y = -0.12;
    lForearm.add(lArmLower);

    const lHand = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.085, 0.03), skin);
    lHand.position.y = -0.26;
    lForearm.add(lHand);

    // Right Arm (Compression Sleeve)
    const rightArm = new THREE.Group();
    rightArm.position.set(0.24, 0.35, 0);
    spine.add(rightArm);

    const rShoulder = new THREE.Mesh(new THREE.DodecahedronGeometry(0.062, 0), this.mats.sblBlue);
    rightArm.add(rShoulder);

    const rUpperArm = new THREE.Mesh(new THREE.CylinderGeometry(0.048, 0.042, 0.24, 6), this.mats.compressionSleeve);
    rUpperArm.position.y = -0.12;
    rightArm.add(rUpperArm);

    const rForearm = new THREE.Group();
    rForearm.position.y = -0.24;
    rightArm.add(rForearm);

    const rArmLower = new THREE.Mesh(new THREE.CylinderGeometry(0.042, 0.036, 0.24, 6), this.mats.compressionSleeve);
    rArmLower.position.y = -0.12;
    rForearm.add(rArmLower);

    const rHand = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.085, 0.03), skin);
    rHand.position.y = -0.26;
    rForearm.add(rHand);

    // Legs
    const leftLeg = new THREE.Group();
    leftLeg.position.set(-0.1, -0.095, 0);
    pelvis.add(leftLeg);

    const lThigh = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.058, 0.4, 6), skin);
    lThigh.position.y = -0.2;
    leftLeg.add(lThigh);

    const lKnee = new THREE.Group();
    lKnee.position.y = -0.4;
    leftLeg.add(lKnee);

    const lPad = this.createKneePad(this.mats.shoeAccentCyan);
    lKnee.add(lPad);

    const lCalf = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.042, 0.4, 6), skin);
    lCalf.position.y = -0.2;
    lKnee.add(lCalf);

    const lSneaker = this.createSneaker(this.mats.shoeAccentCyan);
    lSneaker.position.set(0, -0.4, 0.03);
    lKnee.add(lSneaker);

    const rightLeg = new THREE.Group();
    rightLeg.position.set(0.1, -0.095, 0);
    pelvis.add(rightLeg);

    const rThigh = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.058, 0.4, 6), skin);
    rThigh.position.y = -0.2;
    rightLeg.add(rThigh);

    const rKnee = new THREE.Group();
    rKnee.position.y = -0.4;
    rightLeg.add(rKnee);

    const rPad = this.createKneePad(this.mats.shoeAccentCyan);
    rKnee.add(rPad);

    const rCalf = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.042, 0.4, 6), skin);
    rCalf.position.y = -0.2;
    rKnee.add(rCalf);

    const rSneaker = this.createSneaker(this.mats.shoeAccentCyan);
    rSneaker.position.set(0, -0.4, 0.03);
    rKnee.add(rSneaker);

    root.userData = {
      id: 'juandiego',
      name: 'Juan Diego Núñez',
      role: 'Atacante / Análisis Biomecánico',
      number: 7,
      pelvis, spine, head,
      leftArm, rightArm,
      leftForearm: lForearm, rightForearm: rForearm,
      leftLeg, rightLeg,
      leftKnee: lKnee, rightKnee: rKnee
    };

    return root;
  }

  // -------------------------------------------------------------
  // 3. MARTÍN (Martín Quiñones) - Setter (#10)
  // -------------------------------------------------------------
  buildMartin() {
    const THREE = this.THREE;
    const root = new THREE.Group();
    root.name = 'Martin';

    const skin = this.mats.skinMartin;
    const hair = this.mats.hairMartin;
    const eyeIris = this.mats.eyeAmber;

    const H_SCALE = 0.98;
    root.scale.set(H_SCALE, H_SCALE, H_SCALE);

    const pelvis = new THREE.Group();
    pelvis.position.y = 0.91;
    root.add(pelvis);

    const hipsGeo = new THREE.BoxGeometry(0.29, 0.18, 0.22);
    const hips = new THREE.Mesh(hipsGeo, this.mats.shortsBlue);
    pelvis.add(hips);

    const spine = new THREE.Group();
    spine.position.y = 0.09;
    pelvis.add(spine);

    // Torso with custom SBL jersey texture
    const torsoMat = this.createJerseyMaterial('Martín', '10');
    const torsoGeo = new THREE.BoxGeometry(0.3, 0.38, 0.21);
    const torso = new THREE.Mesh(torsoGeo, torsoMat);
    torso.position.y = 0.19;
    spine.add(torso);

    const collar = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.035, 0.18), this.mats.sblGold);
    collar.position.set(0, 0.38, 0);
    spine.add(collar);

    const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.078, 0.1, 8), skin);
    neck.position.y = 0.41;
    spine.add(neck);

    const head = new THREE.Group();
    head.position.y = 0.56;
    spine.add(head);

    const headGeo = new THREE.BoxGeometry(0.23, 0.24, 0.22);
    const headMesh = new THREE.Mesh(headGeo, skin);
    head.add(headMesh);

    const jawGeo = new THREE.CylinderGeometry(0.115, 0.085, 0.08, 6);
    const jaw = new THREE.Mesh(jawGeo, skin);
    jaw.position.y = -0.12;
    head.add(jaw);

    const noseGeo = new THREE.ConeGeometry(0.02, 0.042, 4);
    const nose = new THREE.Mesh(noseGeo, skin);
    nose.rotation.x = Math.PI / 2;
    nose.position.set(0, 0.01, 0.125);
    head.add(nose);

    const eyeL = this.createEye(eyeIris, false);
    eyeL.position.set(-0.058, 0.03, 0.114);
    head.add(eyeL);

    const eyeR = this.createEye(eyeIris, false);
    eyeR.position.set(0.058, 0.03, 0.114);
    head.add(eyeR);

    const browGeo = new THREE.BoxGeometry(0.052, 0.012, 0.01);
    const browL = new THREE.Mesh(browGeo, this.mats.eyebrow);
    browL.position.set(-0.058, 0.07, 0.118);
    browL.rotation.z = 0.04;
    const browR = new THREE.Mesh(browGeo, this.mats.eyebrow);
    browR.position.set(0.058, 0.07, 0.118);
    browR.rotation.z = -0.04;
    head.add(browL, browR);

    const mouthGeo = new THREE.BoxGeometry(0.048, 0.01, 0.01);
    const mouth = new THREE.Mesh(mouthGeo, this.mats.mouthLip);
    mouth.position.set(0, -0.055, 0.116);
    head.add(mouth);

    // --- MARTÍN'S HAIR: Curly Polygonal Volume ---
    const hairCap = new THREE.Group();
    head.add(hairCap);

    const crownGeo = new THREE.BoxGeometry(0.24, 0.13, 0.23);
    const crown = new THREE.Mesh(crownGeo, hair);
    crown.position.set(0, 0.08, 0);
    hairCap.add(crown);

    const curlOffsets = [
      [-0.08, 0.15, 0.03], [0.0, 0.17, 0.04], [0.08, 0.15, 0.03],
      [-0.05, 0.16, -0.04], [0.05, 0.16, -0.04],
      [-0.09, 0.09, -0.07], [0.09, 0.09, -0.07]
    ];
    curlOffsets.forEach((pos, idx) => {
      const curlGeo = new THREE.DodecahedronGeometry(0.055, 0);
      const curl = new THREE.Mesh(curlGeo, hair);
      curl.position.set(pos[0], pos[1], pos[2]);
      curl.rotation.set(idx * 0.4, idx * 0.6, 0);
      hairCap.add(curl);
    });

    const backGeo = new THREE.BoxGeometry(0.235, 0.16, 0.06);
    const backHair = new THREE.Mesh(backGeo, hair);
    backHair.position.set(0, 0.02, -0.11);
    hairCap.add(backHair);

    // Arms
    const leftArm = new THREE.Group();
    leftArm.position.set(-0.22, 0.33, 0);
    spine.add(leftArm);

    const lShoulder = new THREE.Mesh(new THREE.DodecahedronGeometry(0.058, 0), this.mats.sblBlue);
    leftArm.add(lShoulder);

    const lUpperArm = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.04, 0.23, 6), skin);
    lUpperArm.position.y = -0.115;
    leftArm.add(lUpperArm);

    const lForearm = new THREE.Group();
    lForearm.position.y = -0.23;
    leftArm.add(lForearm);

    const lArmLower = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.035, 0.23, 6), skin);
    lArmLower.position.y = -0.115;
    lForearm.add(lArmLower);

    const lHand = new THREE.Mesh(new THREE.BoxGeometry(0.058, 0.08, 0.028), skin);
    lHand.position.y = -0.25;
    lForearm.add(lHand);

    // Right Arm (Holding Volleyball)
    const rightArm = new THREE.Group();
    rightArm.position.set(0.22, 0.33, 0);
    spine.add(rightArm);

    const rShoulder = new THREE.Mesh(new THREE.DodecahedronGeometry(0.058, 0), this.mats.sblBlue);
    rightArm.add(rShoulder);

    const rUpperArm = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.04, 0.23, 6), skin);
    rUpperArm.position.y = -0.115;
    rightArm.add(rUpperArm);

    const rForearm = new THREE.Group();
    rForearm.position.y = -0.23;
    rightArm.add(rForearm);

    const rArmLower = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.035, 0.23, 6), skin);
    rArmLower.position.y = -0.115;
    rForearm.add(rArmLower);

    const rHand = new THREE.Mesh(new THREE.BoxGeometry(0.058, 0.08, 0.028), skin);
    rHand.position.y = -0.25;
    rForearm.add(rHand);

    // Mikasa-Style Low-Poly Volleyball
    const ballGroup = new THREE.Group();
    const ballMesh = new THREE.Mesh(new THREE.DodecahedronGeometry(0.125, 1), this.mats.sblGold);
    const bandMesh1 = new THREE.Mesh(new THREE.TorusGeometry(0.128, 0.016, 6, 16), this.mats.sblBlue);
    const bandMesh2 = new THREE.Mesh(new THREE.TorusGeometry(0.128, 0.016, 6, 16), this.mats.sblWhite);
    bandMesh2.rotation.x = Math.PI / 2;
    ballGroup.add(ballMesh, bandMesh1, bandMesh2);
    ballGroup.position.set(0, -0.34, 0.06);
    rForearm.add(ballGroup);

    // Legs
    const leftLeg = new THREE.Group();
    leftLeg.position.set(-0.095, -0.09, 0);
    pelvis.add(leftLeg);

    const lThigh = new THREE.Mesh(new THREE.CylinderGeometry(0.066, 0.055, 0.38, 6), skin);
    lThigh.position.y = -0.19;
    leftLeg.add(lThigh);

    const lKnee = new THREE.Group();
    lKnee.position.y = -0.38;
    leftLeg.add(lKnee);

    const lPad = this.createKneePad(this.mats.sblGold);
    lKnee.add(lPad);

    const lCalf = new THREE.Mesh(new THREE.CylinderGeometry(0.052, 0.042, 0.38, 6), skin);
    lCalf.position.y = -0.19;
    lKnee.add(lCalf);

    const lSneaker = this.createSneaker(this.mats.shoeAccentGold);
    lSneaker.position.set(0, -0.38, 0.03);
    lKnee.add(lSneaker);

    const rightLeg = new THREE.Group();
    rightLeg.position.set(0.095, -0.09, 0);
    pelvis.add(rightLeg);

    const rThigh = new THREE.Mesh(new THREE.CylinderGeometry(0.066, 0.055, 0.38, 6), skin);
    rThigh.position.y = -0.19;
    rightLeg.add(rThigh);

    const rKnee = new THREE.Group();
    rKnee.position.y = -0.38;
    rightLeg.add(rKnee);

    const rPad = this.createKneePad(this.mats.sblGold);
    rKnee.add(rPad);

    const rCalf = new THREE.Mesh(new THREE.CylinderGeometry(0.052, 0.042, 0.38, 6), skin);
    rCalf.position.y = -0.19;
    rKnee.add(rCalf);

    const rSneaker = this.createSneaker(this.mats.shoeAccentGold);
    rSneaker.position.set(0, -0.38, 0.03);
    rKnee.add(rSneaker);

    root.userData = {
      id: 'martin',
      name: 'Martín Quiñones',
      role: 'Armador / Estrategia & Dialéctica',
      number: 10,
      pelvis, spine, head,
      leftArm, rightArm,
      leftForearm: lForearm, rightForearm: rForearm,
      leftLeg, rightLeg,
      leftKnee: lKnee, rightKnee: rKnee,
      ball: ballGroup
    };

    return root;
  }
}
