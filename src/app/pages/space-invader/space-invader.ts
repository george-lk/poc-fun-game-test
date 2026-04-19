import { Component, DestroyRef, HostListener, computed, inject, signal } from '@angular/core';

type GameState = 'playing' | 'paused' | 'won' | 'lost';

interface Enemy {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

interface Bullet {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

const STAGE_WIDTH = 640;
const STAGE_HEIGHT = 720;
const PLAYER_WIDTH = 56;
const PLAYER_HEIGHT = 28;
const PLAYER_START_X = (STAGE_WIDTH - PLAYER_WIDTH) / 2;
const PLAYER_Y = STAGE_HEIGHT - 72;
const PLAYER_MOVE_STEP = 24;
const PLAYER_BULLET_WIDTH = 4;
const PLAYER_BULLET_HEIGHT = 18;
const PLAYER_BULLET_SPEED = 18;
const PLAYER_BULLET_LIMIT = 2;
const ENEMY_ROWS = 4;
const ENEMY_COLUMNS = 8;
const ENEMY_WIDTH = 42;
const ENEMY_HEIGHT = 28;
const ENEMY_GAP_X = 18;
const ENEMY_GAP_Y = 18;
const ENEMY_START_X = 94;
const ENEMY_START_Y = 96;
const ENEMY_STEP_X = 16;
const ENEMY_STEP_Y = 20;
const ENEMY_BULLET_WIDTH = 6;
const ENEMY_BULLET_HEIGHT = 18;
const ENEMY_BULLET_SPEED = 10;
const ENEMY_SCORE = 100;
const TICK_MS = 40;
const INITIAL_LIVES = 3;
const ENEMY_SHOT_INTERVAL_STEPS = 4;

function createInitialEnemies(): Enemy[] {
  return Array.from({ length: ENEMY_ROWS * ENEMY_COLUMNS }, (_, index) => {
    const row = Math.floor(index / ENEMY_COLUMNS);
    const column = index % ENEMY_COLUMNS;

    return {
      id: `enemy-${row}-${column}`,
      x: ENEMY_START_X + column * (ENEMY_WIDTH + ENEMY_GAP_X),
      y: ENEMY_START_Y + row * (ENEMY_HEIGHT + ENEMY_GAP_Y),
      width: ENEMY_WIDTH,
      height: ENEMY_HEIGHT,
    };
  });
}

const INITIAL_ENEMIES = createInitialEnemies();
const INITIAL_ENEMY_COUNT = INITIAL_ENEMIES.length;

@Component({
  selector: 'app-space-invader',
  templateUrl: './space-invader.html',
  styleUrl: './space-invader.css',
})
export class SpaceInvader {
  protected readonly stageWidth = STAGE_WIDTH;
  protected readonly stageHeight = STAGE_HEIGHT;
  protected readonly playerY = PLAYER_Y;
  protected readonly playerWidth = PLAYER_WIDTH;
  protected readonly playerHeight = PLAYER_HEIGHT;
  protected readonly playerX = signal(PLAYER_START_X);
  protected readonly enemies = signal<Enemy[]>(this.createEnemyWave());
  protected readonly playerBullets = signal<Bullet[]>([]);
  protected readonly enemyBullets = signal<Bullet[]>([]);
  protected readonly score = signal(0);
  protected readonly lives = signal(INITIAL_LIVES);
  protected readonly gameState = signal<GameState>('playing');
  protected readonly remainingEnemies = computed(() => this.enemies().length);
  protected readonly isPlaying = computed(() => this.gameState() === 'playing');
  protected readonly isPaused = computed(() => this.gameState() === 'paused');
  protected readonly isGameOver = computed(
    () => this.gameState() === 'won' || this.gameState() === 'lost',
  );
  protected readonly overlayTitle = computed(() => {
    switch (this.gameState()) {
      case 'paused':
        return 'Paused';
      case 'won':
        return 'Victory';
      case 'lost':
        return 'Game over';
      default:
        return '';
    }
  });
  protected readonly statusMessage = computed(() => {
    switch (this.gameState()) {
      case 'paused':
        return 'Paused. Press P to resume or R to restart the run.';
      case 'won':
        return 'Victory. You cleared the final wave. Press R to launch again.';
      case 'lost':
        return 'Game over. The invaders slipped through. Press R to restart.';
      default:
        return 'Move with Left and Right or A and D. Press Space to fire, P to pause, and R to restart.';
    }
  });

  private readonly destroyRef = inject(DestroyRef);
  private loopId: ReturnType<typeof setInterval> | undefined;
  private bulletSequence = 0;
  private enemyDirection: 1 | -1 = 1;
  private frameCount = 0;
  private enemyShotCountdown = ENEMY_SHOT_INTERVAL_STEPS;
  private enemyShooterIndex = 0;

