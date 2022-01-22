interface BreakPoint {
  name: string;
  frame: number;
}

const sqMin = 0,
  sqMax = 99,
  basePath =
    'https://flatyfind-projects-media.s3.eu-central-1.amazonaws.com/pflugfelder/seeber-gaerten/turntable/total/',
  prefix = 'Fassade_',
  extension = '.jpg',
  frames: HTMLImageElement[] = [],
  breakpoints: BreakPoint[] = [
    { name: 'north', frame: 0 },
    { name: 'east', frame: 25 },
    { name: 'south', frame: 50 },
    { name: 'west', frame: 75 },
  ],
  breakpointStart = 0;
let currentBreakpointIndex = breakpointStart;
let currentBreakpoint = breakpoints[breakpointStart];
let bpAnimating = false;

let loaded = 0;
let loaderWidth: string;
let currentFrame = sqMin;
let autorotation = false;
let autoRotationDelay = 90;
let requestedAnimationFrame: number;

let dragging = false;

// Elements
const canvas = document.querySelector('canvas') as HTMLCanvasElement;
const ctx = canvas.getContext('2d');
const loaderEl = document.querySelector('.loader');
const loadedEl = document.querySelector('.loaded');
const loadedBar = document.querySelector('.loader-bar__inner') as HTMLElement;

// BP buttons
const btnBpPref = document.querySelector('.bp-prev') as HTMLButtonElement;
const btnBpNext = document.querySelector('.bp-next') as HTMLButtonElement;

btnBpPref.addEventListener('click', () => {
  if (bpAnimating) return;

  if (currentBreakpointIndex - 1 < 0) {
    currentBreakpointIndex = breakpoints.length - 1;
  } else {
    currentBreakpointIndex--;
  }

  currentBreakpoint = breakpoints[currentBreakpointIndex];
  currentBreakPointValueEl.innerText = currentBreakpoint.name;

  goToPrevBp();
});

btnBpNext.addEventListener('click', () => {
  if (bpAnimating) return;

  if (currentBreakpointIndex + 1 > breakpoints.length - 1) {
    currentBreakpointIndex = 0;
  } else {
    currentBreakpointIndex++;
  }

  currentBreakpoint = breakpoints[currentBreakpointIndex];
  currentBreakPointValueEl.innerText = currentBreakpoint.name;

  goToNextBp();
});

// Debug elements
const autorotationInput = document.querySelector(
  '#autorotation'
) as HTMLInputElement;
const autorotationDelayInput = document.querySelector(
  '#autorotation-delay'
) as HTMLInputElement;
const currentFrameValueEl = document.querySelector(
  '.current-frame__value'
) as HTMLElement;
const sequenceMaxValueEl = document.querySelector(
  '.sequence-max__value'
) as HTMLElement;
const currentBreakPointValueEl = document.querySelector(
  '.current-bp__value'
) as HTMLElement;

sequenceMaxValueEl.innerText = sqMax.toString();
currentBreakPointValueEl.innerText = breakpoints[breakpointStart].name;

autorotationInput.checked = autorotation;

autorotationInput.addEventListener('change', e => {
  if ((e.target as HTMLInputElement).checked) animateAutorotation();
  else {
    cancelAnimationFrame(requestedAnimationFrame);
    goToClosestBreakPoint();
  }
});

autorotationDelayInput.addEventListener('change', e => {
  autoRotationDelay = Number((e.target as HTMLInputElement).value);
});

function loadImage(
  path: string,
  throttled: boolean = false
): Promise<HTMLImageElement | Error> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = path;

    if (throttled) {
      img.addEventListener('load', () => {
        setTimeout(() => {
          resolve(img);
        }, 5);
      });
    } else {
      img.addEventListener('load', () => {
        resolve(img);
      });
    }

    img.addEventListener('error', _err => {
      reject(new Error('Image could not be loaded'));
    });
  });
}

