// viewer.js - 3D Character Studio Viewer for Sofía, Juan Diego & Martín
import { CharacterBuilder } from './characters.js';

const THREE = window.THREE;

export class CharacterViewer {
  constructor(container) {
    this.container = container;

    // Dimensions
    this.width = window.innerWidth;
    this.height = window.innerHeight;

    // Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    this.renderer.setSize(this.width, this.height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.2;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.container.appendChild(this.renderer.domElement);

    // Scene & Camera
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0c0f14);
    this.scene.fog = new THREE.FogExp2(0x0c0f14, 0.035);

    this.camera = new THREE.PerspectiveCamera(38, this.width / this.height, 0.1, 100);
    this.camera.position.set(0, 2.2, 5.8);
    this.target = new THREE.Vector3(0, 0.95, 0);

    // Orbit Controls
    if (window.THREE.OrbitControls) {
      this.controls = new window.THREE.OrbitControls(this.camera, this.renderer.domElement);
      this.controls.enableDamping = true;
      this.controls.dampingFactor = 0.06;
      this.controls.maxPolarAngle = Math.PI / 2 + 0.05;
      this.controls.minDistance = 1.2;
      this.controls.maxDistance = 12;
      this.controls.target.copy(this.target);
    }

    // Setup Environment, Lights & Characters
    this.initLights();
    this.initPedestals();
    this.initCharacters();

    // State
    this.currentPose = 'stand';
    this.activeFocus = 'all';
    this.clock = new THREE.Clock();

