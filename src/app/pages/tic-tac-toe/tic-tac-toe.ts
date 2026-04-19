import { Component, computed, signal } from '@angular/core';

type Player = 'X' | 'O';
type CellValue = Player | null;

const WINNING_LINES = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

@Component({
  selector: 'app-tic-tac-toe',
  templateUrl: './tic-tac-toe.html',
  styleUrl: './tic-tac-toe.css',
})
export class TicTacToe {
  protected readonly board = signal<CellValue[]>(Array<CellValue>(9).fill(null));
  protected readonly currentPlayer = signal<Player>('X');
  protected readonly winner = computed(() => this.findWinner(this.board()));
  protected readonly isDraw = computed(
    () => !this.winner() && this.board().every((cell) => cell !== null),
  );
  protected readonly isGameOver = computed(() => Boolean(this.winner()) || this.isDraw());
  protected readonly statusMessage = computed(() => {
    const winner = this.winner();

    if (winner) {
      return `Player ${winner} wins!`;
    }

    if (this.isDraw()) {
      return 'It is a draw.';
    }

    return `Current player: ${this.currentPlayer()}`;
  });

  protected playTurn(index: number): void {
    if (this.board()[index] || this.isGameOver()) {
      return;
    }

    const nextBoard = [...this.board()];
    nextBoard[index] = this.currentPlayer();
    this.board.set(nextBoard);

    if (!this.findWinner(nextBoard) && nextBoard.some((cell) => cell === null)) {
      this.currentPlayer.set(this.currentPlayer() === 'X' ? 'O' : 'X');
    }
  }

  protected resetGame(): void {
    this.board.set(Array<CellValue>(9).fill(null));
    this.currentPlayer.set('X');
  }

  private findWinner(board: CellValue[]): Player | null {
    for (const [first, second, third] of WINNING_LINES) {
      const value = board[first];

      if (value && value === board[second] && value === board[third]) {
        return value;
      }
    }

    return null;
  }
}
