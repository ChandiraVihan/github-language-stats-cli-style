// src/lib/gif-generator.ts
import { createCanvas, loadImage, Image, CanvasRenderingContext2D } from 'canvas';
import GIFEncoder from 'gif-encoder-2';
import { Language, Profile } from './github';

const WIDTH = 800;
const HEIGHT = 500;
const CENTER_X = WIDTH / 2;
const CENTER_Y = HEIGHT / 2 + 20;
const ORBIT_RADIUS_X = 280;
const ORBIT_RADIUS_Y = 100;

interface Planet {
  language: Language;
  angle: number;
  icon: string;
  color: string;
}

export async function generateSolarSystemGIF(
  profile: Profile,
  languages: Language[]
): Promise<Buffer> {
  const canvas = createCanvas(WIDTH, HEIGHT);
  const ctx = canvas.getContext('2d');
  
  // Load avatar
  const avatar = await loadImage(profile.avatarUrl);
  
  // Setup planets
  const planets: Planet[] = languages.map((lang, i) => ({
    language: lang,
    angle: (i * (Math.PI * 2)) / languages.length,
    icon: getLanguageIcon(lang.name),
    color: lang.color || '#33ff00',
  }));

  const totalBytes = languages.reduce((a, b) => a + b.size, 0);
  
  // Setup GIF encoder
  const encoder = new GIFEncoder(WIDTH, HEIGHT);
  
  encoder.setRepeat(0);
  encoder.setDelay(50);
  encoder.start();
  
  const totalFrames = 180;
  
  for (let frame = 0; frame < totalFrames; frame++) {
    drawFrame(ctx, frame, totalFrames, avatar, planets, profile, totalBytes);
    encoder.addFrame(ctx);
  }
  
  encoder.finish();
  
  return encoder.out.getData();
}


function drawFrame(
  ctx: CanvasRenderingContext2D,
  frame: number,
  totalFrames: number,
  avatar: Image,
  planets: Planet[],
  profile: Profile,
  totalBytes: number
) {
  // Background
  drawBackground(ctx, frame);
  
  // Orbit rings (subtle)
  drawOrbitRings(ctx);
  
  // Draw planets with trails
  planets.forEach((planet, i) => {
    const progress = frame / totalFrames;
    const orbitSpeed = 0.5 + (i * 0.1); // Different speeds for each planet
    const currentAngle = planet.angle + (progress * Math.PI * 2 * orbitSpeed);
    
    // Calculate 3D position
    const x = CENTER_X + Math.cos(currentAngle) * ORBIT_RADIUS_X;
    const y = CENTER_Y + Math.sin(currentAngle) * ORBIT_RADIUS_Y;
    
    // Scale based on "depth" (z-index simulation)
    const depth = Math.sin(currentAngle);
    const scale = 0.7 + (depth + 1) * 0.15; // 0.7 to 1.0
    const alpha = 0.6 + (depth + 1) * 0.2; // 0.6 to 1.0
    
    // Draw trail (snake-like)
    drawTrail(ctx, planet, currentAngle, frame, i);
    
    // Draw planet
    drawPlanet(ctx, planet, x, y, scale, alpha, totalBytes);
  });
  
  // Center avatar (sun)
  drawAvatar(ctx, avatar, frame);
  
  // Terminal overlay with typing
  drawTerminalOverlay(ctx, profile, frame);
}

function drawBackground(ctx: CanvasRenderingContext2D, frame: number) {
  // Dark gradient
  const gradient = ctx.createLinearGradient(0, 0, 0, HEIGHT);
  gradient.addColorStop(0, '#0d1117');
  gradient.addColorStop(1, '#010409');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
  
  // Stars
  ctx.fillStyle = '#ffffff';
  for (let i = 0; i < 50; i++) {
    const x = (i * 137.5) % WIDTH;
    const y = (i * 71.3) % HEIGHT;
    const twinkle = Math.sin((frame + i) * 0.1) * 0.5 + 0.5;
    ctx.globalAlpha = twinkle * 0.3;
    ctx.fillRect(x, y, 2, 2);
  }
  ctx.globalAlpha = 1;
  
  // Scanlines
  ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
  for (let y = 0; y < HEIGHT; y += 4) {
    ctx.fillRect(0, y, WIDTH, 2);
  }
}

function drawOrbitRings(ctx: CanvasRenderingContext2D) {
  ctx.strokeStyle = 'rgba(51, 255, 0, 0.1)';
  ctx.lineWidth = 1;
  
  // Outer ring
  ctx.beginPath();
  ctx.ellipse(CENTER_X, CENTER_Y, ORBIT_RADIUS_X, ORBIT_RADIUS_Y, 0, 0, Math.PI * 2);
  ctx.stroke();
  
  // Inner ring
  ctx.beginPath();
  ctx.ellipse(CENTER_X, CENTER_Y, ORBIT_RADIUS_X * 0.7, ORBIT_RADIUS_Y * 0.7, 0, 0, Math.PI * 2);
  ctx.stroke();
}

function drawTrail(
  ctx: CanvasRenderingContext2D,
  planet: Planet,
  currentAngle: number,
  frame: number,
  index: number
) {
  const trailLength = 8;
  
  for (let t = 0; t < trailLength; t++) {
    const trailAngle = currentAngle - (t * 0.05);
    const trailX = CENTER_X + Math.cos(trailAngle) * ORBIT_RADIUS_X;
    const trailY = CENTER_Y + Math.sin(trailAngle) * ORBIT_RADIUS_Y;
    const trailDepth = Math.sin(trailAngle);
    const trailScale = 0.7 + (trailDepth + 1) * 0.15;
    
    const alpha = (1 - t / trailLength) * 0.3;
    const size = (20 * trailScale) * (1 - t / trailLength);
    
    ctx.beginPath();
    ctx.arc(trailX, trailY, size, 0, Math.PI * 2);
    ctx.fillStyle = hexToRgba(planet.color, alpha);
    ctx.fill();
  }
}

