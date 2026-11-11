/**
 * Scene3D - Modelado 3D Procedural en Three.js
 * Proyecto: "El Saque de Reconciliación" - Colegio San Bonifacio de las Lanzas
 * Creado siguiendo los patrones del repositorio awesome-opus5-5-videos:
 * - Modelado 100% en código (cero dependencias de modelos externos rotos)
 * - Cancha transformable (Tradicional 18x9m / Red 2.43m -> Sentado 10x6m / Red 1.15m)
 * - Rigs procedurales articulados con indicador de pelvis en suelo (World ParaVolley)
 * - Visualizadores tácticos: cobertura hexagonal, red de interdependencia (Geist), vectores
 */

class Scene3D {
  constructor(container) {
    this.container = container;
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.controls = null;
    this.isOrbitEnabled = false;

    // Elementos del mundo
    this.courtGroup = null;
    this.netGroup = null;
    this.netMesh = null;
    this.netPosts = [];
    this.ball = null;
    this.ballTrail = null;
    this.trailPoints = [];
    this.playersTeamA = []; // Equipo A (SBL Rojo/Blanco)
    this.playersTeamB = []; // Equipo B (Rival / Ruanda / Sarajevo)
    this.tacticalOverlays = null;
    this.geistLines = [];
    this.coverageRings = [];
    this.isolationCone = null;

    // Luces
    this.spotLight = null;
    this.rimLight = null;
    this.ambientLight = null;

    this.init();
  }

  init() {
    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || window.innerHeight;

    // Escena
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0a0d14);
    this.scene.fog = new THREE.FogExp2(0x0a0d14, 0.025);

    // Cámara cinematográfica
    this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    this.camera.position.set(0, 7.5, 15);

