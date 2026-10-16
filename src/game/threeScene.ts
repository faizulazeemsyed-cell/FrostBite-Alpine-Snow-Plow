import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import confetti from 'canvas-confetti';
import { SnowGrid } from './snowGrid';
import {
  createPlowTruck,
  createAlpineChalet,
  createSnowyPineTree,
  createStreetLamp,
  createSnowman,
  createFenceSegment,
  createCollectibleMesh,
  PlowTruckParts,
} from './models';
import { synthAudio } from '../audio/SynthAudio';
import { VehicleUpgrades, TownSector, CollectibleItem, ComboState, GameStats } from '../types/game';

interface InputState {
  forward: boolean;
  backward: boolean;
  left: boolean;
  right: boolean;
  boost: boolean;
  hornJustPressed: boolean;
}

export interface GameCallbacks {
  onSpeedUpdate: (speed: number, maxSpeed: number) => void;
  onComboUpdate: (combo: ComboState) => void;
  onCoinsUpdate: (coins: number) => void;
  onSectorComplete: (sector: TownSector) => void;
  onItemCollected: (item: CollectibleItem) => void;
  onSnowClearedPercent: (percent: number) => void;
  onBoostUpdate: (ready: boolean, progress: number) => void;
  onStatsUpdate: (stats: GameStats) => void;
}

interface Obstacle {
  x: number;
  z: number;
  radius: number;
  type: string;
}

interface Particle {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  life: number;
  maxLife: number;
  size: number;
  color: THREE.Color;
}

export class FrostBiteScene {
  private container: HTMLElement;
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.OrthographicCamera;
  private snowGrid: SnowGrid;
  private truckParts: PlowTruckParts;

  // Reusable math objects (zero GC)
  private readonly _vec3 = new THREE.Vector3();
  private readonly _camOffset = new THREE.Vector3(34, 38, 34);
  private readonly _camTarget = new THREE.Vector3(0, 0, 0);

  // Vehicle dynamics
  private posX: number = 0;
  private posZ: number = 0;
  private heading: number = 0; // radians
  private speed: number = 0;
  private steerAngle: number = 0;

  // Upgrades
  public upgrades: VehicleUpgrades = {
    bladeLevel: 1,
    engineLevel: 1,
    treadsLevel: 1,
    spreaderLevel: 0,
    boostLevel: 1,
    magnetLevel: 0,
  };

  // Boost state
  private boostActive: boolean = false;
  private boostTimer: number = 0;
  private boostCooldown: number = 0;
  private readonly maxBoostCooldown: number = 6.0;

  // Combo system
  private comboCount: number = 0;
  private comboMultiplier: number = 1.0;
  private comboTimer: number = 0;
  private readonly maxComboTimer: number = 4.0;

  // Economy & Stats
  public coins: number = 50; // Starter coins for immediate fun
  public stats: GameStats = {
    snowPlowedMeters: 0,
    totalCoinsEarned: 50,
    maxCombo: 1,
    sectorsCompleted: 0,
    timePlayedSeconds: 0,
    itemsFound: 0,
  };

  // Obstacles & Collisions
  private obstacles: Obstacle[] = [];
  private cameraShake: number = 0;
  private hitstopTimer: number = 0;

  // Collectibles 3D meshes
  private collectibleMeshes: Map<string, THREE.Group> = new Map();

  // Dynamic snow ground mesh & texture
  private snowTexture: THREE.CanvasTexture;
  private groundMesh: THREE.Mesh | null = null;

  // Particle systems
  private sprayParticles: Particle[] = [];
  private sprayPoints: THREE.Points | null = null;
  private sprayGeo: THREE.BufferGeometry | null = null;

  // Gentle snowfall in sky
  private snowflakes: THREE.Points | null = null;

  // Loop & Callbacks
  private callbacks: GameCallbacks;
  private animFrameId: number | null = null;
  private lastTime: number = 0;
  private isRunning: boolean = false;
  public isTitleScreenMode: boolean = true;

  // Input
  public input: InputState = {
    forward: false,
    backward: false,
    left: false,
    right: false,
    boost: false,
    hornJustPressed: false,
  };

