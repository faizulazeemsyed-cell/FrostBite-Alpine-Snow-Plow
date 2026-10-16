/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import { FrostBiteScene } from './game/threeScene';
import { TitleScreen } from './components/TitleScreen';
import { HUD } from './components/HUD';
import { UpgradesModal } from './components/UpgradesModal';
import { PauseModal } from './components/PauseModal';
import { VictoryModal } from './components/VictoryModal';
import { TouchControls } from './components/TouchControls';
import { synthAudio } from './audio/SynthAudio';
import { GameMode, VehicleUpgrades, ComboState, GameStats, TownSector } from './types/game';

export default function App() {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<FrostBiteScene | null>(null);

  // Game flow states
  const [gameMode, setGameMode] = useState<GameMode>('TITLE');
  const [isGarageOpen, setIsGarageOpen] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  // HUD readouts
  const [speed, setSpeed] = useState(0);
  const [maxSpeed, setMaxSpeed] = useState(26);
  const [coins, setCoins] = useState(50);
  const [snowClearedPercent, setSnowClearedPercent] = useState(0);
  const [combo, setCombo] = useState<ComboState>({
    count: 0,
    multiplier: 1.0,
    timer: 0,
    maxTimer: 4.0,
    tierName: 'Ready',
  });
  const [boostReady, setBoostReady] = useState(true);
  const [boostProgress, setBoostProgress] = useState(1.0);
  const [activeSector, setActiveSector] = useState<TownSector | null>(null);

  const [upgrades, setUpgrades] = useState<VehicleUpgrades>({
    bladeLevel: 1,
    engineLevel: 1,
    treadsLevel: 1,
    spreaderLevel: 0,
    boostLevel: 1,
    magnetLevel: 0,
  });

  const [stats, setStats] = useState<GameStats>({
    snowPlowedMeters: 0,
    totalCoinsEarned: 50,
    maxCombo: 1,
    sectorsCompleted: 0,
    timePlayedSeconds: 0,
    itemsFound: 0,
  });

  // Touch device detection
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  // Initialize Three.js scene once on mount
  useEffect(() => {
    if (!mountRef.current) return;

    setIsTouchDevice('ontouchstart' in window || navigator.maxTouchPoints > 0);

    const scene = new FrostBiteScene(mountRef.current, {
      onSpeedUpdate: (spd, maxSpd) => {
        setSpeed(spd);
        setMaxSpeed(maxSpd);
      },
      onComboUpdate: (c) => setCombo(c),
      onCoinsUpdate: (c) => setCoins(c),
      onSectorComplete: (sec) => {
        setActiveSector(sec);
      },
      onItemCollected: (item) => {
        // Collectible feedback
      },
      onSnowClearedPercent: (pct) => {
        setSnowClearedPercent(pct);
        if (pct >= 85 && gameMode === 'PLAYING') {
          setGameMode('VICTORY');
        }
      },
      onBoostUpdate: (ready, progress) => {
        setBoostReady(ready);
        setBoostProgress(progress);
      },
      onStatsUpdate: (st) => setStats(st),
    });

    sceneRef.current = scene;
    scene.start();

    return () => {
      scene.dispose();
      synthAudio.dispose();
    };
  }, []);

  // Keyboard input listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Audio unlock on first keypress
      synthAudio.init();
      synthAudio.resume();

      if (e.code === 'KeyP' || e.code === 'Escape') {
        if (gameMode === 'PLAYING') {
          if (isGarageOpen) {
            setIsGarageOpen(false);
          } else {
            setGameMode('PAUSED');
          }
        } else if (gameMode === 'PAUSED') {
          setGameMode('PLAYING');
        }
        return;
      }

      if (gameMode === 'TITLE') {
        if (e.code === 'Space' || e.code === 'Enter') {
          handleStartGame();
        }
        return;
      }

      if (gameMode === 'PLAYING' && !isGarageOpen) {
        if (e.code === 'KeyW' || e.code === 'ArrowUp') sceneRef.current!.input.forward = true;
        if (e.code === 'KeyS' || e.code === 'ArrowDown') sceneRef.current!.input.backward = true;
        if (e.code === 'KeyA' || e.code === 'ArrowLeft') sceneRef.current!.input.left = true;
        if (e.code === 'KeyD' || e.code === 'ArrowRight') sceneRef.current!.input.right = true;
        if (e.code === 'Space') {
          e.preventDefault();
          sceneRef.current?.triggerBoost();
        }
        if (e.code === 'KeyH') {
          e.preventDefault();
          sceneRef.current?.triggerHorn();
        }
        if (e.code === 'KeyB' || e.code === 'KeyU') {
          setIsGarageOpen((prev) => !prev);
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (!sceneRef.current) return;
      if (e.code === 'KeyW' || e.code === 'ArrowUp') sceneRef.current.input.forward = false;
      if (e.code === 'KeyS' || e.code === 'ArrowDown') sceneRef.current.input.backward = false;
      if (e.code === 'KeyA' || e.code === 'ArrowLeft') sceneRef.current.input.left = false;
      if (e.code === 'KeyD' || e.code === 'ArrowRight') sceneRef.current.input.right = false;
    };

    const handleBlur = () => {
      // Clear held keys on blur
      if (sceneRef.current) {
        sceneRef.current.input.forward = false;
        sceneRef.current.input.backward = false;
        sceneRef.current.input.left = false;
        sceneRef.current.input.right = false;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleBlur);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleBlur);
    };
  }, [gameMode, isGarageOpen]);

  const handleStartGame = () => {
    synthAudio.init();
    synthAudio.resume();
    if (sceneRef.current) {
      sceneRef.current.isTitleScreenMode = false;
    }
    setGameMode('PLAYING');
  };

  const handleToggleMute = () => {
    const muted = synthAudio.toggleMute();
    setIsMuted(muted);
  };

  const handleUpgrade = (id: keyof VehicleUpgrades, cost: number) => {
    if (!sceneRef.current) return;
    const newUpgrades = {
      ...upgrades,
      [id]: upgrades[id] + 1,
    };
    setUpgrades(newUpgrades);
    const newCoins = coins - cost;
    setCoins(newCoins);
    sceneRef.current.coins = newCoins;
    sceneRef.current.updateUpgrades(newUpgrades);
  };

  const handleRestart = () => {
    if (sceneRef.current) {
      sceneRef.current.resetGame();
    }
    setGameMode('PLAYING');
    setIsGarageOpen(false);
  };

  const handleExitToTitle = () => {
    if (sceneRef.current) {
      sceneRef.current.isTitleScreenMode = true;
      sceneRef.current.resetGame();
    }
    setGameMode('TITLE');
    setIsGarageOpen(false);
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#0d1722]">
      {/* Isolated WebGL Canvas Container */}
      <div ref={mountRef} className="absolute inset-0 w-full h-full z-0 cursor-grab active:cursor-grabbing" />

      {/* Screen Shell Overlays */}
      {gameMode === 'TITLE' && (
        <TitleScreen
          onStart={handleStartGame}
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
        />
      )}

      {gameMode === 'PLAYING' && (
        <>
          <HUD
            speed={speed}
            maxSpeed={maxSpeed}
            coins={coins}
            snowClearedPercent={snowClearedPercent}
            combo={combo}
            upgrades={upgrades}
            boostReady={boostReady}
            boostProgress={boostProgress}
            activeSector={activeSector}
            isMuted={isMuted}
            onToggleMute={handleToggleMute}
            onOpenGarage={() => setIsGarageOpen(true)}
            onPause={() => setGameMode('PAUSED')}
            onTriggerHorn={() => sceneRef.current?.triggerHorn()}
            onTriggerBoost={() => sceneRef.current?.triggerBoost()}
          />

          {isTouchDevice && (
            <TouchControls
              onForward={(pressed) => {
                if (sceneRef.current) sceneRef.current.input.forward = pressed;
              }}
              onBackward={(pressed) => {
                if (sceneRef.current) sceneRef.current.input.backward = pressed;
              }}
              onLeft={(pressed) => {
                if (sceneRef.current) sceneRef.current.input.left = pressed;
              }}
              onRight={(pressed) => {
                if (sceneRef.current) sceneRef.current.input.right = pressed;
              }}
              onBoost={() => sceneRef.current?.triggerBoost()}
              onHorn={() => sceneRef.current?.triggerHorn()}
              boostReady={boostReady}
            />
          )}
        </>
      )}

      {/* Upgrades Garage Modal */}
      {isGarageOpen && (
        <UpgradesModal
          coins={coins}
          upgrades={upgrades}
          onUpgrade={handleUpgrade}
          onClose={() => setIsGarageOpen(false)}
        />
      )}

      {/* Pause Modal */}
      {gameMode === 'PAUSED' && (
        <PauseModal
          onResume={() => setGameMode('PLAYING')}
          onRestart={handleRestart}
          onExitToTitle={handleExitToTitle}
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
        />
      )}

      {/* Victory Modal */}
      {gameMode === 'VICTORY' && (
        <VictoryModal
          stats={stats}
          snowClearedPercent={snowClearedPercent}
          onContinueFreePlow={() => setGameMode('PLAYING')}
          onPlayNewShift={handleRestart}
        />
      )}
    </div>
  );
}
