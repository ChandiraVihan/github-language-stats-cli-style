// src/lib/gif-generator.ts
import { createCanvas, loadImage, Image, CanvasRenderingContext2D } from 'canvas';
import GIFEncoder from 'gif-encoder-2';
import { Language, Profile } from './github';
import fetch from 'node-fetch';

const WIDTH = 1200;
const HEIGHT = 600;
const CENTER_X = WIDTH / 2;
const CENTER_Y = HEIGHT / 2 - 30;
const ORBIT_RADIUS_X = 380;
const ORBIT_RADIUS_Y = 140;
const FPS = 60;
const TOTAL_FRAMES = 540; // 9 seconds at 60fps

interface Planet {
  language: Language;
  angle: number;
  icon: string;
  color: string;
  logo: string;
  logoUrl: string;
  loadedLogo?: Image;
}

interface Scene {
  startFrame: number;
  endFrame: number;
  draw: (ctx: CanvasRenderingContext2D, frame: number, sceneFrame: number) => void;
}

// Language logos from GitHub's linguist repo
const LOGO_URLS: Record<string, string> = {
  'JavaScript': 'https://raw.githubusercontent.com/github/explore/main/topics/javascript/javascript.png',
  'TypeScript': 'https://raw.githubusercontent.com/github/explore/main/topics/typescript/typescript.png',
  'Python': 'https://raw.githubusercontent.com/github/explore/main/topics/python/python.png',
  'Java': 'https://raw.githubusercontent.com/github/explore/main/topics/java/java.png',
  'C++': 'https://raw.githubusercontent.com/github/explore/main/topics/cpp/cpp.png',
  'C#': 'https://raw.githubusercontent.com/github/explore/main/topics/csharp/csharp.png',
  'Go': 'https://raw.githubusercontent.com/github/explore/main/topics/go/go.png',
  'Rust': 'https://raw.githubusercontent.com/github/explore/main/topics/rust/rust.png',
  'CSS': 'https://raw.githubusercontent.com/github/explore/main/topics/css/css.png',
  'HTML': 'https://raw.githubusercontent.com/github/explore/main/topics/html/html.png',
  'Shell': 'https://raw.githubusercontent.com/github/explore/main/topics/bash/bash.png',
  'C': 'https://raw.githubusercontent.com/github/explore/main/topics/c/c.png',
  'Ruby': 'https://raw.githubusercontent.com/github/explore/main/topics/ruby/ruby.png',
  'PHP': 'https://raw.githubusercontent.com/github/explore/main/topics/php/php.png',
  'Swift': 'https://raw.githubusercontent.com/github/explore/main/topics/swift/swift.png',
  'Kotlin': 'https://raw.githubusercontent.com/github/explore/main/topics/kotlin/kotlin.png',
};

export async function generateSolarSystemGIF(
  profile: Profile,
  languages: Language[]
): Promise<Buffer> {
  const canvas = createCanvas(WIDTH, HEIGHT);
  const ctx = canvas.getContext('2d');
  
  // Load avatar
  const avatar = await loadImage(profile.avatarUrl);
  
  // Load language logos
  const planets: Planet[] = await Promise.all(
    languages.slice(0, 6).map(async (lang, i) => {
      const logoUrl = LOGO_URLS[lang.name] || '';
      let loadedLogo: Image | undefined;
      
      if (logoUrl) {
        try {
          const response = await fetch(logoUrl);
          const buffer = await response.buffer();
          loadedLogo = await loadImage(buffer);
        } catch (e) {
          console.log(`Failed to load logo for ${lang.name}`);
        }
      }
      
      return {
        language: lang,
        angle: (i * (Math.PI * 2)) / Math.min(languages.length, 6),
        icon: getLanguageIcon(lang.name).icon,
        color: lang.color || '#33ff00',
        logo: getLanguageIcon(lang.name).logo,
        logoUrl,
        loadedLogo,
      };
    })
  );

  const totalBytes = languages.reduce((a, b) => a + b.size, 0);
  
  // Setup GIF encoder for 60fps
  const encoder = new GIFEncoder(WIDTH, HEIGHT);
  encoder.setRepeat(0);
  encoder.setDelay(1000 / FPS); // 16.67ms for 60fps
  encoder.setQuality(1); // Best quality
  encoder.start();
  
  // Define scenes
  const scenes: Scene[] = [
    {
      startFrame: 0,
      endFrame: 180, // 3 seconds
      draw: (ctx, frame, sceneFrame) => drawScene1(ctx, frame, profile, avatar),
    },
    {
      startFrame: 180,
      endFrame: 300, // 2 seconds
      draw: (ctx, frame, sceneFrame) => drawScene2(ctx, sceneFrame, profile),
    },
    {
      startFrame: 300,
      endFrame: 540, // 4 seconds
      draw: (ctx, frame, sceneFrame) => drawScene3(ctx, sceneFrame, profile, planets, totalBytes, avatar),
    },
  ];
  
  // Generate frames
  for (let frame = 0; frame < TOTAL_FRAMES; frame++) {
    // Find active scene
    const scene = scenes.find(s => frame >= s.startFrame && frame < s.endFrame);
    const sceneFrame = frame - (scene?.startFrame || 0);
    
    // Clear with background
    drawBackground(ctx, frame);
    
    // Draw active scene
    if (scene) {
      scene.draw(ctx, frame, sceneFrame);
    }
    
    encoder.addFrame(ctx);
  }
  
  encoder.finish();
  return encoder.out.getData();
}