  constructor() {
    this.startLoop();
    this.destroyRef.onDestroy(() => this.stopLoop());
  }

  @HostListener('window:keydown', ['$event'])
  protected handleKeydown(event: KeyboardEvent): void {
    const key = event.key.toLowerCase();

    if (key === 'r') {
      event.preventDefault();
      this.resetGame();
      return;
    }

    if (key === 'p') {
      event.preventDefault();
      this.togglePause();
      return;
    }

    if (!this.isPlaying()) {
      return;
    }

    if (key === 'arrowleft' || key === 'a') {
      event.preventDefault();
      this.movePlayer(-PLAYER_MOVE_STEP);
      return;
    }

    if (key === 'arrowright' || key === 'd') {
      event.preventDefault();
      this.movePlayer(PLAYER_MOVE_STEP);
      return;
    }

    if (key === ' ') {
      event.preventDefault();
      this.firePlayerShot();
    }
  }

  protected togglePause(): void {
    if (this.gameState() === 'won' || this.gameState() === 'lost') {
      return;
    }

    if (this.gameState() === 'paused') {
      this.gameState.set('playing');
      this.startLoop();
      return;
    }

    this.gameState.set('paused');
    this.stopLoop();
  }

  protected resetGame(): void {
    this.playerX.set(PLAYER_START_X);
    this.enemies.set(this.createEnemyWave());
    this.playerBullets.set([]);
    this.enemyBullets.set([]);
    this.score.set(0);
    this.lives.set(INITIAL_LIVES);
    this.gameState.set('playing');
    this.enemyDirection = 1;
    this.frameCount = 0;
    this.enemyShotCountdown = ENEMY_SHOT_INTERVAL_STEPS;
    this.enemyShooterIndex = 0;
    this.startLoop();
  }

  protected step(): void {
    if (!this.isPlaying()) {
      return;
    }

    this.frameCount += 1;
    this.moveBullets();
    this.resolveCollisions();

    if (!this.isPlaying()) {
      return;
    }

    if (this.frameCount % this.getEnemyMoveFrameInterval() === 0) {
      this.advanceEnemyWave();
      this.resolveCollisions();
    }
  }

  protected movePlayer(delta: number): void {
    if (!this.isPlaying()) {
      return;
    }

    const nextPosition = this.playerX() + delta;
    const maxPosition = STAGE_WIDTH - PLAYER_WIDTH;
    this.playerX.set(Math.min(Math.max(nextPosition, 0), maxPosition));
  }

  protected firePlayerShot(): void {
    if (!this.isPlaying() || this.playerBullets().length >= PLAYER_BULLET_LIMIT) {
      return;
    }

    const bullet: Bullet = {
      id: `player-bullet-${this.bulletSequence += 1}`,
      x: this.playerX() + PLAYER_WIDTH / 2 - PLAYER_BULLET_WIDTH / 2,
      y: PLAYER_Y - PLAYER_BULLET_HEIGHT,
      width: PLAYER_BULLET_WIDTH,
      height: PLAYER_BULLET_HEIGHT,
    };

    this.playerBullets.update((bullets) => [...bullets, bullet]);
  }

  private startLoop(): void {
    if (this.loopId) {
      return;
    }

    this.loopId = setInterval(() => this.step(), TICK_MS);
  }

  private stopLoop(): void {
    if (!this.loopId) {
      return;
    }

    clearInterval(this.loopId);
    this.loopId = undefined;
  }

  private moveBullets(): void {
    this.playerBullets.update((bullets) =>
      bullets
        .map((bullet) => ({ ...bullet, y: bullet.y - PLAYER_BULLET_SPEED }))
        .filter((bullet) => bullet.y + bullet.height >= 0),
    );
    this.enemyBullets.update((bullets) =>
      bullets
        .map((bullet) => ({ ...bullet, y: bullet.y + ENEMY_BULLET_SPEED }))
        .filter((bullet) => bullet.y <= STAGE_HEIGHT),
    );
  }

