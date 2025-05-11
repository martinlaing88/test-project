import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { UsersModule } from './users/users.module';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    UsersModule,
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'test-app';
}
