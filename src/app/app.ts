import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { PageTransitionLink } from './page-transition-link';
import { PageTransitionService } from './page-transition.service';
import { LoadingModal } from './shared/ui/loading-modal/loading-modal';

@Component({
  selector: 'app-root',
  imports: [LoadingModal, PageTransitionLink, RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  private readonly pageTransition = inject(PageTransitionService);

  protected readonly curtainPhase = this.pageTransition.curtainPhase;
  protected readonly isLoading = this.pageTransition.isLoading;
  protected readonly isTransitionVisible = this.pageTransition.isVisible;
}
