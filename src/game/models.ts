import * as THREE from 'three';

// Shared reusable materials & palettes
const asphaltColor = 0x242d38;
const snowWhite = 0xf4f8fc;
const cabinOrange = 0xf97316;
const metalSteel = 0x5a6578;
const rubberBlack = 0x1e242c;
const warmGlow = 0xffe28a;
const darkWood = 0x5c4033;
const pineGreen = 0x1b4332;

export interface PlowTruckParts {
  group: THREE.Group;
  bladeMesh: THREE.Group;
  wheels: THREE.Mesh[];
  beaconMesh: THREE.Mesh;
  headlights: THREE.SpotLight[];
  exhaustPos: THREE.Vector3;
  bladeWidth: number;
  updateBeacon: (time: number) => void;
  updateBladeLevel: (level: number) => void;
}

/**
 * Creates an exquisite 10-part procedural Alpine Snow Plow truck
 */
export function createPlowTruck(bladeLevel: number = 1): PlowTruckParts {
  const truckGroup = new THREE.Group();
  truckGroup.name = 'PlowTruck';

  // 1. Heavy undercarriage chassis
  const chassisGeo = new THREE.BoxGeometry(2.0, 0.45, 3.4);
  const chassisMat = new THREE.MeshStandardMaterial({
    color: metalSteel,
    metalness: 0.75,
    roughness: 0.35,
  });
  const chassis = new THREE.Mesh(chassisGeo, chassisMat);
  chassis.position.y = 0.55;
  chassis.castShadow = true;
  chassis.receiveShadow = true;
  truckGroup.add(chassis);

  // 2. Cozy Cab Body (Alpine Orange)
  const cabGeo = new THREE.BoxGeometry(1.8, 1.25, 1.9);
  const cabMat = new THREE.MeshStandardMaterial({
    color: cabinOrange,
    metalness: 0.25,
    roughness: 0.2,
  });
  const cab = new THREE.Mesh(cabGeo, cabMat);
  cab.position.set(0, 1.35, -0.15);
  cab.castShadow = true;
  truckGroup.add(cab);

  // Cab hood / engine bay
  const hoodGeo = new THREE.BoxGeometry(1.7, 0.65, 1.1);
  const hood = new THREE.Mesh(hoodGeo, cabMat);
  hood.position.set(0, 0.95, 1.25);
  hood.castShadow = true;
  truckGroup.add(hood);

  // Front radiator grille
  const grilleGeo = new THREE.BoxGeometry(1.3, 0.45, 0.1);
  const grilleMat = new THREE.MeshStandardMaterial({
    color: 0x11161d,
    metalness: 0.9,
    roughness: 0.2,
  });
  const grille = new THREE.Mesh(grilleGeo, grilleMat);
  grille.position.set(0, 0.95, 1.81);
  truckGroup.add(grille);

  // 3. Windshield & Cab Windows (Glossy Glass with inner warm glow)
  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0x93c5fd,
    metalness: 0.1,
    roughness: 0.05,
    transmission: 0.75,
    thickness: 0.5,
    transparent: true,
    opacity: 0.85,
  });
  // Front windshield
  const windshieldGeo = new THREE.BoxGeometry(1.6, 0.7, 0.08);
  const windshield = new THREE.Mesh(windshieldGeo, glassMat);
  windshield.position.set(0, 1.5, 0.82);
  windshield.rotation.x = -0.18;
  truckGroup.add(windshield);

  // Side windows
  const sideWindowGeo = new THREE.BoxGeometry(0.08, 0.55, 1.1);
  const sideWindowL = new THREE.Mesh(sideWindowGeo, glassMat);
  sideWindowL.position.set(-0.91, 1.52, -0.1);
  truckGroup.add(sideWindowL);

  const sideWindowR = new THREE.Mesh(sideWindowGeo, glassMat);
  sideWindowR.position.set(0.91, 1.52, -0.1);
  truckGroup.add(sideWindowR);

  // 4. Roof Rack & Flashing Amber Safety Beacon
  const rackGeo = new THREE.BoxGeometry(1.4, 0.08, 1.2);
  const rackMat = new THREE.MeshStandardMaterial({ color: 0x22262d, metalness: 0.8, roughness: 0.3 });
  const rack = new THREE.Mesh(rackGeo, rackMat);
  rack.position.set(0, 2.02, -0.15);
  truckGroup.add(rack);

  // Amber Beacon
  const beaconGeo = new THREE.CylinderGeometry(0.18, 0.22, 0.2, 12);
  const beaconMat = new THREE.MeshStandardMaterial({
    color: 0xf59e0b,
    emissive: 0xd97706,
    emissiveIntensity: 0.8,
    roughness: 0.1,
  });
  const beaconMesh = new THREE.Mesh(beaconGeo, beaconMat);
  beaconMesh.position.set(0, 2.16, -0.15);
  truckGroup.add(beaconMesh);

  // 5. Heavy-Duty Snow Tires with Studs & Rims
  const wheels: THREE.Mesh[] = [];
  const wheelRadius = 0.42;
  const wheelWidth = 0.34;
  const wheelGeo = new THREE.CylinderGeometry(wheelRadius, wheelRadius, wheelWidth, 18);
  wheelGeo.rotateZ(Math.PI / 2);

  const wheelMat = new THREE.MeshStandardMaterial({
    color: rubberBlack,
    roughness: 0.85,
    metalness: 0.1,
  });

  const rimGeo = new THREE.CylinderGeometry(0.24, 0.24, wheelWidth + 0.02, 12);
  rimGeo.rotateZ(Math.PI / 2);
  const rimMat = new THREE.MeshStandardMaterial({
    color: 0xd1d5db,
    metalness: 0.85,
    roughness: 0.25,
  });

  const wheelPositions = [
    [-1.05, 0.42, 1.15],
    [1.05, 0.42, 1.15],
    [-1.05, 0.42, -1.05],
    [1.05, 0.42, -1.05],
  ];

  wheelPositions.forEach((pos) => {
    const wheelGroup = new THREE.Group();
    const tire = new THREE.Mesh(wheelGeo, wheelMat);
    tire.castShadow = true;
    const rim = new THREE.Mesh(rimGeo, rimMat);
    wheelGroup.add(tire);
    wheelGroup.add(rim);
    wheelGroup.position.set(pos[0], pos[1], pos[2]);
    truckGroup.add(wheelGroup);
    wheels.push(tire);
  });

  // 6. Exhaust Pipe with warm chimney/engine puff
  const exhaustGeo = new THREE.CylinderGeometry(0.06, 0.06, 1.4, 8);
  const exhaustMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.9, roughness: 0.2 });
  const exhaust = new THREE.Mesh(exhaustGeo, exhaustMat);
  exhaust.position.set(-0.85, 1.6, -1.1);
  truckGroup.add(exhaust);

  // 7. Salt Spreader Box on rear bed
  const hopperGeo = new THREE.BoxGeometry(1.6, 0.7, 0.9);
  const hopperMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.5, roughness: 0.4 });
  const hopper = new THREE.Mesh(hopperGeo, hopperMat);
  hopper.position.set(0, 1.05, -1.2);
  hopper.castShadow = true;
  truckGroup.add(hopper);

  // Rear salt spinner disc
  const spinnerGeo = new THREE.CylinderGeometry(0.25, 0.25, 0.05, 12);
  const spinnerMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.8, roughness: 0.2 });
  const spinner = new THREE.Mesh(spinnerGeo, spinnerMat);
  spinner.position.set(0, 0.45, -1.75);
  truckGroup.add(spinner);

  // 8. Headlights (L & R)
  const headlights: THREE.SpotLight[] = [];
  const lightOffsets = [-0.6, 0.6];
  lightOffsets.forEach((xOff) => {
    // Light housing
    const housingGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.1, 12);
    housingGeo.rotateX(Math.PI / 2);
    const housingMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: warmGlow,
      emissiveIntensity: 1.0,
      roughness: 0.2,
    });
    const lightMesh = new THREE.Mesh(housingGeo, housingMat);
    lightMesh.position.set(xOff, 0.88, 1.82);
    truckGroup.add(lightMesh);

    // Warm headlight cone
    const spot = new THREE.SpotLight(0xfff3d6, 4.0, 18, Math.PI / 5, 0.35, 1.2);
    spot.position.set(xOff, 0.9, 1.85);
    spot.target.position.set(xOff, 0.2, 8);
    truckGroup.add(spot);
    truckGroup.add(spot.target);
    headlights.push(spot);
  });

  // 9. Front Plow Blade Assembly (Dynamic width & design based on level)
  const bladeGroup = new THREE.Group();
  bladeGroup.name = 'PlowBlade';
  bladeGroup.position.set(0, 0.4, 2.2);
  truckGroup.add(bladeGroup);

  let currentBladeWidth = 2.4;

  const rebuildBlade = (lvl: number) => {
    // Clear old children
    while (bladeGroup.children.length > 0) {
      bladeGroup.remove(bladeGroup.children[0]);
    }

    currentBladeWidth = 2.4 + (lvl - 1) * 0.7; // 2.4m -> 3.1m -> 3.8m -> 4.5m

    // Curved front scoop blade
    const curve = new THREE.CylinderGeometry(
      currentBladeWidth * 0.5,
      currentBladeWidth * 0.5,
      0.65,
      24,
      1,
      true,
      0,
      Math.PI * 0.45
    );
    curve.rotateZ(Math.PI / 2);
    curve.rotateY(Math.PI * 0.77);

    const bladeMat = new THREE.MeshStandardMaterial({
      color: lvl === 4 ? 0xef4444 : 0xe2e8f0, // Gold/red on max level!
      metalness: 0.85,
      roughness: 0.25,
      side: THREE.DoubleSide,
    });
    const bladeCurve = new THREE.Mesh(curve, bladeMat);
    bladeCurve.castShadow = true;
    bladeCurve.position.set(0, 0.15, 0);
    bladeGroup.add(bladeCurve);

    // Top reinforcement bar
    const barGeo = new THREE.BoxGeometry(currentBladeWidth, 0.1, 0.15);
    const barMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.8, roughness: 0.3 });
    const bar = new THREE.Mesh(barGeo, barMat);
    bar.position.set(0, 0.48, 0.05);
    bladeGroup.add(bar);

    // Hazard chevron plates on left/right wings
    const wingGeo = new THREE.BoxGeometry(0.1, 0.6, 0.35);
    const wingMat = new THREE.MeshStandardMaterial({
      color: 0xfacc15,
      roughness: 0.4,
    });
    const wingL = new THREE.Mesh(wingGeo, wingMat);
    wingL.position.set(-currentBladeWidth * 0.5, 0.15, 0.1);
    bladeGroup.add(wingL);

    const wingR = new THREE.Mesh(wingGeo, wingMat);
    wingR.position.set(currentBladeWidth * 0.5, 0.15, 0.1);
    bladeGroup.add(wingR);

    // Hydraulic push arms
    const armGeo = new THREE.CylinderGeometry(0.05, 0.05, 0.9, 8);
    armGeo.rotateX(Math.PI / 2);
    const armMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.9, roughness: 0.2 });

    const armL = new THREE.Mesh(armGeo, armMat);
    armL.position.set(-0.6, 0.1, -0.4);
    bladeGroup.add(armL);

    const armR = new THREE.Mesh(armGeo, armMat);
    armR.position.set(0.6, 0.1, -0.4);
    bladeGroup.add(armR);

    // If level 4: Add Rotary Turbo Snowblower turbines!
    if (lvl === 4) {
      const blowerGeo = new THREE.CylinderGeometry(0.28, 0.28, 0.3, 12);
      blowerGeo.rotateX(Math.PI / 2);
      const blowerMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.9, roughness: 0.1 });
      const blower = new THREE.Mesh(blowerGeo, blowerMat);
      blower.position.set(0, 0.25, 0.2);
      bladeGroup.add(blower);
    }
  };

  rebuildBlade(bladeLevel);

  const updateBeacon = (time: number) => {
    // Flashing rotation effect
    beaconMesh.rotation.y = time * 8;
    const pulse = 0.5 + 0.5 * Math.sin(time * 12);
    (beaconMesh.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.4 + pulse * 1.2;
  };

  return {
    group: truckGroup,
    bladeMesh: bladeGroup,
    wheels,
    beaconMesh,
    headlights,
    exhaustPos: new THREE.Vector3(-0.85, 2.3, -1.1),
    bladeWidth: currentBladeWidth,
    updateBeacon,
    updateBladeLevel: rebuildBlade,
  };
}

