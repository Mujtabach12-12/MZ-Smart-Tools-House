const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
function polygonArea(points) { return Math.abs(points.reduce((sum,[x,y],i)=>{const[nx,ny]=points[(i+1)%points.length];return sum+x*ny-nx*y;},0))/2; }

export function orderCorners(points) {
  if (!Array.isArray(points) || points.length !== 4) return null;
  const clean = points.map((point) => [Number(point?.[0]), Number(point?.[1])]);
  if (clean.some(([x, y]) => !Number.isFinite(x) || !Number.isFinite(y))) return null;
  const tl = clean.reduce((best, p) => (p[0] + p[1] < best[0] + best[1] ? p : best));
  const br = clean.reduce((best, p) => (p[0] + p[1] > best[0] + best[1] ? p : best));
  const tr = clean.reduce((best, p) => (p[0] - p[1] > best[0] - best[1] ? p : best));
  const bl = clean.reduce((best, p) => (p[0] - p[1] < best[0] - best[1] ? p : best));
  const ordered = [tl, tr, br, bl];
  if (new Set(ordered.map((p) => `${p[0]}:${p[1]}`)).size !== 4) return null;
  return ordered;
}

export function validateDocumentCorners(points, width, height, minAreaRatio = 0.02) {
  const ordered = orderCorners(points);
  if (!ordered || !(width > 0) || !(height > 0)) return null;
  if (ordered.some(([x, y]) => x < 0 || y < 0 || x > width || y > height)) return null;
  if (polygonArea(ordered) < width * height * minAreaRatio) return null;
  const sides = ordered.map((p, i) => Math.hypot(ordered[(i + 1) % 4][0] - p[0], ordered[(i + 1) % 4][1] - p[1]));
  if (Math.min(...sides) < Math.min(width, height) * 0.03) return null;
  return ordered;
}

function makeGray(data, width, height, maxSide = 480) {
  const scale = Math.min(1, maxSide / Math.max(width, height));
  const w = Math.max(20, Math.round(width * scale));
  const h = Math.max(20, Math.round(height * scale));
  const gray = new Float32Array(w * h);
  for (let y = 0; y < h; y += 1) {
    const sy = Math.min(height - 1, Math.max(0, Math.round((y + 0.5) / scale - 0.5)));
    for (let x = 0; x < w; x += 1) {
      const sx = Math.min(width - 1, Math.max(0, Math.round((x + 0.5) / scale - 0.5)));
      const index = (sy * width + sx) * 4;
      gray[y * w + x] = data[index] * 0.299 + data[index + 1] * 0.587 + data[index + 2] * 0.114;
    }
  }
  return { gray, w, h, scale };
}

function blur3x3(gray, width, height) {
  const out = new Float32Array(gray);
  for (let y = 1; y < height - 1; y += 1) {
    for (let x = 1; x < width - 1; x += 1) {
      let sum = 0;
      for (let yy = -1; yy <= 1; yy += 1) for (let xx = -1; xx <= 1; xx += 1) sum += gray[(y + yy) * width + x + xx];
      out[y * width + x] = sum / 9;
    }
  }
  return out;
}

function sobelEdges(gray, width, height) {
  const magnitude = new Float32Array(width * height);
  const samples = [];
  for (let y = 1; y < height - 1; y += 1) {
    for (let x = 1; x < width - 1; x += 1) {
      const a=gray[(y-1)*width+x-1], b=gray[(y-1)*width+x], c=gray[(y-1)*width+x+1];
      const d=gray[y*width+x-1], f=gray[y*width+x+1];
      const g=gray[(y+1)*width+x-1], h=gray[(y+1)*width+x], k=gray[(y+1)*width+x+1];
      const gx=-a+c-2*d+2*f-g+k, gy=-a-2*b-c+g+2*h+k;
      const value = Math.hypot(gx, gy);
      magnitude[y * width + x] = value;
      if ((x + y) % 2 === 0) samples.push(value);
    }
  }
  samples.sort((a,b)=>a-b);
  const p88 = samples[Math.floor(samples.length * 0.88)] || 0;
  const threshold = Math.max(32, p88);
  const binary = new Uint8Array(width * height);
  for (let i = 0; i < magnitude.length; i += 1) if (magnitude[i] >= threshold) binary[i] = 1;
  return { binary, threshold };
}

function dilate(binary, width, height) {
  const out = new Uint8Array(binary.length);
  for (let y = 1; y < height - 1; y += 1) for (let x = 1; x < width - 1; x += 1) {
    let hit = 0;
    for (let yy = -1; yy <= 1 && !hit; yy += 1) for (let xx = -1; xx <= 1; xx += 1) if (binary[(y + yy) * width + x + xx]) { hit = 1; break; }
    if (hit) out[y * width + x] = 1;
  }
  return out;
}

