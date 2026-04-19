import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { SnakeGame } from './snake-game';

describe('SnakeGame', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SnakeGame],
    }).compileComponents();
  });

  it('should render the board, score, and initial snake body', () => {
    const fixture = TestBed.createComponent(SnakeGame);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.querySelector('h1')?.textContent).toContain('Snake Game');
    expect(compiled.querySelectorAll('.board-cell')).toHaveLength(144);
    expect(compiled.querySelectorAll('.board-cell--head')).toHaveLength(1);
    expect(compiled.querySelectorAll('.board-cell--snake')).toHaveLength(2);
    expect(compiled.textContent).toContain('Score');
    expect(compiled.textContent).toContain('Length');
    expect(compiled.textContent).toContain('Use arrow keys or WASD');
  });

  it('should move toward an apple, grow, and increase the score', () => {
    vi.useFakeTimers();

    const fixture = TestBed.createComponent(SnakeGame);
    fixture.detectChanges();

    const component = fixture.componentInstance as unknown as {
      apple: { set: (position: { x: number; y: number }) => void };
      step: () => void;
      resetGame: () => void;
    };
    component.resetGame();
    component.apple.set({ x: 5, y: 6 });
    fixture.detectChanges();

    component.step();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.querySelectorAll('.board-cell--head')).toHaveLength(1);
    expect(compiled.querySelectorAll('.board-cell--snake')).toHaveLength(3);
    expect(compiled.textContent).toContain('Score');
    expect(compiled.textContent).toContain('1');
    expect(compiled.textContent).toContain('4');

    vi.useRealTimers();
  });

  it('should pause and resume the game loop from the action button', () => {
    vi.useFakeTimers();

    const fixture = TestBed.createComponent(SnakeGame);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const pauseButton = compiled.querySelector<HTMLButtonElement>('.primary-button');

    pauseButton?.click();
    fixture.detectChanges();
    expect(compiled.querySelector('.status')?.textContent).toContain('Paused');
    expect(pauseButton?.textContent).toContain('Resume');

    pauseButton?.click();
    fixture.detectChanges();
    expect(compiled.querySelector('.status')?.textContent).toContain('Use arrow keys or WASD');
    expect(pauseButton?.textContent).toContain('Pause');

    vi.useRealTimers();
  });

  it('should end the game when the snake hits a wall', () => {
    vi.useFakeTimers();

    const fixture = TestBed.createComponent(SnakeGame);
    fixture.detectChanges();

    const component = fixture.componentInstance as unknown as { step: () => void };

    for (let index = 0; index < 8; index += 1) {
      component.step();
    }

    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.status')?.textContent).toContain('Game over');
    expect(compiled.querySelector<HTMLButtonElement>('.primary-button')?.disabled).toBe(true);

    vi.useRealTimers();
  });
});
