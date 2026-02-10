import { Component, EventEmitter, Input, Output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-modal',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './modal.html',
  styleUrl: './modal.css',
})
export class Modal {
  @Input() title: string = '';
  @Input() isOpen: boolean = false;
  @Output() submitName = new EventEmitter<string>();

  displayName = signal('');

  onSubmit() {
    if (this.displayName().trim()) {
      this.submitName.emit(this.displayName());
    }
  }
}