async function loadImages(throttled: boolean = false) {
  for (let index = sqMin; index <= sqMax; index++) {
    const path = `${basePath}${prefix}${index
      .toString()
      .padStart(3, '0')}${extension}`;
    try {
      const res = await loadImage(path, throttled);
      frames[index] = res as HTMLImageElement;
      loaded++;

      loaderWidth = `${Math.floor((loaded / sqMax) * 100) - 1}%`;
      loadedBar.style.width = loaderWidth;

      (loadedEl as HTMLElement).innerText = `${loaderWidth}`;

      if (loaded === 100) {
        loaderEl?.classList.add('hidden');
      }
    } catch (error) {
      console.log((error as Error).message);
    }
  }
}

await loadImages(true);

canvas.width = frames[0].width;
canvas.height = frames[0].height;
canvas.classList.add('visible');

/**
 * Handles the autorotation animation.
 */
function animateAutorotation() {
  let start: number;
  let previousTimeStamp: number = 0;
  let previousElapsed: number = 0;

  function autorotate(timestamp: number) {
    if (start === undefined) {
      start = timestamp;
    }

    if (previousTimeStamp === 0) {
      previousTimeStamp = timestamp;
    }

    const elapsed = Math.floor(timestamp - start);
    previousElapsed = Math.floor(previousTimeStamp - start);

    if (elapsed - previousElapsed > autoRotationDelay) {
      if (currentFrame < sqMax) {
        currentFrame++;
        currentFrameValueEl.innerText = currentFrame.toString();
      } else {
        currentFrame = sqMin;
        currentFrameValueEl.innerText = currentFrame.toString();
      }

      ctx?.clearRect(0, 0, canvas.width, canvas.height);
      ctx?.drawImage(frames[currentFrame], 0, 0);

      previousTimeStamp = timestamp;
    }

    requestedAnimationFrame = requestAnimationFrame(autorotate);
  }

  requestedAnimationFrame = requestAnimationFrame(autorotate);
}

if (autorotation) animateAutorotation();
else {
  currentFrame = breakpoints[breakpointStart].frame;
  currentFrameValueEl.innerText = currentFrame.toString();
  ctx?.clearRect(0, 0, canvas.width, canvas.height);
  ctx?.drawImage(frames[currentFrame], 0, 0);
}

function goToNextBp() {
  bpAnimating = true;

  const animate = () => {
    requestedAnimationFrame = requestAnimationFrame(animate);
    currentFrame++;

    if (currentFrame > sqMax) {
      currentFrame = sqMin;

      if (currentFrame === currentBreakpoint.frame) {
        cancelAnimationFrame(requestedAnimationFrame);
      } else {
        currentFrame++;
        ctx?.clearRect(0, 0, canvas.width, canvas.height);
        ctx?.drawImage(frames[currentFrame], 0, 0);
      }
    }

    if (currentFrame === currentBreakpoint.frame) {
      cancelAnimationFrame(requestedAnimationFrame);
      bpAnimating = false;
    }

    currentFrameValueEl.innerText = currentFrame.toString();
    ctx?.clearRect(0, 0, canvas.width, canvas.height);
    ctx?.drawImage(frames[currentFrame], 0, 0);
  };

  requestedAnimationFrame = requestAnimationFrame(animate);
}

function goToPrevBp() {
  bpAnimating = true;

  const animate = () => {
    requestedAnimationFrame = requestAnimationFrame(animate);
    currentFrame--;

    if (currentFrame < sqMin) {
      currentFrame = sqMax;

      if (currentFrame === currentBreakpoint.frame) {
        cancelAnimationFrame(requestedAnimationFrame);
      } else {
        currentFrame--;
        ctx?.clearRect(0, 0, canvas.width, canvas.height);
        ctx?.drawImage(frames[currentFrame], 0, 0);
      }
    }

    if (currentFrame === currentBreakpoint.frame) {
      cancelAnimationFrame(requestedAnimationFrame);
      bpAnimating = false;
    }

    currentFrameValueEl.innerText = currentFrame.toString();
    ctx?.clearRect(0, 0, canvas.width, canvas.height);
    ctx?.drawImage(frames[currentFrame], 0, 0);
  };

  requestedAnimationFrame = requestAnimationFrame(animate);
}

