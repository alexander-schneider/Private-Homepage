(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;

    const canvas = document.getElementById("tetris-doodle");
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    const SHAPES = {
        I: [[1, 1, 1, 1]],
        O: [[1, 1], [1, 1]],
        T: [[0, 1, 0], [1, 1, 1]],
        S: [[0, 1, 1], [1, 1, 0]],
        Z: [[1, 1, 0], [0, 1, 1]],
        J: [[1, 0, 0], [1, 1, 1]],
        L: [[0, 0, 1], [1, 1, 1]],
    };
    const KEYS = Object.keys(SHAPES);
    const MAX_PIECES = 1;
    const DROP_MS = 720;

    let COLS = 24;
    let ROWS = 16;
    let cell = 36;
    let originX = 0;
    let originY = 0;
    let board = emptyBoard();
    let pieces = [];
    let dropAcc = 0;
    let last = 0;
    let inkStack = "rgba(17, 17, 17, 0.035)";
    let inkActive = "rgba(17, 17, 17, 0.11)";
    let running = true;
    let softResetAt = 0;
    let viewW = 0;
    let viewH = 0;

    function emptyBoard() {
        return Array.from({ length: ROWS }, () => Array(COLS).fill(0));
    }

    function hash(n) {
        const x = Math.sin(n * 127.1) * 43758.5453;
        return x - Math.floor(x);
    }

    function jitter(seed, i) {
        return (hash(seed * 17 + i) - 0.5) * 1.5;
    }

    function isDark() {
        const theme = document.documentElement.dataset.theme;
        if (theme === "dark") return true;
        if (theme === "light") return false;
        return window.matchMedia("(prefers-color-scheme: dark)").matches;
    }

    function refreshInk() {
        if (isDark()) {
            inkStack = "rgba(242, 242, 242, 0.045)";
            inkActive = "rgba(242, 242, 242, 0.14)";
        } else {
            inkStack = "rgba(17, 17, 17, 0.04)";
            inkActive = "rgba(17, 17, 17, 0.12)";
        }
    }

    function resize() {
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        viewW = window.innerWidth;
        viewH = window.innerHeight;
        canvas.width = Math.floor(viewW * dpr);
        canvas.height = Math.floor(viewH * dpr);
        canvas.style.width = `${viewW}px`;
        canvas.style.height = `${viewH}px`;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        cell = Math.max(26, Math.min(40, Math.round(viewW / 36)));
        COLS = Math.max(12, Math.ceil(viewW / cell));
        ROWS = Math.max(14, Math.ceil(viewH / cell));
        // Flush to the bottom edge — gravity reads correctly
        originX = (viewW - COLS * cell) / 2;
        originY = viewH - ROWS * cell;

        board = emptyBoard();
        pieces = [];
        softResetAt = 0;
        seedQuietStack();
        while (pieces.length < MAX_PIECES) spawn();
        refreshInk();
    }

    function rotate(matrix) {
        const rows = matrix.length;
        const cols = matrix[0].length;
        const next = Array.from({ length: cols }, () => Array(rows).fill(0));
        for (let y = 0; y < rows; y++) {
            for (let x = 0; x < cols; x++) {
                next[x][rows - 1 - y] = matrix[y][x];
            }
        }
        return next;
    }

    function collide(mat, px, py) {
        for (let y = 0; y < mat.length; y++) {
            for (let x = 0; x < mat[y].length; x++) {
                if (!mat[y][x]) continue;
                const nx = px + x;
                const ny = py + y;
                if (nx < 0 || nx >= COLS || ny >= ROWS) return true;
                if (ny >= 0 && board[ny][nx]) return true;
            }
        }
        return false;
    }

    function seedQuietStack() {
        // A few grounded rows with a jagged skyline — looks like mid-game Tetris
        const heights = [];
        let h = 2 + ((hash(11) * 2) | 0); // 2–3
        for (let x = 0; x < COLS; x++) {
            const step = hash(x * 17 + 5);
            if (step < 0.28) h = Math.max(2, h - 1);
            else if (step > 0.72) h = Math.min(4, h + 1);
            heights[x] = h;
        }

        // Occasional wells / peaks so it reads as real play residue
        for (let i = 0; i < Math.max(2, COLS / 8); i++) {
            const x = (hash(i * 41 + 9) * COLS) | 0;
            heights[x] = Math.max(1, heights[x] - 1);
            if (x + 1 < COLS) heights[x + 1] = Math.min(4, heights[x + 1] + 1);
        }

        for (let x = 0; x < COLS; x++) {
            for (let k = 0; k < heights[x]; k++) {
                const y = ROWS - 1 - k;
                // Sparse holes so lines don't auto-clear immediately
                if (k === 1 && hash(x * 23 + k * 7) < 0.12) continue;
                board[y][x] = ((x + 1) * 37 + k * 11) || 1;
            }
        }
    }

    function spawn() {
        const key = KEYS[(Math.random() * KEYS.length) | 0];
        let matrix = SHAPES[key].map((row) => row.slice());
        const turns = (Math.random() * 4) | 0;
        for (let i = 0; i < turns; i++) matrix = rotate(matrix);

        const x = Math.max(0, ((COLS - matrix[0].length) / 2) | 0);
        const y = -matrix.length;
        if (collide(matrix, x, 0)) {
            board = emptyBoard();
            seedQuietStack();
        }
        pieces.push({ matrix, x, y, seed: (Math.random() * 10000) | 0, key });
    }

    function merge(piece) {
        const { matrix, x, y, seed } = piece;
        for (let py = 0; py < matrix.length; py++) {
            for (let px = 0; px < matrix[py].length; px++) {
                if (!matrix[py][px]) continue;
                const by = y + py;
                const bx = x + px;
                if (by >= 0 && by < ROWS && bx >= 0 && bx < COLS) {
                    board[by][bx] = seed + px * 3 + py * 7 || 1;
                }
            }
        }
        clearLines();
    }

    function clearLines() {
        let cleared = 0;
        for (let y = ROWS - 1; y >= 0; y--) {
            if (board[y].every(Boolean)) {
                board.splice(y, 1);
                board.unshift(Array(COLS).fill(0));
                cleared += 1;
                y += 1;
            }
        }
        const filled = board.flat().filter(Boolean).length;
        // Soft reset once the stack climbs — reseed a low floor again
        if (filled > COLS * 6) softResetAt = performance.now() + 1800;
    }

    function sketchCell(x, y, seed) {
        const s = cell * 0.72;
        const ox = x + (cell - s) / 2;
        const oy = y + (cell - s) / 2;
        const pts = [
            [ox + jitter(seed, 1), oy + jitter(seed, 2)],
            [ox + s + jitter(seed, 3), oy + jitter(seed, 4)],
            [ox + s + jitter(seed, 5), oy + s + jitter(seed, 6)],
            [ox + jitter(seed, 7), oy + s + jitter(seed, 8)],
        ];

        ctx.beginPath();
        ctx.moveTo(pts[0][0], pts[0][1]);
        for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
        ctx.closePath();
        ctx.stroke();
    }

    function draw() {
        ctx.clearRect(0, 0, viewW || window.innerWidth, viewH || window.innerHeight);
        ctx.lineJoin = "round";
        ctx.lineCap = "round";

        ctx.strokeStyle = inkStack;
        ctx.lineWidth = 1.05;
        for (let y = 0; y < ROWS; y++) {
            for (let x = 0; x < COLS; x++) {
                if (!board[y][x]) continue;
                sketchCell(originX + x * cell, originY + y * cell, board[y][x]);
            }
        }

        // Active pieces read clearer so motion from the top is visible
        ctx.strokeStyle = inkActive;
        ctx.lineWidth = 1.25;
        for (const piece of pieces) {
            const { matrix, x, y, seed } = piece;
            for (let py = 0; py < matrix.length; py++) {
                for (let px = 0; px < matrix[py].length; px++) {
                    if (!matrix[py][px]) continue;
                    const by = y + py;
                    const cy = originY + by * cell;
                    if (cy + cell < 0 || cy > viewH) continue;
                    sketchCell(originX + (x + px) * cell, cy, seed + px + py);
                }
            }
        }
    }

    function tick(ts) {
        if (!running) return;
        if (!last) last = ts;
        const dt = ts - last;
        last = ts;

        if (softResetAt && ts >= softResetAt) {
            board = emptyBoard();
            seedQuietStack();
            softResetAt = 0;
            pieces = [];
            while (pieces.length < MAX_PIECES) spawn();
        }

        dropAcc += dt;
        while (dropAcc >= DROP_MS) {
            dropAcc -= DROP_MS;
            while (pieces.length < MAX_PIECES) spawn();

            const next = [];
            for (const piece of pieces) {
                if (!collide(piece.matrix, piece.x, piece.y + 1)) {
                    piece.y += 1;
                    next.push(piece);
                } else {
                    merge(piece);
                }
            }
            pieces = next;
            while (pieces.length < MAX_PIECES) spawn();
        }

        draw();
        requestAnimationFrame(tick);
    }

    function onVisibility() {
        running = document.visibilityState === "visible";
        if (running) {
            last = 0;
            requestAnimationFrame(tick);
        }
    }

    resize();
    draw();
    requestAnimationFrame(tick);

    window.addEventListener("resize", () => {
        resize();
        draw();
    }, { passive: true });
    window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => {
        refreshInk();
        draw();
    });
    document.addEventListener("themechange", () => {
        refreshInk();
        draw();
    });
    document.addEventListener("visibilitychange", onVisibility);
})();
