import { DatePipe } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-home',
  imports: [DatePipe, RouterLink],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home {
  protected readonly announcement = 'No new announcement';
  protected readonly currentDate = new Date();
  protected readonly latestPatch = 'No new latest patch';
}
