import { Component, AfterViewInit, OnDestroy, signal, ElementRef, inject } from '@angular/core';

@Component({
  selector: 'app-home',
  imports: [],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home implements AfterViewInit, OnDestroy {
  activeSection = signal<string>('home');
  private observer: IntersectionObserver | null = null;
  private readonly elementRef = inject(ElementRef);

  ngAfterViewInit() {
    setTimeout(() => {
      const options = {
        root: null,
        rootMargin: '-50% 0px -50% 0px',
        threshold: 0,
      };

      this.observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            this.activeSection.set(entry.target.id);
          }
        });
      }, options);

      const sections = this.elementRef.nativeElement.querySelectorAll('section');
      sections.forEach((section: Element) => {
        this.observer?.observe(section);
      });
    }, 100);
  }

  ngOnDestroy() {
    this.observer?.disconnect();
  }

  scrollTo(id: string) {
    const element = document.getElementById(id);
    if (element) {
      const headerOffset = 100;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth',
      });
    } else {
      if (id === 'home') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  }
}