/**
 * Creates a cozy Alpine Chalet cabin with snowy roof, warm glowing windows, and stone chimney
 */
export function createAlpineChalet(width: number = 4.8, depth: number = 5.2): THREE.Group {
  const chalet = new THREE.Group();
  chalet.name = 'AlpineChalet';

  // 1. Stone foundation
  const foundGeo = new THREE.BoxGeometry(width + 0.4, 0.5, depth + 0.4);
  const foundMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.9, metalness: 0.1 });
  const found = new THREE.Mesh(foundGeo, foundMat);
  found.position.y = 0.25;
  found.receiveShadow = true;
  chalet.add(found);

  // 2. Timber Log walls
  const wallHeight = 2.8;
  const wallGeo = new THREE.BoxGeometry(width, wallHeight, depth);
  const wallMat = new THREE.MeshStandardMaterial({
    color: darkWood,
    roughness: 0.8,
    metalness: 0.05,
  });
  const walls = new THREE.Mesh(wallGeo, wallMat);
  walls.position.y = 0.5 + wallHeight * 0.5;
  walls.castShadow = true;
  walls.receiveShadow = true;
  chalet.add(walls);

  // 3. Steep A-frame snowy gable roof
  const roofHeight = 2.4;
  const roofGeo = new THREE.ConeGeometry((width + 1.2) * 0.75, roofHeight, 4);
  roofGeo.rotateY(Math.PI / 4);
  const roofMat = new THREE.MeshStandardMaterial({
    color: snowWhite,
    roughness: 0.6,
    metalness: 0.05,
  });
  const roof = new THREE.Mesh(roofGeo, roofMat);
  roof.position.y = 0.5 + wallHeight + roofHeight * 0.5 - 0.2;
  roof.scale.set(1.1, 1.0, depth / width);
  roof.castShadow = true;
  chalet.add(roof);

  // 4. Warm glowing windows
  const windowMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    emissive: 0xf59e0b,
    emissiveIntensity: 1.2,
    roughness: 0.2,
  });
  const winGeo = new THREE.PlaneGeometry(0.8, 1.0);

  // Front window
  const winFront = new THREE.Mesh(winGeo, windowMat);
  winFront.position.set(0, 1.8, depth * 0.5 + 0.02);
  chalet.add(winFront);

  // Side windows
  const winSide1 = new THREE.Mesh(winGeo, windowMat);
  winSide1.position.set(width * 0.5 + 0.02, 1.8, 0);
  winSide1.rotation.y = Math.PI / 2;
  chalet.add(winSide1);

  const winSide2 = new THREE.Mesh(winGeo, windowMat);
  winSide2.position.set(-width * 0.5 - 0.02, 1.8, 0);
  winSide2.rotation.y = -Math.PI / 2;
  chalet.add(winSide2);

  // Warm light source radiating onto nearby snow
  const windowLight = new THREE.PointLight(0xf59e0b, 1.2, 8, 1.5);
  windowLight.position.set(0, 1.8, depth * 0.5 + 0.8);
  chalet.add(windowLight);

  // 5. Stone chimney
  const chimneyGeo = new THREE.BoxGeometry(0.7, 2.8, 0.7);
  const chimneyMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.9, metalness: 0.2 });
  const chimney = new THREE.Mesh(chimneyGeo, chimneyMat);
  chimney.position.set(width * 0.32, 0.5 + wallHeight + 0.6, -depth * 0.2);
  chimney.castShadow = true;
  chalet.add(chimney);

  // Snow cap on chimney rim
  const chimCapGeo = new THREE.BoxGeometry(0.85, 0.2, 0.85);
  const chimCap = new THREE.Mesh(chimCapGeo, roofMat);
  chimCap.position.set(width * 0.32, 0.5 + wallHeight + 2.05, -depth * 0.2);
  chalet.add(chimCap);

  return chalet;
}

