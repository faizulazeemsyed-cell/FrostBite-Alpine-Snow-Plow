import { TownSector, CollectibleItem } from '../types/game';

export interface SnowCell {
  x: number;
  z: number;
  depth: number; // 0.0 (fully cleared) to 1.0 (deep drift)
  initialDepth: number;
  isPlowable: boolean;
  sectorId: string | null;
}

export class SnowGrid {
  public readonly size: number = 100; // 100x100 grid
  public readonly worldWidth: number = 100; // -50 to +50
  public readonly cellSize: number;
  public cells: Float32Array; // depth of each cell [0..1]
  public plowableMask: Uint8Array; // 1 if plowable, 0 if building/boundary
  public sectorMap: (string | null)[]; // sector id for each cell

  public sectors: TownSector[] = [];
  public collectibles: CollectibleItem[] = [];

  // Canvas texture for real-time snow surface rendering
  public canvas: HTMLCanvasElement;
  public ctx: CanvasRenderingContext2D;
  private dirtyMinX: number = 0;
  private dirtyMaxX: number = 0;
  private dirtyMinZ: number = 0;
  private dirtyMaxZ: number = 0;
  public isDirty: boolean = true;

  constructor() {
    this.cellSize = this.worldWidth / this.size; // 1.0 unit per cell
    const totalCells = this.size * this.size;
    this.cells = new Float32Array(totalCells);
    this.plowableMask = new Uint8Array(totalCells);
    this.sectorMap = new Array(totalCells).fill(null);

    // Setup offscreen canvas for snow mask
    this.canvas = document.createElement('canvas');
    this.canvas.width = this.size;
    this.canvas.height = this.size;
    this.ctx = this.canvas.getContext('2d', { willReadFrequently: false })!;

    this.initSectors();
    this.initPlowableRoads();
    this.initCollectibles();
    this.initCanvasTexture();
  }

  private initSectors() {
    this.sectors = [
      {
        id: 'main_street',
        name: 'Alpine High Street',
        description: 'Clear the central avenue for the morning delivery truck',
        targetPercent: 88,
        clearedPercent: 0,
        totalSnowCells: 0,
        clearedSnowCells: 0,
        isComplete: false,
        rewardCoins: 150,
        bounds: { minX: -42, maxX: 42, minZ: -6, maxZ: 6 },
      },
      {
        id: 'town_square',
        name: 'Town Square & Great Fir Tree',
        description: 'Plow the festive plaza and around the grand Christmas tree',
        targetPercent: 85,
        clearedPercent: 0,
        totalSnowCells: 0,
        clearedSnowCells: 0,
        isComplete: false,
        rewardCoins: 250,
        bounds: { minX: -18, maxX: 18, minZ: 8, maxZ: 38 },
      },
      {
        id: 'chalet_lane',
        name: 'Chalet Driveways',
        description: 'Help the villagers dig out their cozy log cabins',
        targetPercent: 82,
        clearedPercent: 0,
        totalSnowCells: 0,
        clearedSnowCells: 0,
        isComplete: false,
        rewardCoins: 200,
        bounds: { minX: -42, maxX: -10, minZ: -42, maxZ: -10 },
      },
      {
        id: 'hospital_lane',
        name: 'Clinic Emergency Route',
        description: 'Keep the mountain ambulance lane clear of deep drifts',
        targetPercent: 90,
        clearedPercent: 0,
        totalSnowCells: 0,
        clearedSnowCells: 0,
        isComplete: false,
        rewardCoins: 300,
        bounds: { minX: 10, maxX: 44, minZ: -42, maxZ: -10 },
      },
      {
        id: 'pond_perimeter',
        name: 'Frozen Pond Skating Rink',
        description: 'Clear the ice ring perimeter for village skaters',
        targetPercent: 80,
        clearedPercent: 0,
        totalSnowCells: 0,
        clearedSnowCells: 0,
        isComplete: false,
        rewardCoins: 220,
        bounds: { minX: -24, maxX: 24, minZ: -48, maxZ: -32 },
      },
    ];
  }