// Scene 1: Terminal boot + whoami
function drawScene1(ctx: CanvasRenderingContext2D, frame: number, profile: Profile, avatar: Image) {
  const termX = 80;
  const termY = 100;
  const termW = 500;
  const termH = 400;
  
  // Terminal window
  drawTerminalWindow(ctx, termX, termY, termW, termH, frame);
  
  // Header
  ctx.fillStyle = '#8b949e';
  ctx.font = '12px monospace';
  ctx.fillText('vihan@github ~ %', termX + 20, termY + 50);
  
  // Typing sequence with realistic timing
  const sequence = [
    { char: 'w', delay: 30 },
    { char: 'h', delay: 35 },
    { char: 'o', delay: 40 },
    { char: 'a', delay: 45 }, // Typo
    { char: 'BACKSPACE', delay: 55, isBackspace: true },
    { char: 'm', delay: 65 },
    { char: 'i', delay: 70 },
    { char: 'ENTER', delay: 85, isEnter: true },
    { text: profile.name || profile.login, delay: 95, isOutput: true, color: '#00ff41' },
    { text: profile.bio || 'Full Stack Developer', delay: 130, isOutput: true, color: '#8b949e' },
  ];
  
  let cursorX = termX + 20;
  const cursorY = termY + 80;
  
  sequence.forEach((item) => {
    if (frame < item.delay) return;
    
    if (item.isBackspace) {
      // Backspace animation
      const progress = (frame - item.delay) / 5;
      if (progress < 1) {
        ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
        ctx.fillRect(cursorX - 12, cursorY - 14, 14, 18);
      } else {
        cursorX -= 10;
      }
    } else if (item.isEnter) {
      if (frame === item.delay) {
        // Flash effect
        ctx.fillStyle = 'rgba(0, 255, 65, 0.15)';
        ctx.fillRect(termX + 2, cursorY - 20, termW - 4, 30);
      }
    } else if (item.isOutput) {
      const typeProgress = Math.min(item.text!.length, Math.max(0, frame - item.delay));
      const visible = item.text!.slice(0, typeProgress);
      ctx.fillStyle = item.color!;
      ctx.fillText(visible, termX + 20, cursorY + (item.delay === 95 ? 0 : 25));
    } else {
      ctx.fillStyle = '#00ff41';
      ctx.fillText(item.char, cursorX, cursorY);
      cursorX += ctx.measureText(item.char).width;
    }
  });
  
  // Blinking cursor
  if (frame < 95 || (frame > 160 && frame % 30 < 15)) {
    ctx.fillStyle = '#00ff41';
    ctx.fillRect(cursorX, cursorY - 12, 10, 18);
  }
  
  // Profile picture fades in
  if (frame > 120) {
    const fadeIn = Math.min(1, (frame - 120) / 30);
    ctx.globalAlpha = fadeIn;
    drawAvatarSmall(ctx, avatar, termX + termW - 100, termY + 150, 60);
    ctx.globalAlpha = 1;
  }
}