/**
 * Creates an alpine pine tree with layered snow caps
 */
export function createSnowyPineTree(scale: number = 1.0): THREE.Group {
  const tree = new THREE.Group();
  tree.name = 'SnowyPine';

  // Trunk
  const trunkGeo = new THREE.CylinderGeometry(0.25 * scale, 0.38 * scale, 1.6 * scale, 8);
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x3e2723, roughness: 0.9, metalness: 0.05 });
  const trunk = new THREE.Mesh(trunkGeo, trunkMat);
  trunk.position.y = 0.8 * scale;
  trunk.castShadow = true;
  tree.add(trunk);

  // 3 Foliage Tiers with snow tops
  const foliageMat = new THREE.MeshStandardMaterial({
    color: pineGreen,
    roughness: 0.8,
    metalness: 0.05,
  });
  const snowMat = new THREE.MeshStandardMaterial({
    color: snowWhite,
    roughness: 0.55,
    metalness: 0.05,
  });

  const tiers = [
    { r: 2.2 * scale, h: 2.0 * scale, y: 1.8 * scale },
    { r: 1.7 * scale, h: 1.8 * scale, y: 3.0 * scale },
    { r: 1.1 * scale, h: 1.6 * scale, y: 4.1 * scale },
  ];

  tiers.forEach((t) => {
    // Green tier
    const coneGeo = new THREE.ConeGeometry(t.r, t.h, 8);
    const cone = new THREE.Mesh(coneGeo, foliageMat);
    cone.position.y = t.y;
    cone.castShadow = true;
    tree.add(cone);

    // Snow cover tier
    const snowCapGeo = new THREE.ConeGeometry(t.r * 0.92, t.h * 0.5, 8);
    const snowCap = new THREE.Mesh(snowCapGeo, snowMat);
    snowCap.position.y = t.y + t.h * 0.22;
    snowCap.castShadow = true;
    tree.add(snowCap);
  });

  return tree;
}

