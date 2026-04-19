import { TestBed } from '@angular/core/testing';
import { TicTacToe } from './tic-tac-toe';

describe('TicTacToe', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TicTacToe],
    }).compileComponents();
  });

  it('should render a 3x3 board and show the current player', () => {
    const fixture = TestBed.createComponent(TicTacToe);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const boardButtons = compiled.querySelectorAll('.cell');

    expect(compiled.querySelector('h1')?.textContent).toContain('Tic Tac Toe');
    expect(boardButtons).toHaveLength(9);
    expect(compiled.querySelector('.status')?.textContent).toContain('Current player: X');
  });

  it('should alternate turns, stop on a win, and block more moves', () => {
    const fixture = TestBed.createComponent(TicTacToe);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const boardButtons = () => compiled.querySelectorAll<HTMLButtonElement>('.cell');

    boardButtons()[0].click();
    fixture.detectChanges();
    expect(compiled.querySelector('.status')?.textContent).toContain('Current player: O');

    boardButtons()[3].click();
    boardButtons()[1].click();
    boardButtons()[4].click();
    boardButtons()[2].click();
    fixture.detectChanges();

    expect(compiled.querySelector('.status')?.textContent).toContain('Player X wins!');
    expect(boardButtons()[5].disabled).toBe(true);

    boardButtons()[5].click();
    fixture.detectChanges();
    expect(boardButtons()[5].textContent?.trim()).toBe('');
  });

  it('should detect a draw and reset to a new game', () => {
    const fixture = TestBed.createComponent(TicTacToe);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const boardButtons = () => compiled.querySelectorAll<HTMLButtonElement>('.cell');

    [0, 1, 2, 4, 3, 5, 7, 6, 8].forEach((index) => {
      boardButtons()[index].click();
      fixture.detectChanges();
    });

    expect(compiled.querySelector('.status')?.textContent).toContain('It is a draw.');

    compiled.querySelector<HTMLButtonElement>('.reset-button')?.click();
    fixture.detectChanges();

    expect(compiled.querySelector('.status')?.textContent).toContain('Current player: X');
    boardButtons().forEach((button) => {
      expect(button.textContent?.trim()).toBe('');
      expect(button.disabled).toBe(false);
    });
  });
});
