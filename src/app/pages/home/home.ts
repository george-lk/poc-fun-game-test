import { DatePipe } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PageTransitionLink } from '../../page-transition-link';

@Component({
  selector: 'app-home',
  imports: [DatePipe, PageTransitionLink, RouterLink],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home {
  protected readonly announcement = 'No new announcement';
  protected readonly currentDate = new Date();
  protected readonly latestPatch = 'No new latest patch';
}