/**
 * Creates a cozy warm Victorian street lantern
 */
export function createStreetLamp(): THREE.Group {
  const lamp = new THREE.Group();
  lamp.name = 'StreetLamp';

  // Base & post
  const postGeo = new THREE.CylinderGeometry(0.08, 0.14, 3.4, 8);
  const metalMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.9, roughness: 0.2 });
  const post = new THREE.Mesh(postGeo, metalMat);
  post.position.y = 1.7;
  post.castShadow = true;
  lamp.add(post);

  // Lantern glass head
  const glassGeo = new THREE.CylinderGeometry(0.24, 0.16, 0.45, 6);
  const glassMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    emissive: warmGlow,
    emissiveIntensity: 1.5,
    roughness: 0.1,
  });
  const lanternGlass = new THREE.Mesh(glassGeo, glassMat);
  lanternGlass.position.y = 3.4;
  lamp.add(lanternGlass);

  // Lantern roof with snow cap
  const roofGeo = new THREE.ConeGeometry(0.35, 0.25, 6);
  const roofMat = new THREE.MeshStandardMaterial({ color: snowWhite, roughness: 0.5 });
  const roof = new THREE.Mesh(roofGeo, roofMat);
  roof.position.y = 3.7;
  lamp.add(roof);

  // Warm light pool
  const light = new THREE.PointLight(warmGlow, 1.8, 10, 1.4);
  light.position.set(0, 3.3, 0);
  lamp.add(light);

  return lamp;
}