function drawPlanet(
  ctx: CanvasRenderingContext2D,
  planet: Planet,
  x: number,
  y: number,
  scale: number,
  alpha: number,
  totalBytes: number
) {
  const size = 25 * scale;
  const percent = ((planet.language.size / totalBytes) * 100).toFixed(1);
  
  ctx.save();
  ctx.globalAlpha = alpha;
  
  // Glow
  const glow = ctx.createRadialGradient(x, y, 0, x, y, size * 2);
  glow.addColorStop(0, hexToRgba(planet.color, 0.4));
  glow.addColorStop(1, 'transparent');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(x, y, size * 2, 0, Math.PI * 2);
  ctx.fill();
  
  // Planet body
  ctx.beginPath();
  ctx.arc(x, y, size, 0, Math.PI * 2);
  ctx.fillStyle = planet.color;
  ctx.fill();
  
  // Border
  ctx.strokeStyle = 'rgba(255,255,255,0.3)';
  ctx.lineWidth = 2;
  ctx.stroke();
  
  // Icon
  ctx.fillStyle = '#ffffff';
  ctx.font = `bold ${12 * scale}px monospace`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(planet.icon, x, y);
  
  // Label (only when in front)
  if (alpha > 0.8) {
    ctx.fillStyle = '#c9d1d9';
    ctx.font = `bold ${11 * scale}px monospace`;
    ctx.fillText(planet.language.name, x, y + size + 12);
    ctx.fillStyle = planet.color;
    ctx.fillText(`${percent}%`, x, y + size + 24);
  }
  
  ctx.restore();
}

function drawAvatar(ctx: CanvasRenderingContext2D, avatar: Image, frame: number) {
  const size = 70;
  const pulse = Math.sin(frame * 0.1) * 3;
  
  // Outer glow pulse
  const gradient = ctx.createRadialGradient(
    CENTER_X, CENTER_Y, size * 0.8,
    CENTER_X, CENTER_Y, size * 1.5 + pulse
  );
  gradient.addColorStop(0, 'rgba(51, 255, 0, 0.3)');
  gradient.addColorStop(1, 'transparent');
  
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(CENTER_X, CENTER_Y, size * 1.5 + pulse, 0, Math.PI * 2);
  ctx.fill();
  
  // Avatar circle
  ctx.save();
  ctx.beginPath();
  ctx.arc(CENTER_X, CENTER_Y, size, 0, Math.PI * 2);
  ctx.clip();
  
  ctx.drawImage(
    avatar,
    CENTER_X - size,
    CENTER_Y - size,
    size * 2,
    size * 2
  );
  
  ctx.restore();
  
  // Border
  ctx.strokeStyle = '#33ff00';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(CENTER_X, CENTER_Y, size, 0, Math.PI * 2);
  ctx.stroke();
}

function drawTerminalOverlay(ctx: CanvasRenderingContext2D, profile: Profile, frame: number) {
  // Terminal window at bottom
  const termX = 40;
  const termY = HEIGHT - 120;
  const termW = WIDTH - 40;
  const termH = 100;
  
  // Background
  ctx.fillStyle = 'rgba(13, 17, 23, 0.95)';
  ctx.strokeStyle = '#33ff00';
  ctx.lineWidth = 1;
  ctx.fillRect(termX, termY, termW, termH);
  ctx.strokeRect(termX, termY, termW, termH);
  
  // Header dots
  const dots = ['#ff5f56', '#ffbd2e', '#27c93f'];
  dots.forEach((color, i) => {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(termX + 15 + i * 15, termY + 15, 4, 0, Math.PI * 2);
    ctx.fill();
  });
  
  // Typing text
  const lines = [
    { text: '$ whoami', delay: 0 },
    { text: profile.name || profile.login, delay: 15 },
    { text: profile.bio || 'Developer', delay: 30 },
  ];
  
  ctx.font = '13px JetBrains Mono, monospace';
  ctx.fillStyle = '#0051ff';
  
  lines.forEach((line, i) => {
    const y = termY + 45 + i * 20;
    
    if (line.delay === 0) {
      // First line always show
      ctx.fillText(line.text, termX + 15, y);
    } else {
      // Typewriter effect
      const charCount = Math.max(0, Math.floor((frame - line.delay) / 2));
      const visibleText = line.text.slice(0, charCount);
      
      if (visibleText) {
        ctx.fillText(visibleText, termX + 15, y);
      }
      
      // Blinking cursor
      if (frame > line.delay && charCount < line.text.length && frame % 10 < 5) {
        ctx.fillRect(termX + 15 + ctx.measureText(visibleText).width, y - 10, 8, 14);
      }
    }
  });
}

function getLanguageIcon(name: string): string {
  const icons: Record<string, string> = {
    'JavaScript': 'JS',
    'TypeScript': 'TS',
    'Python': 'Py',
    'Java': 'Jv',
    'C++': 'C+',
    'C#': 'C#',
    'Go': 'Go',
    'Rust': 'Rs',
    'Ruby': 'Rb',
    'PHP': 'Php',
    'Swift': 'Sw',
    'Kotlin': 'Kt',
    'HTML': 'H',
    'CSS': 'CSS',
    'Shell': 'Sh',
    'C': 'C',
  };
  return icons[name] || name.slice(0, 2).toUpperCase();
}

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}