// Scene 2: mylangstats command
function drawScene2(ctx: CanvasRenderingContext2D, frame: number, profile: Profile) {
  const termX = 80;
  const termY = 100;
  const termW = 500;
  const termH = 400;
  
  drawTerminalWindow(ctx, termX, termY, termW, termH, 180 + frame);
  
  // Previous output dimmed
  ctx.fillStyle = 'rgba(139, 148, 158, 0.3)';
  ctx.font = '12px monospace';
  ctx.fillText('vihan@github ~ % whoami', termX + 20, termY + 50);
  ctx.fillText(profile.name || profile.login, termX + 20, termY + 80);
  
  // New prompt
  ctx.fillStyle = '#8b949e';
  ctx.fillText('vihan@github ~ %', termX + 20, termY + 130);
  
  // Type mylangstats
  const command = 'mylangstats';
  const typeProgress = Math.min(command.length, Math.max(0, frame - 20));
  const visibleCmd = command.slice(0, typeProgress);
  
  ctx.fillStyle = '#00ff41';
  ctx.fillText(visibleCmd, termX + 20 + ctx.measureText('vihan@github ~ % ').width, termY + 130);
  
  // Cursor
  if (frame % 20 < 10) {
    const cursorPos = termX + 20 + ctx.measureText('vihan@github ~ % ' + visibleCmd).width;
    ctx.fillRect(cursorPos, termY + 118, 10, 16);
  }
  
  // Execute at frame 80
  if (frame === 80) {
    ctx.fillStyle = 'rgba(0, 255, 65, 0.2)';
    ctx.fillRect(termX + 2, termY + 115, termW - 4, 25);
  }
  
  // Transition to solar system at end
  if (frame > 100) {
    const fadeOut = Math.max(0, 1 - (frame - 100) / 20);
    ctx.fillStyle = `rgba(13, 17, 23, ${1 - fadeOut})`;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
  }
}

// Scene 3: Solar system visualization
function drawScene3(
  ctx: CanvasRenderingContext2D,
  frame: number,
  profile: Profile,
  planets: Planet[],
  totalBytes: number,
  avatar: Image
) {
  // Draw orbit rings first (behind planets)
  drawOrbitRings(ctx, frame);
  
  // Draw planets with proper z-sorting
  const planetPositions = planets.map((planet, i) => {
    const orbitSpeed = 0.3 + (i * 0.1);
    const currentAngle = planet.angle + (frame * 0.002 * orbitSpeed);
    const x = CENTER_X + Math.cos(currentAngle) * ORBIT_RADIUS_X;
    const y = CENTER_Y + Math.sin(currentAngle) * ORBIT_RADIUS_Y;
    const depth = Math.sin(currentAngle);
    
    return { planet, x, y, depth, angle: currentAngle, index: i };
  });
  
  // Sort by depth for proper layering
  planetPositions.sort((a, b) => a.depth - b.depth);
  
  // Draw trails first (behind planets)
  planetPositions.forEach(({ planet, angle, index }) => {
    if (frame > index * 10) {
      drawEnhancedTrail(ctx, planet, angle, frame, index);
    }
  });
  
  // Draw planets
  planetPositions.forEach(({ planet, x, y, depth, index }) => {
    if (frame > index * 10) {
      const scale = 0.6 + (depth + 1) * 0.2;
      const alpha = 0.5 + (depth + 1) * 0.25;
      drawEnhancedPlanet(ctx, planet, x, y, scale, alpha, totalBytes, frame);
    }
  });
  
  // Center avatar (sun)
  drawEnhancedAvatar(ctx, avatar, frame);
  
  // Stats panel slides in from right
  if (frame > 60) {
    const slideProgress = Math.min(1, (frame - 60) / 30);
    const panelX = WIDTH - 320 + (1 - easeOutCubic(slideProgress)) * 300;
    drawStatsPanel(ctx, panelX, 100, planets, totalBytes, frame);
  }
}

