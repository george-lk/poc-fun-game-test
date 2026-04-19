import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { SpaceInvader } from './space-invader';

interface SignalLike<T> {
  (): T;
  set: (value: T) => void;
}

describe('SpaceInvader', () => {
  beforeEach(async () => {
    vi.useFakeTimers();

    await TestBed.configureTestingModule({
      imports: [SpaceInvader],
    }).compileComponents();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should render the stage, score panel, lives, and full enemy fleet', () => {
    const fixture = TestBed.createComponent(SpaceInvader);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.querySelector('h1')?.textContent).toContain('Space Invader');
    expect(compiled.querySelectorAll('.enemy')).toHaveLength(32);
    expect(compiled.querySelector('.player-ship')).toBeTruthy();
    expect(compiled.textContent).toContain('Score');
    expect(compiled.textContent).toContain('Lives');
    expect(compiled.textContent).toContain('Fleet');
    expect(compiled.textContent).toContain('Move');
    expect(compiled.textContent).toContain('Space');
  });

  it('should destroy an enemy, raise the score, and enter the win state when the fleet is cleared', () => {
    const fixture = TestBed.createComponent(SpaceInvader);
    fixture.detectChanges();

    const component = fixture.componentInstance as unknown as {
      playerX: SignalLike<number>;
      playerY: number;
      enemies: SignalLike<Array<{ id: string; x: number; y: number; width: number; height: number }>>;
      playerBullets: SignalLike<Array<{ id: string; x: number; y: number; width: number; height: number }>>;
      score: SignalLike<number>;
      firePlayerShot: () => void;
      step: () => void;
    };

    component.playerX.set(220);
    component.playerBullets.set([]);
    component.enemies.set([
      {
        id: 'enemy-final',
        x: 225,
        y: component.playerY - 96,
        width: 42,
        height: 28,
      },
    ]);
    component.firePlayerShot();

    for (let index = 0; index < 6; index += 1) {
      component.step();
    }

    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;

    expect(component.score()).toBe(100);
    expect(compiled.querySelectorAll('.enemy')).toHaveLength(0);
    expect(compiled.querySelector('.overlay h2')?.textContent).toContain('Victory');
    expect(compiled.textContent).toContain('Press R to launch again');
  });

  it('should pause and resume from the keyboard shortcut', () => {
    const fixture = TestBed.createComponent(SpaceInvader);
    fixture.detectChanges();

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'p' }));
    fixture.detectChanges();

    let compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.overlay h2')?.textContent).toContain('Paused');
    expect(compiled.textContent).toContain('Press P to resume');

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'p' }));
    fixture.detectChanges();

    compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.overlay')).toBeNull();
    expect(compiled.textContent).toContain('Press Space to fire');
  });

  it('should lose all lives after repeated enemy hits and show game over', () => {
    const fixture = TestBed.createComponent(SpaceInvader);
    fixture.detectChanges();

    const component = fixture.componentInstance as unknown as {
      playerX: SignalLike<number>;
      playerY: number;
      enemyBullets: SignalLike<Array<{ id: string; x: number; y: number; width: number; height: number }>>;
      lives: SignalLike<number>;
      step: () => void;
    };

    component.playerX.set(280);

    for (let index = 0; index < 3; index += 1) {
      component.enemyBullets.set([
        {
          id: `enemy-hit-${index}`,
          x: 306,
          y: component.playerY - 8,
          width: 6,
          height: 18,
        },
      ]);
      component.step();
    }

    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;

    expect(component.lives()).toBe(0);
    expect(compiled.querySelector('.overlay h2')?.textContent).toContain('Game over');
    expect(compiled.textContent).toContain('Press R to restart');
  });
});
