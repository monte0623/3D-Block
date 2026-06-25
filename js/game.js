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

// 1. 定義 3D 方塊庫 (以相對座標表示)
const TETROMINOES = {
    I: { blocks: [[0,0,0], [1,0,0], [-1,0,0], [2,0,0]], color: 0x00f0f0 },       // 青色
    O: { blocks: [[0,0,0], [1,0,0], [0,1,0], [1,1,0], [0,0,1], [1,0,1], [0,1,1], [1,1,1]], color: 0xf0f000 }, // 黃色 (2x2x2)
    T: { blocks: [[0,0,0], [-1,0,0], [1,0,0], [0,1,0]], color: 0xa000f0 },       // 紫色
    L3: { blocks: [[0,0,0], [1,0,0], [0,1,0]], color: 0xffaa00 },                // 橘色 (3塊迷你L)
    CORNER: { blocks: [[0,0,0], [1,0,0], [0,1,0], [0,0,1]], color: 0x0000f0 },    // 深藍 (3D拐角)
    CROSS: { blocks: [[0,0,0], [1,0,0], [-1,0,0], [0,1,0], [0,-1,0], [0,0,1], [0,0,-1]], color: 0xff00ff }, // 桃紅 (3D十字)
    Z3D: { blocks: [[0,0,0], [1,0,0], [0,1,0], [-1,1,0], [0,0,1], [1,0,1]], color: 0x00f000 }, // 綠色
    L5: { blocks: [[0,0,0], [-1,0,0], [1,0,0], [2,0,0], [2,1,0]], color: 0xff5555 } // 紅色
};

// 2. 當前操作中的方塊狀態
let currentPiece = {
    type: 'I',
    blocks: [],      // 旋轉後的相對座標庫
    position: {x: 0, y: 0, z: 10}, // 當前在世界網格的位置
    color: 0xffffff,
    meshGroup: null  // Three.js 的 3D 物件群組
};

// 3. 全軸向旋轉數學函式 (每次旋轉 90 度)
function rotatePiece(axis) {
    let rotated = currentPiece.blocks.map(b => {
        let [x, y, z] = b;
        switch(axis) {
            case 'X': return [x, -z, y];  // 繞 X 軸旋轉
            case 'Y': return [z, y, -x];  // 繞 Y 軸旋轉
            case 'Z': return [-y, x, z];  // 繞 Z 軸旋轉
        }
    });

    // 這裡後續會加入碰撞偵測 (Collision Detection)
    // 如果沒有碰撞，就把旋轉後的座標蓋過去
    currentPiece.blocks = rotated;
    updatePieceVisual(); // 更新 3D 畫面
}

// 4. 在 3D 場景中繪製/更新目前掉落的方塊
function updatePieceVisual() {
    if (currentPiece.meshGroup) scene.remove(currentPiece.meshGroup);

    currentPiece.meshGroup = new THREE.Group();
    const material = new THREE.MeshLambertMaterial({ color: currentPiece.color });
    const geometry = new THREE.BoxGeometry(0.95, 0.95, 0.95); // 微縮小留點邊界線

    // 將方塊網格置中偏移量
    const offsetX = gridX / 2 - 0.5;
    const offsetY = gridY / 2 - 0.5;

    currentPiece.blocks.forEach(b => {
        const mesh = new THREE.Mesh(geometry, material);
        // 計算在 3D 空間中的絕對位置
        mesh.position.set(
            currentPiece.position.x + b[0] - offsetX,
            currentPiece.position.z + b[2], // Z軸在Three.js通常是高度，我們這裡把陣列的Z對應到Three.js的Y
            currentPiece.position.y + b[1] - offsetY
        );
        currentPiece.meshGroup.add(mesh);
    });

    scene.add(currentPiece.meshGroup);
}

// 測試用：隨機生成一個新方塊
function spawnPiece() {
    const keys = Object.keys(TETROMINOES);
    const randKey = keys[Math.floor(Math.random() * keys.length)];
    const typeData = TETROMINOES[randKey];

    currentPiece.type = randKey;
    currentPiece.blocks = JSON.parse(JSON.stringify(typeData.blocks)); // 深拷貝
    currentPiece.color = typeData.color;
    
    // 從最頂部中央生成
    currentPiece.position = {
        x: Math.floor(gridX / 2),
        y: Math.floor(gridY / 2),
        z: gridZ - 1
    };

    updatePieceVisual();
}

// 可以在 init3D 結尾呼叫 spawnPiece() 來測試顯示！

// 啟動 3D 舞台
init3D();