/**
 * Creates a friendly 3-tier Snowman with top hat and scarf
 */
export function createSnowman(): THREE.Group {
  const snowman = new THREE.Group();
  snowman.name = 'Snowman';

  const snowMat = new THREE.MeshStandardMaterial({ color: snowWhite, roughness: 0.5 });

  // Bottom sphere
  const bottom = new THREE.Mesh(new THREE.SphereGeometry(0.65, 12, 12), snowMat);
  bottom.position.y = 0.55;
  bottom.castShadow = true;
  snowman.add(bottom);

  // Middle sphere
  const mid = new THREE.Mesh(new THREE.SphereGeometry(0.48, 12, 12), snowMat);
  mid.position.y = 1.35;
  mid.castShadow = true;
  snowman.add(mid);

  // Head sphere
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.35, 12, 12), snowMat);
  head.position.y = 1.95;
  head.castShadow = true;
  snowman.add(head);

  // Carrot nose
  const noseGeo = new THREE.ConeGeometry(0.06, 0.3, 8);
  noseGeo.rotateX(Math.PI / 2);
  const noseMat = new THREE.MeshStandardMaterial({ color: 0xf97316, roughness: 0.6 });
  const nose = new THREE.Mesh(noseGeo, noseMat);
  nose.position.set(0, 1.95, 0.42);
  snowman.add(nose);

  // Woolen red scarf
  const scarfGeo = new THREE.TorusGeometry(0.32, 0.08, 8, 16);
  scarfGeo.rotateX(Math.PI / 2);
  const scarfMat = new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.7 });
  const scarf = new THREE.Mesh(scarfGeo, scarfMat);
  scarf.position.set(0, 1.7, 0);
  snowman.add(scarf);

  // Top hat
  const hatGeo = new THREE.CylinderGeometry(0.24, 0.24, 0.4, 12);
  const hatBrimGeo = new THREE.CylinderGeometry(0.38, 0.38, 0.04, 12);
  const hatMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.4 });
  const hat = new THREE.Mesh(hatGeo, hatMat);
  hat.position.y = 2.4;
  const hatBrim = new THREE.Mesh(hatBrimGeo, hatMat);
  hatBrim.position.y = 2.22;
  snowman.add(hat);
  snowman.add(hatBrim);

  return snowman;
}

