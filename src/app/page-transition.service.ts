import { DestroyRef, Injectable, computed, inject, signal } from '@angular/core';
import {
  NavigationCancel,
  NavigationEnd,
  NavigationError,
  NavigationStart,
  Router,
  UrlTree,
} from '@angular/router';

const MIN_LOADING_DURATION_MS = 5000;
export const CURTAIN_DURATION_MS = 450;

export type CurtainPhase = 'hidden' | 'closing' | 'closed' | 'opening';

@Injectable({ providedIn: 'root' })
export class PageTransitionService {
  readonly curtainPhase = signal<CurtainPhase>('closed');
  readonly isLoading = signal(true);
  readonly isVisible = computed(() => this.curtainPhase() !== 'hidden');

  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);
  private loadingStartedAt = Date.now();
  private isManualNavigationPending = false;
  private closeTimeoutId: ReturnType<typeof setTimeout> | undefined;
  private revealTimeoutId: ReturnType<typeof setTimeout> | undefined;
  private hideTimeoutId: ReturnType<typeof setTimeout> | undefined;

  constructor() {
    const subscription = this.router.events.subscribe((event) => {
      if (event instanceof NavigationStart) {
        this.handleNavigationStart();
      }

      if (
        event instanceof NavigationEnd ||
        event instanceof NavigationCancel ||
        event instanceof NavigationError
      ) {
        this.handleNavigationSettled();
      }
    });

    this.destroyRef.onDestroy(() => {
      subscription.unsubscribe();
      this.clearTimers();
    });
  }

  requestNavigation(url: string | UrlTree): boolean {
    const targetUrl = this.getUrl(url);

    if (!this.shouldIntercept(targetUrl)) {
      return false;
    }

    this.clearTimers();
    this.isManualNavigationPending = true;
    this.isLoading.set(true);
    this.curtainPhase.set('closing');

    this.closeTimeoutId = setTimeout(() => {
      this.curtainPhase.set('closed');
      void this.router.navigateByUrl(targetUrl).catch(() => {
        this.isManualNavigationPending = false;
        this.scheduleReveal(MIN_LOADING_DURATION_MS);
      });
    }, CURTAIN_DURATION_MS);

    return true;
  }

  shouldIntercept(url: string | UrlTree): boolean {
    return this.curtainPhase() === 'hidden' && this.getUrl(url) !== this.router.url;
  }

  private handleNavigationStart(): void {
    if (this.isManualNavigationPending) {
      return;
    }

    this.clearTimers();
    this.loadingStartedAt = Date.now();
    this.isLoading.set(true);
    this.curtainPhase.set('closed');
  }

  private handleNavigationSettled(): void {
    if (this.isManualNavigationPending) {
      this.isManualNavigationPending = false;
      this.scheduleReveal(MIN_LOADING_DURATION_MS);
      return;
    }

    const elapsed = Date.now() - this.loadingStartedAt;
    const remaining = Math.max(MIN_LOADING_DURATION_MS - elapsed, 0);
    this.scheduleReveal(remaining);
  }

  private scheduleReveal(delayMs: number): void {
    if (this.revealTimeoutId) {
      clearTimeout(this.revealTimeoutId);
    }

    if (this.hideTimeoutId) {
      clearTimeout(this.hideTimeoutId);
    }

    this.revealTimeoutId = setTimeout(() => {
      this.curtainPhase.set('opening');
      this.hideTimeoutId = setTimeout(() => {
        this.isLoading.set(false);
        this.curtainPhase.set('hidden');
        this.hideTimeoutId = undefined;
      }, CURTAIN_DURATION_MS);
      this.revealTimeoutId = undefined;
    }, delayMs);
  }

  private clearTimers(): void {
    if (this.closeTimeoutId) {
      clearTimeout(this.closeTimeoutId);
      this.closeTimeoutId = undefined;
    }

    if (this.revealTimeoutId) {
      clearTimeout(this.revealTimeoutId);
      this.revealTimeoutId = undefined;
    }

    if (this.hideTimeoutId) {
      clearTimeout(this.hideTimeoutId);
      this.hideTimeoutId = undefined;
    }
  }

  private getUrl(url: string | UrlTree): string {
    return typeof url === 'string' ? url : this.router.serializeUrl(url);
  }
}
