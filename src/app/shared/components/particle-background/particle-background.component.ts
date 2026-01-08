import { Component, ElementRef, ViewChild, AfterViewInit, OnDestroy, NgZone, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';

@Component({
    selector: 'app-particle-background',
    standalone: true,
    imports: [CommonModule],
    template: `<canvas #bgCanvas class="absolute top-0 left-0 w-full h-full z-0 block"></canvas>`,
    styles: [`
    :host {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 0;
    }
  `]
})
export class ParticleBackgroundComponent implements AfterViewInit, OnDestroy {
    @ViewChild('bgCanvas', { static: false }) canvasRef!: ElementRef<HTMLCanvasElement>;

    private ctx!: CanvasRenderingContext2D;
    private particles: Particle[] = [];
    private animationFrameId: number = 0;
    private resizeListener: any;
    private isBrowser: boolean;

    constructor(
        private ngZone: NgZone,
        @Inject(PLATFORM_ID) platformId: Object
    ) {
        this.isBrowser = isPlatformBrowser(platformId);
    }

    ngAfterViewInit(): void {
        if (this.isBrowser) {
            this.initCanvas();
        }
    }

    ngOnDestroy(): void {
        if (this.isBrowser) {
            cancelAnimationFrame(this.animationFrameId);
            window.removeEventListener('resize', this.resizeListener);
        }
    }

    private initCanvas(): void {
        const canvas = this.canvasRef.nativeElement;
        this.ctx = canvas.getContext('2d')!;

        this.resizeCanvas();
        this.createParticles();

        this.ngZone.runOutsideAngular(() => {
            this.animate();
        });

        this.resizeListener = () => {
            this.resizeCanvas();
            this.createParticles();
        };
        window.addEventListener('resize', this.resizeListener);
    }

    private resizeCanvas(): void {
        const canvas = this.canvasRef.nativeElement;
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }

    private createParticles(): void {
        const canvas = this.canvasRef.nativeElement;
        const particleCount = window.innerWidth < 768 ? 40 : 80;
        this.particles = [];

        for (let i = 0; i < particleCount; i++) {
            this.particles.push(new Particle(canvas.width, canvas.height));
        }
    }

    private animate(): void {
        const canvas = this.canvasRef.nativeElement;
        this.ctx.clearRect(0, 0, canvas.width, canvas.height);

        this.particles.forEach((p, index) => {
            p.update();
            p.draw(this.ctx);

            for (let j = index + 1; j < this.particles.length; j++) {
                const p2 = this.particles[j];
                const dist = Math.hypot(p.x - p2.x, p.y - p2.y);
                const maxDist = 150;

                if (dist < maxDist) {
                    this.ctx.beginPath();
                    this.ctx.strokeStyle = `rgba(16, 185, 129, ${1 - dist / maxDist})`;
                    this.ctx.lineWidth = 0.5;
                    this.ctx.moveTo(p.x, p.y);
                    this.ctx.lineTo(p2.x, p2.y);
                    this.ctx.stroke();
                }
            }
        });

        this.animationFrameId = requestAnimationFrame(() => this.animate());
    }
}

class Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    size: number;
    canvasWidth: number;
    canvasHeight: number;

    constructor(w: number, h: number) {
        this.canvasWidth = w;
        this.canvasHeight = h;
        this.x = Math.random() * w;
        this.y = Math.random() * h;
        this.vx = (Math.random() - 0.5) * 1;
        this.vy = (Math.random() - 0.5) * 1;
        this.size = Math.random() * 2 + 1;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;

        if (this.x < 0 || this.x > this.canvasWidth) this.vx *= -1;
        if (this.y < 0 || this.y > this.canvasHeight) this.vy *= -1;
    }

    draw(ctx: CanvasRenderingContext2D) {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(16, 185, 129, 0.5)';
        ctx.fill();
    }
}
