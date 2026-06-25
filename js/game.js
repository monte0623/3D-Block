// ==========================================
// 1. 全域變數與遊戲狀態
// ==========================================
let currentLevel = 1;
let gridX = 5; 
let gridY = 5;
const gridZ = 10; // 固定 10 層

let scene, camera, renderer, gridHelper;
let heightMarkers = []; // 儲存高度標記物件，以便動態改變顏色

// 3D 方塊庫定義 (每種都有獨特顏色)
const TETROMINOES = {
    I: { blocks: [[0,0,0], [1,0,0], [-1,0,0], [2,0,0]], color: 0x00f0f0 },       // 青色
    O: { blocks: [[0,0,0], [1,0,0], [0,1,0], [1,1,0], [0,0,1], [1,0,1], [0,1,1], [1,1,1]], color: 0xf0f000 }, // 黃色
    T: { blocks: [[0,0,0], [-1,0,0], [1,0,0], [0,1,0]], color: 0xa000f0 },       // 紫色
    L3: { blocks: [[0,0,0], [1,0,0], [0,1,0]], color: 0xffaa00 },                // 橘色
    CORNER: { blocks: [[0,0,0], [1,0,0], [0,1,0], [0,0,1]], color: 0x3333ff },    // 藍色
    CROSS: { blocks: [[0,0,0], [1,0,0], [-1,0,0], [0,1,0], [0,-1,0], [0,0,1], [0,0,-1]], color: 0xff00ff }, // 桃紅
    Z3D: { blocks: [[0,0,0], [1,0,0], [0,1,0], [-1,1,0], [0,0,1], [1,0,1]], color: 0x00f000 }, // 綠色
    L5: { blocks: [[0,0,0], [-1,0,0], [1,0,0], [2,0,0], [2,1,0]], color: 0xff5555 } // 紅色
};

let currentPiece = {
    type: 'I', blocks: [], position: {x: 0, y: 0, z: 9}, color: 0xffffff, meshGroup: null
};

// ==========================================
// 2. 初始化 3D 場景
// ==========================================
function init3D() {
    const container = document.getElementById('canvas-wrapper');
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x141414); // 微調深色背景

    const aspect = window.innerWidth / window.innerHeight;
    const d = 12; // 放大一點視角範圍，確保看得到完整的10層
    camera = new THREE.OrthographicCamera(-d * aspect, d * aspect, d, -d, 1, 1000);
    
    // 調整相機位置，讓 10 層高度有更立體的透視感
    camera.position.set(25, 22, 25); 
    camera.lookAt(0, 4, 0);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    container.appendChild(renderer.domElement);

    // 光源設定
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.5);
    dirLight.position.set(10, 25, 15);
    scene.add(dirLight);

    buildGrid();
    spawnPiece(); 
    animate();
}

// 繪製網格與 10 層高度標記
function buildGrid() {
    if (gridHelper) scene.remove(gridHelper);
    gridHelper = new THREE.Group();
    
    const material = new THREE.LineBasicMaterial({ color: 0x444444 });
    const offsetX = gridX / 2;
    const offsetY = gridY / 2;

    // 1. 繪製地面網格
    for (let i = 0; i <= gridX; i++) {
        const points = [new THREE.Vector3(i - offsetX, 0, -offsetY), new THREE.Vector3(i - offsetX, 0, gridY - offsetY)];
        gridHelper.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), material));
    }
    for (let j = 0; j <= gridY; j++) {
        const points = [new THREE.Vector3(-offsetX, 0, j - offsetY), new THREE.Vector3(gridX - offsetX, 0, j - offsetY)];
        gridHelper.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), material));
    }

    // 2. 繪製 4 根角落支柱
    const columnMat = new THREE.LineBasicMaterial({ color: 0x6633cc });
    const corners = [[-offsetX, -offsetY], [offsetX, -offsetY], [-offsetX, offsetY], [offsetX, offsetY]];
    corners.forEach(c => {
        const points = [new THREE.Vector3(c[0], 0, c[1]), new THREE.Vector3(c[0], gridZ, c[1])];
        gridHelper.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), columnMat));
    });

    // 3. 建立 10 層的高度標記線與動態背牆刻度
    heightMarkers = [];
    const markerMat = new THREE.LineDashedMaterial({ color: 0x333333, dashSize: 0.2, gapSize: 0.2 });
    
    for (let h = 1; h <= gridZ; h++) {
        // 在後方兩根柱子之間連一條水平線作為高度參考
        const points = [
            new THREE.Vector3(-offsetX, h, -offsetY), // 左後角落
            new THREE.Vector3(offsetX, h, -offsetY)   // 右後角落
        ];
        const lineGeo = new THREE.BufferGeometry().setFromPoints(points);
        const line = new THREE.Line(lineGeo, markerMat);
        line.computeLineDistances(); // 虛線必備
        gridHelper.add(line);

        // 建立後方高度的「動態指示燈方塊」 (做在後方邊界上)
        const indicatorGeo = new THREE.BoxGeometry(gridX, 0.1, 0.1);
        const indicatorMat = new THREE.MeshBasicMaterial({ color: 0x333333, transparent: true, opacity: 0.5 });
        const indicator = new THREE.Mesh(indicatorGeo, indicatorMat);
        indicator.position.set(0, h - 0.5, -offsetY); // 放在每一層的中間高度
        gridHelper.add(indicator);
        
        // 將指示燈存入陣列，以便隨時根據方塊高度改變顏色
        heightMarkers.push(indicator);
    }

    scene.add(gridHelper);
}