  constructor(container: HTMLElement, callbacks: GameCallbacks) {
    this.container = container;
    this.callbacks = callbacks;
    this.snowGrid = new SnowGrid();

    // 1. Renderer setup
    const isHeadless = navigator.webdriver || /HeadlessChrome/i.test(navigator.userAgent);
    this.renderer = new THREE.WebGLRenderer({
      antialias: !isHeadless,
      powerPreference: 'high-performance',
      alpha: false,
    });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.renderer.setPixelRatio(isHeadless ? 1 : Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = !isHeadless;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(this.renderer.domElement);

    // 2. Scene setup & Fog
    this.scene = new THREE.Scene();
    const fogColor = new THREE.Color(0xd7e7f6);
    this.scene.background = fogColor;
    this.scene.fog = new THREE.FogExp2(0xd7e7f6, 0.011);

    // 3. Studio Environment Map
    const pmrem = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    pmrem.dispose();

    // 4. True Isometric Orthographic Camera
    const aspect = container.clientWidth / container.clientHeight;
    const viewSize = 38; // Height in world units
    this.camera = new THREE.OrthographicCamera(
      (-viewSize * aspect) / 2,
      (viewSize * aspect) / 2,
      viewSize / 2,
      -viewSize / 2,
      1,
      200
    );
    this.camera.position.set(34, 38, 34);
    this.camera.lookAt(0, 0, 0);

    // 5. Lighting rig
    this.setupLighting();

    // 6. Ground & Snow Surface
    this.snowTexture = new THREE.CanvasTexture(this.snowGrid.canvas);
    this.snowTexture.colorSpace = THREE.SRGBColorSpace;
    this.snowTexture.anisotropy = this.renderer.capabilities.getMaxAnisotropy();
    this.setupGround();

    // 7. World Props (Chalets, Pine Trees, Street Lamps, Snowmen, Fences)
    this.buildAlpineTown();

    // 8. Hero Plow Truck
    this.truckParts = createPlowTruck(this.upgrades.bladeLevel);
    this.truckParts.group.position.set(0, 0, 0);
    this.scene.add(this.truckParts.group);

    // 9. Particle Systems
    this.setupParticles();

    // 10. Collectibles
    this.setupCollectibles();

    // Window Resize listener
    window.addEventListener('resize', this.onResize);

    // Pre-warm shaders
    this.renderer.compile(this.scene, this.camera);
  }

  private setupLighting() {
    // Warm winter key light with soft orthographic shadows
    const sunLight = new THREE.DirectionalLight(0xfffaed, 2.4);
    sunLight.position.set(35, 55, 25);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 10;
    sunLight.shadow.camera.far = 120;
    const shadowDist = 45;
    sunLight.shadow.camera.left = -shadowDist;
    sunLight.shadow.camera.right = shadowDist;
    sunLight.shadow.camera.top = shadowDist;
    sunLight.shadow.camera.bottom = -shadowDist;
    sunLight.shadow.bias = -0.0004;
    sunLight.shadow.normalBias = 0.02;
    this.scene.add(sunLight);

    // Hemisphere light: cool twilight sky vs snowy lavender ground
    const hemiLight = new THREE.HemisphereLight(0xbae6fd, 0xe2e8f0, 1.1);
    this.scene.add(hemiLight);
  }

  private setupGround() {
    // 1. Asphalt / Cobblestone Base Plane beneath snow
    const baseGeo = new THREE.PlaneGeometry(120, 120);
    baseGeo.rotateX(-Math.PI / 2);
    const baseMat = new THREE.MeshStandardMaterial({
      color: 0x242d38,
      roughness: 0.9,
      metalness: 0.15,
    });
    const baseMesh = new THREE.Mesh(baseGeo, baseMat);
    baseMesh.position.y = -0.02;
    baseMesh.receiveShadow = true;
    this.scene.add(baseMesh);

    // 2. Snow Surface with dynamic canvas texture
    const snowGeo = new THREE.PlaneGeometry(100, 100);
    snowGeo.rotateX(-Math.PI / 2);
    const snowMat = new THREE.MeshStandardMaterial({
      map: this.snowTexture,
      roughness: 0.75,
      metalness: 0.05,
    });
    this.groundMesh = new THREE.Mesh(snowGeo, snowMat);
    this.groundMesh.position.y = 0.01;
    this.groundMesh.receiveShadow = true;
    this.scene.add(this.groundMesh);
  }

  private buildAlpineTown() {
    // Helper to register obstacle
    const addObstacle = (x: number, z: number, r: number, type: string) => {
      this.obstacles.push({ x, z, radius: r, type });
    };

    // --- Cozy Chalets & Cabins ---
    const chaletPositions = [
      // Along Chalet Lane (West)
      { x: -32, z: -18, w: 5.4, d: 5.0, rot: 0.2 },
      { x: -20, z: -28, w: 4.8, d: 4.6, rot: -0.4 },
      { x: -34, z: -32, w: 5.6, d: 5.2, rot: 0.1 },

      // Along Hospital / Clinic Lane (East)
      { x: 30, z: -18, w: 6.2, d: 5.4, rot: -0.2 },
      { x: 22, z: -28, w: 5.0, d: 4.8, rot: 0.3 },
      { x: 35, z: -32, w: 5.8, d: 5.2, rot: -0.1 },

      // Near Town Square (North)
      { x: -22, z: 22, w: 5.6, d: 5.0, rot: 1.57 },
      { x: 22, z: 22, w: 5.6, d: 5.0, rot: -1.57 },
      { x: -16, z: 38, w: 5.2, d: 4.6, rot: 0 },
      { x: 16, z: 38, w: 5.2, d: 4.6, rot: 0 },
    ];

    chaletPositions.forEach((pos) => {
      const chalet = createAlpineChalet(pos.w, pos.d);
      chalet.position.set(pos.x, 0, pos.z);
      chalet.rotation.y = pos.rot;
      this.scene.add(chalet);
      addObstacle(pos.x, pos.z, Math.max(pos.w, pos.d) * 0.58, 'chalet');
    });

    // --- Grand Christmas Tree in Town Square ---
    const grandTree = createSnowyPineTree(2.2);
    grandTree.position.set(0, 0, 22);
    this.scene.add(grandTree);
    addObstacle(0, 22, 2.0, 'tree');

    // Add festive colored baubles to the grand tree
    const baubleMat = new THREE.MeshStandardMaterial({
      color: 0xef4444,
      emissive: 0xdc2626,
      emissiveIntensity: 0.8,
    });
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const b = new THREE.Mesh(new THREE.SphereGeometry(0.2, 8, 8), baubleMat);
      b.position.set(Math.cos(angle) * 1.8, 2.5 + (i % 3) * 0.8, 22 + Math.sin(angle) * 1.8);
      this.scene.add(b);
    }

    // --- Snowy Pine Forests on Perimeters ---
    const treePositions = [
      // Border forest clumps
      [-46, -46], [-42, -45], [-45, -38], [-46, -20], [-46, 0], [-46, 20], [-46, 42],
      [46, -46], [42, -45], [45, -38], [46, -20], [46, 0], [46, 20], [46, 42],
      [-25, -46], [-10, -46], [10, -46], [25, -46],
      [-30, 46], [-10, 46], [10, 46], [30, 46],
      // Inner accents
      [-12, -12], [12, -12], [-14, 8], [14, 8],
    ];

    treePositions.forEach(([tx, tz]) => {
      const scale = 0.85 + Math.random() * 0.45;
      const pine = createSnowyPineTree(scale);
      pine.position.set(tx, 0, tz);
      pine.rotation.y = Math.random() * Math.PI * 2;
      this.scene.add(pine);
      addObstacle(tx, tz, 0.9 * scale, 'tree');
    });

    // --- Street Lamps along High Street and Plazas ---
    const lampPositions = [
      [-22, 5], [0, 5], [22, 5],
      [-22, -5], [0, -5], [22, -5],
      [-10, 15], [10, 15],
      [-10, 30], [10, 30],
      [-18, -20], [18, -20],
    ];

    lampPositions.forEach(([lx, lz]) => {
      const lamp = createStreetLamp();
      lamp.position.set(lx, 0, lz);
      this.scene.add(lamp);
      addObstacle(lx, lz, 0.4, 'lamp');
    });

    // --- Snowmen cheering along the roads ---
    const snowmanPositions = [
      [-14, 2], [14, -2], [-5, 12], [8, 14], [-24, -22],
    ];
    snowmanPositions.forEach(([sx, sz]) => {
      const snowman = createSnowman();
      snowman.position.set(sx, 0, sz);
      snowman.rotation.y = Math.random() * Math.PI * 2;
      this.scene.add(snowman);
      addObstacle(sx, sz, 0.6, 'snowman');
    });

    // --- Rustic Fences ---
    const fenceLines = [
      { x: -28, z: -8, length: 12, rot: 0 },
      { x: 28, z: -8, length: 12, rot: 0 },
      { x: -28, z: 8, length: 12, rot: 0 },
      { x: 28, z: 8, length: 12, rot: 0 },
    ];
    fenceLines.forEach((f) => {
      const fence = createFenceSegment(f.length);
      fence.position.set(f.x, 0, f.z);
      fence.rotation.y = f.rot;
      this.scene.add(fence);
      addObstacle(f.x, f.z, f.length * 0.45, 'fence');
    });

    // --- Frozen Pond Skating Rink (South) ---
    const pondGeo = new THREE.CylinderGeometry(12, 12, 0.1, 32);
    const pondMat = new THREE.MeshPhysicalMaterial({
      color: 0x7dd3fc,
      metalness: 0.1,
      roughness: 0.1,
      transmission: 0.6,
      thickness: 1.0,
      clearcoat: 1.0,
      clearcoatRoughness: 0.1,
    });
    const pond = new THREE.Mesh(pondGeo, pondMat);
    pond.position.set(0, 0.05, -38);
    this.scene.add(pond);
  }

