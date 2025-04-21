const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const ambientLight = new THREE.AmbientLight(0x404040, 2); // цвет и интенсивность света
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1); // белый свет с интенсивностью 1
directionalLight.position.set(5, 5, 5); // позиция света в пространстве
scene.add(directionalLight);

const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.rotateSpeed = 0.5;
camera.position.z = 50;
controls.autoRotate = false;  // Отключение автоповорота камеры
controls.minDistance = 10;
controls.maxDistance = 150;

const loader = new THREE.TextureLoader();

const galaxyTexture = loader.load('textures/galaxy.jpg');
const galaxyGeometry = new THREE.SphereGeometry(500, 64, 64);
const galaxyMaterial = new THREE.MeshBasicMaterial({
  map: galaxyTexture,
  side: THREE.BackSide
});
const galaxySphere = new THREE.Mesh(galaxyGeometry, galaxyMaterial);
scene.add(galaxySphere);

const tooltip = document.getElementById('tooltip');
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

const planets = [], planetNames = [], orbitData = [];

function createPlanet(data, distanceFromSun) {
  // Планеты на расстоянии друг от друга
  const orbitRadius = distanceFromSun * 10;  // Умножаем на 10, чтобы сделать расстояние удобным для сцены
  const orbitSpeed = (data.physical_characteristics.orbital_speed_km_s || 0.01 + Math.random() * 0.01) / 1000;  // Скорость орбиты

  // Позиция и размер планет
  const position = data.position || [Math.random() * 50 - 25, 0, Math.random() * 50 - 25];
  const geometry = new THREE.SphereGeometry(data.radius * 1.5 || 1, 32, 32);  // Увеличиваем радиус планеты на 50%
  const texture = data.texture_path ? loader.load("textures/" + data.texture_path) : null;
  const material = new THREE.MeshStandardMaterial({
    map: texture,
    emissive: data.famous ? new THREE.Color('white') : new THREE.Color('black'),
    emissiveIntensity: data.famous ? 0.5 : 0.1,
  });

  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(...position);  // Задаём позицию планеты
  scene.add(mesh);

  planets.push(mesh);
  planetNames.push(data.name);

  // Записываем данные для орбит
  orbitData.push({
    center: data.orbitCenter || [0, 0, 0],
    radius: orbitRadius,
    speed: orbitSpeed,
    angle: Math.random() * Math.PI * 2
  });
}

fetch('info.json')
  .then(res => res.json())
  .then(data => {
    let distanceFromSun = 1;  // Начинаем с 1 (Меркурий)
    data.forEach(obj => {
      createPlanet(obj, distanceFromSun);  // Передаем расстояние от Солнца
      distanceFromSun++;  // Увеличиваем расстояние для следующей планеты
    });
  });

const pointLight = new THREE.PointLight(0xffffff, 2);
pointLight.position.set(0, 0, 0);
scene.add(pointLight);

// Солнце с текстурой
const sunTexture = loader.load('textures/sun.jpg'); // Добавляем текстуру для Солнца
const sunGeo = new THREE.SphereGeometry(3, 64, 64);
const sunMat = new THREE.MeshBasicMaterial({
  map: sunTexture,  // Текстура для Солнца
  transparent: true,
  opacity: 0.9
});
const sun = new THREE.Mesh(sunGeo, sunMat);
sun.name = 'Sun';
scene.add(sun);

function animate() {
  requestAnimationFrame(animate);
  controls.update();

  // Движение планет по орбитам
  planets.forEach((p, i) => {
    const o = orbitData[i];
    if (o) {
      o.angle += o.speed * 0.01;  // Одинаковая скорость орбит
      p.position.x = o.center[0] + o.radius * Math.cos(o.angle);  // X координата
      p.position.z = o.center[2] + o.radius * Math.sin(o.angle);  // Z координата

      // Вращение планеты вокруг своей оси
      p.rotation.y += 0.005;
    }
  });

  // Анимация Солнца (пульсация)
  sun.material.opacity = 0.8 + 0.1 * Math.sin(Date.now() * 0.002);
  
  // Рендер сцены
  renderer.render(scene, camera);
}
animate();

window.addEventListener('mousemove', event => {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(planets);
  if (intersects.length > 0) {
    const idx = planets.indexOf(intersects[0].object);
    tooltip.style.left = `${event.clientX + 5}px`;
    tooltip.style.top = `${event.clientY + 5}px`;
    tooltip.innerHTML = planetNames[idx];
    tooltip.style.display = 'block';
  } else {
    tooltip.style.display = 'none';
  }
});