    window.addEventListener('resize', () => this.onResize());
  }

  initLights() {
    this.keyLight = new THREE.DirectionalLight(0xfff3e4, 2.6);
    this.keyLight.position.set(6, 8, 5);
    this.keyLight.castShadow = true;
    this.keyLight.shadow.mapSize.set(2048, 2048);
    this.keyLight.shadow.bias = -0.0004;
    this.scene.add(this.keyLight);

    this.rimLight = new THREE.DirectionalLight(0x3fd8ff, 3.8);
    this.rimLight.position.set(-6, 4, -5);
    this.scene.add(this.rimLight);

    this.bounceLight = new THREE.DirectionalLight(0xffaa44, 0.5);
    this.bounceLight.position.set(0, -3, 0);
    this.scene.add(this.bounceLight);

    this.hemiLight = new THREE.HemisphereLight(0x243444, 0x080a0e, 0.9);
    this.scene.add(this.hemiLight);

    const createSpot = (x, color = 0x45f0dd) => {
      const spot = new THREE.SpotLight(color, 2.2, 10, Math.PI / 5, 0.5);
      spot.position.set(x, 4.5, 0);
      spot.target.position.set(x, 0, 0);
      this.scene.add(spot);
      this.scene.add(spot.target);
      return spot;
    };

    createSpot(-1.75, 0xffd400); // Sofía
    createSpot(0.0, 0x3fd8ff);   // Juan Diego
    createSpot(1.75, 0x00ffaa);  // Martín
  }

  initPedestals() {
    const floorGeo = new THREE.PlaneGeometry(40, 40);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x0b0d12,
      roughness: 0.8,
      metalness: 0.15
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    this.scene.add(floor);

    const grid = new THREE.GridHelper(24, 48, 0x1d2c3e, 0x111620);
    grid.position.y = 0.002;
    this.scene.add(grid);

    const createPedestal = (x, name, accentColor) => {
      const pedGroup = new THREE.Group();
      pedGroup.position.set(x, 0, 0);

      const baseGeo = new THREE.CylinderGeometry(0.72, 0.78, 0.08, 16);
      const baseMat = new THREE.MeshStandardMaterial({
        color: 0x141a24,
        roughness: 0.4,
        metalness: 0.3,
        flatShading: true
      });
      const base = new THREE.Mesh(baseGeo, baseMat);
      base.position.y = 0.04;
      base.receiveShadow = true;
      pedGroup.add(base);

      const ringGeo = new THREE.TorusGeometry(0.74, 0.015, 6, 24);
      const ringMat = new THREE.MeshBasicMaterial({ color: accentColor });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.rotation.x = Math.PI / 2;
      ring.position.y = 0.082;
      pedGroup.add(ring);

      this.scene.add(pedGroup);
      return pedGroup;
    };

    this.pedSofia = createPedestal(-1.75, 'SOFÍA', 0xffd400);
    this.pedJuan = createPedestal(0.0, 'JUAN DIEGO', 0x3fd8ff);
    this.pedMartin = createPedestal(1.75, 'MARTÍN', 0x00ffaa);
  }

  initCharacters() {
    this.builder = new CharacterBuilder(THREE);

    this.sofia = this.builder.buildSofia();
    this.sofia.position.set(-1.75, 0.08, 0);
    this.scene.add(this.sofia);

    this.juanDiego = this.builder.buildJuanDiego();
    this.juanDiego.position.set(0.0, 0.08, 0);
    this.scene.add(this.juanDiego);

    this.martin = this.builder.buildMartin();
    this.martin.position.set(1.75, 0.08, 0);
    this.scene.add(this.martin);

    this.characters = [this.sofia, this.juanDiego, this.martin];

    // Wheelchairs for Sitting / Parasport presentation
    this.wheelchairSofia = this.builder.createWheelchair('gold');
    this.wheelchairSofia.position.set(-1.75, 0.08, 0);
    this.wheelchairSofia.visible = false;
    this.scene.add(this.wheelchairSofia);

    this.wheelchairJuan = this.builder.createWheelchair('cyan');
    this.wheelchairJuan.position.set(0.0, 0.08, 0);
    this.wheelchairJuan.visible = false;
    this.scene.add(this.wheelchairJuan);

    this.wheelchairMartin = this.builder.createWheelchair('gold');
    this.wheelchairMartin.position.set(1.75, 0.08, 0);
    this.wheelchairMartin.visible = false;
    this.scene.add(this.wheelchairMartin);

    this.wheelchairs = [this.wheelchairSofia, this.wheelchairJuan, this.wheelchairMartin];

    this.setPose('stand');
  }

  setPose(poseName) {
    this.currentPose = poseName;

    // Toggle wheelchair visibility
    if (this.wheelchairs) {
      this.wheelchairs.forEach(w => {
        w.visible = (poseName === 'sitting');
      });
    }

    this.characters.forEach((char) => {
      const u = char.userData;

      if (poseName === 'stand') {
        u.pelvis.position.set(0, u.id === 'juandiego' ? 0.94 : (u.id === 'martin' ? 0.91 : 0.88), 0);
        u.pelvis.rotation.set(0, 0, 0);
        u.spine.rotation.set(0, 0, 0);
        u.head.rotation.set(0, 0, 0);

        u.leftLeg.rotation.set(0, 0, 0);
        u.rightLeg.rotation.set(0, 0, 0);
        u.leftKnee.rotation.set(0, 0, 0);
        u.rightKnee.rotation.set(0, 0, 0);

        if (u.id === 'sofia') {
          u.leftArm.rotation.set(0.1, 0, -0.6);
          u.leftForearm.rotation.set(0, 0, 1.4);
          u.rightArm.rotation.set(0.1, 0, 0.25);
          u.rightForearm.rotation.set(-0.35, 0, 0);
          u.head.rotation.set(0.05, 0.12, 0);
        } else if (u.id === 'juandiego') {
          u.leftArm.rotation.set(0.2, 0, -0.2);
          u.leftForearm.rotation.set(-0.35, 0, 0);
          u.rightArm.rotation.set(0.2, 0, 0.2);
          u.rightForearm.rotation.set(-0.4, 0, 0);
          u.head.rotation.set(0, 0, 0);
        } else if (u.id === 'martin') {
          u.leftArm.rotation.set(0.1, 0, -0.2);
          u.leftForearm.rotation.set(-0.3, 0, 0);
          u.rightArm.rotation.set(-0.5, 0, 0.35);
          u.rightForearm.rotation.set(-1.1, 0, 0);
          u.head.rotation.set(0.05, -0.15, 0);
        }
      } else if (poseName === 'sitting') {
        // Natural Sitting on Wheelchair Cushion (Seat height y ≈ 0.52)
        const seatY = u.id === 'juandiego' ? 0.55 : (u.id === 'martin' ? 0.53 : 0.51);
        u.pelvis.position.set(0, seatY, -0.06);
        u.pelvis.rotation.set(-0.06, 0, 0);
        u.spine.rotation.set(0.04, 0, 0);

        // Thighs 90 degrees forward (-PI/2), knees 90 degrees down (+PI/2)
        // This places calves vertical and sneakers resting flat naturally on the footrest!
        u.leftLeg.rotation.set(-Math.PI / 2 + 0.05, 0, -0.06);
        u.rightLeg.rotation.set(-Math.PI / 2 + 0.05, 0, 0.06);
        u.leftKnee.rotation.set(Math.PI / 2 - 0.04, 0, 0);
        u.rightKnee.rotation.set(Math.PI / 2 - 0.04, 0, 0);

        if (u.id === 'sofia') {
          // Resting hands naturally on armrests / wheels, confident posture
          u.leftArm.rotation.set(0.2, 0, -0.35);
          u.leftForearm.rotation.set(-0.7, 0, 0.1);
          u.rightArm.rotation.set(-0.35, 0, 0.4);
          u.rightForearm.rotation.set(-0.8, 0, -0.2);
          u.head.rotation.set(0, 0.08, 0);
        } else if (u.id === 'juandiego') {
          // Pushing / holding wheels with hands ready for athletic drive
          u.leftArm.rotation.set(0.25, 0, -0.4);
          u.leftForearm.rotation.set(-0.8, 0, 0.15);
          u.rightArm.rotation.set(-0.7, 0, 0.3);
          u.rightForearm.rotation.set(-1.0, 0, -0.15);
          u.head.rotation.set(-0.05, 0, 0);
        } else if (u.id === 'martin') {
          // Left hand on wheel rim, right hand spinning / presenting Mikasa volleyball
          u.leftArm.rotation.set(0.2, 0, -0.38);
          u.leftForearm.rotation.set(-0.75, 0, 0.15);
          u.rightArm.rotation.set(-0.85, 0, 0.35);
          u.rightForearm.rotation.set(-0.95, 0, 0);
          u.head.rotation.set(0, -0.1, 0);
        }
      } else if (poseName === 'spike') {
        u.pelvis.position.set(0, u.id === 'juandiego' ? 0.98 : (u.id === 'martin' ? 0.94 : 0.9), 0);
        u.pelvis.rotation.set(0, 0, 0);

        if (u.id === 'juandiego') {
          u.rightArm.rotation.set(-2.2, 0, 0.5);
          u.rightForearm.rotation.set(-1.4, 0, 0);
          u.leftArm.rotation.set(0.4, 0, -0.4);
          u.leftForearm.rotation.set(-0.5, 0, 0);
          u.spine.rotation.set(-0.2, -0.4, 0);
          u.head.rotation.set(-0.15, 0.35, 0);
          u.leftLeg.rotation.set(0.3, 0, -0.2);
          u.rightLeg.rotation.set(-0.35, 0, 0.2);
        } else if (u.id === 'sofia') {
          u.rightArm.rotation.set(-2.4, 0, 0.3);
          u.rightForearm.rotation.set(-0.5, 0, 0);
          u.leftArm.rotation.set(0.1, 0, -0.5);
          u.leftForearm.rotation.set(0, 0, 1.2);
          u.head.rotation.set(0.1, 0, 0);
        } else if (u.id === 'martin') {
          u.leftArm.rotation.set(-1.9, 0, -0.3);
          u.leftForearm.rotation.set(-0.6, 0, 0);
          u.rightArm.rotation.set(-1.9, 0, 0.3);
          u.rightForearm.rotation.set(-0.6, 0, 0);
          u.head.rotation.set(-0.2, 0, 0);
        }
      }
    });
  }

  focusOn(characterId) {
    this.activeFocus = characterId;

    let targetPos = new THREE.Vector3(0, 0.95, 0);
    let camPos = new THREE.Vector3(0, 2.2, 5.8);

    if (characterId === 'sofia') {
      targetPos.set(-1.75, 1.25, 0);
      camPos.set(-1.75, 1.55, 2.2);
    } else if (characterId === 'juandiego') {
      targetPos.set(0.0, 1.35, 0);
      camPos.set(0.0, 1.65, 2.3);
    } else if (characterId === 'martin') {
      targetPos.set(1.75, 1.3, 0);
      camPos.set(1.75, 1.6, 2.2);
    }

    this.tweenCamera(camPos, targetPos);
  }

  tweenCamera(toCam, toTarget, duration = 0.8) {
    const startCam = this.camera.position.clone();
    const startTarget = this.controls ? this.controls.target.clone() : this.target.clone();
    const startTime = performance.now();

    const animateTween = (now) => {
      const p = Math.min(1.0, (now - startTime) / (duration * 1000));
      const ease = 1 - Math.pow(1 - p, 3);

      this.camera.position.lerpVectors(startCam, toCam, ease);
      if (this.controls) {
        this.controls.target.lerpVectors(startTarget, toTarget, ease);
      }

      if (p < 1.0) {
        requestAnimationFrame(animateTween);
      }
    };

    requestAnimationFrame(animateTween);
  }

  animate() {
    requestAnimationFrame(() => this.animate());

    const t = this.clock.getElapsedTime();

    this.characters.forEach((char, idx) => {
      const u = char.userData;
      const offset = idx * 1.5;

      if (this.currentPose === 'stand') {
        u.spine.rotation.x = Math.sin(t * 2 + offset) * 0.015;
        u.head.rotation.y += Math.sin(t * 1.2 + offset) * 0.002;

        if (u.id === 'martin' && u.ball) {
          u.ball.rotation.y += 0.03;
          u.ball.rotation.x += 0.01;
        }

        if (u.id === 'sofia' && u.pony) {
          u.pony.rotation.z = -0.45 + Math.sin(t * 2.5) * 0.03;
        }
      }
    });

    if (this.controls) {
      this.controls.update();
    }

    this.renderer.render(this.scene, this.camera);
  }

  onResize() {
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.camera.aspect = this.width / this.height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(this.width, this.height);
  }
}
