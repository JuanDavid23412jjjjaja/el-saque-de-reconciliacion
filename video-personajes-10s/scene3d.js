// scene3d.js - High-End 3D Court, PBR Lighting & Character Choreography for 10-Second Showcase
const THREE = window.THREE;
import { CharacterBuilder } from './characters.js';
import { clamp, easeOutCubic, easeInOutCubic, smoothstep } from './lib.js?v=4';

export class Scene3D {
  constructor(canvas) {
    this.canvas = canvas;
    this.width = canvas.width || 1920;
    this.height = canvas.height || 1080;

    // Renderer
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(this.width, this.height, false);
    this.renderer.setPixelRatio(1);
    this.renderer.outputEncoding = THREE.sRGBEncoding;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.2;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // Scene & Camera
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x060911);
    this.scene.fog = new THREE.FogExp2(0x060911, 0.045);

    this.camera = new THREE.PerspectiveCamera(40, this.width / this.height, 0.1, 100);

    // Setup Environment, Lighting, Characters
    this.setupLighting();
    this.setupCourt();
    this.setupCharacters();
    this.setupVolleyball();
    this.setupVFX();
  }

  setupLighting() {
    // Ambient / Environment Fill
    const hemiLight = new THREE.HemisphereLight(0xdce8ff, 0x091428, 0.85);
    this.scene.add(hemiLight);

    // Key Directional Light (Soft Studio Sun)
    this.keyLight = new THREE.DirectionalLight(0xfff6ea, 2.2);
    this.keyLight.position.set(4, 7, 5);
    this.keyLight.castShadow = true;
    this.keyLight.shadow.mapSize.width = 2048;
    this.keyLight.shadow.mapSize.height = 2048;
    this.keyLight.shadow.camera.near = 1;
    this.keyLight.shadow.camera.far = 20;
    this.keyLight.shadow.camera.left = -6;
    this.keyLight.shadow.camera.right = 6;
    this.keyLight.shadow.camera.top = 6;
    this.keyLight.shadow.camera.bottom = -6;
    this.keyLight.shadow.bias = -0.0005;
    this.scene.add(this.keyLight);

    // Cyan Rim Light (Right-Rear edge definition)
    this.cyanRim = new THREE.DirectionalLight(0x3fd8ff, 2.6);
    this.cyanRim.position.set(-5, 4, -4);
    this.scene.add(this.cyanRim);

    // Gold Rim Light (Left-Rear edge definition)
    this.goldRim = new THREE.DirectionalLight(0xffd400, 2.2);
    this.goldRim.position.set(5, 3.5, -4);
    this.scene.add(this.goldRim);

    // Deep Floor Fill (Upward bounce from SBL blue court)
    this.floorBounce = new THREE.DirectionalLight(0x143ea6, 0.7);
    this.floorBounce.position.set(0, -2, 2);
    this.scene.add(this.floorBounce);

    // Overhead Center Spotlights
    this.spotCenter = new THREE.SpotLight(0xffffff, 2.5, 14, Math.PI / 4, 0.4, 1.2);
    this.spotCenter.position.set(0, 7.5, 0);
    this.spotCenter.target.position.set(0, 0, 0);
    this.scene.add(this.spotCenter);
    this.scene.add(this.spotCenter.target);
  }

  setupCourt() {
    const courtGroup = new THREE.Group();

    // 1. Duela Parquet Floor
    const floorGeo = new THREE.PlaneGeometry(28, 20);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x1b2438,
      roughness: 0.28,
      metalness: 0.15,
      flatShading: true
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    courtGroup.add(floor);

    // 2. Sitting Volleyball Regulation Court (10m x 6m)
    // SBL Blue Court Infield
    const infieldGeo = new THREE.PlaneGeometry(6, 10);
    const infieldMat = new THREE.MeshStandardMaterial({
      color: 0x12368c,
      roughness: 0.32,
      metalness: 0.1,
      flatShading: true
    });
    const infield = new THREE.Mesh(infieldGeo, infieldMat);
    infield.rotation.x = -Math.PI / 2;
    infield.position.y = 0.002;
    infield.receiveShadow = true;
    courtGroup.add(infield);

    // Attack zones (2m from net on each side)
    const attackZoneGeo = new THREE.PlaneGeometry(6, 2);
    const attackZoneMat = new THREE.MeshStandardMaterial({
      color: 0x0f2d74,
      roughness: 0.35,
      flatShading: true
    });
    const attackZ1 = new THREE.Mesh(attackZoneGeo, attackZoneMat);
    attackZ1.rotation.x = -Math.PI / 2;
    attackZ1.position.set(0, 0.003, 1);
    attackZ1.receiveShadow = true;
    const attackZ2 = new THREE.Mesh(attackZoneGeo, attackZoneMat);
    attackZ2.rotation.x = -Math.PI / 2;
    attackZ2.position.set(0, 0.003, -1);
    attackZ2.receiveShadow = true;
    courtGroup.add(attackZ1, attackZ2);

    // Court White Boundary Lines
    const lineMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const addLine = (w, h, x, z) => {
      const line = new THREE.Mesh(new THREE.PlaneGeometry(w, h), lineMat);
      line.rotation.x = -Math.PI / 2;
      line.position.set(x, 0.005, z);
      courtGroup.add(line);
    };

    // Boundary perimeter (6m x 10m)
    addLine(6.08, 0.05, 0, 5.0);
    addLine(6.08, 0.05, 0, -5.0);
    addLine(0.05, 10.05, -3.0, 0);
    addLine(0.05, 10.05, 3.0, 0);

    // Attack lines (2m from center line)
    addLine(6.0, 0.05, 0, 2.0);
    addLine(6.0, 0.05, 0, -2.0);

    // Center Line (0m directly under net)
    const centerLineMat = new THREE.MeshBasicMaterial({ color: 0xffd400 });
    const centerLine = new THREE.Mesh(new THREE.PlaneGeometry(6.0, 0.06), centerLineMat);
    centerLine.rotation.x = -Math.PI / 2;
    centerLine.position.set(0, 0.006, 0);
    courtGroup.add(centerLine);

    // 3. Center Court SBL Crest Texture
    const crestCanvas = document.createElement('canvas');
    crestCanvas.width = 512;
    crestCanvas.height = 512;
    const cctx = crestCanvas.getContext('2d');
    cctx.fillStyle = 'transparent';
    cctx.clearRect(0, 0, 512, 512);

    // Concentric gold & white rings
    cctx.strokeStyle = '#ffd400';
    cctx.lineWidth = 14;
    cctx.beginPath();
    cctx.arc(256, 256, 220, 0, Math.PI * 2);
    cctx.stroke();

    cctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    cctx.lineWidth = 4;
    cctx.beginPath();
    cctx.arc(256, 256, 195, 0, Math.PI * 2);
    cctx.stroke();

    // Emblem Text
    cctx.fillStyle = '#ffffff';
    cctx.font = '900 36px "Inter", sans-serif';
    cctx.textAlign = 'center';
    cctx.letterSpacing = '3px';
    cctx.fillText('SAN BONIFACIO', 256, 240);

    cctx.fillStyle = '#ffd400';
    cctx.font = '700 20px "JetBrains Mono", monospace';
    cctx.letterSpacing = '2px';
    cctx.fillText('DE LAS LANZAS', 256, 280);

    cctx.fillStyle = 'rgba(63, 216, 255, 0.9)';
    cctx.font = '800 16px "JetBrains Mono", monospace';
    cctx.fillText('GRADO 10° · VOLEIBOL SENTADO', 256, 320);

    const crestTex = new THREE.CanvasTexture(crestCanvas);
    const crestMat = new THREE.MeshBasicMaterial({ map: crestTex, transparent: true, opacity: 0.85 });
    const crestMesh = new THREE.Mesh(new THREE.PlaneGeometry(3.6, 3.6), crestMat);
    crestMesh.rotation.x = -Math.PI / 2;
    crestMesh.position.set(0, 0.007, 0);
    courtGroup.add(crestMesh);

    // 4. Sitting Volleyball Regulation Net (Height = 1.15m)
    const netGroup = new THREE.Group();

    // Titanium Support Posts (at x = -3.5 and +3.5)
    const postMat = new THREE.MeshStandardMaterial({ color: 0x8292a8, metalness: 0.85, roughness: 0.2, flatShading: true });
    const postGeo = new THREE.CylinderGeometry(0.06, 0.06, 1.45, 12);

    const postL = new THREE.Mesh(postGeo, postMat);
    postL.position.set(-3.5, 0.725, 0);
    postL.castShadow = true;
    const postR = new THREE.Mesh(postGeo, postMat);
    postR.position.set(3.5, 0.725, 0);
    postR.castShadow = true;
    netGroup.add(postL, postR);

    // Net Mesh Plane (7.0m wide, 0.8m height, bottom at y = 0.35m, top at y = 1.15m)
    const netMeshCanvas = document.createElement('canvas');
    netMeshCanvas.width = 256;
    netMeshCanvas.height = 256;
    const nctx = netMeshCanvas.getContext('2d');
    nctx.fillStyle = 'rgba(0,0,0,0)';
    nctx.clearRect(0, 0, 256, 256);
    nctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
    nctx.lineWidth = 3;
    for (let i = 0; i <= 256; i += 24) {
      nctx.beginPath(); nctx.moveTo(i, 0); nctx.lineTo(i, 256); nctx.stroke();
      nctx.beginPath(); nctx.moveTo(0, i); nctx.lineTo(256, i); nctx.stroke();
    }
    const netMeshTex = new THREE.CanvasTexture(netMeshCanvas);
    netMeshTex.wrapS = THREE.RepeatWrapping;
    netMeshTex.wrapT = THREE.RepeatWrapping;
    netMeshTex.repeat.set(28, 4);

    const netMat = new THREE.MeshStandardMaterial({
      map: netMeshTex,
      transparent: true,
      opacity: 0.75,
      roughness: 0.6,
      side: THREE.DoubleSide
    });
    const netMesh = new THREE.Mesh(new THREE.PlaneGeometry(7.0, 0.8), netMat);
    netMesh.position.set(0, 0.75, 0);
    netGroup.add(netMesh);

    // White Top Band (Width: 7.0m, height: 0.07m, positioned exactly at y = 1.15m)
    const bandMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.35 });
    const topBand = new THREE.Mesh(new THREE.BoxGeometry(7.0, 0.065, 0.04), bandMat);
    topBand.position.set(0, 1.15, 0);
    netGroup.add(topBand);

    // Blue Bottom Band
    const botBand = new THREE.Mesh(new THREE.BoxGeometry(7.0, 0.04, 0.03), new THREE.MeshStandardMaterial({ color: 0x143ea6 }));
    botBand.position.set(0, 0.35, 0);
    netGroup.add(botBand);

    // Red & White Antennae at court edges (-3.0m and +3.0m)
    const antGeo = new THREE.CylinderGeometry(0.015, 0.015, 1.8, 8);
    const antMat = new THREE.MeshStandardMaterial({ color: 0xff2840, roughness: 0.4 });
    const antL = new THREE.Mesh(antGeo, antMat);
    antL.position.set(-3.0, 1.25, 0);
    const antR = new THREE.Mesh(antGeo, antMat);
    antR.position.set(3.0, 1.25, 0);
    netGroup.add(antL, antR);

    courtGroup.add(netGroup);
    this.scene.add(courtGroup);
  }

  setupCharacters() {
    this.builder = new CharacterBuilder(THREE);

    // Build the 3 models
    this.sofia = this.builder.buildSofia();
    this.juan = this.builder.buildJuanDiego();
    this.martin = this.builder.buildMartin();

    // Wheelchairs for the athletes
    this.wheelchairSofia = this.builder.createWheelchair('gold');
    this.wheelchairJuan = this.builder.createWheelchair('cyan');
    this.wheelchairMartin = this.builder.createWheelchair('gold');

    [this.wheelchairSofia, this.wheelchairJuan, this.wheelchairMartin].forEach(w => {
      w.traverse(node => {
        if (node.isMesh) {
          node.castShadow = true;
          node.receiveShadow = true;
        }
      });
      this.scene.add(w);
    });

    // Enable shadows on all character meshes
    [this.sofia, this.juan, this.martin].forEach(char => {
      char.traverse(node => {
        if (node.isMesh) {
          node.castShadow = true;
          node.receiveShadow = true;
        }
      });
      this.scene.add(char);
    });

    // Initial Standing Poses & Positions
    // Sofía: Leader at net right-center
    this.sofia.position.set(-0.2, 0, 1.3);
    this.sofia.rotation.y = 0.25;

    // Martín: Tactician setter near net center
    this.martin.position.set(1.4, 0, 0.9);
    this.martin.rotation.y = -0.4;

    // Juan Diego: Heavy spiker on attack line
    this.juan.position.set(-1.6, 0, 2.2);
    this.juan.rotation.y = 0.15;

    // Wheelchair initial setup (visible when sitting)
    this.wheelchairSofia.visible = false;
    this.wheelchairJuan.visible = false;
    this.wheelchairMartin.visible = false;
  }

  setupVolleyball() {
    // Low-poly Tricolor Mikasa V200W
    const ballGroup = new THREE.Group();
    const ballGeo = new THREE.DodecahedronGeometry(0.12, 2);

    // Procedural Mikasa Tricolor Texture
    const ballCanvas = document.createElement('canvas');
    ballCanvas.width = 256;
    ballCanvas.height = 256;
    const bctx = ballCanvas.getContext('2d');
    bctx.fillStyle = '#ffd400'; // Yellow
    bctx.fillRect(0, 0, 256, 256);
    bctx.fillStyle = '#143ea6'; // Blue swirl
    bctx.beginPath();
    bctx.arc(128, 128, 110, 0, Math.PI);
    bctx.fill();
    bctx.fillStyle = '#ffffff'; // White crest
    bctx.beginPath();
    bctx.arc(128, 128, 50, 0, Math.PI * 2);
    bctx.fill();

    const ballTex = new THREE.CanvasTexture(ballCanvas);
    const ballMat = new THREE.MeshStandardMaterial({
      map: ballTex,
      roughness: 0.35,
      metalness: 0.1,
      flatShading: true
    });
    this.ballMesh = new THREE.Mesh(ballGeo, ballMat);
    this.ballMesh.castShadow = true;
    ballGroup.add(this.ballMesh);

    // Ball motion comet trail (ribbon of light)
    const trailGeo = new THREE.CylinderGeometry(0.005, 0.08, 1.2, 8, 1, true);
    const trailMat = new THREE.MeshBasicMaterial({
      color: 0x3fd8ff,
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide
    });
    this.ballTrail = new THREE.Mesh(trailGeo, trailMat);
    this.ballTrail.rotation.x = Math.PI / 2;
    this.ballTrail.position.z = 0.6;
    ballGroup.add(this.ballTrail);

    this.ball = ballGroup;
    this.ball.position.set(1.4, 1.15, 0.9); // starts with Martín
    this.scene.add(this.ball);
  }

  setupVFX() {
    // Holographic Floor Shockwave Ring on spike impact
    const ringGeo = new THREE.RingGeometry(0.1, 0.25, 32);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x3fd8ff,
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide
    });
    this.shockwave = new THREE.Mesh(ringGeo, ringMat);
    this.shockwave.rotation.x = -Math.PI / 2;
    this.shockwave.position.set(0.4, 0.01, -2.4);
    this.scene.add(this.shockwave);

    // Pelvic contact indicator disk (World ParaVolley rule validator under Juan Diego)
    const diskGeo = new THREE.RingGeometry(0.2, 0.38, 24);
    const diskMat = new THREE.MeshBasicMaterial({
      color: 0x00ffaa,
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide
    });
    this.pelvicDisk = new THREE.Mesh(diskGeo, diskMat);
    this.pelvicDisk.rotation.x = -Math.PI / 2;
    this.scene.add(this.pelvicDisk);
  }

  // --- Main Per-Frame Cinematic Choreography ---
  renderFrame(t) {
    // 1. Natural blinking cadence
    const blinkSofia = (t > 1.1 && t < 1.25) || (t > 2.5 && t < 2.65) ? 1.0 : 0.0;
    const blinkMartin = (t > 4.2 && t < 4.35) || (t > 5.6 && t < 5.75) ? 1.0 : 0.0;
    const blinkJuan = (t > 6.9 && t < 7.05) || (t > 8.8 && t < 8.95) ? 1.0 : 0.0;

    this.sofia.setBlink(blinkSofia);
    this.martin.setBlink(blinkMartin);
    this.juan.setBlink(blinkJuan);

    // 2. Continuous Organic Idle (Breathing and Gentle Balance)
    const breath = Math.sin(t * 3.5) * 0.015;
    this.sofia.userData.spine.position.y = 0.42 + breath;
    this.martin.userData.spine.position.y = 0.44 + breath;
    this.juan.userData.spine.position.y = 0.44 + breath;

    // -------------------------------------------------------------
    // SHOT 1: 0.0s – 3.2s | SOFÍA (#4 CAPITANA) MONOLOGUE & WELCOME
    // -------------------------------------------------------------
    if (t < 3.2) {
      const p = t / 3.2;

      // Camera: Smooth orbit around Sofía at eye level
      const camX = -0.2 + Math.sin(p * 0.6 + 0.3) * 1.5;
      const camY = 1.35 + Math.cos(p * 0.5) * 0.08;
      const camZ = 1.3 + Math.cos(p * 0.6 + 0.3) * 1.5;
      this.camera.position.set(camX, camY, camZ);
      this.camera.lookAt(-0.2, 1.25, 1.3);

      // Sofía Speaking Envelope: Speech audio runs 0.25s to 3.02s
      if (t >= 0.25 && t <= 3.02) {
        // Speech rhythm envelope based on actual phoneme cadence
        const speechAmp = Math.max(0, Math.sin(t * 18.0) * Math.sin(t * 7.5)) * 1.2;
        this.sofia.setTalking(speechAmp);

        // Right arm welcomes and gestures
        this.sofia.userData.rightArm.rotation.x = -0.4 + Math.sin(t * 4.0) * 0.2;
        this.sofia.userData.rightArm.rotation.z = -0.5 + Math.sin(t * 5.0) * 0.15;
        this.sofia.userData.rightForearm.rotation.x = -0.6 + Math.sin(t * 4.0) * 0.25;

        // Left arm resting gracefully on hip
        this.sofia.userData.leftArm.rotation.z = 0.35;
        this.sofia.userData.leftForearm.rotation.x = -0.5;
      } else {
        this.sofia.setTalking(0);
      }

      // Background Teammates idle in place
      this.martin.userData.rightArm.rotation.x = -0.3;
      this.martin.userData.ball.rotation.y = t * 3.0; // spinning ball
      this.ball.position.set(1.4, 1.15 + Math.sin(t * 2.0) * 0.02, 0.9);

      this.shockwave.material.opacity = 0;
      this.pelvicDisk.material.opacity = 0;
    }

    // -------------------------------------------------------------
    // SHOT 2: 3.2s – 6.4s | MARTÍN (#10 ARMADOR) TACTICAL ANALYSIS
    // -------------------------------------------------------------
    else if (t < 6.4) {
      const p = (t - 3.2) / 3.2;

      // Camera: Whip dolly to Martín in 3/4 view
      const camX = 1.4 + Math.cos(p * 0.7 - 0.5) * 1.6;
      const camY = 1.3 + Math.sin(p * 0.4) * 0.06;
      const camZ = 0.9 + Math.sin(p * 0.7 - 0.5) * 1.6;
      this.camera.position.set(camX, camY, camZ);
      this.camera.lookAt(1.4, 1.22, 0.9);

      // Sofía rests in attentive pose
      this.sofia.setTalking(0);
      this.sofia.userData.rightArm.rotation.set(0, 0, -0.15);

      // Martín Speaking Envelope: Speech audio runs 3.15s to 5.43s
      if (t >= 3.15 && t <= 5.43) {
        const speechAmp = Math.max(0, Math.sin(t * 19.0) * Math.sin(t * 8.0)) * 1.2;
        this.martin.setTalking(speechAmp);

        // Martín raises right hand pointing to the 1.15m net
        this.martin.userData.rightArm.rotation.x = -0.8 + Math.sin(t * 4.5) * 0.15;
        this.martin.userData.rightArm.rotation.z = 0.4 + Math.sin(t * 3.5) * 0.1;
        this.martin.userData.rightForearm.rotation.x = -0.5;

        // Left hand holds and balances the spinning Mikasa ball
        this.martin.userData.leftArm.rotation.x = -0.6;
        this.martin.userData.leftArm.rotation.z = 0.3;
        this.martin.userData.leftForearm.rotation.x = -0.7;

        this.ball.position.set(1.22, 1.28 + Math.sin(t * 4.0) * 0.03, 0.95);
        this.ballMesh.rotation.y = t * 6.0;
        this.ballMesh.rotation.x = t * 2.0;
      } else {
        this.martin.setTalking(0);
      }

      // From 5.6s onwards, transition team toward seated positions in wheelchairs
      if (t > 5.5) {
        const sitP = easeInOutCubic(clamp((t - 5.5) / 0.9, 0, 1));
        this.wheelchairJuan.visible = true;
        this.wheelchairJuan.position.set(-0.6, 0, 1.4);
        this.setNaturalSitting(this.juan, sitP);
        this.juan.position.set(-0.6, 0, 1.4);
      }
    }

    // -------------------------------------------------------------
    // SHOT 3: 6.4s – 10.0s | JUAN DIEGO (#7 REMATADOR) & SEATED SPIKE!
    // -------------------------------------------------------------
    else {
      const p = (t - 6.4) / 3.6;

      // Ensure all 3 are in Natural Wheelchair Sitting Posture!
      this.wheelchairSofia.visible = true;
      this.wheelchairJuan.visible = true;
      this.wheelchairMartin.visible = true;

      this.wheelchairSofia.position.set(-1.8, 0, 2.5);
      this.wheelchairSofia.rotation.y = 0.3;
      this.wheelchairMartin.position.set(0.8, 0, 1.0);
      this.wheelchairMartin.rotation.y = -0.4;
      this.wheelchairJuan.position.set(-0.6, 0, 1.4);
      this.wheelchairJuan.rotation.y = 0.1;

      this.setNaturalSitting(this.sofia, 1.0);
      this.setNaturalSitting(this.martin, 1.0);
      this.setNaturalSitting(this.juan, 1.0);

      this.sofia.position.set(-1.8, 0, 2.5);
      this.sofia.rotation.y = 0.3;
      this.martin.position.set(0.8, 0, 1.0);
      this.martin.rotation.y = -0.4;
      this.juan.position.set(-0.6, 0, 1.4);
      this.juan.rotation.y = 0.1;

      // Wheelchair contact indicator glow
      this.pelvicDisk.position.set(this.juan.position.x, 0.008, this.juan.position.z);
      this.pelvicDisk.material.opacity = 0.85;

      // Juan Diego Speech: 5.75s to 7.65s
      if (t <= 7.65) {
        const speechAmp = Math.max(0, Math.sin(t * 20.0) * Math.sin(t * 9.0)) * 1.3;
        this.juan.setTalking(speechAmp);

        // Camera: Heroic angle looking at Juan Diego in his sport wheelchair
        const camP = clamp((t - 6.4) / 1.2, 0, 1);
        this.camera.position.set(
          -0.6 + Math.sin(camP * 0.5 + 0.6) * 1.9,
          0.85 + camP * 0.1,
          1.4 + Math.cos(camP * 0.5 + 0.6) * 1.9
        );
        this.camera.lookAt(-0.6, 0.75, 1.4);
      } else {
        this.juan.setTalking(0);
      }

      // Ball & Volleyball Play Kinematics:
      // 7.4s - 7.9s: Martín sets the ball high near the net
      if (t >= 7.4 && t < 7.9) {
        const setP = (t - 7.4) / 0.5;
        // Parabolic set from Martín to Juan Diego's spike window
        const bx = 0.8 + (-0.6 - 0.8) * setP;
        const bz = 1.0 + (0.5 - 1.0) * setP;
        const by = 0.8 + 1.1 * Math.sin(setP * Math.PI) + 0.3 * setP;
        this.ball.position.set(bx, by, bz);
        this.ballMesh.rotation.x = t * 8.0;

        // Juan Diego cocks back for the spike from his wheelchair
        this.juan.userData.spine.rotation.y = -0.5 * setP;
        this.juan.userData.rightArm.rotation.x = -1.8 * setP;
        this.juan.userData.rightArm.rotation.z = -0.6 * setP;
        this.juan.userData.rightForearm.rotation.x = -1.2 * setP;
      }
      // 7.9s - 8.2s: SPIKE STRIKE (Snap forward and down from wheelchair)
      else if (t >= 7.9 && t < 8.2) {
        const strikeP = (t - 7.9) / 0.3;
        this.ball.position.set(-0.6 + strikeP * 0.1, 1.7 - strikeP * 0.2, 0.5 - strikeP * 0.3);

        // Core torques forward, compression-sleeved arm whips straight through ball
        this.juan.userData.spine.rotation.x = 0.35 * strikeP;
        this.juan.userData.spine.rotation.y = 0.3 * strikeP;
        this.juan.userData.rightArm.rotation.x = -1.8 + 2.6 * strikeP;
        this.juan.userData.rightArm.rotation.z = -0.2;
        this.juan.userData.rightForearm.rotation.x = 0;
      }
      // 8.2s - 8.7s: Ball Rockets over the 1.15m net with comet trail into opponent court!
      else if (t >= 8.2 && t < 8.7) {
        const flyP = (t - 8.2) / 0.5;
        const startX = -0.5, endX = 0.4;
        const startZ = 0.2, endZ = -2.4;
        const startY = 1.3, endY = 0.12;

        const bx = startX + (endX - startX) * flyP;
        const bz = startZ + (endZ - startZ) * flyP;
        const by = startY + (endY - startY) * flyP - 0.2 * Math.sin(flyP * Math.PI);

        this.ball.position.set(bx, by, bz);
        this.ballMesh.rotation.x = t * 25.0;
        this.ballMesh.rotation.y = t * 15.0;

        // Activate glowing comet trail
        this.ballTrail.material.opacity = 0.85;
      }
      // 8.7s - 10.0s: Floor Impact & Victory Celebration!
      else if (t >= 8.7) {
        // Ball bounces off floor
        const bounceP = clamp((t - 8.7) / 1.3, 0, 1);
        this.ball.position.set(0.4, 0.12 + Math.abs(Math.sin(bounceP * 4.0)) * 0.45 * (1 - bounceP), -2.4 + bounceP * 0.3);
        this.ballTrail.material.opacity = Math.max(0, 0.85 - bounceP * 2.5);

        // Shockwave expands on duela floor
        const swP = clamp((t - 8.7) / 0.8, 0, 1);
        const scale = 1.0 + swP * 4.5;
        this.shockwave.scale.set(scale, scale, scale);
        this.shockwave.material.opacity = Math.max(0, 0.9 * (1.0 - swP));

        // Camera: Grand cinematic pull-out to master isometric celebration view
        const grandP = easeOutCubic(clamp((t - 8.7) / 1.3, 0, 1));
        const camX = -0.6 + (3.6 - (-0.6)) * grandP;
        const camY = 0.6 + (2.6 - 0.6) * grandP;
        const camZ = 1.4 + (4.4 - 1.4) * grandP;
        this.camera.position.set(camX, camY, camZ);
        this.camera.lookAt(0, 0.6, 0);

        // Team Celebrates: Arms up in Victory!
        this.sofia.userData.rightArm.rotation.z = -1.2;
        this.sofia.userData.leftArm.rotation.z = 1.2;
        this.sofia.userData.rightForearm.rotation.x = -0.5;
        this.sofia.userData.leftForearm.rotation.x = -0.5;

        this.juan.userData.rightArm.rotation.x = -1.4;
        this.juan.userData.rightArm.rotation.z = -0.6;
        this.juan.userData.leftArm.rotation.x = -1.4;
        this.juan.userData.leftArm.rotation.z = 0.6;

        this.martin.userData.rightArm.rotation.x = -1.5;
        this.martin.userData.rightArm.rotation.z = 0.3;
      }
    }

    // Render 3D Scene
    this.renderer.render(this.scene, this.camera);
  }

  // Helper: Natural Wheelchair Seated Posture (Feet naturally supported on footrest)
  setNaturalSitting(char, p) {
    const d = char.userData;
    if (!d) return;

    const standY = d.id === 'juandiego' ? 0.94 : (d.id === 'martin' ? 0.91 : 0.88);
    const seatY = d.id === 'juandiego' ? 0.55 : (d.id === 'martin' ? 0.53 : 0.51);

    // Pelvis sitting on wheelchair cushion
    d.pelvis.position.y = standY * (1 - p) + seatY * p;
    d.pelvis.position.z = -0.06 * p;
    d.pelvis.rotation.x = -0.06 * p;

    // Thighs 90° forward, knees 90° down -> Calves vertical, feet flat on footrest!
    d.leftLeg.rotation.x = (-Math.PI / 2 + 0.05) * p;
    d.rightLeg.rotation.x = (-Math.PI / 2 + 0.05) * p;
    d.leftLeg.rotation.z = -0.06 * p;
    d.rightLeg.rotation.z = 0.06 * p;

    d.leftKnee.rotation.x = (Math.PI / 2 - 0.04) * p;
    d.rightKnee.rotation.x = (Math.PI / 2 - 0.04) * p;

    // Spine upright
    d.spine.rotation.x = 0.04 * p;
  }

  // Helper: World ParaVolley Seated Posture (Pelvis on duela, legs forward, hands on floor)
  setSeatedPosture(char, p) {
    const d = char.userData;
    if (!d) return;

    // Pelvis on ground (y = 0.12)
    d.pelvis.position.y = 0.78 * (1 - p) + 0.14 * p;

    // Legs extended forward on duela
    d.leftLeg.rotation.x = -1.45 * p;
    d.rightLeg.rotation.x = -1.45 * p;
    d.leftLeg.rotation.z = -0.15 * p;
    d.rightLeg.rotation.z = 0.15 * p;

    d.leftKnee.rotation.x = 0.25 * p;
    d.rightKnee.rotation.x = 0.25 * p;

    // Torso upright with slight athletic forward pitch
    d.spine.rotation.x = 0.18 * p;

    // Arms down near floor as balance fulcrums
    if (p > 0.8 && char.userData.id !== 'juandiego') {
      d.leftArm.rotation.x = 0.4;
      d.rightArm.rotation.x = 0.4;
      d.leftArm.rotation.z = 0.35;
      d.rightArm.rotation.z = -0.35;
    }
  }
}
