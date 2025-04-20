const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.rotateSpeed = 0.5;
camera.position.z = 50;

const loader = new THREE.TextureLoader();
loader.load('textures/galaxy.jpg', texture => scene.background = texture);

const tooltip = document.getElementById('tooltip');
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

const planets = [], planetNames = [], orbitData = [];

function createPlanet(data) {
  const geometry = new THREE.SphereGeometry(data.radius, 32, 32);
  const texture = data.texture_path ? loader.load("textures/" + data.texture_path) : null;
  const material = new THREE.MeshStandardMaterial({
    map: texture,
    emissive: data.famous ? new THREE.Color('white') : new THREE.Color('black'),
    emissiveIntensity: data.famous ? 0.5 : 0.1,
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(...data.position);
  scene.add(mesh);
  planets.push(mesh);
  planetNames.push(data.name);
  orbitData.push({
    center: data.orbitCenter,
    radius: data.orbitRadius,
    speed: data.orbitSpeed,
    angle: Math.random() * Math.PI * 2
  });
}

fetch('info.json')
  .then(res => res.json())
  .then(data => {
    data.forEach(obj => createPlanet(obj));
  });

const pointLight = new THREE.PointLight(0xffffff, 2);
pointLight.position.set(0, 0, 0);
scene.add(pointLight);

const sunGeo = new THREE.SphereGeometry(3, 64, 64);
const sunMat = new THREE.MeshBasicMaterial({ color: 0xffcc00, transparent: true, opacity: 0.9 });
const sun = new THREE.Mesh(sunGeo, sunMat);
sun.name = 'Sun';
scene.add(sun);

function animate() {
  requestAnimationFrame(animate);
  controls.update();
  planets.forEach((p, i) => {
    p.rotation.y += 0.005;
    const o = orbitData[i];
    if (o) {
      o.angle += o.speed;
      p.position.x = o.center[0] + o.radius * Math.cos(o.angle);
      p.position.z = o.center[2] + o.radius * Math.sin(o.angle);
    }
  });
  sun.material.opacity = 0.8 + 0.1 * Math.sin(Date.now() * 0.002);
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
