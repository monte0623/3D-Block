document.addEventListener('DOMContentLoaded', () => {
    console.log("控制系統已啟動，正在綁定鍵盤與觸控事件...");

    // ==========================================
    // 1. 電腦鍵盤事件監聽
    // ==========================================
    window.addEventListener('keydown', (event) => {
        // 防止網頁因為按下方向鍵或空白鍵而上下滾動
        if (['SPACE', 'ARROWUP', 'ARROWDOWN', 'ARROWLEFT', 'ARROWRIGHT'].includes(event.key.toUpperCase())) {
            event.preventDefault();
        }

        const key = event.key.toUpperCase();
        
        // 檢查 game.js 的函式是否存在
        if (typeof window.rotatePiece !== 'function' || typeof window.movePiece !== 'function') {
            console.error("錯誤：找不到 game.js 的控制函式！");
            return;
        }

        switch (key) {
            // --- 左手：翻轉方塊 ---
            case 'W': rotatePiece('X'); break;
            case 'S': rotatePiece('X'); break; // 繞X軸旋轉
            case 'A': rotatePiece('Y'); break;
            case 'D': rotatePiece('Y'); break; // 繞Y軸旋轉
            case 'Q': rotatePiece('Z'); break;
            case 'E': rotatePiece('Z'); break; // 繞Z軸旋轉

            // --- 右手：移動方塊 (支援標準鍵盤數字與九宮格數字鍵) ---
            case '8': case 'ARROWUP':    // 前 (Y軸負向)
                movePiece(0, -1, 0); break;
            case '2': case 'ARROWDOWN':  // 後 (Y軸正向)
                movePiece(0, 1, 0); break;
            case '4': case 'ARROWLEFT':  // 左 (X軸負向)
                movePiece(-1, 0, 0); break;
            case '6': case 'ARROWRIGHT': // 右 (X軸正向)
                movePiece(1, 0, 0); break;
            case '0': case ' ':          // 快速下落 (0 或 空白鍵，Z軸向下)
                movePiece(0, 0, -1); break;
        }
    });

    // ==========================================
    // 2. 行動裝置：手機/平板虛擬按鈕點擊事件 (防錯綁定)
    // ==========================================
    const bindBtn = (id, callback) => {
        const btn = document.getElementById(id);
        if (btn) {
            btn.addEventListener('click', callback);
        } else {
            console.warn(`警告：找不到按鈕元件 #${id}`);
        }
    };

    // 左側翻轉
    bindBtn('btn-rot-x', () => window.rotatePiece('X'));
    bindBtn('btn-rot-y', () => window.rotatePiece('Y'));
    bindBtn('btn-rot-z', () => window.rotatePiece('Z'));

    // 右側移動
    bindBtn('btn-move-fwd', () => window.movePiece(0, -1, 0));
    bindBtn('btn-move-back', () => window.movePiece(0, 1, 0));
    bindBtn('btn-move-left', () => window.movePiece(-1, 0, 0));
    bindBtn('btn-move-right', () => window.movePiece(1, 0, 0));
    bindBtn('btn-drop', () => window.movePiece(0, 0, -1));
});