// ==========================================
// 3. 方塊動作與動態高度追蹤
// ==========================================
function spawnPiece() {
    const keys = Object.keys(TETROMINOES);
    const randKey = keys[Math.floor(Math.random() * keys.length)];
    const typeData = TETROMINOES[randKey];

    currentPiece.type = randKey;
    currentPiece.blocks = JSON.parse(JSON.stringify(typeData.blocks));
    currentPiece.color = typeData.color;
    // 從第 10 層 (索引 9) 最上方中央生成
    currentPiece.position = { x: Math.floor(gridX / 2), y: Math.floor(gridY / 2), z: gridZ - 1 };

    updatePieceVisual();
}

function movePiece(dx, dy, dz) {
    // 限制範圍不超出邊界
    let newX = currentPiece.position.x + dx;
    let newY = currentPiece.position.y + dy;
    let newZ = currentPiece.position.z + dz;

    if (newX >= 0 && newX < gridX && newY >= 0 && newY < gridY && newZ >= 0 && newZ < gridZ) {
        currentPiece.position.x = newX;
        currentPiece.position.y = newY;
        currentPiece.position.z = newZ;
        updatePieceVisual();
    }
}

function rotatePiece(axis) {
    let rotated = currentPiece.blocks.map(b => {
        let [x, y, z] = b;
        switch(axis) {
            case 'X': return [x, -z, y];
            case 'Y': return [z, y, -x];
            case 'Z': return [-y, x, z];
        }
    });
    currentPiece.blocks = rotated;
    updatePieceVisual();
}

function updatePieceVisual() {
    if (currentPiece.meshGroup) scene.remove(currentPiece.meshGroup);
    currentPiece.meshGroup = new THREE.Group();
    
    // 使用方塊自帶的繽紛顏色
    const material = new THREE.MeshLambertMaterial({ color: currentPiece.color });
    const geometry = new THREE.BoxGeometry(0.95, 0.95, 0.95);
    const offsetX = gridX / 2 - 0.5;
    const offsetY = gridY / 2 - 0.5;

    currentPiece.blocks.forEach(b => {
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(
            currentPiece.position.x + b[0] - offsetX,
            currentPiece.position.z + b[2] + 0.5, // 修正高度對齊
            currentPiece.position.y + b[1] - offsetY
        );
        currentPiece.meshGroup.add(mesh);
    });
    scene.add(currentPiece.meshGroup);

    // 【核心新功能】更新後方牆面的高度動態標記
    updateHeightIndicator();
}

// 根據方塊目前所在的 Z 軸高度，讓後方對應層數的標記亮起
function updateHeightIndicator() {
    const currentZ = currentPiece.position.z; // 0 ~ 9 

    heightMarkers.forEach((marker, index) => {
        if (index === currentZ) {
            // 方塊所在的那一層：高度標記變成該方塊的顏色，並且發亮
            marker.material.color.setHex(currentPiece.color);
            marker.material.opacity = 1.0;
        } else {
            // 其他層數：保持暗灰色
            marker.material.color.setHex(0x333333);
            marker.material.opacity = 0.4;
        }
    });
}

function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
}

window.addEventListener('resize', () => {
    if (!camera || !renderer) return;
    const aspect = window.innerWidth / window.innerHeight;
    const d = 12;
    camera.left = -d * aspect; camera.right = d * aspect; camera.top = d; camera.bottom = -d;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// 啟動
init3D();