  private setupParticles() {
    // 1. Snow Spray Particle Pool (from plow blade chutes)
    const maxSpray = 120;
    this.sprayGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(maxSpray * 3);
    const colors = new Float32Array(maxSpray * 3);

    for (let i = 0; i < maxSpray; i++) {
      positions[i * 3] = 0;
      positions[i * 3 + 1] = -10; // hidden initially
      positions[i * 3 + 2] = 0;
      colors[i * 3] = 0.95;
      colors[i * 3 + 1] = 0.98;
      colors[i * 3 + 2] = 1.0;
    }

    this.sprayGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.sprayGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const sprayMat = new THREE.PointsMaterial({
      size: 0.55,
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
    });
    this.sprayPoints = new THREE.Points(this.sprayGeo, sprayMat);
    this.sprayPoints.frustumCulled = false;
    this.scene.add(this.sprayPoints);

    // 2. Sky Falling Snowflakes
    const flakeCount = 280;
    const flakeGeo = new THREE.BufferGeometry();
    const flakePos = new Float32Array(flakeCount * 3);
    for (let i = 0; i < flakeCount; i++) {
      flakePos[i * 3] = (Math.random() - 0.5) * 90;
      flakePos[i * 3 + 1] = Math.random() * 25 + 1;
      flakePos[i * 3 + 2] = (Math.random() - 0.5) * 90;
    }
    flakeGeo.setAttribute('position', new THREE.BufferAttribute(flakePos, 3));

    const flakeMat = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.35,
      transparent: true,
      opacity: 0.75,
    });
    this.snowflakes = new THREE.Points(flakeGeo, flakeMat);
    this.scene.add(this.snowflakes);
  }

  private setupCollectibles() {
    this.snowGrid.collectibles.forEach((item) => {
      const mesh = createCollectibleMesh(item.type);
      mesh.position.set(item.position[0], item.position[1], item.position[2]);
      this.scene.add(mesh);
      this.collectibleMeshes.set(item.id, mesh);
    });
  }

  public emitSnowSpray(count: number, isPlowing: boolean) {
    if (!this.sprayPoints || !this.sprayGeo) return;
    const forward = this._vec3.set(Math.sin(this.heading), 0, Math.cos(this.heading));
    const right = new THREE.Vector3(Math.cos(this.heading), 0, -Math.sin(this.heading));

    const bladeWidth = this.truckParts.bladeWidth;

    for (let i = 0; i < count; i++) {
      if (this.sprayParticles.length > 100) break;
      const side = Math.random() > 0.5 ? 1 : -1;
      const origin = new THREE.Vector3(this.posX, 0.4, this.posZ)
        .addScaledVector(forward, 2.2)
        .addScaledVector(right, (side * bladeWidth) / 2);

      const vel = new THREE.Vector3()
        .copy(right)
        .multiplyScalar(side * (3.0 + Math.random() * 4.0))
        .addScaledVector(forward, 1.5 + Math.random() * 2.0);
      vel.y = 2.5 + Math.random() * 3.5;

      this.sprayParticles.push({
        position: origin,
        velocity: vel,
        life: 0,
        maxLife: 0.4 + Math.random() * 0.35,
        size: 0.4 + Math.random() * 0.3,
        color: new THREE.Color(0xf1f8ff),
      });
    }
  }

  private updateParticles(dt: number) {
    // 1. Update spray particles
    if (this.sprayPoints && this.sprayGeo) {
      const posAttr = this.sprayGeo.attributes.position as THREE.BufferAttribute;
      const posArray = posAttr.array as Float32Array;

      for (let i = this.sprayParticles.length - 1; i >= 0; i--) {
        const p = this.sprayParticles[i];
        p.life += dt;
        if (p.life >= p.maxLife) {
          this.sprayParticles.splice(i, 1);
          continue;
        }

        p.position.addScaledVector(p.velocity, dt);
        p.velocity.y -= 9.8 * dt; // gravity

        if (i < 120) {
          posArray[i * 3] = p.position.x;
          posArray[i * 3 + 1] = p.position.y;
          posArray[i * 3 + 2] = p.position.z;
        }
      }

      // Hide unused
      for (let i = this.sprayParticles.length; i < 120; i++) {
        posArray[i * 3 + 1] = -20;
      }
      posAttr.needsUpdate = true;
    }

    // 2. Update sky snowflakes (gentle snowfall)
    if (this.snowflakes) {
      const posAttr = this.snowflakes.geometry.attributes.position as THREE.BufferAttribute;
      const arr = posAttr.array as Float32Array;
      const count = arr.length / 3;

      for (let i = 0; i < count; i++) {
        arr[i * 3 + 1] -= dt * 2.2; // fall down
        arr[i * 3] += Math.sin(arr[i * 3 + 1] * 0.4 + i) * dt * 0.6; // gentle drift

        if (arr[i * 3 + 1] <= 0) {
          arr[i * 3 + 1] = 25;
          arr[i * 3] = this.posX + (Math.random() - 0.5) * 70;
          arr[i * 3 + 2] = this.posZ + (Math.random() - 0.5) * 70;
        }
      }
      posAttr.needsUpdate = true;
    }
  }

  private updateCollectibles(dt: number, time: number) {
    const magnetRadius = this.upgrades.magnetLevel === 2 ? 8.0 : this.upgrades.magnetLevel === 1 ? 4.5 : 0;

    this.snowGrid.collectibles.forEach((item) => {
      if (item.collected) return;
      const mesh = this.collectibleMeshes.get(item.id);
      if (!mesh) return;

      // Bobbing and spinning
      mesh.rotation.y = time * 2.5;
      mesh.position.y = item.position[1] + Math.sin(time * 3 + item.position[0]) * 0.15;

      const dx = this.posX - item.position[0];
      const dz = this.posZ - item.position[2];
      const dist = Math.sqrt(dx * dx + dz * dz);

      // Magnet pull
      if (magnetRadius > 0 && dist < magnetRadius) {
        item.position[0] += (dx / dist) * dt * 9.0;
        item.position[2] += (dz / dist) * dt * 9.0;
        mesh.position.x = item.position[0];
        mesh.position.z = item.position[2];
      }

      // Collect check (within truck bounding circle)
      if (dist < 2.0) {
        item.collected = true;
        this.scene.remove(mesh);
        this.coins += item.value;
        this.stats.totalCoinsEarned += item.value;
        this.stats.itemsFound++;
        synthAudio.playPickupSound(item.type);
        this.callbacks.onCoinsUpdate(this.coins);
        this.callbacks.onItemCollected(item);
      }
    });
  }

  public updateUpgrades(newUpgrades: VehicleUpgrades) {
    this.upgrades = { ...newUpgrades };
    this.truckParts.updateBladeLevel(this.upgrades.bladeLevel);
  }

  public triggerHorn() {
    synthAudio.playHorn();
    this.cameraShake = Math.max(this.cameraShake, 0.15);
  }

  public triggerBoost() {
    if (this.boostCooldown <= 0 && !this.boostActive) {
      this.boostActive = true;
      const duration = 2.0 + (this.upgrades.boostLevel - 1) * 0.6;
      this.boostTimer = duration;
      const cooldownBase = Math.max(3.0, 7.0 - (this.upgrades.boostLevel - 1) * 1.5);
      this.boostCooldown = cooldownBase;
      synthAudio.playBoostSound();
      this.cameraShake = 0.3;
    }
  }

  public resetGame() {
    this.posX = 0;
    this.posZ = 0;
    this.heading = 0;
    this.speed = 0;
    this.steerAngle = 0;
    this.comboCount = 0;
    this.comboMultiplier = 1.0;
    this.comboTimer = 0;
    this.boostActive = false;
    this.boostTimer = 0;
    this.boostCooldown = 0;

    // Reset snow grid
    this.snowGrid = new SnowGrid();
    this.snowTexture.dispose();
    this.snowTexture = new THREE.CanvasTexture(this.snowGrid.canvas);
    this.snowTexture.colorSpace = THREE.SRGBColorSpace;
    if (this.groundMesh) {
      (this.groundMesh.material as THREE.MeshStandardMaterial).map = this.snowTexture;
      (this.groundMesh.material as THREE.MeshStandardMaterial).needsUpdate = true;
    }

    // Reset collectibles
    this.collectibleMeshes.forEach((mesh) => this.scene.remove(mesh));
    this.collectibleMeshes.clear();
    this.setupCollectibles();

    this.callbacks.onSnowClearedPercent(0);
    this.callbacks.onComboUpdate({
      count: 0,
      multiplier: 1.0,
      timer: 0,
      maxTimer: this.maxComboTimer,
      tierName: 'Ready',
    });
  }

  public start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.lastTime = performance.now();
    this.tick(this.lastTime);
  }

  public stop() {
    this.isRunning = false;
    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
  }

  private tick = (currentTime: number) => {
    if (!this.isRunning) return;
    this.animFrameId = requestAnimationFrame(this.tick);

    const rawDt = (currentTime - this.lastTime) / 1000;
    this.lastTime = currentTime;
    // Frame delta clamp per craft guidelines
    const dt = Math.min(rawDt, 0.05);

    // Hitstop freeze on heavy collisions
    if (this.hitstopTimer > 0) {
      this.hitstopTimer -= dt;
      this.renderer.render(this.scene, this.camera);
      return;
    }

    this.update(dt, currentTime / 1000);
    this.renderer.render(this.scene, this.camera);
  };

  private update(dt: number, time: number) {
    if (this.isTitleScreenMode) {
      // Atmospheric live-world slow camera pan
      const panRadius = 38;
      const panSpeed = 0.12;
      const camX = Math.cos(time * panSpeed) * panRadius;
      const camZ = Math.sin(time * panSpeed) * panRadius + 10;
      this.camera.position.set(camX, 32, camZ);
      this.camera.lookAt(0, 2, 10);

      // Flashing amber beacon
      this.truckParts.updateBeacon(time);
      this.updateParticles(dt);
      return;
    }

    this.stats.timePlayedSeconds += dt;

    // 1. Boost timers
    if (this.boostActive) {
      this.boostTimer -= dt;
      if (this.boostTimer <= 0) {
        this.boostActive = false;
      }
    }
    if (this.boostCooldown > 0) {
      this.boostCooldown -= dt;
    }
    const cooldownProgress = Math.max(0, 1.0 - this.boostCooldown / this.maxBoostCooldown);
    this.callbacks.onBoostUpdate(this.boostCooldown <= 0, cooldownProgress);

    // 2. Vehicle acceleration & steering mechanics
    const maxSpeed = (12 + (this.upgrades.engineLevel - 1) * 3.5) * (this.boostActive ? 1.6 : 1.0);
    const accelRate = (15 + (this.upgrades.engineLevel - 1) * 4.0) * (this.boostActive ? 1.8 : 1.0);
    const brakeRate = 22.0;
    const gripFactor = 0.88 + (this.upgrades.treadsLevel - 1) * 0.05; // Less slippage on higher treads

    if (this.input.forward) {
      this.speed = Math.min(maxSpeed, this.speed + accelRate * dt);
    } else if (this.input.backward) {
      this.speed = Math.max(-maxSpeed * 0.5, this.speed - brakeRate * dt);
    } else {
      // Natural deceleration / snow drag
      this.speed = THREE.MathUtils.damp(this.speed, 0, 3.5, dt);
    }

    // Steering input
    const maxSteer = 0.55;
    let targetSteer = 0;
    if (this.input.left) targetSteer += maxSteer;
    if (this.input.right) targetSteer -= maxSteer;

    this.steerAngle = THREE.MathUtils.damp(this.steerAngle, targetSteer, 9.0 * gripFactor, dt);

    // Turn vehicle proportional to current speed (car physics)
    if (Math.abs(this.speed) > 0.1) {
      const turnSpeed = (this.speed / maxSpeed) * this.steerAngle * 2.6;
      this.heading += turnSpeed * dt;
    }

    // Compute proposed new position
    const forwardX = Math.sin(this.heading);
    const forwardZ = Math.cos(this.heading);
    const nextX = this.posX + forwardX * this.speed * dt;
    const nextZ = this.posZ + forwardZ * this.speed * dt;

    // 3. Collision resolution against town obstacles
    let collided = false;
    for (const obs of this.obstacles) {
      const dx = nextX - obs.x;
      const dz = nextZ - obs.z;
      const minDist = obs.radius + 1.4; // truck collision radius
      if (dx * dx + dz * dz < minDist * minDist) {
        collided = true;
        // Bump back
        this.speed = -this.speed * 0.45;
        this.cameraShake = 0.4;
        this.hitstopTimer = 0.05; // 50ms hitstop
        synthAudio.playCollisionSound();
        // Reset combo on hard crash!
        if (this.comboCount > 5) {
          this.comboCount = Math.floor(this.comboCount * 0.5);
          this.comboMultiplier = Math.max(1.0, this.comboMultiplier - 1.0);
        }
        break;
      }
    }

    // World boundary check (-48 to +48)
    if (Math.abs(nextX) > 48 || Math.abs(nextZ) > 48) {
      this.speed = -this.speed * 0.5;
      collided = true;
    }

    if (!collided) {
      this.posX = nextX;
      this.posZ = nextZ;
    }

    // 4. Update 3D truck transformation
    this.truckParts.group.position.set(this.posX, 0, this.posZ);
    this.truckParts.group.rotation.y = this.heading;

    // Wheel roll animation
    const wheelRot = (this.speed / 0.42) * dt;
    this.truckParts.wheels.forEach((w) => {
      w.rotation.x += wheelRot;
    });

    // Front wheels steering turn
    this.truckParts.wheels[0].rotation.y = this.steerAngle * 0.7;
    this.truckParts.wheels[1].rotation.y = this.steerAngle * 0.7;

    // Amber beacon
    this.truckParts.updateBeacon(time);

    // 5. Snow Plowing & Swept Footprint Clearance
    let isActivelyPlowing = false;
    let snowVolumeCleared = 0;

    // Position of front plow blade in world space
    const bladeOffset = 2.2;
    const bladeWorldX = this.posX + forwardX * bladeOffset;
    const bladeWorldZ = this.posZ + forwardZ * bladeOffset;
    const bladeRadius = this.truckParts.bladeWidth * 0.55;

    // Only plow if driving forward with speed > 0.8
    if (this.speed > 0.8) {
      const bladeClearance = this.snowGrid.clearSnowAt(
        bladeWorldX,
        bladeWorldZ,
        bladeRadius,
        1.0 + (this.upgrades.bladeLevel - 1) * 0.35
      );

      if (bladeClearance.clearedCount > 0) {
        isActivelyPlowing = true;
        snowVolumeCleared += bladeClearance.depthRemoved;
        this.emitSnowSpray(Math.min(6, bladeClearance.clearedCount), true);

        // Check if sector completed!
        bladeClearance.newlyCompletedSectors.forEach((sec) => {
          this.coins += sec.rewardCoins;
          this.stats.totalCoinsEarned += sec.rewardCoins;
          this.stats.sectorsCompleted++;
          synthAudio.playSectorCompletedSound();
          confetti({
            particleCount: 70,
            spread: 60,
            origin: { y: 0.65 },
          });
          this.callbacks.onSectorComplete(sec);
          this.callbacks.onCoinsUpdate(this.coins);
        });
      }
    }

    // 6. Salt Spreader clearance behind truck
    if (this.upgrades.spreaderLevel > 0 && Math.abs(this.speed) > 1.0) {
      const rearX = this.posX - forwardX * 1.6;
      const rearZ = this.posZ - forwardZ * 1.6;
      const spreaderRadius = 1.2 + (this.upgrades.spreaderLevel - 1) * 0.8;
      this.snowGrid.clearSnowAt(rearX, rearZ, spreaderRadius, 0.4);
    }

    // 7. Combo Multiplier Progression
    if (isActivelyPlowing) {
      this.comboTimer = this.maxComboTimer;
      this.comboCount += Math.round(snowVolumeCleared * 3.5) + 1;
      this.stats.snowPlowedMeters += snowVolumeCleared;

      // Calculate multiplier tiers
      let newMultiplier = 1.0;
      let tierName = 'Flurry';
      if (this.comboCount >= 220) {
        newMultiplier = 8.0;
        tierName = 'BLIZZARD KING!';
      } else if (this.comboCount >= 140) {
        newMultiplier = 5.0;
        tierName = 'Avalanche!';
      } else if (this.comboCount >= 80) {
        newMultiplier = 3.5;
        tierName = 'Snow Storm!';
      } else if (this.comboCount >= 40) {
        newMultiplier = 2.5;
        tierName = 'Drift Buster!';
      } else if (this.comboCount >= 15) {
        newMultiplier = 1.5;
        tierName = 'Plow Streak!';
      }

      if (newMultiplier > this.comboMultiplier) {
        this.comboMultiplier = newMultiplier;
        synthAudio.playComboChime(Math.floor(this.comboCount / 20), this.comboMultiplier);
        this.cameraShake = Math.max(this.cameraShake, 0.18);
      }

      if (this.comboMultiplier > this.stats.maxCombo) {
        this.stats.maxCombo = this.comboMultiplier;
      }

      // Add coins proportional to multiplier
      if (Math.random() < 0.25) {
        const coinInc = Math.round(this.comboMultiplier);
        this.coins += coinInc;
        this.stats.totalCoinsEarned += coinInc;
        this.callbacks.onCoinsUpdate(this.coins);
      }
    } else {
      // Combo decay when not clearing snow
      if (this.comboTimer > 0) {
        this.comboTimer -= dt;
      } else if (this.comboCount > 0) {
        this.comboCount = Math.max(0, this.comboCount - Math.round(30 * dt));
        if (this.comboCount === 0) {
          this.comboMultiplier = 1.0;
        }
      }
    }

    // 8. Update Snow Texture if modified
    if (this.snowGrid.isDirty) {
      this.snowTexture.needsUpdate = true;
      this.snowGrid.isDirty = false;
      const overallCleared = this.snowGrid.getOverallClearedPercent();
      this.callbacks.onSnowClearedPercent(overallCleared);
    }

    // 9. Audio feedback updates
    synthAudio.updateEngineSound(
      Math.abs(this.speed) / maxSpeed,
      this.input.forward,
      this.boostActive
    );
    synthAudio.updateSnowCrunch(isActivelyPlowing, this.speed / maxSpeed);

    // 10. Update Particles & Collectibles
    this.updateParticles(dt);
    this.updateCollectibles(dt, time);

    // 11. Camera follow with silky-smooth damping and shake
    const targetCamX = this.posX + this._camOffset.x;
    const targetCamY = this._camOffset.y;
    const targetCamZ = this.posZ + this._camOffset.z;

    this.camera.position.x = THREE.MathUtils.damp(this.camera.position.x, targetCamX, 6.0, dt);
    this.camera.position.y = targetCamY;
    this.camera.position.z = THREE.MathUtils.damp(this.camera.position.z, targetCamZ, 6.0, dt);

    // Apply camera shake
    if (this.cameraShake > 0) {
      this.camera.position.x += (Math.random() - 0.5) * this.cameraShake * 1.5;
      this.camera.position.z += (Math.random() - 0.5) * this.cameraShake * 1.5;
      this.cameraShake = THREE.MathUtils.damp(this.cameraShake, 0, 7.0, dt);
    }

    this._camTarget.set(this.posX, 0.8, this.posZ);
    this.camera.lookAt(this._camTarget);

    // 12. Notify React HUD
    this.callbacks.onSpeedUpdate(Math.abs(Math.round(this.speed * 2.2)), Math.round(maxSpeed * 2.2));
    this.callbacks.onComboUpdate({
      count: this.comboCount,
      multiplier: this.comboMultiplier,
      timer: this.comboTimer,
      maxTimer: this.maxComboTimer,
      tierName: this.comboCount >= 220 ? 'BLIZZARD KING!' : this.comboCount >= 140 ? 'AVALANCHE!' : this.comboCount >= 80 ? 'SNOW STORM!' : this.comboCount >= 40 ? 'DRIFT BUSTER' : this.comboCount > 0 ? 'PLOW STREAK' : 'CHILLING',
    });
    this.callbacks.onStatsUpdate(this.stats);
  }

  public getSectors(): TownSector[] {
    return this.snowGrid.sectors;
  }

  private onResize = () => {
    if (!this.container) return;
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    const aspect = w / h;
    const viewSize = 38;

    this.camera.left = (-viewSize * aspect) / 2;
    this.camera.right = (viewSize * aspect) / 2;
    this.camera.top = viewSize / 2;
    this.camera.bottom = -viewSize / 2;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(w, h);
  };

  public dispose() {
    this.stop();
    window.removeEventListener('resize', this.onResize);
    this.snowTexture.dispose();
    this.renderer.dispose();
    if (this.container.contains(this.renderer.domElement)) {
      this.container.removeChild(this.renderer.domElement);
    }
  }
}
