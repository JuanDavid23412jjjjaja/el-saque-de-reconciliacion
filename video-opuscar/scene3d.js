// scene3d.js - High-End 3D Studio & Biomechanical Modeling Pipeline (Lemo-Opuscar Quality)
import { lerp, seg, ss, eio, eo, track } from './lib.js';

export class Scene3D {
  constructor(container) {
    this.container = container;
    this.THREE = window.THREE;
    const THREE = this.THREE;

    this.W = 1920;
    this.H = 1080;

    // Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true, alpha: false });
    this.renderer.setSize(this.W, this.H);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.container.appendChild(this.renderer.domElement);

    // Scene & Fog
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0c0f14);
    this.scene.fog = new THREE.FogExp2(0x0c0f14, 0.035);

    // Camera
    this.camera = new THREE.PerspectiveCamera(36, this.W / this.H, 0.1, 120);
    this.cameraTarget = new THREE.Vector3(0, 1.2, 0);

    // Build Scene Components
    this.initStudioEnvironment();
    this.initLights();
    this.initCourt();
    this.initNetSystem();
    this.initAthlete();
    this.initVolleyball();
    this.initTrajectoryRibbon();
    this.initCameraPath();
  }

  initStudioEnvironment() {
    const THREE = this.THREE;

    // Curved Cyclorama Studio Backdrop
    const cycGeo = new THREE.CylinderGeometry(28, 28, 20, 48, 1, true, -Math.PI / 2, Math.PI);
    const cycMat = new THREE.MeshStandardMaterial({
      color: 0x11161f,
      roughness: 0.9,
      metalness: 0.1,
      side: THREE.BackSide
    });
    const cycMesh = new THREE.Mesh(cycGeo, cycMat);
    cycMesh.position.set(0, 8, 0);
    this.scene.add(cycMesh);

    // Distant Arena LED Light Bars (Cinematic background accents)
    const ledMat = new THREE.MeshBasicMaterial({ color: 0x1b3ed2 });
    for (let i = -3; i <= 3; i++) {
      const ledBar = new THREE.Mesh(new THREE.BoxGeometry(4.5, 0.08, 0.08), ledMat);
      ledBar.position.set(i * 6, 9.5, -12);
      this.scene.add(ledBar);
    }
  }

  initLights() {
    const THREE = this.THREE;

    // 1. Studio Key Light (Warm soft directional from high front-right)
    this.keyLight = new THREE.DirectionalLight(0xfff5ea, 2.4);
    this.keyLight.position.set(8, 10, -6);
    this.keyLight.castShadow = true;
    this.keyLight.shadow.mapSize.set(2048, 2048);
    this.keyLight.shadow.camera.near = 1;
    this.keyLight.shadow.camera.far = 30;
    this.keyLight.shadow.camera.left = -12;
    this.keyLight.shadow.camera.right = 12;
    this.keyLight.shadow.camera.top = 12;
    this.keyLight.shadow.camera.bottom = -12;
    this.keyLight.shadow.bias = -0.0004;
    this.scene.add(this.keyLight);

    // 2. High-Tech Cyan Rim Light (Sharp edge separation from rear)
    this.rimLight = new THREE.DirectionalLight(0x3fd8ff, 4.2);
    this.rimLight.position.set(-8, 5, 8);
    this.scene.add(this.rimLight);

    // 3. Warm Under-Bounce Fill
    this.bounceLight = new THREE.DirectionalLight(0xffaa44, 0.6);
    this.bounceLight.position.set(0, -3, 0);
    this.bounceLight.target.position.set(0, 1, 0);
    this.scene.add(this.bounceLight);

    // 4. Soft Ambient Hemisphere Light
    this.hemiLight = new THREE.HemisphereLight(0x283848, 0x080a0e, 0.85);
    this.scene.add(this.hemiLight);

    // 5. Seated Athlete Overhead Follow Spotlight
    this.athleteSpot = new THREE.SpotLight(0x45f0dd, 2.5, 14, Math.PI / 4, 0.6);
    this.athleteSpot.position.set(0, 5, -1.6);
    this.athleteSpot.target.position.set(0, 0, -1.6);
    this.scene.add(this.athleteSpot);
    this.scene.add(this.athleteSpot.target);
  }

  initCourt() {
    const THREE = this.THREE;

    // Studio Master Floor (Dark subtle satin sheen)
    const floorGeo = new THREE.PlaneGeometry(60, 60);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x0b0d11,
      roughness: 0.7,
      metalness: 0.2
    });
    this.floor = new THREE.Mesh(floorGeo, floorMat);
    this.floor.rotation.x = -Math.PI / 2;
    this.floor.receiveShadow = true;
    this.scene.add(this.floor);

    // Drafting Isometric Grid Overlay
    const grid = new THREE.GridHelper(40, 80, 0x1f3044, 0x131a22);
    grid.position.y = 0.002;
    this.scene.add(grid);

    // Active Court Polyurethane Synthetic Flooring
    const courtGeo = new THREE.PlaneGeometry(18, 9);
    this.courtMat = new THREE.MeshStandardMaterial({
      color: 0x14202c,
      roughness: 0.45,
      metalness: 0.12
    });
    this.courtMesh = new THREE.Mesh(courtGeo, this.courtMat);
    this.courtMesh.rotation.x = -Math.PI / 2;
    this.courtMesh.rotation.z = Math.PI / 2;
    this.courtMesh.position.y = 0.005;
    this.courtMesh.receiveShadow = true;
    this.scene.add(this.courtMesh);

    // Court Lines Group
    this.courtLines = new THREE.Group();
    this.scene.add(this.courtLines);

    const lineMat = new THREE.LineBasicMaterial({ color: 0xffffff, linewidth: 2 });
    const lineMatCyan = new THREE.LineBasicMaterial({ color: 0x3fd8ff, linewidth: 2 });

    // Boundary Line
    this.boundaryLineGeo = new THREE.BufferGeometry();
    this.boundaryLine = new THREE.LineLoop(this.boundaryLineGeo, lineMat);
    this.courtLines.add(this.boundaryLine);

    // Center Net Line
    const centerLineGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-4.5, 0.01, 0),
      new THREE.Vector3(4.5, 0.01, 0)
    ]);
    this.centerLine = new THREE.Line(centerLineGeo, new THREE.LineBasicMaterial({ color: 0xffd400, linewidth: 2.5 }));
    this.courtLines.add(this.centerLine);

    // Attack Lines
    this.attackLineAGeo = new THREE.BufferGeometry();
    this.attackLineA = new THREE.Line(this.attackLineAGeo, lineMatCyan);
    this.courtLines.add(this.attackLineA);

    this.attackLineBGeo = new THREE.BufferGeometry();
    this.attackLineB = new THREE.Line(this.attackLineBGeo, lineMatCyan);
    this.courtLines.add(this.attackLineB);

    // Traditional Exclusion Red Zone
    const exclGeo = new THREE.PlaneGeometry(9, 18);
    this.exclMat = new THREE.MeshBasicMaterial({
      color: 0xff2828,
      transparent: true,
      opacity: 0.14,
      side: THREE.DoubleSide
    });
    this.exclMesh = new THREE.Mesh(exclGeo, this.exclMat);
    this.exclMesh.rotation.x = -Math.PI / 2;
    this.exclMesh.position.y = 0.008;
    this.scene.add(this.exclMesh);
  }

  initNetSystem() {
    const THREE = this.THREE;
    this.netGroup = new THREE.Group();
    this.scene.add(this.netGroup);

    // Titanium Anodized Net Posts
    const postMat = new THREE.MeshStandardMaterial({
      color: 0x1e242d,
      roughness: 0.25,
      metalness: 0.88
    });
    const postGeo = new THREE.CylinderGeometry(0.065, 0.075, 3.4, 24);

    this.leftPost = new THREE.Mesh(postGeo, postMat);
    this.leftPost.position.set(-4.5, 1.7, 0);
    this.leftPost.castShadow = true;

    this.rightPost = new THREE.Mesh(postGeo, postMat);
    this.rightPost.position.set(4.5, 1.7, 0);
    this.rightPost.castShadow = true;
    this.netGroup.add(this.leftPost, this.rightPost);

    // Mechanical Telescoping Leadscrew Sleeves
    const sleeveGeo = new THREE.CylinderGeometry(0.085, 0.085, 0.26, 24);
    const sleeveMat = new THREE.MeshStandardMaterial({ color: 0xffd400, roughness: 0.25, metalness: 0.7 });
    this.leftSleeve = new THREE.Mesh(sleeveGeo, sleeveMat);
    this.rightSleeve = new THREE.Mesh(sleeveGeo, sleeveMat);
    this.netGroup.add(this.leftSleeve, this.rightSleeve);

    // Top Canvas White Band
    const topBandGeo = new THREE.BoxGeometry(9.0, 0.07, 0.035);
    const topBandMat = new THREE.MeshStandardMaterial({ color: 0xf5f7fb, roughness: 0.65 });
    this.topBand = new THREE.Mesh(topBandGeo, topBandMat);
    this.topBand.castShadow = true;

    // Bottom Band
    const botBandGeo = new THREE.BoxGeometry(9.0, 0.04, 0.02);
    this.botBand = new THREE.Mesh(botBandGeo, topBandMat);
    this.netGroup.add(this.topBand, this.botBand);

    // Fine Net Mesh Grid (Double-sided semi-transparent grid)
    const meshGeo = new THREE.PlaneGeometry(9.0, 1.0, 54, 12);
    const meshMat = new THREE.MeshBasicMaterial({
      color: 0x90a4b8,
      wireframe: true,
      transparent: true,
      opacity: 0.65
    });
    this.netMesh = new THREE.Mesh(meshGeo, meshMat);
    this.netGroup.add(this.netMesh);

    // Red/White Striped Antennae
    const antennaGeo = new THREE.CylinderGeometry(0.015, 0.015, 1.8, 16);
    const antennaMat = new THREE.MeshStandardMaterial({ color: 0xff3333, roughness: 0.4 });
    this.leftAntenna = new THREE.Mesh(antennaGeo, antennaMat);
    this.rightAntenna = new THREE.Mesh(antennaGeo, antennaMat);
    this.netGroup.add(this.leftAntenna, this.rightAntenna);

    this.updateNetHeight(2.43);
  }

  updateNetHeight(height) {
    this.netHeight = height;
    this.topBand.position.set(0, height - 0.035, 0);
    this.botBand.position.set(0, height - 0.965, 0);
    this.netMesh.position.set(0, height - 0.5, 0);

    this.leftSleeve.position.set(-4.5, height, 0);
    this.rightSleeve.position.set(4.5, height, 0);

    this.leftAntenna.position.set(-3.0, height + 0.35, 0);
    this.rightAntenna.position.set(3.0, height + 0.35, 0);
  }

  initAthlete() {
    const THREE = this.THREE;
    this.athleteGroup = new THREE.Group();
    this.scene.add(this.athleteGroup);

    // High-Tech CAD Biomechanical Mannequin Materials
    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0x32404f,
      roughness: 0.45,
      metalness: 0.25
    });
    const jerseyMat = new THREE.MeshStandardMaterial({
      color: 0x1844bb, // SBL Blue
      roughness: 0.55
    });
    const goldAccent = new THREE.MeshStandardMaterial({
      color: 0xffd400, // SBL Gold
      roughness: 0.35,
      metalness: 0.5
    });
    const jointMat = new THREE.MeshStandardMaterial({
      color: 0x3fd8ff,
      roughness: 0.2,
      metalness: 0.9,
      emissive: 0x004466,
      emissiveIntensity: 0.5
    });

    // 1. Pelvic Base Ground Anchor (WPV 4.2.1 Rule Representation)
    const discGeo = new THREE.CylinderGeometry(0.46, 0.48, 0.02, 32);
    this.pelvisDiscMat = new THREE.MeshStandardMaterial({
      color: 0x00ff88,
      emissive: 0x00ff88,
      emissiveIntensity: 0.7,
      transparent: true,
      opacity: 0.9
    });
    this.pelvisDisc = new THREE.Mesh(discGeo, this.pelvisDiscMat);
    this.pelvisDisc.position.set(0, 0.01, 0);
    this.athleteGroup.add(this.pelvisDisc);

    // Pelvis anatomical cradle
    const pelvisGeo = new THREE.CylinderGeometry(0.26, 0.2, 0.18, 16);
    this.pelvis = new THREE.Mesh(pelvisGeo, bodyMat);
    this.pelvis.position.set(0, 0.12, 0);
    this.athleteGroup.add(this.pelvis);

    // 2. Articulated Spine & Vertebrae Chain
    this.spineGroup = new THREE.Group();
    this.spineGroup.position.set(0, 0.2, 0);
    this.athleteGroup.add(this.spineGroup);

    // Vertebrae discs
    for (let i = 0; i < 3; i++) {
      const v = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.13, 0.04, 12), goldAccent);
      v.position.y = 0.05 + i * 0.07;
      this.spineGroup.add(v);
    }

    // Athletic Torso / Chest (SBL Jersey styling)
    const chestGeo = new THREE.CylinderGeometry(0.32, 0.24, 0.38, 16);
    this.chest = new THREE.Mesh(chestGeo, jerseyMat);
    this.chest.position.y = 0.36;
    this.chest.castShadow = true;
    this.spineGroup.add(this.chest);

    // Number "10" on Chest (Grade 10 representation)
    const numDecal = new THREE.Mesh(new THREE.PlaneGeometry(0.18, 0.18), new THREE.MeshBasicMaterial({ color: 0xffffff }));
    numDecal.position.set(0, 0.38, 0.28);
    this.spineGroup.add(numDecal);

    // Neck & Head
    const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.09, 0.12, 12), bodyMat);
    neck.position.y = 0.58;
    this.spineGroup.add(neck);

    const headGeo = new THREE.SphereGeometry(0.17, 24, 20);
    this.head = new THREE.Mesh(headGeo, bodyMat);
    this.head.position.y = 0.74;
    this.head.castShadow = true;
    this.spineGroup.add(this.head);

    // Cyan HUD Visor
    const visorGeo = new THREE.BoxGeometry(0.24, 0.06, 0.16);
    const visorMat = new THREE.MeshBasicMaterial({ color: 0x3fd8ff });
    this.visor = new THREE.Mesh(visorGeo, visorMat);
    this.visor.position.set(0, 0.76, 0.12);
    this.spineGroup.add(this.visor);

    // 3. Legs Seated Forward on Floor
    const thighGeo = new THREE.CylinderGeometry(0.09, 0.07, 0.48, 12);
    const calfGeo = new THREE.CylinderGeometry(0.07, 0.05, 0.48, 12);
    const shoeGeo = new THREE.BoxGeometry(0.12, 0.08, 0.25);

    // Left Leg
    this.leftLeg = new THREE.Group();
    this.leftLeg.position.set(-0.22, 0.1, 0.12);
    this.leftLeg.rotation.x = Math.PI / 2.2;
    this.leftLeg.rotation.y = -0.16;
    const lThigh = new THREE.Mesh(thighGeo, bodyMat);
    lThigh.position.y = 0.24;
    const lKnee = new THREE.Mesh(new THREE.SphereGeometry(0.08, 12, 12), jointMat);
    lKnee.position.y = 0.48;
    const lCalf = new THREE.Mesh(calfGeo, bodyMat);
    lCalf.position.y = 0.72;
    const lShoe = new THREE.Mesh(shoeGeo, goldAccent);
    lShoe.position.set(0, 0.98, 0.07);
    this.leftLeg.add(lThigh, lKnee, lCalf, lShoe);
    this.athleteGroup.add(this.leftLeg);

    // Right Leg
    this.rightLeg = new THREE.Group();
    this.rightLeg.position.set(0.22, 0.1, 0.12);
    this.rightLeg.rotation.x = Math.PI / 2.2;
    this.rightLeg.rotation.y = 0.16;
    const rThigh = new THREE.Mesh(thighGeo, bodyMat);
    rThigh.position.y = 0.24;
    const rKnee = new THREE.Mesh(new THREE.SphereGeometry(0.08, 12, 12), jointMat);
    rKnee.position.y = 0.48;
    const rCalf = new THREE.Mesh(calfGeo, bodyMat);
    rCalf.position.y = 0.72;
    const rShoe = new THREE.Mesh(shoeGeo, goldAccent);
    rShoe.position.set(0, 0.98, 0.07);
    this.rightLeg.add(rThigh, rKnee, rCalf, rShoe);
    this.athleteGroup.add(this.rightLeg);

    // 4. Arms (Biomechanical Kinetic Chain)
    const armGeo = new THREE.CylinderGeometry(0.065, 0.055, 0.36, 12);
    const handGeo = new THREE.BoxGeometry(0.08, 0.14, 0.035);

    // Left Arm (Floor Fulcrum)
    this.leftArmGroup = new THREE.Group();
    this.leftArmGroup.position.set(-0.38, 0.46, 0);
    this.spineGroup.add(this.leftArmGroup);
    const lShoulder = new THREE.Mesh(new THREE.SphereGeometry(0.085, 12, 12), jointMat);
    this.leftArmGroup.add(lShoulder);
    this.lUpperArm = new THREE.Mesh(armGeo, bodyMat);
    this.lUpperArm.position.y = -0.18;
    this.leftArmGroup.add(this.lUpperArm);

    this.lForearmGroup = new THREE.Group();
    this.lForearmGroup.position.set(0, -0.36, 0);
    this.leftArmGroup.add(this.lForearmGroup);
    const lElbow = new THREE.Mesh(new THREE.SphereGeometry(0.065, 12, 12), jointMat);
    this.lForearmGroup.add(lElbow);
    this.lForearm = new THREE.Mesh(armGeo, bodyMat);
    this.lForearm.position.y = -0.16;
    this.lForearmGroup.add(this.lForearm);
    this.lHand = new THREE.Mesh(handGeo, jointMat);
    this.lHand.position.y = -0.32;
    this.lForearmGroup.add(this.lHand);

    // Right Arm (Dynamic Hitting Arm)
    this.rightArmGroup = new THREE.Group();
    this.rightArmGroup.position.set(0.38, 0.46, 0);
    this.spineGroup.add(this.rightArmGroup);
    const rShoulder = new THREE.Mesh(new THREE.SphereGeometry(0.085, 12, 12), jointMat);
    this.rightArmGroup.add(rShoulder);
    this.rUpperArm = new THREE.Mesh(armGeo, bodyMat);
    this.rUpperArm.position.y = -0.18;
    this.rightArmGroup.add(this.rUpperArm);

    this.rForearmGroup = new THREE.Group();
    this.rForearmGroup.position.set(0, -0.36, 0);
    this.rightArmGroup.add(this.rForearmGroup);
    const rElbow = new THREE.Mesh(new THREE.SphereGeometry(0.065, 12, 12), jointMat);
    this.rForearmGroup.add(rElbow);
    this.rForearm = new THREE.Mesh(armGeo, bodyMat);
    this.rForearm.position.y = -0.16;
    this.rForearmGroup.add(this.rForearm);
    this.rHand = new THREE.Mesh(handGeo, goldAccent);
    this.rHand.position.y = -0.32;
    this.rForearmGroup.add(this.rHand);

    // Seated placement on Team A side (z = -1.6, x = 0)
    this.athleteGroup.position.set(0, 0, -1.6);
  }

  initVolleyball() {
    const THREE = this.THREE;

    // Detailed Mikasa-Style 18-Panel Volleyball
    const ballGeo = new THREE.SphereGeometry(0.13, 36, 28);
    const ballMat = new THREE.MeshStandardMaterial({
      color: 0xf2c400, // Vibrant Gold
      roughness: 0.38,
      metalness: 0.08
    });
    this.ball = new THREE.Mesh(ballGeo, ballMat);
    this.ball.castShadow = true;
    this.scene.add(this.ball);

    // Swirling Blue Aerodynamic Panels
    const ribbonGeo = new THREE.TorusGeometry(0.131, 0.018, 12, 36);
    const blueMat = new THREE.MeshStandardMaterial({ color: 0x1434c4, roughness: 0.4 });
    const whiteMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.4 });

    const b1 = new THREE.Mesh(ribbonGeo, blueMat);
    const b2 = new THREE.Mesh(ribbonGeo, whiteMat);
    b2.rotation.x = Math.PI / 2;
    const b3 = new THREE.Mesh(ribbonGeo, blueMat);
    b3.rotation.y = Math.PI / 2;

    this.ball.add(b1, b2, b3);
    this.ball.position.set(0, 1.8, -3.2);

    // Floor Impact Holographic Target Reticle
    this.shockRingGroup = new THREE.Group();
    this.shockRingGroup.position.set(0.8, 0.015, 3.0);
    this.scene.add(this.shockRingGroup);

    const shockGeo = new THREE.RingGeometry(0.06, 0.16, 36);
    this.shockMat = new THREE.MeshBasicMaterial({
      color: 0x3fd8ff,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0
    });
    this.shockRing = new THREE.Mesh(shockGeo, this.shockMat);
    this.shockRing.rotation.x = -Math.PI / 2;
    this.shockRingGroup.add(this.shockRing);
  }

  initTrajectoryRibbon() {
    const THREE = this.THREE;
    this.maxTrailPoints = 80;
    const trailPositions = new Float32Array(this.maxTrailPoints * 3);
    const trailGeo = new THREE.BufferGeometry();
    trailGeo.setAttribute('position', new THREE.BufferAttribute(trailPositions, 3));

    const trailMat = new THREE.LineBasicMaterial({
      color: 0x45f0dd,
      linewidth: 3,
      transparent: true,
      opacity: 0.85
    });
    this.trailLine = new THREE.Line(trailGeo, trailMat);
    this.scene.add(this.trailLine);
    this.trailHistory = [];
  }

  initCameraPath() {
    // 4 Distinct Camera Moves mapped via monotone cubic interpolation
    // Shot 1: Macro Grazing along 2.43m net (0.0s - 3.0s)
    // Shot 2: Mechanical Net Descent & Biomechanical Framing (3.0s - 5.5s)
    // Shot 3: Hero Strike Dynamic Orbit (5.5s - 8.0s)
    // Shot 4: High Master Wide Orbit & Synthesis (8.0s - 10.0s)

    this.camTrack = track([
      [0.0,  [2.2,  2.3, -3.4]],
      [1.5,  [1.0,  2.45, -2.2]],
      [3.0,  [2.8,  1.9, -1.4]],
      [4.2,  [3.8,  1.5, -0.4]],
      [5.5,  [2.4,  1.1, -2.4]],
      [6.4,  [-1.8, 1.15, -2.5]],
      [7.2,  [-1.1, 1.4, -0.8]],
      [8.0,  [1.9,  2.2,  1.6]],
      [9.0,  [3.6,  3.0,  3.4]],
      [10.0, [4.5,  3.4,  4.0]]
    ]);

    this.targetTrack = track([
      [0.0,  [0.0, 2.43, -0.4]],
      [1.5,  [0.0, 2.43,  0.0]],
      [3.0,  [0.0, 1.90, -0.2]],
      [4.2,  [0.0, 1.15, -0.5]],
      [5.5,  [0.0, 0.85, -1.4]],
      [6.4,  [0.0, 1.35, -1.2]],
      [7.2,  [0.35, 1.15,  0.6]],
      [8.0,  [0.8, 0.35,  2.8]],
      [9.0,  [0.0, 0.60,  0.4]],
      [10.0, [0.0, 0.50,  0.0]]
    ]);
  }

  update(t) {
    const THREE = this.THREE;

    // 1. Camera Keyframe Update
    const cp = this.camTrack(t);
    const tp = this.targetTrack(t);
    this.camera.position.set(cp[0], cp[1], cp[2]);
    this.cameraTarget.set(tp[0], tp[1], tp[2]);
    this.camera.lookAt(this.cameraTarget);

    // 2. Net Height Mechanical Descent (2.43m -> 1.15m)
    let curNetH = 2.43;
    if (t < 2.8) {
      curNetH = 2.43;
    } else if (t <= 4.6) {
      const p = eio(seg(t, 2.8, 4.6));
      curNetH = lerp(2.43, 1.15, p);
    } else {
      curNetH = 1.15;
    }
    this.updateNetHeight(curNetH);

    // 3. Court Markings Contraction (18m x 9m -> 10m x 6m)
    let courtL = 18.0;
    let courtW = 9.0;
    let attackDist = 3.0;

    if (t < 2.8) {
      courtL = 18.0;
      courtW = 9.0;
      attackDist = 3.0;
      this.exclMat.opacity = 0.16;
    } else if (t <= 4.8) {
      const p = eio(seg(t, 2.8, 4.8));
      courtL = lerp(18.0, 10.0, p);
      courtW = lerp(9.0, 6.0, p);
      attackDist = lerp(3.0, 2.0, p);
      this.exclMat.opacity = lerp(0.16, 0.0, p);
    } else {
      courtL = 10.0;
      courtW = 6.0;
      attackDist = 2.0;
      this.exclMat.opacity = 0.0;
    }

    this.courtMesh.scale.set(courtW / 9.0, courtL / 18.0, 1.0);

    const halfW = courtW / 2;
    const halfL = courtL / 2;
    this.boundaryLineGeo.setFromPoints([
      new THREE.Vector3(-halfW, 0.01, -halfL),
      new THREE.Vector3(halfW, 0.01, -halfL),
      new THREE.Vector3(halfW, 0.01, halfL),
      new THREE.Vector3(-halfW, 0.01, halfL)
    ]);
    this.attackLineAGeo.setFromPoints([
      new THREE.Vector3(-halfW, 0.01, -attackDist),
      new THREE.Vector3(halfW, 0.01, -attackDist)
    ]);
    this.attackLineBGeo.setFromPoints([
      new THREE.Vector3(-halfW, 0.01, attackDist),
      new THREE.Vector3(halfW, 0.01, attackDist)
    ]);

    // 4. Biomechanical Athlete Kinematics
    if (t < 5.2) {
      // Idle seated tracking
      this.spineGroup.rotation.y = Math.sin(t * 1.6) * 0.05;
      this.spineGroup.rotation.x = -0.05;
      this.rightArmGroup.rotation.set(0.3, 0, 0.2);
      this.leftArmGroup.rotation.set(-0.2, 0, -0.4);
      this.rForearmGroup.rotation.x = -0.8;
      this.lForearmGroup.rotation.x = -0.5;
      this.pelvisDiscMat.color.setHex(t >= 3.0 ? 0x00ff88 : 0x3fd8ff);
    } else if (t < 6.45) {
      // Wind-up: Plant left hand, arch core, cock hitting arm
      const p = seg(t, 5.2, 6.45);
      const easeWind = eio(p);
      this.spineGroup.rotation.y = lerp(0, -0.48, easeWind);
      this.spineGroup.rotation.x = lerp(-0.05, -0.28, easeWind);

      this.leftArmGroup.rotation.set(lerp(-0.2, 0.42, easeWind), 0, lerp(-0.4, -0.72, easeWind));
      this.lForearmGroup.rotation.x = lerp(-0.5, -0.92, easeWind);

      this.rightArmGroup.rotation.set(lerp(0.3, -1.85, easeWind), 0, lerp(0.2, 0.65, easeWind));
      this.rForearmGroup.rotation.x = lerp(-0.8, -1.45, easeWind);
      this.head.rotation.set(0.2, 0.25, 0);
    } else if (t < 7.2) {
      // Forward Strike! Explosive core flexion & spike
      const p = seg(t, 6.45, 7.2);
      const easeStrike = eo(p);
      this.spineGroup.rotation.y = lerp(-0.48, 0.38, easeStrike);
      this.spineGroup.rotation.x = lerp(-0.28, 0.36, easeStrike);

      this.rightArmGroup.rotation.set(lerp(-1.85, 1.25, easeStrike), 0, lerp(0.65, -0.1, easeStrike));
      this.rForearmGroup.rotation.x = lerp(-1.45, -0.2, easeStrike);
    } else {
      // Follow-through & Recovery
      const p = ss(seg(t, 7.2, 8.8));
      this.spineGroup.rotation.y = lerp(0.38, 0.05, p);
      this.spineGroup.rotation.x = lerp(0.36, -0.05, p);
      this.rightArmGroup.rotation.set(lerp(1.25, 0.4, p), 0, lerp(-0.1, 0.2, p));
      this.rForearmGroup.rotation.x = lerp(-0.2, -0.7, p);
    }

    // 5. Volleyball Trajectory
    let ballPos = new THREE.Vector3(0, 1.8, -3.2);
    if (t < 5.0) {
      const p = seg(t, 3.5, 5.0);
      ballPos.set(
        lerp(0.4, 0.1, p),
        lerp(2.2, 1.7, p) + Math.sin(t * 3) * 0.03,
        lerp(-3.8, -2.1, p)
      );
      this.ball.rotation.x += 0.02;
    } else if (t < 6.45) {
      const p = seg(t, 5.0, 6.45);
      const hArc = Math.sin(p * Math.PI) * 0.4;
      ballPos.set(
        lerp(0.1, 0.22, p),
        lerp(1.7, 1.55, p) + hArc,
        lerp(-2.1, -1.35, p)
      );
      this.ball.rotation.x += 0.03;
    } else if (t < 7.8) {
      const p = seg(t, 6.45, 7.8);
      const flightApex = Math.sin(p * Math.PI) * 0.38;
      ballPos.set(
        lerp(0.22, 0.8, p),
        lerp(1.55, 0.13, p) + flightApex,
        lerp(-1.35, 3.0, p)
      );
      this.ball.rotation.x += 0.28;
      this.ball.rotation.y += 0.18;
    } else {
      const p = seg(t, 7.8, 9.2);
      const bounceH = Math.max(0, Math.sin(p * Math.PI * 2) * 0.25 * Math.exp(-p * 3));
      ballPos.set(
        lerp(0.8, 0.95, p),
        0.13 + bounceH,
        lerp(3.0, 3.3, p)
      );
      this.ball.rotation.x += 0.05 * (1 - p);
    }
    this.ball.position.copy(ballPos);

    // Impact Shockwave
    if (t >= 7.75 && t < 9.6) {
      const sp = seg(t, 7.75, 9.6);
      const rScale = lerp(1, 15, eo(sp));
      this.shockRing.scale.set(rScale, rScale, 1);
      this.shockMat.opacity = lerp(0.9, 0, eo(sp));
    } else {
      this.shockMat.opacity = 0;
    }

    // Trajectory Comet Ribbon
    if (t >= 5.0 && t <= 8.5) {
      this.trailHistory.push(ballPos.clone());
      if (this.trailHistory.length > this.maxTrailPoints) this.trailHistory.shift();
      const posAttr = this.trailLine.geometry.attributes.position;
      for (let i = 0; i < this.trailHistory.length; i++) {
        posAttr.setXYZ(i, this.trailHistory[i].x, this.trailHistory[i].y, this.trailHistory[i].z);
      }
      posAttr.needsUpdate = true;
      this.trailLine.geometry.setDrawRange(0, this.trailHistory.length);
    } else if (t < 5.0) {
      this.trailHistory = [];
      this.trailLine.geometry.setDrawRange(0, 0);
    }

    // Render WebGL
    this.renderer.render(this.scene, this.camera);
  }

  projectToScreen(x, y, z) {
    const v = new this.THREE.Vector3(x, y, z);
    v.project(this.camera);
    return {
      x: (v.x * 0.5 + 0.5) * this.W,
      y: (-(v.y * 0.5) + 0.5) * this.H,
      z: v.z,
      visible: v.z < 1.0
    };
  }
}