  private resolveCollisions(): void {
    let enemies = this.enemies();
    let playerBullets = this.playerBullets();
    let enemyBullets = this.enemyBullets();
    let scoreDelta = 0;

    if (enemies.length > 0 && playerBullets.length > 0) {
      const destroyedEnemyIds = new Set<string>();
      const survivingPlayerBullets: Bullet[] = [];

      for (const bullet of playerBullets) {
        const hitEnemy = enemies.find((enemy) => this.intersects(bullet, enemy));

        if (!hitEnemy) {
          survivingPlayerBullets.push(bullet);
          continue;
        }

        destroyedEnemyIds.add(hitEnemy.id);
        scoreDelta += ENEMY_SCORE;
      }

      if (destroyedEnemyIds.size > 0) {
        enemies = enemies.filter((enemy) => !destroyedEnemyIds.has(enemy.id));
      }

      playerBullets = survivingPlayerBullets;
    }

    const playerBounds = {
      x: this.playerX(),
      y: PLAYER_Y,
      width: PLAYER_WIDTH,
      height: PLAYER_HEIGHT,
    };
    const playerWasHit = enemyBullets.some((bullet) => this.intersects(bullet, playerBounds));

    if (playerWasHit) {
      enemyBullets = enemyBullets.filter((bullet) => !this.intersects(bullet, playerBounds));
      this.lives.update((lives) => Math.max(lives - 1, 0));
    }

    this.enemies.set(enemies);
    this.playerBullets.set(playerBullets);
    this.enemyBullets.set(enemyBullets);

    if (scoreDelta > 0) {
      this.score.update((score) => score + scoreDelta);
    }

    if (enemies.length === 0) {
      this.gameState.set('won');
      this.stopLoop();
      return;
    }

    if (this.lives() === 0 || this.hasEnemyReachedPlayerLine(enemies)) {
      this.gameState.set('lost');
      this.stopLoop();
    }
  }

  private advanceEnemyWave(): void {
    const enemies = this.enemies();

    if (enemies.length === 0) {
      return;
    }

    const shouldDrop = enemies.some((enemy) => {
      const nextX = enemy.x + this.enemyDirection * ENEMY_STEP_X;
      return nextX < 18 || nextX + enemy.width > STAGE_WIDTH - 18;
    });

    const nextEnemies = enemies.map((enemy) => ({
      ...enemy,
      x: shouldDrop ? enemy.x : enemy.x + this.enemyDirection * ENEMY_STEP_X,
      y: shouldDrop ? enemy.y + ENEMY_STEP_Y : enemy.y,
    }));

    if (shouldDrop) {
      this.enemyDirection = this.enemyDirection === 1 ? -1 : 1;
    }

    this.enemies.set(nextEnemies);
    this.enemyShotCountdown -= 1;

    if (this.enemyShotCountdown <= 0) {
      this.spawnEnemyShot(nextEnemies);
      this.enemyShotCountdown = ENEMY_SHOT_INTERVAL_STEPS;
    }
  }

  private spawnEnemyShot(enemies: Enemy[]): void {
    if (enemies.length === 0) {
      return;
    }

    const columns = new Map<number, Enemy>();

    for (const enemy of enemies) {
      const column = Math.round((enemy.x - ENEMY_START_X) / (ENEMY_WIDTH + ENEMY_GAP_X));
      const currentBottomEnemy = columns.get(column);

      if (!currentBottomEnemy || enemy.y > currentBottomEnemy.y) {
        columns.set(column, enemy);
      }
    }

    const shooters = Array.from(columns.values()).sort((first, second) => first.x - second.x);

    if (shooters.length === 0) {
      return;
    }

    const shooter = shooters[this.enemyShooterIndex % shooters.length];
    this.enemyShooterIndex += 1;

    const bullet: Bullet = {
      id: `enemy-bullet-${this.bulletSequence += 1}`,
      x: shooter.x + shooter.width / 2 - ENEMY_BULLET_WIDTH / 2,
      y: shooter.y + shooter.height,
      width: ENEMY_BULLET_WIDTH,
      height: ENEMY_BULLET_HEIGHT,
    };

    this.enemyBullets.update((bullets) => [...bullets, bullet]);
  }

  private getEnemyMoveFrameInterval(): number {
    const defeatedEnemies = INITIAL_ENEMY_COUNT - this.enemies().length;
    return Math.max(12 - Math.floor(defeatedEnemies / 4), 5);
  }

  private hasEnemyReachedPlayerLine(enemies: Enemy[]): boolean {
    return enemies.some((enemy) => enemy.y + enemy.height >= PLAYER_Y - 16);
  }

  private intersects(
    first: { x: number; y: number; width: number; height: number },
    second: { x: number; y: number; width: number; height: number },
  ): boolean {
    return (
      first.x < second.x + second.width &&
      first.x + first.width > second.x &&
      first.y < second.y + second.height &&
      first.y + first.height > second.y
    );
  }

  private createEnemyWave(): Enemy[] {
    return INITIAL_ENEMIES.map((enemy) => ({ ...enemy }));
  }
}