    // Renderizador con sombras y tone mapping editorial
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, preserveDrawingBuffer: true });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.container.appendChild(this.renderer.domElement);

    // Controles de órbita (para modo exploración interactiva del estudiante)
    if (window.THREE && window.THREE.OrbitControls) {
      this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
      this.controls.enableDamping = true;
      this.controls.dampingFactor = 0.05;
      this.controls.maxPolarAngle = Math.PI / 2 - 0.03; // no pasar por debajo del suelo
      this.controls.enabled = false;
    }

    this.setupLighting();
    this.createGymEnvironment();
    this.createCourt();
    this.createNet();
    this.createBall();
    this.createPlayers();
    this.createTacticalVisualizers();

    window.addEventListener('resize', () => this.onResize());
  }

  setupLighting() {
    this.ambientLight = new THREE.AmbientLight(0xdde5ff, 0.55);
    this.scene.add(this.ambientLight);

    // Key light (Luz principal de estadio con sombras nítidas)
    this.spotLight = new THREE.SpotLight(0xfff6ea, 2.2);
    this.spotLight.position.set(4, 16, 8);
    this.spotLight.angle = Math.PI / 4;
    this.spotLight.penumbra = 0.6;
    this.spotLight.decay = 1.2;
    this.spotLight.distance = 45;
    this.spotLight.castShadow = true;
    this.spotLight.shadow.mapSize.width = 2048;
    this.spotLight.shadow.mapSize.height = 2048;
    this.spotLight.shadow.camera.near = 2;
    this.spotLight.shadow.camera.far = 40;
    this.spotLight.shadow.bias = -0.0003;
    this.scene.add(this.spotLight);

    // Rim light institucional (azul cian / dorado)
    this.rimLight = new THREE.DirectionalLight(0x00d4ff, 1.2);
    this.rimLight.position.set(-8, 9, -10);
    this.scene.add(this.rimLight);

    // Luz cálida de rebote inferior
    const groundBounce = new THREE.DirectionalLight(0xff7733, 0.4);
    groundBounce.position.set(0, -2, 0);
    this.scene.add(groundBounce);
  }

  createGymEnvironment() {
    // Piso general del coliseo (madera oscura con barniz reflectante)
    const floorGeo = new THREE.PlaneGeometry(60, 60);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x141824,
      roughness: 0.35,
      metalness: 0.15
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -0.01;
    floor.receiveShadow = true;
    this.scene.add(floor);

    // Gradas y muros del coliseo estilizados
    const wallGeo = new THREE.BoxGeometry(40, 10, 1);
    const wallMat = new THREE.MeshStandardMaterial({ color: 0x0c101c, roughness: 0.8 });

    const backWall = new THREE.Mesh(wallGeo, wallMat);
    backWall.position.set(0, 5, -16);
    this.scene.add(backWall);

    // Pancarta institucional "Colegio San Bonifacio de las Lanzas"
    const bannerGeo = new THREE.PlaneGeometry(16, 2.2);
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 140;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#0f1422';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#e52424';
    ctx.fillRect(0, 0, 16, canvas.height);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 36px "Century Gothic", sans-serif';
    ctx.fillText('COL. SAN BONIFACIO DE LAS LANZAS • CICLO PROYECTIVO', 35, 60);
    ctx.fillStyle = '#94a3b8';
    ctx.font = '24px "Century Gothic", sans-serif';
    ctx.fillText('EL SAQUE DE RECONCILIACIÓN • VOLEIBOL SENTADO (2026)', 35, 105);

    const bannerTex = new THREE.CanvasTexture(canvas);
    const bannerMat = new THREE.MeshBasicMaterial({ map: bannerTex });
    const banner = new THREE.Mesh(bannerGeo, bannerMat);
    banner.position.set(0, 6.2, -15.4);
    this.scene.add(banner);
  }

  createCourt() {
    this.courtGroup = new THREE.Group();

    // Área exterior de seguridad (gris oscuro deportivo)
    const outGeo = new THREE.PlaneGeometry(22, 14);
    const outMat = new THREE.MeshStandardMaterial({ color: 0x1a2133, roughness: 0.6 });
    const outMesh = new THREE.Mesh(outGeo, outMat);
    outMesh.rotation.x = -Math.PI / 2;
    outMesh.receiveShadow = true;
    this.courtGroup.add(outMesh);

    // Cancha de juego principal (Azul deportivo mate con reborde rojo institucional)
    // Inicialmente tamaño tradicional (18m x 9m)
    const courtGeo = new THREE.PlaneGeometry(18, 9);
    const courtMat = new THREE.MeshStandardMaterial({
      color: 0x1d4ed8,
      roughness: 0.45,
      metalness: 0.05
    });
    this.courtMesh = new THREE.Mesh(courtGeo, courtMat);
    this.courtMesh.rotation.x = -Math.PI / 2;
    this.courtMesh.position.y = 0.002;
    this.courtMesh.receiveShadow = true;
    this.courtGroup.add(this.courtMesh);

    // Cancha interior de Voleibol Sentado (10m x 6m, verde/cian brillante, se revela en Acto II y III)
    const sittingCourtGeo = new THREE.PlaneGeometry(10, 6);
    const sittingCourtMat = new THREE.MeshStandardMaterial({
      color: 0x059669,
      roughness: 0.5,
      transparent: true,
      opacity: 0.0
    });
    this.sittingCourtMesh = new THREE.Mesh(sittingCourtGeo, sittingCourtMat);
    this.sittingCourtMesh.rotation.x = -Math.PI / 2;
    this.sittingCourtMesh.position.y = 0.004;
    this.sittingCourtMesh.receiveShadow = true;
    this.courtGroup.add(this.sittingCourtMesh);

    // Líneas de cancha (Línea central, perímetro, líneas de ataque)
    this.courtLines = this.createCourtLines();
    this.courtGroup.add(this.courtLines);

    this.scene.add(this.courtGroup);
  }

  createCourtLines() {
    const linesGroup = new THREE.Group();
    const lineMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const lineMatAttack = new THREE.MeshBasicMaterial({ color: 0xfacc15 }); // Amarillo ataque

    // Línea central (x = 0)
    const centerLineGeo = new THREE.PlaneGeometry(0.1, 9);
    const centerLine = new THREE.Mesh(centerLineGeo, lineMat);
    centerLine.rotation.x = -Math.PI / 2;
    centerLine.position.set(0, 0.006, 0);
    linesGroup.add(centerLine);

    // Perímetro tradicional (18m largo x 9m ancho)
    // Líneas laterales
    [-4.5, 4.5].forEach(z => {
      const sideGeo = new THREE.PlaneGeometry(18, 0.08);
      const sideMesh = new THREE.Mesh(sideGeo, lineMat);
      sideMesh.rotation.x = -Math.PI / 2;
      sideMesh.position.set(0, 0.006, z);
      linesGroup.add(sideMesh);
    });
    // Líneas de fondo
    [-9, 9].forEach(x => {
      const endGeo = new THREE.PlaneGeometry(0.08, 9);
      const endMesh = new THREE.Mesh(endGeo, lineMat);
      endMesh.rotation.x = -Math.PI / 2;
      endMesh.position.set(x, 0.006, 0);
      linesGroup.add(endMesh);
    });

    // Líneas de ataque tradicionales (a 3m de la red)
    [-3, 3].forEach(x => {
      const attGeo = new THREE.PlaneGeometry(0.06, 9);
      const attMesh = new THREE.Mesh(attGeo, lineMat);
      attMesh.rotation.x = -Math.PI / 2;
      attMesh.position.set(x, 0.006, 0);
      linesGroup.add(attMesh);
    });

    // Líneas de Voleibol Sentado (a 2m de la red y perímetro 10x6m)
    this.sittingLinesGroup = new THREE.Group();
    this.sittingLinesGroup.visible = false;

    [-2, 2].forEach(x => {
      const satGeo = new THREE.PlaneGeometry(0.08, 6);
      const satMesh = new THREE.Mesh(satGeo, lineMatAttack);
      satMesh.rotation.x = -Math.PI / 2;
      satMesh.position.set(x, 0.008, 0);
      this.sittingLinesGroup.add(satMesh);
    });
    // Perímetro sentado (10x6m)
    [-3, 3].forEach(z => {
      const satSideGeo = new THREE.PlaneGeometry(10, 0.08);
      const satSide = new THREE.Mesh(satSideGeo, lineMatAttack);
      satSide.rotation.x = -Math.PI / 2;
      satSide.position.set(0, 0.008, z);
      this.sittingLinesGroup.add(satSide);
    });
    [-5, 5].forEach(x => {
      const satEndGeo = new THREE.PlaneGeometry(0.08, 6);
      const satEnd = new THREE.Mesh(satEndGeo, lineMatAttack);
      satEnd.rotation.x = -Math.PI / 2;
      satEnd.position.set(x, 0.008, 0);
      this.sittingLinesGroup.add(satEnd);
    });
    linesGroup.add(this.sittingLinesGroup);

    return linesGroup;
  }

  createNet() {
    this.netGroup = new THREE.Group();

    // Postes laterales (a z = -5.2 y +5.2)
    const postGeo = new THREE.CylinderGeometry(0.06, 0.06, 3.2, 16);
    const postMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.8, roughness: 0.2 });

    [-5.2, 5.2].forEach(z => {
      const post = new THREE.Mesh(postGeo, postMat);
      post.position.set(0, 1.6, z);
      post.castShadow = true;
      this.netGroup.add(post);
      this.netPosts.push(post);
    });

    // Malla de la red procedural
    // Altura tradicional: parte superior en y = 2.43m, ancho de red 1m
    const netWidth = 10.4;
    const netHeight = 1.0;
    const netGeo = new THREE.PlaneGeometry(netWidth, netHeight, 32, 8);

    // Textura de rejilla generada en Canvas
    const netCanvas = document.createElement('canvas');
    netCanvas.width = 128;
    netCanvas.height = 128;
    const nctx = netCanvas.getContext('2d');
    nctx.strokeStyle = '#e2e8f0';
    nctx.lineWidth = 4;
    nctx.strokeRect(0, 0, 128, 128);
    nctx.beginPath();
    nctx.moveTo(64, 0); nctx.lineTo(64, 128);
    nctx.moveTo(0, 64); nctx.lineTo(128, 64);
    nctx.stroke();

    const netTex = new THREE.CanvasTexture(netCanvas);
    netTex.wrapS = THREE.RepeatWrapping;
    netTex.wrapT = THREE.RepeatWrapping;
    netTex.repeat.set(40, 5);

    const netMat = new THREE.MeshBasicMaterial({
      map: netTex,
      transparent: true,
      opacity: 0.75,
      side: THREE.DoubleSide
    });

    this.netMesh = new THREE.Mesh(netGeo, netMat);
    this.netMesh.rotation.y = Math.PI / 2;
    this.netMesh.position.set(0, 1.93, 0); // centro de red para 2.43m (2.43 - 0.5 = 1.93)
    this.netGroup.add(this.netMesh);

    // Banda superior blanca
    const bandGeo = new THREE.BoxGeometry(0.08, 0.08, netWidth);
    const bandMat = new THREE.MeshStandardMaterial({ color: 0xffffff });
    this.netTopBand = new THREE.Mesh(bandGeo, bandMat);
    this.netTopBand.position.set(0, 2.43, 0);
    this.netGroup.add(this.netTopBand);

    // Antenas rojas/blancas reglamentarias
    [-4.5, 4.5].forEach(z => {
      const antGeo = new THREE.CylinderGeometry(0.015, 0.015, 1.8, 8);
      const antMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
      const ant = new THREE.Mesh(antGeo, antMat);
      ant.position.set(0, 2.8, z);
      this.netGroup.add(ant);
    });

    this.scene.add(this.netGroup);
  }

  createBall() {
    const ballGroup = new THREE.Group();

    // Balón de voleibol tricolor (blanco, azul, amarillo)
    const ballGeo = new THREE.SphereGeometry(0.24, 32, 24);

    const bCanvas = document.createElement('canvas');
    bCanvas.width = 256;
    bCanvas.height = 128;
    const bctx = bCanvas.getContext('2d');
    bctx.fillStyle = '#f8fafc';
    bctx.fillRect(0, 0, 256, 128);
    bctx.fillStyle = '#2563eb';
    bctx.fillRect(0, 0, 85, 128);
    bctx.fillStyle = '#eab308';
    bctx.fillRect(170, 0, 86, 128);
    bctx.strokeStyle = '#1e293b';
    bctx.lineWidth = 3;
    bctx.strokeRect(0, 0, 256, 128);

    const ballTex = new THREE.CanvasTexture(bCanvas);
    const ballMat = new THREE.MeshStandardMaterial({
      map: ballTex,
      roughness: 0.35,
      metalness: 0.1
    });

    this.ballMesh = new THREE.Mesh(ballGeo, ballMat);
    this.ballMesh.castShadow = true;
    ballGroup.add(this.ballMesh);

    // Sombra proyectada suave en piso
    const shadowGeo = new THREE.CircleGeometry(0.35, 16);
    const shadowMat = new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0.4
    });
    this.ballShadow = new THREE.Mesh(shadowGeo, shadowMat);
    this.ballShadow.rotation.x = -Math.PI / 2;
    this.ballShadow.position.y = 0.01;
    this.scene.add(this.ballShadow);

    // Estela de partículas luminosas
    const trailGeo = new THREE.BufferGeometry();
    const maxTrail = 40;
    const positions = new Float32Array(maxTrail * 3);
    trailGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const trailMat = new THREE.LineBasicMaterial({
      color: 0xf59e0b,
      transparent: true,
      opacity: 0.8,
      linewidth: 3
    });
    this.ballTrail = new THREE.Line(trailGeo, trailMat);
    this.scene.add(this.ballTrail);

    ballGroup.position.set(-4, 3.2, 0);
    this.ball = ballGroup;
    this.scene.add(this.ball);
  }

  // Creación de personajes 3D procedurales y articulados
  createPlayerRig(config) {
    const root = new THREE.Group();

    // 1. Anillo indicador de pelvis en suelo (World ParaVolley Pelvis Rule)
    const ringGeo = new THREE.RingGeometry(0.38, 0.46, 32);
    const ringMat = new THREE.MeshBasicMaterial({
      color: config.isSitting ? 0x10b981 : 0xef4444, // Verde si pelvis en suelo, rojo si salto ilegal
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.9
    });
    const pelvisRing = new THREE.Mesh(ringGeo, ringMat);
    pelvisRing.rotation.x = -Math.PI / 2;
    pelvisRing.position.y = 0.02;
    root.add(pelvisRing);

    // 2. Base / Pelvis
    const pelvisGeo = new THREE.CylinderGeometry(0.24, 0.28, 0.25, 16);
    const shortsMat = new THREE.MeshStandardMaterial({
      color: config.shortsColor || 0x1e293b,
      roughness: 0.6
    });
    const pelvis = new THREE.Mesh(pelvisGeo, shortsMat);
    pelvis.position.y = config.isSitting ? 0.16 : 0.95;
    pelvis.castShadow = true;
    root.add(pelvis);

    // 3. Torso / Camiseta deportiva
    const torsoGeo = new THREE.CylinderGeometry(0.26, 0.22, 0.65, 16);
    const jerseyMat = new THREE.MeshStandardMaterial({
      color: config.jerseyColor,
      roughness: 0.5
    });
    const torso = new THREE.Mesh(torsoGeo, jerseyMat);
    torso.position.y = config.isSitting ? 0.52 : 1.35;
    torso.castShadow = true;
    root.add(torso);

    // 4. Cabeza
    const headGeo = new THREE.SphereGeometry(0.18, 20, 18);
    const skinMat = new THREE.MeshStandardMaterial({ color: 0xd4a373, roughness: 0.7 });
    const head = new THREE.Mesh(headGeo, skinMat);
    head.position.y = config.isSitting ? 0.98 : 1.82;
    head.castShadow = true;
    root.add(head);

    // 5. Brazos articulados (para arrastre por el piso, golpe bajo o remate)
    const armGeo = new THREE.CylinderGeometry(0.065, 0.055, 0.55, 12);
    const leftArmGroup = new THREE.Group();
    const rightArmGroup = new THREE.Group();

    const leftArm = new THREE.Mesh(armGeo, jerseyMat);
    leftArm.position.y = -0.25;
    leftArm.castShadow = true;
    leftArmGroup.add(leftArm);

    const rightArm = new THREE.Mesh(armGeo, jerseyMat);
    rightArm.position.y = -0.25;
    rightArm.castShadow = true;
    rightArmGroup.add(rightArm);

    leftArmGroup.position.set(-0.32, config.isSitting ? 0.75 : 1.58, 0);
    rightArmGroup.position.set(0.32, config.isSitting ? 0.75 : 1.58, 0);

    root.add(leftArmGroup);
    root.add(rightArmGroup);

    // 6. Piernas
    const legGeo = new THREE.CylinderGeometry(0.08, 0.07, config.isSitting ? 0.65 : 0.85, 12);
    const legMat = new THREE.MeshStandardMaterial({ color: 0x0f172a });

    const leftLeg = new THREE.Mesh(legGeo, legMat);
    const rightLeg = new THREE.Mesh(legGeo, legMat);

    if (config.isSitting) {
      // Piernas estiradas o cruzadas sobre el piso
      leftLeg.rotation.x = Math.PI / 2.2;
      rightLeg.rotation.x = Math.PI / 2.2;
      leftLeg.position.set(-0.16, 0.1, 0.32);
      rightLeg.position.set(0.16, 0.1, 0.32);
    } else {
      // Piernas erguidas de pie
      leftLeg.position.set(-0.14, 0.45, 0);
      rightLeg.position.set(0.14, 0.45, 0);
    }
    leftLeg.castShadow = true;
    rightLeg.castShadow = true;
    root.add(leftLeg);
    root.add(rightLeg);

    root.position.copy(config.position);

    return {
      root,
      pelvisRing,
      torso,
      head,
      leftArmGroup,
      rightArmGroup,
      pelvis,
      config,
      initialPos: config.position.clone()
    };
  }

  createPlayers() {
    // 6 Jugadores Equipo A (San Bonifacio de las Lanzas - Rojo / Blanco)
    const teamAPositions = [
      new THREE.Vector3(-6.5, 0, 0),     // Sacador / Zaguero central (Pos 1/6)
      new THREE.Vector3(-4.5, 0, -2.2),  // Zaguero izquierdo (Pos 5)
      new THREE.Vector3(-4.5, 0, 2.2),   // Zaguero derecho (Pos 1)
      new THREE.Vector3(-1.8, 0, -2.0),  // Delantero izquierdo (Pos 4)
      new THREE.Vector3(-1.5, 0, 0),     // Armador central (Pos 3)
      new THREE.Vector3(-1.8, 0, 2.0),   // Delantero derecho (Pos 2)
    ];

    teamAPositions.forEach((pos, idx) => {
      const player = this.createPlayerRig({
        position: pos,
        isSitting: false,
        jerseyColor: idx < 2 ? 0xdc2626 : 0xef4444, // Rojo SBL
        shortsColor: 0x1e293b,
        id: `A_${idx}`
      });
      this.playersTeamA.push(player);
      this.scene.add(player.root);
    });

    // 6 Jugadores Equipo B (Sarajevo / Ruanda - Azul / Dorado / Verde)
    const teamBPositions = [
      new THREE.Vector3(6.5, 0, 0),
      new THREE.Vector3(4.5, 0, 2.2),
      new THREE.Vector3(4.5, 0, -2.2),
      new THREE.Vector3(1.8, 0, 2.0),
      new THREE.Vector3(1.5, 0, 0),
      new THREE.Vector3(1.8, 0, -2.0),
    ];

    teamBPositions.forEach((pos, idx) => {
      const player = this.createPlayerRig({
        position: pos,
        isSitting: false,
        jerseyColor: 0x0284c7, // Azul deportivo
        shortsColor: 0x0f172a,
        id: `B_${idx}`
      });
      this.playersTeamB.push(player);
      this.scene.add(player.root);
    });
  }

  createTacticalVisualizers() {
    this.tacticalOverlays = new THREE.Group();

    // 1. Anillos de cobertura hexagonal en el suelo para cada jugador
    for (let i = 0; i < 6; i++) {
      const ringGeo = new THREE.RingGeometry(1.2, 1.35, 6);
      const ringMat = new THREE.MeshBasicMaterial({
        color: 0x38bdf8,
        transparent: true,
        opacity: 0.0,
        side: THREE.DoubleSide
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.rotation.x = -Math.PI / 2;
      ring.position.y = 0.015;
      this.coverageRings.push(ring);
      this.tacticalOverlays.add(ring);
    }

    // 2. Red de interdependencia no verbal (Geist): Líneas de luz que unen a los compañeros
    const lineMat = new THREE.LineBasicMaterial({
      color: 0xfacc15,
      transparent: true,
      opacity: 0.0,
      linewidth: 2
    });

    // Conexiones triangulares de soporte
    for (let i = 0; i < 8; i++) {
      const geo = new THREE.BufferGeometry();
      const pts = new Float32Array([0, 0, 0, 1, 0, 1]);
      geo.setAttribute('position', new THREE.BufferAttribute(pts, 3));
      const line = new THREE.Line(geo, lineMat.clone());
      this.geistLines.push(line);
      this.tacticalOverlays.add(line);
    }

    // 3. Cono de exclusión / sombra (Acto I)
    const coneGeo = new THREE.ConeGeometry(3.5, 0.02, 32);
    const coneMat = new THREE.MeshBasicMaterial({
      color: 0x7f1d1d,
      transparent: true,
      opacity: 0.0,
      side: THREE.DoubleSide
    });
    this.isolationCone = new THREE.Mesh(coneGeo, coneMat);
    this.isolationCone.rotation.x = -Math.PI / 2;
    this.isolationCone.position.set(-5, 0.012, 0);
    this.tacticalOverlays.add(this.isolationCone);

    this.scene.add(this.tacticalOverlays);
  }

  // Modificación determinista en función del tiempo t (0 a 225s)
  update(t, actState) {
    // Si el usuario activó OrbitControls, dejamos que la cámara la mueva él
    if (this.controls && this.controls.enabled) {
      this.controls.update();
    } else if (actState.cameraPos) {
      // Interpolación suave de cámara cinematográfica
      this.camera.position.lerp(actState.cameraPos, 0.06);
      if (actState.cameraLookAt) {
        this.camera.lookAt(actState.cameraLookAt);
      }
    }

    // Altura de la red (2.43m tradicional -> 1.15m voleibol sentado)
    const targetNetHeight = actState.isSittingVolleyball ? 1.15 : 2.43;
    const currentNetBandY = this.netTopBand.position.y;
    this.netTopBand.position.y += (targetNetHeight - currentNetBandY) * 0.08;
    this.netMesh.position.y = this.netTopBand.position.y - 0.5;

    // Visibilidad de cancha de voleibol sentado
    const targetSittingOpacity = actState.isSittingVolleyball ? 0.9 : 0.0;
    this.sittingCourtMesh.material.opacity += (targetSittingOpacity - this.sittingCourtMesh.material.opacity) * 0.05;
    this.sittingLinesGroup.visible = this.sittingCourtMesh.material.opacity > 0.1;

    // Actualización de jugadores (De pie vs Sentados)
    this.updatePlayerPostures(actState.isSittingVolleyball, t);

    // Animación del balón
    this.updateBall(actState.ballTrajectory, t);

    // Actualización de táctica y Geist
    this.updateTacticalHUD(actState, t);

    // Render
    this.renderer.render(this.scene, this.camera);
  }

  updatePlayerPostures(isSitting, t) {
    const updateTeam = (team) => {
      team.forEach((p, idx) => {
        const targetTorsoY = isSitting ? 0.52 : 1.35;
        const targetPelvisY = isSitting ? 0.16 : 0.95;
        const targetHeadY = isSitting ? 0.98 : 1.82;

        p.torso.position.y += (targetTorsoY - p.torso.position.y) * 0.1;
        p.pelvis.position.y += (targetPelvisY - p.pelvis.position.y) * 0.1;
        p.head.position.y += (targetHeadY - p.head.position.y) * 0.1;

        // Anillo de pelvis: verde si sentado, rojo parpadeante si salta ilegalmente en voleibol sentado
        if (isSitting) {
          p.pelvisRing.material.color.setHex(0x10b981); // Pelvis en el suelo = regla cumplida
          p.pelvisRing.material.opacity = 0.85 + Math.sin(t * 4 + idx) * 0.15;
        } else {
          p.pelvisRing.material.color.setHex(0xef4444);
          p.pelvisRing.material.opacity = 0.3;
        }

        // Micro-animación de respiración / brazos
        if (isSitting) {
          // Manos apoyadas en el piso para arrastre
          p.leftArmGroup.rotation.x = Math.sin(t * 2 + idx) * 0.15;
          p.rightArmGroup.rotation.x = Math.sin(t * 2 + idx) * 0.15;
        } else {
          // Posición atlética de pie
          p.leftArmGroup.rotation.x = 0.2 + Math.sin(t * 1.5 + idx) * 0.08;
          p.rightArmGroup.rotation.x = 0.2 + Math.sin(t * 1.5 + idx) * 0.08;
        }
      });
    };

    updateTeam(this.playersTeamA);
    updateTeam(this.playersTeamB);
  }

  updateBall(traj, t) {
    if (!traj) return;

    // Calcular posición del balón según parábola del momento
    this.ball.position.set(traj.x, traj.y, traj.z);
    this.ballMesh.rotation.x += 0.06;
    this.ballMesh.rotation.y += 0.08;

    // Sombra en el suelo
    this.ballShadow.position.x = traj.x;
    this.ballShadow.position.z = traj.z;
    const shadowScale = Math.max(0.15, 1 - traj.y * 0.15);
    this.ballShadow.scale.set(shadowScale, shadowScale, 1);
    this.ballShadow.material.opacity = Math.max(0.08, 0.45 - traj.y * 0.08);

    // Estela
    this.trailPoints.unshift(new THREE.Vector3(traj.x, traj.y, traj.z));
    if (this.trailPoints.length > 35) this.trailPoints.pop();

    const posAttr = this.ballTrail.geometry.attributes.position;
    for (let i = 0; i < this.trailPoints.length; i++) {
      posAttr.setXYZ(i, this.trailPoints[i].x, this.trailPoints[i].y, this.trailPoints[i].z);
    }
    posAttr.needsUpdate = true;
  }

  updateTacticalHUD(actState, t) {
    // 1. Cono de exclusión del Acto I
    if (this.isolationCone) {
      const targetIso = actState.showIsolation ? 0.6 : 0.0;
      this.isolationCone.material.opacity += (targetIso - this.isolationCone.material.opacity) * 0.08;
    }

    // 2. Anillos de cobertura hexagonal en el suelo (Acto III - Sarajevo)
    this.coverageRings.forEach((ring, idx) => {
      const targetOp = actState.showTacticalHexagons ? 0.75 : 0.0;
      ring.material.opacity += (targetOp - ring.material.opacity) * 0.06;
      if (this.playersTeamA[idx]) {
        ring.position.x = this.playersTeamA[idx].root.position.x;
        ring.position.z = this.playersTeamA[idx].root.position.z;
        ring.rotation.z = t * 0.3 + idx;
      }
    });

    // 3. Geist / Red de Interdependencia (Acto IV y V)
    const targetGeist = actState.showGeist ? 0.85 : 0.0;
    const connections = [
      [0, 1], [0, 2], [1, 3], [2, 5], [3, 4], [4, 5], [1, 4], [2, 4]
    ];

    connections.forEach((conn, idx) => {
      const line = this.geistLines[idx];
      if (!line) return;
      line.material.opacity += (targetGeist - line.material.opacity) * 0.06;

      if (actState.showGeist && this.playersTeamA[conn[0]] && this.playersTeamA[conn[1]]) {
        const p1 = this.playersTeamA[conn[0]].root.position;
        const p2 = this.playersTeamA[conn[1]].root.position;
        const pts = line.geometry.attributes.position;
        pts.setXYZ(0, p1.x, 0.45 + Math.sin(t * 3 + idx) * 0.08, p1.z);
        pts.setXYZ(1, p2.x, 0.45 + Math.cos(t * 3 + idx) * 0.08, p2.z);
        pts.needsUpdate = true;
      }
    });
  }

  setOrbitControls(enabled) {
    this.isOrbitEnabled = enabled;
    if (this.controls) {
      this.controls.enabled = enabled;
    }
  }

  onResize() {
    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || window.innerHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }
}

window.Scene3D = Scene3D;