  private initPlowableRoads() {
    // Fill all cells initially with deep snow
    for (let gz = 0; gz < this.size; gz++) {
      for (let gx = 0; gx < this.size; gx++) {
        const idx = gz * this.size + gx;
        const wx = (gx + 0.5) * this.cellSize - this.worldWidth * 0.5;
        const wz = (gz + 0.5) * this.cellSize - this.worldWidth * 0.5;

        // Check if inside any sector bounds or road corridors
        let inSector: TownSector | null = null;
        for (const sec of this.sectors) {
          if (
            wx >= sec.bounds.minX &&
            wx <= sec.bounds.maxX &&
            wz >= sec.bounds.minZ &&
            wz <= sec.bounds.maxZ
          ) {
            inSector = sec;
            break;
          }
        }

        // Connecting side avenues and roundabouts
        const isConnectingRoad =
          (Math.abs(wx) < 5 && wz >= -45 && wz <= 42) || // North-south central road
          (Math.abs(wz) < 6 && wx >= -46 && wx <= 46) || // East-west main avenue
          (wx >= -38 && wx <= -12 && Math.abs(wz - -25) < 4) || // Chalet cross street
          (wx >= 12 && wx <= 40 && Math.abs(wz - -25) < 4) || // Hospital cross street
          (Math.abs(wx) < 18 && wz >= 12 && wz <= 35) || // Town square plaza
          (Math.sqrt(wx * wx + (wz + 38) * (wz + 38)) <= 14); // Pond ring

        if (inSector || isConnectingRoad) {
          this.cells[idx] = 1.0; // 100% snow depth initially
          this.plowableMask[idx] = 1;
          this.sectorMap[idx] = inSector ? inSector.id : null;
          if (inSector) {
            inSector.totalSnowCells++;
          }
        } else {
          // Off-road perimeter snow drift
          this.cells[idx] = 1.0;
          this.plowableMask[idx] = 0;
          this.sectorMap[idx] = null;
        }
      }
    }
  }

  private initCollectibles() {
    this.collectibles = [
      // Frozen coins
      { id: 'c1', type: 'coin', position: [-25, 0.4, 0], collected: false, value: 50, name: 'Frozen Gold Coin' },
      { id: 'c2', type: 'coin', position: [25, 0.4, 0], collected: false, value: 50, name: 'Frozen Gold Coin' },
      { id: 'c3', type: 'coin', position: [0, 0.4, 25], collected: false, value: 75, name: 'Frozen Gold Coin' },
      { id: 'c4', type: 'coin', position: [-25, 0.4, -25], collected: false, value: 60, name: 'Frozen Gold Coin' },
      { id: 'c5', type: 'coin', position: [25, 0.4, -25], collected: false, value: 60, name: 'Frozen Gold Coin' },
      { id: 'c6', type: 'coin', position: [-5, 0.4, -40], collected: false, value: 80, name: 'Frozen Gold Coin' },
      { id: 'c7', type: 'coin', position: [8, 0.4, -40], collected: false, value: 80, name: 'Frozen Gold Coin' },

      // Hot Cocoa Mugs
      { id: 'cocoa1', type: 'cocoa', position: [-12, 0.4, 18], collected: false, value: 100, name: 'Steaming Cocoa Mug' },
      { id: 'cocoa2', type: 'cocoa', position: [32, 0.4, -20], collected: false, value: 100, name: 'Steaming Cocoa Mug' },
      { id: 'cocoa3', type: 'cocoa', position: [-32, 0.4, -22], collected: false, value: 100, name: 'Steaming Cocoa Mug' },

      // Lost Mittens
      { id: 'mitten1', type: 'mitten', position: [14, 0.4, 28], collected: false, value: 120, name: 'Woolen Mitten' },
      { id: 'mitten2', type: 'mitten', position: [-20, 0.4, -30], collected: false, value: 120, name: 'Woolen Mitten' },

      // Golden Snowflakes
      { id: 'flake1', type: 'snowflake', position: [0, 0.6, 32], collected: false, value: 200, name: 'Rare Golden Snowflake' },
      { id: 'flake2', type: 'snowflake', position: [0, 0.6, -38], collected: false, value: 200, name: 'Rare Golden Snowflake' },
    ];
  }

