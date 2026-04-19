import { DestroyRef, Directive, ElementRef, inject, input } from '@angular/core';
import { PageTransitionService } from './page-transition.service';

@Directive({
  selector: 'a[appPageTransitionLink]',
  standalone: true,
})
export class PageTransitionLink {
  readonly appPageTransitionLink = input.required<string>();

  private readonly destroyRef = inject(DestroyRef);
  private readonly elementRef = inject(ElementRef<HTMLAnchorElement>);
  private readonly pageTransition = inject(PageTransitionService);
  private readonly clickHandler = (event: MouseEvent) => {
    if (!this.isPrimaryNavigation(event) || !this.pageTransition.shouldIntercept(this.appPageTransitionLink())) {
      return;
    }

    event.preventDefault();
    event.stopImmediatePropagation();
    this.pageTransition.requestNavigation(this.appPageTransitionLink());
  };

  constructor() {
    const element = this.elementRef.nativeElement;
    element.addEventListener('click', this.clickHandler, true);

    this.destroyRef.onDestroy(() => {
      element.removeEventListener('click', this.clickHandler, true);
    });
  }

  private isPrimaryNavigation(event: MouseEvent): boolean {
    if (
      event.button !== 0 ||
      event.defaultPrevented ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return false;
    }

    const target = this.elementRef.nativeElement.getAttribute('target');
    return !target || target === '_self';
  }
}