// Helper functions
function drawBackground(ctx: CanvasRenderingContext2D, frame: number) {
  // Deep space gradient
  const gradient = ctx.createRadialGradient(
    CENTER_X, CENTER_Y, 0,
    CENTER_X, CENTER_Y, WIDTH
  );
  gradient.addColorStop(0, '#161b22');
  gradient.addColorStop(0.5, '#0d1117');
  gradient.addColorStop(1, '#010409');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
  
  // Animated stars
  for (let i = 0; i < 150; i++) {
    const baseX = (i * 137.5) % WIDTH;
    const baseY = (i * 71.3) % HEIGHT;
    const x = (baseX + frame * 0.05 * (i % 3 + 1)) % WIDTH;
    const size = (i % 4) * 0.5 + 0.5;
    const twinkle = Math.sin((frame + i) * 0.03 + i) * 0.5 + 0.5;
    const depth = i / 150;
    
    ctx.globalAlpha = twinkle * depth * 0.9;
    ctx.fillStyle = i % 10 === 0 ? '#58a6ff' : '#ffffff';
    ctx.beginPath();
    ctx.arc(x, baseY, size, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  
  // Nebula clouds
  const nebula1 = ctx.createRadialGradient(
    WIDTH * 0.2, HEIGHT * 0.3, 0,
    WIDTH * 0.2, HEIGHT * 0.3, 400
  );
  nebula1.addColorStop(0, 'rgba(88, 166, 255, 0.08)');
  nebula1.addColorStop(1, 'transparent');
  ctx.fillStyle = nebula1;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
  
  const nebula2 = ctx.createRadialGradient(
    WIDTH * 0.8, HEIGHT * 0.7, 0,
    WIDTH * 0.8, HEIGHT * 0.7, 300
  );
  nebula2.addColorStop(0, 'rgba(0, 255, 65, 0.05)');
  nebula2.addColorStop(1, 'transparent');
  ctx.fillStyle = nebula2;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
  
  // Scanlines
  ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
  for (let y = 0; y < HEIGHT; y += 2) {
    const offset = Math.sin((y + frame) * 0.01) * 1;
    ctx.fillRect(0, y + offset, WIDTH, 1);
  }
  
  // Vignette
  const vignette = ctx.createRadialGradient(
    CENTER_X, CENTER_Y, HEIGHT * 0.3,
    CENTER_X, CENTER_Y, HEIGHT * 0.9
  );
  vignette.addColorStop(0, 'transparent');
  vignette.addColorStop(1, 'rgba(0,0,0,0.7)');
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
}

function drawTerminalWindow(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, frame: number) {
  // Glassmorphism background
  ctx.fillStyle = 'rgba(22, 27, 34, 0.9)';
  ctx.strokeStyle = 'rgba(0, 255, 65, 0.2)';
  ctx.lineWidth = 1;
  
  roundRect(ctx, x, y, w, h, 16);
  ctx.fill();
  ctx.stroke();
  
  // Top highlight
  const highlight = ctx.createLinearGradient(x, y, x, y + 40);
  highlight.addColorStop(0, 'rgba(255,255,255,0.05)');
  highlight.addColorStop(1, 'transparent');
  ctx.fillStyle = highlight;
  ctx.beginPath();
  ctx.roundRect(x, y, w, 40, [16, 16, 0, 0]);
  ctx.fill();
  
  // Window controls with glow
  const controls = [
    { x: x + 20, color: '#ff5f56', glow: 'rgba(255, 95, 86, 0.6)' },
    { x: x + 40, color: '#ffbd2e', glow: 'rgba(255, 189, 46, 0.6)' },
    { x: x + 60, color: '#27c93f', glow: 'rgba(39, 201, 63, 0.6)' },
  ];
  
  controls.forEach(ctrl => {
    ctx.shadowColor = ctrl.glow;
    ctx.shadowBlur = 10;
    ctx.fillStyle = ctrl.color;
    ctx.beginPath();
    ctx.arc(ctrl.x, y + 20, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  });
}

function drawEnhancedAvatar(ctx: CanvasRenderingContext2D, avatar: Image, frame: number) {
  const size = 90;
  const pulse = Math.sin(frame * 0.05) * 0.08 + 1;
  
  // Sun rays rotating
  ctx.save();
  ctx.translate(CENTER_X, CENTER_Y);
  ctx.rotate(frame * 0.008);
  
  for (let i = 0; i < 16; i++) {
    const angle = (i / 16) * Math.PI * 2;
    const rayLength = 140 * pulse;
    const rayWidth = 4;
    
    ctx.rotate(angle);
    const gradient = ctx.createLinearGradient(0, size * 0.8, 0, rayLength);
    gradient.addColorStop(0, 'rgba(255, 200, 50, 0.6)');
    gradient.addColorStop(0.5, 'rgba(255, 150, 0, 0.3)');
    gradient.addColorStop(1, 'transparent');
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.moveTo(-rayWidth/2, size * 0.8);
    ctx.lineTo(rayWidth/2, size * 0.8);
    ctx.lineTo(0, rayLength);
    ctx.fill();
  }
  ctx.restore();
  
  // Multiple glow rings
  for (let i = 4; i > 0; i--) {
    const ringSize = size * (1 + i * 0.25) * pulse;
    const alpha = 0.15 / i;
    
    const gradient = ctx.createRadialGradient(
      CENTER_X, CENTER_Y, size * 0.9,
      CENTER_X, CENTER_Y, ringSize
    );
    gradient.addColorStop(0, `rgba(255, 165, 0, ${alpha})`);
    gradient.addColorStop(1, 'transparent');
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(CENTER_X, CENTER_Y, ringSize, 0, Math.PI * 2);
    ctx.fill();
  }
  
  // Avatar clip
  ctx.save();
  ctx.beginPath();
  ctx.arc(CENTER_X, CENTER_Y, size, 0, Math.PI * 2);
  ctx.clip();
  
  ctx.drawImage(avatar, CENTER_X - size, CENTER_Y - size, size * 2, size * 2);
  
  // Sun overlay
  const sunOverlay = ctx.createRadialGradient(
    CENTER_X, CENTER_Y, 0,
    CENTER_X, CENTER_Y, size
  );
  sunOverlay.addColorStop(0, 'rgba(255, 220, 100, 0.3)');
  sunOverlay.addColorStop(0.7, 'rgba(255, 150, 50, 0.1)');
  sunOverlay.addColorStop(1, 'rgba(255, 100, 0, 0.2)');
  ctx.fillStyle = sunOverlay;
  ctx.fill();
  
  ctx.restore();
  
  // Animated border
  const borderPulse = Math.sin(frame * 0.1) * 0.5 + 0.5;
  ctx.strokeStyle = '#ffa500';
  ctx.lineWidth = 3;
  ctx.shadowColor = '#ffa500';
  ctx.shadowBlur = 15 + borderPulse * 10;
  ctx.beginPath();
  ctx.arc(CENTER_X, CENTER_Y, size, 0, Math.PI * 2);
  ctx.stroke();
  ctx.shadowBlur = 0;
}

function drawEnhancedPlanet(
  ctx: CanvasRenderingContext2D,
  planet: Planet,
  x: number,
  y: number,
  scale: number,
  alpha: number,
  totalBytes: number,
  frame: number
) {
  const size = 35 * scale;
  const percent = ((planet.language.size / totalBytes) * 100).toFixed(1);
  
  ctx.save();
  ctx.globalAlpha = alpha;
  
  // Planet glow
  const glow = ctx.createRadialGradient(x, y, 0, x, y, size * 2.5);
  glow.addColorStop(0, hexToRgba(planet.color, 0.5));
  glow.addColorStop(0.5, hexToRgba(planet.color, 0.2));
  glow.addColorStop(1, 'transparent');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(x, y, size * 2.5, 0, Math.PI * 2);
  ctx.fill();
  
  // Orbit ring segment near planet
  ctx.strokeStyle = hexToRgba(planet.color, 0.3);
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(CENTER_X, CENTER_Y, Math.sqrt((x - CENTER_X) ** 2 + (y - CENTER_Y) ** 2), 0, Math.PI * 2);
  ctx.stroke();
  
  // Planet body with 3D effect
  const bodyGradient = ctx.createRadialGradient(
    x - size * 0.3, y - size * 0.3, 0,
    x, y, size
  );
  bodyGradient.addColorStop(0, lightenColor(planet.color, 30));
  bodyGradient.addColorStop(0.5, planet.color);
  bodyGradient.addColorStop(1, darkenColor(planet.color, 30));
  
  ctx.beginPath();
  ctx.arc(x, y, size, 0, Math.PI * 2);
  ctx.fillStyle = bodyGradient;
  ctx.fill();
  
  // Logo or icon
  if (planet.loadedLogo) {
    const logoSize = size * 1.2;
    ctx.drawImage(planet.loadedLogo, x - logoSize/2, y - logoSize/2, logoSize, logoSize);
  } else {
    ctx.fillStyle = '#ffffff';
    ctx.font = `bold ${14 * scale}px monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(planet.icon, x, y);
  }
  
  // Label with background
  if (alpha > 0.7) {
    const label = `${planet.language.name} ${percent}%`;
    ctx.font = `bold ${12 * scale}px monospace`;
    const textWidth = ctx.measureText(label).width;
    
    // Label background
    ctx.fillStyle = 'rgba(13, 17, 23, 0.8)';
    ctx.beginPath();
    ctx.roundRect(x - textWidth/2 - 6, y + size + 8, textWidth + 12, 20, 4);
    ctx.fill();
    
    // Label text
    ctx.fillStyle = planet.color;
    ctx.fillText(label, x, y + size + 20);
  }
  
  ctx.restore();
}

function drawEnhancedTrail(
  ctx: CanvasRenderingContext2D,
  planet: Planet,
  currentAngle: number,
  frame: number,
  index: number
) {
  const trailLength = 12;
  
  for (let t = 0; t < trailLength; t++) {
    const trailAngle = currentAngle - (t * 0.04);
    const trailX = CENTER_X + Math.cos(trailAngle) * ORBIT_RADIUS_X;
    const trailY = CENTER_Y + Math.sin(trailAngle) * ORBIT_RADIUS_Y;
    const trailDepth = Math.sin(trailAngle);
    const trailScale = 0.6 + (trailDepth + 1) * 0.2;
    
    const alpha = (1 - t / trailLength) * 0.4 * (0.5 + (trailDepth + 1) * 0.25);
    const size = (30 * trailScale) * (1 - t / trailLength);
    
    ctx.beginPath();
    ctx.arc(trailX, trailY, size, 0, Math.PI * 2);
    ctx.fillStyle = hexToRgba(planet.color, alpha);
    ctx.fill();
  }
}

function drawOrbitRings(ctx: CanvasRenderingContext2D, frame: number) {
  // Main orbit paths
  ctx.strokeStyle = 'rgba(0, 255, 65, 0.08)';
  ctx.lineWidth = 1;
  
  // Outer ring
  ctx.beginPath();
  ctx.ellipse(CENTER_X, CENTER_Y, ORBIT_RADIUS_X, ORBIT_RADIUS_Y, 0, 0, Math.PI * 2);
  ctx.stroke();
  
  // Inner ring
  ctx.beginPath();
  ctx.ellipse(CENTER_X, CENTER_Y, ORBIT_RADIUS_X * 0.65, ORBIT_RADIUS_Y * 0.65, 0, 0, Math.PI * 2);
  ctx.stroke();
  
  // Animated ring segments
  const dashOffset = (frame * 0.5) % 100;
  ctx.setLineDash([20, 80]);
  ctx.lineDashOffset = -dashOffset;
  ctx.strokeStyle = 'rgba(0, 255, 65, 0.15)';
  ctx.beginPath();
  ctx.ellipse(CENTER_X, CENTER_Y, ORBIT_RADIUS_X, ORBIT_RADIUS_Y, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);
}

function drawStatsPanel(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  planets: Planet[],
  totalBytes: number,
  frame: number
) {
  const w = 280;
  const h = 350;
  
  // Panel background
  ctx.fillStyle = 'rgba(22, 27, 34, 0.95)';
  ctx.strokeStyle = 'rgba(0, 255, 65, 0.3)';
  ctx.lineWidth = 1;
  roundRect(ctx, x, y, w, h, 12);
  ctx.fill();
  ctx.stroke();
  
  // Header
  ctx.fillStyle = '#00ff41';
  ctx.font = 'bold 16px monospace';
  ctx.fillText('> Language Stats', x + 20, y + 40);
  
  // Stats bars
  const sortedPlanets = [...planets].sort((a, b) => b.language.size - a.language.size);
  
  sortedPlanets.forEach((planet, i) => {
    const barY = y + 80 + i * 45;
    const percent = (planet.language.size / totalBytes) * 100;
    const barWidth = 200;
    const fillWidth = (percent / 100) * barWidth;
    
    // Animate bar fill
    const animDelay = i * 10;
    const animProgress = Math.max(0, Math.min(1, (frame - 90 - animDelay) / 20));
    const currentWidth = fillWidth * easeOutCubic(animProgress);
    
    // Label
    ctx.fillStyle = '#c9d1d9';
    ctx.font = '12px monospace';
    ctx.fillText(planet.language.name, x + 20, barY);
    
    // Percentage
    ctx.fillStyle = planet.color;
    ctx.fillText(`${percent.toFixed(1)}%`, x + 240, barY);
    
    // Bar background
    ctx.fillStyle = 'rgba(48, 54, 61, 0.8)';
  ctx.beginPath();
    ctx.roundRect(x + 20, barY + 8, barWidth, 8, 4);
    ctx.fill();
    
    // Bar fill with glow
    if (currentWidth > 0) {
      ctx.fillStyle = planet.color;
      ctx.shadowColor = planet.color;
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.roundRect(x + 20, barY + 8, currentWidth, 8, 4);
      ctx.fill();
      ctx.shadowBlur = 0;
    }
  });
}

function drawAvatarSmall(ctx: CanvasRenderingContext2D, avatar: Image, x: number, y: number, size: number) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y, size, 0, Math.PI * 2);
  ctx.clip();
  ctx.drawImage(avatar, x - size, y - size, size * 2, size * 2);
  
  // Green glow border
  ctx.strokeStyle = '#00ff41';
  ctx.lineWidth = 3;
  ctx.shadowColor = '#00ff41';
  ctx.shadowBlur = 15;
  ctx.stroke();
  ctx.restore();
}

// Utility functions
function roundRect(ctx: any, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function lightenColor(hex: string, percent: number): string {
  const r = Math.min(255, parseInt(hex.slice(1, 3), 16) + percent);
  const g = Math.min(255, parseInt(hex.slice(3, 5), 16) + percent);
  const b = Math.min(255, parseInt(hex.slice(5, 7), 16) + percent);
  return `rgb(${r}, ${g}, ${b})`;
}

function darkenColor(hex: string, percent: number): string {
  const r = Math.max(0, parseInt(hex.slice(1, 3), 16) - percent);
  const g = Math.max(0, parseInt(hex.slice(3, 5), 16) - percent);
  const b = Math.max(0, parseInt(hex.slice(5, 7), 16) - percent);
  return `rgb(${r}, ${g}, ${b})`;
}

function getLanguageIcon(name: string): { icon: string; color: string; logo: string } {
  const icons: Record<string, { icon: string; color: string; logo: string }> = {
    'JavaScript': { icon: 'JS', color: '#f7df1e', logo: '⚡' },
    'TypeScript': { icon: 'TS', color: '#3178c6', logo: '🔷' },
    'Python': { icon: 'Py', color: '#3776ab', logo: '🐍' },
    'Java': { icon: 'Jv', color: '#b07219', logo: '☕' },
    'C++': { icon: 'C+', color: '#f34b7d', logo: '⚙️' },
    'C#': { icon: 'C#', color: '#178600', logo: '🔧' },
    'Go': { icon: 'Go', color: '#00add8', logo: '🐹' },
    'Rust': { icon: 'Rs', color: '#dea584', logo: '🦀' },
    'CSS': { icon: 'CSS', color: '#563d7c', logo: '🎨' },
    'HTML': { icon: 'HTML', color: '#e34c26', logo: '📄' },
    'Shell': { icon: 'Sh', color: '#89e051', logo: '🐚' },
  };
  return icons[name] || { icon: name.slice(0, 2), color: '#8b949e', logo: '●' };
}