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
const TOTAL_FRAMES = 540;

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
  
  const avatar = await loadImage(profile.avatarUrl);
  
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
  
  const encoder = new GIFEncoder(WIDTH, HEIGHT);
  encoder.setRepeat(0);
  encoder.setDelay(1000 / FPS);
  encoder.setQuality(1);
  encoder.start();
  
  const scenes: Scene[] = [
    {
      startFrame: 0,
      endFrame: 180,
      draw: (ctx, frame, sceneFrame) => drawScene1(ctx, frame, profile, avatar),
    },
    {
      startFrame: 180,
      endFrame: 300,
      draw: (ctx, frame, sceneFrame) => drawScene2(ctx, sceneFrame, profile),
    },
    {
      startFrame: 300,
      endFrame: 540,
      draw: (ctx, frame, sceneFrame) => drawScene3(ctx, sceneFrame, profile, planets, totalBytes, avatar),
    },
  ];
  
  for (let frame = 0; frame < TOTAL_FRAMES; frame++) {
    const scene = scenes.find(s => frame >= s.startFrame && frame < s.endFrame);
    const sceneFrame = frame - (scene?.startFrame || 0);
    
    drawBackground(ctx, frame);
    
    if (scene) {
      scene.draw(ctx, frame, sceneFrame);
    }
    
    encoder.addFrame(ctx);
  }
  
  encoder.finish();
  return encoder.out.getData();
}