canvas.addEventListener('mousedown', () => {
  dragging = true;
});

canvas.addEventListener('mouseup', () => {
  dragging = false;
  goToClosestBreakPoint();
});

canvas.addEventListener('mouseout', () => {
  dragging = false;
});

let perSecond = 60;
let wait = false;
canvas.addEventListener('mousemove', e => {
  if (dragging && !wait && !bpAnimating) {
    if (e.movementX > 0) {
      currentFrame++;

      if (currentFrame > sqMax) {
        currentFrame = sqMin;
      }
    } else if (e.movementX < 0) {
      currentFrame--;

      if (currentFrame < sqMin) {
        currentFrame = sqMax;
      }
    }

    ctx?.clearRect(0, 0, canvas.width, canvas.height);
    ctx?.drawImage(frames[currentFrame], 0, 0);
    currentFrameValueEl.innerText = currentFrame.toString();

    wait = true;

    setTimeout(() => {
      wait = false;
    }, 1000 / perSecond);
  }
});

function findClosestBreakpoint(needle: number, haystack: BreakPoint[]) {
  return haystack.reduce((a, b) => {
    let aDiff = Math.abs(a.frame - needle);
    let bDiff = Math.abs(b.frame - needle);

    if (aDiff == bDiff) {
      return a > b ? a : b;
    } else {
      return bDiff < aDiff ? b : a;
    }
  });
}

function goToClosestBreakPoint() {
  const closestBp = findClosestBreakpoint(currentFrame, breakpoints);
  if (currentFrame === closestBp.frame) {
    currentBreakpoint = closestBp;
    currentBreakPointValueEl.innerText = currentBreakpoint.name;
    return;
  }

  goToClosestBp(closestBp);
}

function goToClosestBp(closestBp: BreakPoint) {
  bpAnimating = true;
  let direction: 'right' | 'left';

  if (currentFrame > closestBp.frame) {
    direction = 'left';
  } else {
    direction = 'right';
  }

  const animate = () => {
    requestedAnimationFrame = requestAnimationFrame(animate);

    if (direction === 'right') {
      currentFrame++;
      if (currentFrame > sqMax) {
        currentFrame = sqMin;

        if (currentFrame === closestBp.frame) {
          cancelAnimationFrame(requestedAnimationFrame);
        } else {
          currentFrame++;
          ctx?.clearRect(0, 0, canvas.width, canvas.height);
          ctx?.drawImage(frames[currentFrame], 0, 0);
        }
      }
    } else {
      currentFrame--;
      if (currentFrame < sqMin) {
        currentFrame = sqMax;

        if (currentFrame === currentBreakpoint.frame) {
          cancelAnimationFrame(requestedAnimationFrame);
        } else {
          currentFrame--;
          ctx?.clearRect(0, 0, canvas.width, canvas.height);
          ctx?.drawImage(frames[currentFrame], 0, 0);
        }
      }
    }

    if (currentFrame === closestBp.frame) {
      cancelAnimationFrame(requestedAnimationFrame);
      bpAnimating = false;

      currentBreakpoint = closestBp;
      currentBreakpointIndex = breakpoints.findIndex(
        bp => bp.frame === closestBp.frame
      );
      currentBreakPointValueEl.innerText = currentBreakpoint.name;
    }

    currentFrameValueEl.innerText = currentFrame.toString();
    ctx?.clearRect(0, 0, canvas.width, canvas.height);
    ctx?.drawImage(frames[currentFrame], 0, 0);
  };

  requestedAnimationFrame = requestAnimationFrame(animate);
}

export {};