/**
 * Creates 3D Floating Collectible Item Mesh
 */
export function createCollectibleMesh(type: 'coin' | 'cocoa' | 'mitten' | 'snowflake'): THREE.Group {
  const item = new THREE.Group();

  if (type === 'coin') {
    const geo = new THREE.CylinderGeometry(0.4, 0.4, 0.1, 16);
    geo.rotateX(Math.PI / 2);
    const mat = new THREE.MeshStandardMaterial({
      color: 0xfacc15,
      metalness: 0.9,
      roughness: 0.15,
      emissive: 0xd97706,
      emissiveIntensity: 0.3,
    });
    const coin = new THREE.Mesh(geo, mat);
    item.add(coin);
  } else if (type === 'cocoa') {
    // Red mug
    const mugGeo = new THREE.CylinderGeometry(0.25, 0.22, 0.5, 12);
    const mugMat = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.3 });
    const mug = new THREE.Mesh(mugGeo, mugMat);

    // White whipped cream / marshmallows top
    const creamGeo = new THREE.SphereGeometry(0.22, 8, 8);
    const creamMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.2 });
    const cream = new THREE.Mesh(creamGeo, creamMat);
    cream.position.y = 0.24;

    item.add(mug);
    item.add(cream);
  } else if (type === 'snowflake') {
    // Crystalline 6-pointed star
    const starGeo = new THREE.OctahedronGeometry(0.38, 0);
    const starMat = new THREE.MeshPhysicalMaterial({
      color: 0x38bdf8,
      metalness: 0.2,
      roughness: 0.05,
      transmission: 0.8,
      emissive: 0x0284c7,
      emissiveIntensity: 0.6,
    });
    const star = new THREE.Mesh(starGeo, starMat);
    item.add(star);
  } else {
    // Mitten
    const handGeo = new THREE.CapsuleGeometry(0.2, 0.35, 4, 8);
    const thumbGeo = new THREE.SphereGeometry(0.12, 6, 6);
    const mat = new THREE.MeshStandardMaterial({ color: 0x10b981, roughness: 0.8 });
    const hand = new THREE.Mesh(handGeo, mat);
    const thumb = new THREE.Mesh(thumbGeo, mat);
    thumb.position.set(0.16, 0.05, 0);
    item.add(hand);
    item.add(thumb);
  }

  return item;
}

/**
 * Creates rustic wooden post-and-rail fence segment
 */
export function createFenceSegment(length: number = 4.0): THREE.Group {
  const fence = new THREE.Group();
  const woodMat = new THREE.MeshStandardMaterial({ color: 0x4a3525, roughness: 0.85, metalness: 0.05 });
  const snowMat = new THREE.MeshStandardMaterial({ color: snowWhite, roughness: 0.6 });

  // 2 vertical posts
  const postGeo = new THREE.BoxGeometry(0.16, 1.2, 0.16);
  const postL = new THREE.Mesh(postGeo, woodMat);
  postL.position.set(-length * 0.5, 0.6, 0);
  postL.castShadow = true;
  fence.add(postL);

  const postR = new THREE.Mesh(postGeo, woodMat);
  postR.position.set(length * 0.5, 0.6, 0);
  postR.castShadow = true;
  fence.add(postR);

  // 2 horizontal rails
  const railGeo = new THREE.BoxGeometry(length, 0.1, 0.12);
  const railBottom = new THREE.Mesh(railGeo, woodMat);
  railBottom.position.y = 0.45;
  fence.add(railBottom);

  const railTop = new THREE.Mesh(railGeo, woodMat);
  railTop.position.y = 0.95;
  fence.add(railTop);

  // Dusted snow on top rail
  const railSnowGeo = new THREE.BoxGeometry(length, 0.06, 0.14);
  const railSnow = new THREE.Mesh(railSnowGeo, snowMat);
  railSnow.position.y = 1.02;
  fence.add(railSnow);

  return fence;
}
