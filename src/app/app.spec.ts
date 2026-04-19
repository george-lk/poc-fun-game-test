import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { vi } from 'vitest';
import { App } from './app';
import { routes } from './app.routes';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideRouter(routes)],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should keep the loading modal visible for at least five seconds', async () => {
    vi.useFakeTimers();

    const fixture = TestBed.createComponent(App);
    const router = TestBed.inject(Router);

    await router.navigateByUrl('/');
    fixture.detectChanges();

    let compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.loading-backdrop')).toBeTruthy();

    await vi.advanceTimersByTimeAsync(4999);
    fixture.detectChanges();
    compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.loading-backdrop')).toBeTruthy();

    await vi.advanceTimersByTimeAsync(1);
    fixture.detectChanges();
    compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.loading-backdrop')).toBeNull();

    vi.useRealTimers();
  });

  it('should render the home page content after loading completes', async () => {
    vi.useFakeTimers();

    const fixture = TestBed.createComponent(App);
    const router = TestBed.inject(Router);

    await router.navigateByUrl('/');
    await vi.advanceTimersByTimeAsync(5000);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const navLinks = Array.from(compiled.querySelectorAll('nav a')).map((link) =>
      link.textContent?.trim(),
    );

    expect(navLinks).toContain('Home');
    expect(navLinks).toContain('Tic Tac Toe');
    expect(navLinks).toContain('Snake Game');
    expect(navLinks).toContain('Space Invader');
    expect(compiled.querySelector('h1')?.textContent).toContain('Home');
    expect(compiled.textContent).toContain('No new announcement');
    expect(compiled.textContent).toContain('No new latest patch');
    expect(compiled.textContent).toContain('Featured games');
    expect(compiled.textContent).toContain('Eat apples, grow longer, and avoid crashing into yourself.');
    expect(compiled.textContent).toContain('Arcade defense is coming soon with waves, scoring, and ship controls.');

    vi.useRealTimers();
  });

  it('should render the tic tac toe page from navigation after loading completes', async () => {
    vi.useFakeTimers();

    const fixture = TestBed.createComponent(App);
    const router = TestBed.inject(Router);

    await router.navigateByUrl('/tic-tac-toe');
    await vi.advanceTimersByTimeAsync(5000);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const navLinks = Array.from(compiled.querySelectorAll('nav a')).map((link) =>
      link.textContent?.trim(),
    );

    expect(navLinks).toContain('Home');
    expect(navLinks).toContain('Tic Tac Toe');
    expect(navLinks).toContain('Snake Game');
    expect(navLinks).toContain('Space Invader');
    expect(compiled.querySelector('h1')?.textContent).toContain('Tic Tac Toe');
    expect(compiled.textContent).toContain('Current player: X');

    vi.useRealTimers();
  });

  it('should render the snake game page from navigation after loading completes', async () => {
    vi.useFakeTimers();

    const fixture = TestBed.createComponent(App);
    const router = TestBed.inject(Router);

    await router.navigateByUrl('/snake-game');
    await vi.advanceTimersByTimeAsync(5000);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const navLinks = Array.from(compiled.querySelectorAll('nav a')).map((link) =>
      link.textContent?.trim(),
    );

    expect(navLinks).toContain('Home');
    expect(navLinks).toContain('Tic Tac Toe');
    expect(navLinks).toContain('Snake Game');
    expect(navLinks).toContain('Space Invader');
    expect(compiled.querySelector('h1')?.textContent).toContain('Snake Game');
    expect(compiled.textContent).toContain('Score');
    expect(compiled.querySelectorAll('.board-cell')).toHaveLength(144);

    vi.useRealTimers();
  });

  it('should render the space invader page from navigation after loading completes', async () => {
    vi.useFakeTimers();

    const fixture = TestBed.createComponent(App);
    const router = TestBed.inject(Router);

    await router.navigateByUrl('/space-invader');
    await vi.advanceTimersByTimeAsync(5000);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const navLinks = Array.from(compiled.querySelectorAll('nav a')).map((link) =>
      link.textContent?.trim(),
    );

    expect(navLinks).toContain('Home');
    expect(navLinks).toContain('Tic Tac Toe');
    expect(navLinks).toContain('Snake Game');
    expect(navLinks).toContain('Space Invader');
    expect(compiled.querySelector('h1')?.textContent).toContain('Space Invader');
    expect(compiled.textContent).toContain('Defend the lane, clear the fleet, and survive three hits');
    expect(compiled.querySelectorAll('.enemy')).toHaveLength(32);
    expect(compiled.querySelector('.player-ship')).toBeTruthy();

    vi.useRealTimers();
  });
});
