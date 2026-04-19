import { Component, DestroyRef, HostListener, computed, inject, signal } from '@angular/core';

type Direction = 'up' | 'down' | 'left' | 'right';

interface Position {
  x: number;
  y: number;
}

interface BoardCell extends Position {
  id: string;
  type: 'empty' | 'snake' | 'head' | 'apple';
  ariaLabel: string;
}

const BOARD_SIZE = 12;
const BOARD_CELLS = BOARD_SIZE * BOARD_SIZE;
const INITIAL_SNAKE: Position[] = [
  { x: 4, y: 6 },
  { x: 3, y: 6 },
  { x: 2, y: 6 },
];
const TICK_MS = 180;

const DIRECTION_VECTORS: Record<Direction, Position> = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

const OPPOSITE_DIRECTIONS: Record<Direction, Direction> = {
  up: 'down',
  down: 'up',
  left: 'right',
  right: 'left',
};

@Component({
  selector: 'app-snake-game',
  templateUrl: './snake-game.html',
  styleUrl: './snake-game.css',
})
export class SnakeGame {
  protected readonly snake = signal<Position[]>(INITIAL_SNAKE);
  protected readonly apple = signal<Position>(this.createApple(INITIAL_SNAKE));
  protected readonly direction = signal<Direction>('right');
  protected readonly isRunning = signal(true);
  protected readonly isGameOver = signal(false);
  protected readonly didWin = signal(false);
  protected readonly score = computed(() => this.snake().length - INITIAL_SNAKE.length);
  protected readonly statusMessage = computed(() => {
    if (this.didWin()) {
      return 'You filled the whole board. You win!';
    }

    if (this.isGameOver()) {
      return 'Game over. The snake crashed.';
    }

    if (!this.isRunning()) {
      return 'Paused. Press resume or steer to keep going.';
    }

    return 'Use arrow keys or WASD to eat apples and grow longer.';
  });
  protected readonly boardCells = computed(() => {
    const snake = this.snake();
    const apple = this.apple();
    const head = snake[0];
    const snakeCells = new Set(snake.map((segment) => this.toCellKey(segment)));

    return Array.from({ length: BOARD_CELLS }, (_, index) => {
      const x = index % BOARD_SIZE;
      const y = Math.floor(index / BOARD_SIZE);
      const position = { x, y };
      const isHead = head.x === x && head.y === y;
      const isApple = apple.x === x && apple.y === y;
      const isSnake = snakeCells.has(this.toCellKey(position));
      const type: BoardCell['type'] = isHead ? 'head' : isApple ? 'apple' : isSnake ? 'snake' : 'empty';

      return {
        ...position,
        id: `${x}-${y}`,
        type,
        ariaLabel: `Row ${y + 1}, column ${x + 1}: ${type.replace('-', ' ')}`,
      };
    });
  });

  private readonly destroyRef = inject(DestroyRef);
  private loopId: ReturnType<typeof setInterval> | undefined;
  private queuedDirection: Direction | null = null;

  constructor() {
    this.startLoop();
    this.destroyRef.onDestroy(() => this.stopLoop());
  }

  @HostListener('window:keydown', ['$event'])
  protected handleKeydown(event: KeyboardEvent): void {
    const nextDirection = this.getDirectionForKey(event.key);

    if (nextDirection) {
      event.preventDefault();
      this.changeDirection(nextDirection);
      return;
    }

    if (event.key === ' ') {
      event.preventDefault();
      this.togglePause();
    }
  }

  protected changeDirection(direction: Direction): void {
    if (this.isGameOver() || this.didWin()) {
      return;
    }

    if (!this.isRunning()) {
      this.isRunning.set(true);
      this.startLoop();
    }

    const activeDirection = this.queuedDirection ?? this.direction();

    if (OPPOSITE_DIRECTIONS[activeDirection] === direction) {
      return;
    }

    this.queuedDirection = direction;
  }

  protected togglePause(): void {
    if (this.isGameOver() || this.didWin()) {
      return;
    }

    if (this.isRunning()) {
      this.isRunning.set(false);
      this.stopLoop();
      return;
    }

    this.isRunning.set(true);
    this.startLoop();
  }

  protected resetGame(): void {
    this.stopLoop();
    this.snake.set(INITIAL_SNAKE.map((segment) => ({ ...segment })));
    this.apple.set(this.createApple(INITIAL_SNAKE));
    this.direction.set('right');
    this.queuedDirection = null;
    this.isGameOver.set(false);
    this.didWin.set(false);
    this.isRunning.set(true);
    this.startLoop();
  }

  protected step(): void {
    if (!this.isRunning() || this.isGameOver() || this.didWin()) {
      return;
    }

    const currentSnake = this.snake();
    const direction = this.queuedDirection ?? this.direction();
    const movement = DIRECTION_VECTORS[direction];
    const head = currentSnake[0];
    const nextHead = { x: head.x + movement.x, y: head.y + movement.y };
    const willEatApple = this.samePosition(nextHead, this.apple());
    const collisionBody = willEatApple ? currentSnake : currentSnake.slice(0, -1);

    this.direction.set(direction);
    this.queuedDirection = null;

    if (this.isOutsideBoard(nextHead) || collisionBody.some((segment) => this.samePosition(segment, nextHead))) {
      this.isGameOver.set(true);
      this.isRunning.set(false);
      this.stopLoop();
      return;
    }

    const nextSnake = [nextHead, ...currentSnake];

    if (!willEatApple) {
      nextSnake.pop();
    }

    this.snake.set(nextSnake);

    if (nextSnake.length === BOARD_CELLS) {
      this.didWin.set(true);
      this.isRunning.set(false);
      this.stopLoop();
      return;
    }

    if (willEatApple) {
      this.apple.set(this.createApple(nextSnake));
    }
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

  private createApple(snake: Position[]): Position {
    const occupied = new Set(snake.map((segment) => this.toCellKey(segment)));
    const availableCells: Position[] = [];

    for (let y = 0; y < BOARD_SIZE; y += 1) {
      for (let x = 0; x < BOARD_SIZE; x += 1) {
        const position = { x, y };

        if (!occupied.has(this.toCellKey(position))) {
          availableCells.push(position);
        }
      }
    }

    return availableCells[Math.floor(Math.random() * availableCells.length)] ?? { x: 0, y: 0 };
  }

  private getDirectionForKey(key: string): Direction | null {
    switch (key.toLowerCase()) {
      case 'arrowup':
      case 'w':
        return 'up';
      case 'arrowdown':
      case 's':
        return 'down';
      case 'arrowleft':
      case 'a':
        return 'left';
      case 'arrowright':
      case 'd':
        return 'right';
      default:
        return null;
    }
  }

  private isOutsideBoard(position: Position): boolean {
    return position.x < 0 || position.x >= BOARD_SIZE || position.y < 0 || position.y >= BOARD_SIZE;
  }

  private samePosition(first: Position, second: Position): boolean {
    return first.x === second.x && first.y === second.y;
  }

  private toCellKey(position: Position): string {
    return `${position.x},${position.y}`;
  }
}
