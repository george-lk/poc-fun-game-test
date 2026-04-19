import { Component, DestroyRef, inject, signal } from '@angular/core';
import {
  NavigationCancel,
  NavigationEnd,
  NavigationError,
  NavigationStart,
  Router,
  RouterLink,
  RouterLinkActive,
  RouterOutlet,
} from '@angular/router';
import { LoadingModal } from './shared/ui/loading-modal/loading-modal';

const MIN_LOADING_DURATION_MS = 5000;

@Component({
  selector: 'app-root',
  imports: [LoadingModal, RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly isLoading = signal(true);

  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);
  private loadingStartedAt = Date.now();
  private hideTimeoutId: ReturnType<typeof setTimeout> | undefined;

  constructor() {
    const subscription = this.router.events.subscribe((event) => {
      if (event instanceof NavigationStart) {
        this.startLoading();
      }

      if (
        event instanceof NavigationEnd ||
        event instanceof NavigationCancel ||
        event instanceof NavigationError
      ) {
        this.finishLoading();
      }
    });

    this.destroyRef.onDestroy(() => {
      subscription.unsubscribe();

      if (this.hideTimeoutId) {
        clearTimeout(this.hideTimeoutId);
      }
    });
  }

  private startLoading(): void {
    if (this.hideTimeoutId) {
      clearTimeout(this.hideTimeoutId);
      this.hideTimeoutId = undefined;
    }

    this.loadingStartedAt = Date.now();
    this.isLoading.set(true);
  }

  private finishLoading(): void {
    const elapsed = Date.now() - this.loadingStartedAt;
    const remaining = Math.max(MIN_LOADING_DURATION_MS - elapsed, 0);

    if (this.hideTimeoutId) {
      clearTimeout(this.hideTimeoutId);
    }

    this.hideTimeoutId = setTimeout(() => {
      this.isLoading.set(false);
      this.hideTimeoutId = undefined;
    }, remaining);
  }
}
