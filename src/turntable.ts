const sqMin = 0,
  sqMax = 99,
  basePath =
    'https://flatyfind-projects-media.s3.eu-central-1.amazonaws.com/pflugfelder/seeber-gaerten/turntable/total/',
  prefix = 'Fassade_',
  extension = '.jpg',
  frames: HTMLImageElement[] = [];
let loaded = 0;
let loaderWidth: string;
let autorotation = true;
let autoRotationDelay = 90;
let requestedAnimationFrame: number;

const canvas = document.querySelector('canvas') as HTMLCanvasElement;
const ctx = canvas.getContext('2d');
const loaderEl = document.querySelector('.loader');
const loadedEl = document.querySelector('.loaded');
const loadedBar = document.querySelector('.loader-bar__inner') as HTMLElement;
const autorotationInput = document.querySelector(
  '#autorotation'
) as HTMLInputElement;

autorotationInput.checked = autorotation;

autorotationInput.addEventListener('change', e => {
  if ((e.target as HTMLInputElement).checked) animate();
  else cancelAnimationFrame(requestedAnimationFrame);
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

let start: number;
let previousTimeStamp: number = 0;
let previousElapsed: number = 0;
let currentFrame = sqMin;

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
    } else {
      currentFrame = sqMin;
    }

    ctx?.clearRect(0, 0, canvas.width, canvas.height);
    ctx?.drawImage(frames[currentFrame], 0, 0);

    previousTimeStamp = timestamp;
  }

  requestedAnimationFrame = requestAnimationFrame(autorotate);
}

function animate() {
  requestedAnimationFrame = requestAnimationFrame(autorotate);
}

if (autorotation) animate();
else ctx?.drawImage(frames[0], 0, 0);

export {};