function drawScene1(ctx: CanvasRenderingContext2D, frame: number, profile: Profile, avatar: Image) {
  const termX = 80;
  const termY = 100;
  const termW = 500;
  const termH = 400;
  
  drawTerminalWindow(ctx, termX, termY, termW, termH, frame);
  
  ctx.fillStyle = '#8b949e';
  ctx.font = '12px monospace';
  ctx.fillText('vihan@github ~ %', termX + 20, termY + 50);
  
  const sequence = [
    { char: 'w', delay: 30 },
    { char: 'h', delay: 35 },
    { char: 'o', delay: 40 },
    { char: 'a', delay: 45 },
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
      const progress = (frame - item.delay) / 5;
      if (progress < 1) {
        ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
        ctx.fillRect(cursorX - 12, cursorY - 14, 14, 18);
      } else {
        cursorX -= 10;
      }
    } else if (item.isEnter) {
      if (frame === item.delay) {
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
  
  if (frame < 95 || (frame > 160 && frame % 30 < 15)) {
    ctx.fillStyle = '#00ff41';
    ctx.fillRect(cursorX, cursorY - 12, 10, 18);
  }
  
  if (frame > 120) {
    const fadeIn = Math.min(1, (frame - 120) / 30);
    ctx.globalAlpha = fadeIn;
    drawAvatarSmall(ctx, avatar, termX + termW - 100, termY + 150, 60);
    ctx.globalAlpha = 1;
  }
}

function drawScene2(ctx: CanvasRenderingContext2D, frame: number, profile: Profile) {
  const termX = 80;
  const termY = 100;
  const termW = 500;
  const termH = 400;
  
  drawTerminalWindow(ctx, termX, termY, termW, termH, 180 + frame);
  
  ctx.fillStyle = 'rgba(139, 148, 158, 0.3)';
  ctx.font = '12px monospace';
  ctx.fillText('vihan@github ~ % whoami', termX + 20, termY + 50);
  ctx.fillText(profile.name || profile.login, termX + 20, termY + 80);
  
  ctx.fillStyle = '#8b949e';
  ctx.fillText('vihan@github ~ %', termX + 20, termY + 130);
  
  const command = 'mylangstats';
  const typeProgress = Math.min(command.length, Math.max(0, frame - 20));
  const visibleCmd = command.slice(0, typeProgress);
  
  ctx.fillStyle = '#00ff41';
  ctx.fillText(visibleCmd, termX + 20 + ctx.measureText('vihan@github ~ % ').width, termY + 130);
  
  if (frame % 20 < 10) {
    const cursorPos = termX + 20 + ctx.measureText('vihan@github ~ % ' + visibleCmd).width;
    ctx.fillRect(cursorPos, termY + 118, 10, 16);
  }
  
  if (frame === 80) {
    ctx.fillStyle = 'rgba(0, 255, 65, 0.2)';
    ctx.fillRect(termX + 2, termY + 115, termW - 4, 25);
  }
  
  if (frame > 100) {
    const fadeOut = Math.max(0, 1 - (frame - 100) / 20);
    ctx.fillStyle = `rgba(13, 17, 23, ${1 - fadeOut})`;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
  }
}

function drawScene3(
  ctx: CanvasRenderingContext2D,
  frame: number,
  profile: Profile,
  planets: Planet[],
  totalBytes: number,
  avatar: Image
) {
  drawElegantOrbits(ctx, 300 + frame);
  
  const planetPositions = planets.map((planet, i) => {
    const orbitSpeed = 0.3 + (i * 0.1);
    const currentAngle = planet.angle + (frame * 0.002 * orbitSpeed);
    const x = CENTER_X + Math.cos(currentAngle) * ORBIT_RADIUS_X;
    const y = CENTER_Y + Math.sin(currentAngle) * ORBIT_RADIUS_Y;
    const depth = Math.sin(currentAngle);
    
    return { planet, x, y, depth, angle: currentAngle, index: i };
  });
  
  planetPositions.sort((a, b) => a.depth - b.depth);
  
  planetPositions.forEach(({ planet, angle, index }) => {
    if (frame > index * 10) {
      drawElegantTrail(ctx, planet, angle);
    }
  });
  
  planetPositions.forEach(({ planet, x, y, depth, index }) => {
    if (frame > index * 10) {
      const scale = 0.6 + (depth + 1) * 0.2;
      const alpha = 0.5 + (depth + 1) * 0.25;
      drawProfessionalPlanet(ctx, planet, x, y, scale, alpha, totalBytes, 300 + frame);
    }
  });
  
  drawProfessionalSun(ctx, avatar, 300 + frame);
  
  if (frame > 60) {
    const slideProgress = Math.min(1, (frame - 60) / 30);
    const panelX = WIDTH - 320 + (1 - easeOutCubic(slideProgress)) * 300;
    drawStatsPanel(ctx, panelX, 100, planets, totalBytes, frame);
  }
}

function drawBackground(ctx: CanvasRenderingContext2D, frame: number) {
  const gradient = ctx.createRadialGradient(
    CENTER_X, CENTER_Y, 0,
    CENTER_X, CENTER_Y, WIDTH
  );
  gradient.addColorStop(0, '#161b22');
  gradient.addColorStop(0.5, '#0d1117');
  gradient.addColorStop(1, '#010409');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
  
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
  
  ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
  for (let y = 0; y < HEIGHT; y += 2) {
    const offset = Math.sin((y + frame) * 0.01) * 1;
    ctx.fillRect(0, y + offset, WIDTH, 1);
  }
  
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
  ctx.fillStyle = 'rgba(22, 27, 34, 0.9)';
  ctx.strokeStyle = 'rgba(0, 255, 65, 0.2)';
  ctx.lineWidth = 1;
  
  roundRect(ctx, x, y, w, h, 16);
  ctx.fill();
  ctx.stroke();
  
  const highlight = ctx.createLinearGradient(x, y, x, y + 40);
  highlight.addColorStop(0, 'rgba(255,255,255,0.05)');
  highlight.addColorStop(1, 'transparent');
  ctx.fillStyle = highlight;
  ctx.beginPath();
  ctx.roundRect(x, y, w, 40, [16, 16, 0, 0]);
  ctx.fill();
  
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

function drawProfessionalSun(ctx: CanvasRenderingContext2D, avatar: Image, frame: number) {
  const size = 85;
  const breathe = Math.sin(frame * 0.03) * 0.05 + 1;
  
  ctx.save();
  ctx.translate(CENTER_X, CENTER_Y);
  ctx.rotate(frame * 0.005);
  
  for (let i = 0; i < 12; i++) {
    const angle = (i / 12) * Math.PI * 2;
    const rayLength = 160 * breathe;
    
    ctx.rotate(angle);
    const gradient = ctx.createLinearGradient(0, size, 0, rayLength);
    gradient.addColorStop(0, 'rgba(255, 200, 50, 0.4)');
    gradient.addColorStop(0.5, 'rgba(255, 150, 0, 0.15)');
    gradient.addColorStop(1, 'transparent');
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.moveTo(-3, size);
    ctx.lineTo(3, size);
    ctx.lineTo(0, rayLength);
    ctx.fill();
  }
  ctx.restore();
  
  for (let i = 4; i > 0; i--) {
    const glowSize = size * (1.3 + i * 0.3) * breathe;
    const alpha = 0.12 / i;
    
    const gradient = ctx.createRadialGradient(CENTER_X, CENTER_Y, size, CENTER_X, CENTER_Y, glowSize);
    gradient.addColorStop(0, `rgba(255, 165, 0, ${alpha})`);
    gradient.addColorStop(1, 'transparent');
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(CENTER_X, CENTER_Y, glowSize, 0, Math.PI * 2);
    ctx.fill();
  }
  
  ctx.save();
  ctx.beginPath();
  ctx.arc(CENTER_X, CENTER_Y, size, 0, Math.PI * 2);
  ctx.clip();
  
  ctx.drawImage(avatar, CENTER_X - size, CENTER_Y - size, size * 2, size * 2);
  
  const tint = ctx.createRadialGradient(CENTER_X, CENTER_Y, 0, CENTER_X, CENTER_Y, size);
  tint.addColorStop(0, 'rgba(255, 220, 100, 0.2)');
  tint.addColorStop(0.7, 'rgba(255, 150, 50, 0.1)');
  tint.addColorStop(1, 'rgba(255, 100, 0, 0.3)');
  ctx.fillStyle = tint;
  ctx.fill();
  
  ctx.restore();
  
  const pulse = Math.sin(frame * 0.08) * 0.5 + 0.5;
  ctx.strokeStyle = '#ffa500';
  ctx.lineWidth = 3;
  ctx.shadowColor = '#ffa500';
  ctx.shadowBlur = 20 + pulse * 15;
  ctx.beginPath();
  ctx.arc(CENTER_X, CENTER_Y, size, 0, Math.PI * 2);
  ctx.stroke();
  ctx.shadowBlur = 0;
}

function drawElegantOrbits(ctx: CanvasRenderingContext2D, frame: number) {
  const rings = [
    { rx: ORBIT_RADIUS_X, ry: ORBIT_RADIUS_Y, alpha: 0.1, width: 1 },
    { rx: ORBIT_RADIUS_X * 0.98, ry: ORBIT_RADIUS_Y * 0.98, alpha: 0.05, width: 3 },
  ];
  
  rings.forEach((ring, i) => {
    ctx.strokeStyle = `rgba(0, 255, 65, ${ring.alpha})`;
    ctx.lineWidth = ring.width;
    
    ctx.setLineDash([50, 100]);
    ctx.lineDashOffset = -frame * (0.5 + i * 0.2);
    
    ctx.beginPath();
    ctx.ellipse(CENTER_X, CENTER_Y, ring.rx, ring.ry, 0, 0, Math.PI * 2);
    ctx.stroke();
  });
  
  ctx.setLineDash([]);
  
  ctx.strokeStyle = 'rgba(88, 166, 255, 0.08)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.ellipse(CENTER_X, CENTER_Y, ORBIT_RADIUS_X * 0.6, ORBIT_RADIUS_Y * 0.6, 0, 0, Math.PI * 2);
  ctx.stroke();
}

function drawElegantTrail(
  ctx: CanvasRenderingContext2D,
  planet: Planet,
  currentAngle: number
) {
  const trailLength = 15;
  
  for (let t = 0; t < trailLength; t++) {
    const trailAngle = currentAngle - (t * 0.03);
    const trailX = CENTER_X + Math.cos(trailAngle) * ORBIT_RADIUS_X;
    const trailY = CENTER_Y + Math.sin(trailAngle) * ORBIT_RADIUS_Y;
    
    const progress = t / trailLength;
    const alpha = (1 - progress) * 0.4 * Math.sin(progress * Math.PI);
    const size = 35 * (1 - progress) * 0.8;
    
    const gradient = ctx.createRadialGradient(trailX, trailY, 0, trailX, trailY, size);
    gradient.addColorStop(0, hexToRgba(planet.color, alpha));
    gradient.addColorStop(1, 'transparent');
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(trailX, trailY, size, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawProfessionalPlanet(
  ctx: CanvasRenderingContext2D,
  planet: Planet,
  x: number,
  y: number,
  scale: number,
  alpha: number,
  totalBytes: number,
  frame: number
) {
  const size = 40 * scale;
  const percent = ((planet.language.size / totalBytes) * 100).toFixed(1);
  
  ctx.save();
  ctx.globalAlpha = alpha;
  
  for (let i = 3; i > 0; i--) {
    const glowSize = size * (1.5 + i * 0.4);
    const glowAlpha = 0.15 / i;
    
    const gradient = ctx.createRadialGradient(x, y, size, x, y, glowSize);
    gradient.addColorStop(0, hexToRgba(planet.color, glowAlpha));
    gradient.addColorStop(1, 'transparent');
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(x, y, glowSize, 0, Math.PI * 2);
    ctx.fill();
  }
  
  const bodyGrad = ctx.createRadialGradient(
    x - size * 0.3, y - size * 0.3, 0,
    x, y, size
  );
  bodyGrad.addColorStop(0, lightenColor(planet.color, 40));
  bodyGrad.addColorStop(0.4, planet.color);
  bodyGrad.addColorStop(0.9, darkenColor(planet.color, 30));
  bodyGrad.addColorStop(1, darkenColor(planet.color, 50));
  
  ctx.beginPath();
  ctx.arc(x, y, size, 0, Math.PI * 2);
  ctx.fillStyle = bodyGrad;
  ctx.fill();
  
  ctx.beginPath();
  ctx.ellipse(x - size * 0.3, y - size * 0.3, size * 0.25, size * 0.15, -Math.PI/4, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
  ctx.fill();
  
  ctx.strokeStyle = lightenColor(planet.color, 20);
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(x, y, size * 0.85, 0, Math.PI * 2);
  ctx.stroke();
  
  if (planet.loadedLogo) {
    const logoSize = size * 1.4;
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = 10;
    ctx.drawImage(planet.loadedLogo, x - logoSize/2, y - logoSize/2, logoSize, logoSize);
    ctx.shadowBlur = 0;
  } else {
    ctx.fillStyle = '#ffffff';
    ctx.font = `bold ${16 * scale}px monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = 'rgba(0,0,0,0.8)';
    ctx.shadowBlur = 4;
    ctx.fillText(planet.icon, x, y);
    ctx.shadowBlur = 0;
  }
  
  if (alpha > 0.7) {
    const label = `${planet.language.name}`;
    const subLabel = `${percent}%`;
    
    ctx.font = `bold ${13 * scale}px "JetBrains Mono", monospace`;
    const textWidth = Math.max(
      ctx.measureText(label).width,
      ctx.measureText(subLabel).width
    );
    
    const labelY = y + size + 25;
    ctx.fillStyle = 'rgba(13, 17, 23, 0.8)';
    ctx.strokeStyle = hexToRgba(planet.color, 0.5);
    ctx.lineWidth = 1;
    
    roundRect(ctx, x - textWidth/2 - 8, labelY - 15, textWidth + 16, 40, 6);
    ctx.fill();
    ctx.stroke();
    
    ctx.shadowColor = planet.color;
    ctx.shadowBlur = 10;
    ctx.fillStyle = '#ffffff';
    ctx.fillText(label, x, labelY);
    
    ctx.shadowBlur = 0;
    ctx.fillStyle = planet.color;
    ctx.fillText(subLabel, x, labelY + 18);
  }
  
  ctx.restore();
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
  
  ctx.fillStyle = 'rgba(22, 27, 34, 0.95)';
  ctx.strokeStyle = 'rgba(0, 255, 65, 0.3)';
  ctx.lineWidth = 1;
  roundRect(ctx, x, y, w, h, 12);
  ctx.fill();
  ctx.stroke();
  
  ctx.fillStyle = '#00ff41';
  ctx.font = 'bold 16px monospace';
  ctx.fillText('> Language Stats', x + 20, y + 40);
  
  const sortedPlanets = [...planets].sort((a, b) => b.language.size - a.language.size);
  
  sortedPlanets.forEach((planet, i) => {
    const barY = y + 80 + i * 45;
    const percent = (planet.language.size / totalBytes) * 100;
    const barWidth = 200;
    const fillWidth = (percent / 100) * barWidth;
    
    const animDelay = i * 10;
    const animProgress = Math.max(0, Math.min(1, (frame - 90 - animDelay) / 20));
    const currentWidth = fillWidth * easeOutCubic(animProgress);
    
    ctx.fillStyle = '#c9d1d9';
    ctx.font = '12px monospace';
    ctx.fillText(planet.language.name, x + 20, barY);
    
    ctx.fillStyle = planet.color;
    ctx.fillText(`${percent.toFixed(1)}%`, x + 240, barY);
    
    ctx.fillStyle = 'rgba(48, 54, 61, 0.8)';
    ctx.beginPath();
    ctx.roundRect(x + 20, barY + 8, barWidth, 8, 4);
    ctx.fill();
    
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
  
  ctx.strokeStyle = '#00ff41';
  ctx.lineWidth = 3;
  ctx.shadowColor = '#00ff41';
  ctx.shadowBlur = 15;
  ctx.stroke();
  ctx.restore();
}

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
  const num = parseInt(hex.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = Math.min(255, (num >> 16) + amt);
  const G = Math.min(255, ((num >> 8) & 0x00FF) + amt);
  const B = Math.min(255, (num & 0x0000FF) + amt);
  return `#${(0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1)}`;
}

function darkenColor(hex: string, percent: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = Math.max(0, (num >> 16) - amt);
  const G = Math.max(0, ((num >> 8) & 0x00FF) - amt);
  const B = Math.max(0, (num & 0x0000FF) - amt);
  return `#${(0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1)}`;
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