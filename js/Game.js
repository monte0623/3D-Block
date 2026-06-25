// 遊戲全域狀態
let currentLevel = 1;
let gridX = 5; // 初始 5x5
let gridY = 5;
const gridZ = 10; // 固定高度 10

// Three.js 核心變數
let scene, camera, renderer;
let gridHelper;

function init3D() {
    const container = document.getElementById('canvas-wrapper');
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a1a1a);

    // 設定正交相機以達到 45度 Isometric 效果
    const aspect = window.innerWidth / window.innerHeight;
    const d = 10; // 視角範圍大小
    camera = new THREE.OrthographicCamera(-d * aspect, d * aspect, d, -d, 1, 1000);
    
    // 完美的 45 度俯視視角位置與朝向
    camera.position.set(20, 20, 20); 
    camera.lookAt(0, 3, 0);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    container.appendChild(renderer.domElement);

    // 加入基礎光源
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.6);
    dirLight.position.set(10, 20, 15);
    scene.add(dirLight);

    buildGrid();
    animate();
}

// 根據當前關卡的尺寸繪製底座格線
function buildGrid() {
    if (gridHelper) scene.remove(gridHelper);

    gridHelper = new THREE.Group();
    const material = new THREE.LineBasicMaterial({ color: 0x555555 });

    // 繪製 X-Y 底面網格 (置中於原點)
    const offsetX = gridX / 2;
    const offsetY = gridY / 2;

    for (let i = 0; i <= gridX; i++) {
        const points = [
            new THREE.Vector3(i - offsetX, 0, -offsetY),
            new THREE.Vector3(i - offsetX, 0, gridY - offsetY)
        ];
        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        gridHelper.add(new THREE.Line(geometry, material));
    }
    for (let j = 0; j <= gridY; j++) {
        const points = [
            new THREE.Vector3(-offsetX, 0, j - offsetY),
            new THREE.Vector3(gridX - offsetX, 0, j - offsetY)
        ];
        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        gridHelper.add(new THREE.Line(geometry, material));
    }

    // 繪製 4 根垂直角落支柱，標示 10 層高度
    const columnMat = new THREE.LineBasicMaterial({ color: 0x8844ff });
    const corners = [
        [-offsetX, -offsetY],
        [offsetX, -offsetY],
        [-offsetX, offsetY],
        [offsetX, offsetY]
    ];
    corners.forEach(c => {
        const points = [
            new THREE.Vector3(c[0], 0, c[1]),
            new THREE.Vector3(c[0], gridZ, c[1])
        ];
        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        gridHelper.add(new THREE.Line(geometry, columnMat));
    });

    scene.add(gridHelper);
}

function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
}

// 監聽視窗縮放
window.addEventListener('resize', () => {
    if (!camera || !renderer) return;
    const aspect = window.innerWidth / window.innerHeight;
    const d = 10;
    camera.left = -d * aspect;
    camera.right = d * aspect;
    camera.top = d;
    camera.bottom = -d;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// 啟動 3D 舞台
init3D();