function components(binary, width, height) {
  const seen = new Uint8Array(binary.length);
  const found = [];
  const neighbors = [[-1,-1],[0,-1],[1,-1],[-1,0],[1,0],[-1,1],[0,1],[1,1]];
  for (let y = 1; y < height - 1; y += 1) for (let x = 1; x < width - 1; x += 1) {
    const start = y * width + x;
    if (!binary[start] || seen[start]) continue;
    const queue = [start]; seen[start] = 1;
    let cursor = 0, count = 0;
    let minSum = Infinity, maxSum = -Infinity, minDiff = Infinity, maxDiff = -Infinity;
    let tl=null,tr=null,br=null,bl=null,minX=x,maxX=x,minY=y,maxY=y;
    while (cursor < queue.length) {
      const index = queue[cursor++]; const cy = Math.floor(index / width), cx = index - cy * width; count += 1;
      const sum = cx + cy, diff = cx - cy;
      if (sum < minSum) { minSum=sum; tl=[cx,cy]; }
      if (sum > maxSum) { maxSum=sum; br=[cx,cy]; }
      if (diff > maxDiff) { maxDiff=diff; tr=[cx,cy]; }
      if (diff < minDiff) { minDiff=diff; bl=[cx,cy]; }
      minX=Math.min(minX,cx);maxX=Math.max(maxX,cx);minY=Math.min(minY,cy);maxY=Math.max(maxY,cy);
      for (const [dx,dy] of neighbors) {
        const nx=cx+dx,ny=cy+dy;if(nx<=0||ny<=0||nx>=width-1||ny>=height-1)continue;
        const ni=ny*width+nx;if(binary[ni]&&!seen[ni]){seen[ni]=1;queue.push(ni);}
      }
    }
    if (count >= Math.max(18, width * height * 0.00045)) found.push({ count, corners:[tl,tr,br,bl], minX,maxX,minY,maxY });
  }
  return found.sort((a,b)=>b.count-a.count).slice(0,24);
}

function lineSupport(binary, width, height, corners) {
  let hits = 0, total = 0;
  const radius = 2;
  for (let side = 0; side < 4; side += 1) {
    const a = corners[side], b = corners[(side + 1) % 4];
    const samples = Math.max(18, Math.min(80, Math.round(Math.hypot(b[0]-a[0], b[1]-a[1]) / 3)));
    for (let i = 0; i <= samples; i += 1) {
      const t=i/samples,x=Math.round(a[0]+(b[0]-a[0])*t),y=Math.round(a[1]+(b[1]-a[1])*t);total += 1;
      let found=false;
      for(let yy=-radius;yy<=radius&&!found;yy+=1)for(let xx=-radius;xx<=radius;xx+=1){const nx=x+xx,ny=y+yy;if(nx>=0&&ny>=0&&nx<width&&ny<height&&binary[ny*width+nx]){found=true;break;}}
      if(found)hits+=1;
    }
  }
  return total ? hits / total : 0;
}

function cornerQuality(corners) {
  let total = 0;
  for (let i = 0; i < 4; i += 1) {
    const prev=corners[(i+3)%4],p=corners[i],next=corners[(i+1)%4];
    const ax=prev[0]-p[0],ay=prev[1]-p[1],bx=next[0]-p[0],by=next[1]-p[1];
    const denom=Math.hypot(ax,ay)*Math.hypot(bx,by)||1;
    total += Math.abs(ax*by-ay*bx)/denom;
  }
  return total/4;
}

function scoreCandidate(candidate, binary, width, height) {
  const ordered = validateDocumentCorners(candidate.corners, width, height, 0.10);
  if (!ordered) return null;
  const areaRatio = polygonArea(ordered)/(width*height);
  if (areaRatio < 0.12 || areaRatio > 0.985) return null;
  const bboxRatio=((candidate.maxX-candidate.minX+1)*(candidate.maxY-candidate.minY+1))/(width*height);
  if (bboxRatio < 0.12) return null;
  const support=lineSupport(binary,width,height,ordered);
  const shape=cornerQuality(ordered);
  const areaScore=clamp((areaRatio-0.10)/0.65,0,1);
  const borderTouches=ordered.filter(([x,y])=>x<2||y<2||x>width-3||y>height-3).length;
  const borderPenalty=borderTouches===4?0.20:borderTouches>=2?0.08:0;
  const confidence=clamp(support*0.58+shape*0.22+areaScore*0.20-borderPenalty,0,1);
  return { corners:ordered, confidence, support, areaRatio };
}

/**
 * Analyze the full image and return the best likely physical page boundary.
 * The detector uses grayscale preprocessing, Sobel edges, connected edge
 * components (contour candidates), four-corner estimation and a confidence
 * score based on line support, shape quality and occupied page area.
 */
export function detectDocumentBoundary(data,width,height){
  if(!data||width<20||height<20||data.length<width*height*4)return null;
  const {gray,w,h,scale}=makeGray(data,width,height);
  const blurred=blur3x3(gray,w,h);
  const {binary}=sobelEdges(blurred,w,h);
  const connected=dilate(binary,w,h);
  const candidates=components(connected,w,h);
  let best=null;
  for(const candidate of candidates){const scored=scoreCandidate(candidate,connected,w,h);if(scored&&(!best||scored.confidence>best.confidence))best=scored;}
  if(!best||best.confidence<0.38)return null;
  const corners=best.corners.map(([x,y])=>[clamp(x/scale,0,width),clamp(y/scale,0,height)]);
  const validated=validateDocumentCorners(corners,width,height,.10);
  if(!validated)return null;
  return { corners:validated, confidence:Number(best.confidence.toFixed(3)), support:Number(best.support.toFixed(3)), areaRatio:Number(best.areaRatio.toFixed(3)) };
}

/** Backward-compatible corner-only API used by older scanner code/tests. */
export function detectDocumentCorners(data,width,height){ return detectDocumentBoundary(data,width,height)?.corners || null; }
export const normalizeCorners=(corners,width,height)=>corners.map(([x,y])=>[x/width,y/height]);