  private initCanvasTexture() {
    // Fill snow canvas with crisp snowy white
    this.ctx.fillStyle = '#f8fbff';
    this.ctx.fillRect(0, 0, this.size, this.size);
    this.isDirty = true;
  }

  public worldToGrid(wx: number, wz: number): { gx: number; gz: number } {
    const gx = Math.floor(((wx + this.worldWidth * 0.5) / this.worldWidth) * this.size);
    const gz = Math.floor(((wz + this.worldWidth * 0.5) / this.worldWidth) * this.size);
    return {
      gx: Math.max(0, Math.min(this.size - 1, gx)),
      gz: Math.max(0, Math.min(this.size - 1, gz)),
    };
  }

  public gridToWorld(gx: number, gz: number): { wx: number; wz: number } {
    return {
      wx: (gx + 0.5) * this.cellSize - this.worldWidth * 0.5,
      wz: (gz + 0.5) * this.cellSize - this.worldWidth * 0.5,
    };
  }

  /**
   * Clears snow in a swept footprint (e.g. plow blade or salt spreader)
   * Returns: { clearedCount, totalDepthRemoved, sectorUpdates }
   */
  public clearSnowAt(
    centerX: number,
    centerZ: number,
    radius: number,
    efficiency: number = 1.0
  ): {
    clearedCount: number;
    depthRemoved: number;
    newlyCompletedSectors: TownSector[];
  } {
    const center = this.worldToGrid(centerX, centerZ);
    const gridRadius = Math.ceil(radius / this.cellSize);

    let clearedCount = 0;
    let depthRemoved = 0;
    const newlyCompletedSectors: TownSector[] = [];

    const minGx = Math.max(0, center.gx - gridRadius);
    const maxGx = Math.min(this.size - 1, center.gx + gridRadius);
    const minGz = Math.max(0, center.gz - gridRadius);
    const maxGz = Math.min(this.size - 1, center.gz + gridRadius);

    for (let gz = minGz; gz <= maxGz; gz++) {
      for (let gx = minGx; gx <= maxGx; gx++) {
        const { wx, wz } = this.gridToWorld(gx, gz);
        const distSq = (wx - centerX) * (wx - centerX) + (wz - centerZ) * (wz - centerZ);

        if (distSq <= radius * radius) {
          const idx = gz * this.size + gx;
          const currentDepth = this.cells[idx];

          if (currentDepth > 0.05) {
            const reduction = Math.min(currentDepth, 0.45 * efficiency);
            this.cells[idx] = Math.max(0, currentDepth - reduction);
            depthRemoved += reduction;
            clearedCount++;

            // Update sector stats if this crossed threshold to fully plowed
            if (this.cells[idx] <= 0.15 && currentDepth > 0.15) {
              const sectorId = this.sectorMap[idx];
              if (sectorId) {
                const sector = this.sectors.find((s) => s.id === sectorId);
                if (sector && !sector.isComplete) {
                  sector.clearedSnowCells++;
                  sector.clearedPercent = Math.min(
                    100,
                    Math.round((sector.clearedSnowCells / Math.max(1, sector.totalSnowCells)) * 100)
                  );
                  if (sector.clearedPercent >= sector.targetPercent) {
                    sector.isComplete = true;
                    newlyCompletedSectors.push(sector);
                  }
                }
              }
            }

            // Draw to snow mask canvas: 0 = plowed dark asphalt, 1 = white snow
            const alpha = this.cells[idx];
            // We use dark asphalt color for cleared roads
            this.ctx.fillStyle = `rgba(32, 42, 54, ${1.0 - alpha})`;
            this.ctx.fillRect(gx, gz, 1, 1);
            this.isDirty = true;
          }
        }
      }
    }

    return { clearedCount, depthRemoved, newlyCompletedSectors };
  }

  public getOverallClearedPercent(): number {
    let totalPlowable = 0;
    let totalCleared = 0;
    for (let i = 0; i < this.cells.length; i++) {
      if (this.plowableMask[i] === 1) {
        totalPlowable++;
        if (this.cells[i] <= 0.2) {
          totalCleared++;
        }
      }
    }
    return totalPlowable > 0 ? Math.round((totalCleared / totalPlowable) * 100) : 0;
  }
}
