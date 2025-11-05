/**
 * Основной класс шахматной игры
 */
class ChessGame {
    /**
     * Инициализация шахматной игры
     */
    constructor() {
        this.board = this.createEmptyBoard();
        this.currentPlayer = 0;
        this.selectedPiece = null;
        this.validMoves = [];
        this.moveHistory = [];
        this.capturedPieces = {0: [], 1: []};
        this.gameOver = false;
        this.check = false;
        this.enPassant = null;
        this.promotionPending = null;
        this.boardFlipped = false;
        this.fogOfWar = true;
        this.visibleCells = new Set();
        
        // Загрузка изображений
        this.imagesLoaded = false;
        this.pieceImages = {};
        this.fogImage = null;
        
        // Таймеры (10 минут в секундах)
        this.timers = {
            0: 600, // Белые: 10 минут
            1: 600  // Черные: 10 минут
        };
        this.timerInterval = null;
        this.currentTimer = null;
        
        this.initializeBoard();
        this.updateVisibleCells();
        
        // Загружаем изображения и только потом инициализируем игру
        this.loadAllImages().then(() => {
            this.imagesLoaded = true;
            this.startTimer();
            this.drawBoard();
            this.updateGameInfo();
        });
    }
    
    /**
     * Загрузка всех изображений с ожиданием завершения
     */
    async loadAllImages() {
        await this.loadPieceImages();
        await this.loadFogImage();
    }
    
    /**
     * Загрузка изображений фигур с ожиданием завершения
     */
    loadPieceImages() {
        return new Promise((resolve) => {
            const pieces = ['P', 'N', 'B', 'R', 'Q', 'K'];
            const colors = ['white', 'black'];
            let imagesToLoad = pieces.length * colors.length;
            let imagesLoaded = 0;
            
            const checkAllLoaded = () => {
                imagesLoaded++;
                if (imagesLoaded === imagesToLoad) {
                    resolve();
                }
            };
            
            pieces.forEach(piece => {
                colors.forEach(color => {
                    const img = new Image();
                    img.onload = checkAllLoaded;
                    img.onerror = () => {
                        console.warn(`Не удалось загрузить изображение: images/${color === 'white' ? '0' : '1'}${piece}.png`);
                        checkAllLoaded();
                    };
                    // Используем ваши файлы с изображениями
                    img.src = `images/${color === 'white' ? '0' : '1'}${piece}.png`;
                    this.pieceImages[`${color}_${piece}`] = img;
                });
            });
            
            // Если нет изображений для загрузки, сразу резолвим
            if (imagesToLoad === 0) {
                resolve();
            }
        });
    }
    
    /**
     * Загрузка изображения тумана войны с ожиданием завершения
     */
    loadFogImage() {
        return new Promise((resolve) => {
            this.fogImage = new Image();
            this.fogImage.onload = resolve;
            this.fogImage.onerror = () => {
                console.warn('Не удалось загрузить изображение тумана: images/fog.png');
                this.fogImage = null;
                resolve();
            };
            this.fogImage.src = 'images/fog.png';
        });
    }
    
    /**
     * Создать пустую шахматную доску
     */
    createEmptyBoard() {
        return Array(8).fill().map(() => Array(8).fill(null));
    }
    
    /**
     * Начальная расстановка фигур на доске
     */
    initializeBoard() {
        // Пешки
        for (let i = 0; i < 8; i++) {
            this.board[1][i] = new Pawn(1);
            this.board[6][i] = new Pawn(0);
        }

        // Остальные фигуры
        const backRowOrder = [Rook, Knight, Bishop, Queen, King, Bishop, Knight, Rook];

        // Черные фигуры
        for (let i = 0; i < 8; i++) {
            this.board[0][i] = new backRowOrder[i](1);
        }

        // Белые фигуры
        for (let i = 0; i < 8; i++) {
            this.board[7][i] = new backRowOrder[i](0);
        }
    }

    /**
     * Запуск таймера для текущего игрока
     */
    startTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
        }
        
        this.currentTimer = this.currentPlayer;
        this.timerInterval = setInterval(() => {
            if (!this.gameOver && this.timers[this.currentTimer] > 0) {
                this.timers[this.currentTimer]--;
                this.updateTimersDisplay();
                
                // Проверка на окончание времени
                if (this.timers[this.currentTimer] <= 0) {
                    this.gameOver = true;
                    clearInterval(this.timerInterval);
                    this.updateGameInfo();
                }
            }
        }, 1000);
        
        this.updateTimersDisplay();
    }

    /**
     * Обновление отображения таймеров
     */
    updateTimersDisplay() {
        const whiteTimer = document.getElementById('white-timer');
        const blackTimer = document.getElementById('black-timer');
        
        if (whiteTimer && blackTimer) {
            // Обновляем время
            whiteTimer.textContent = this.formatTime(this.timers[0]);
            blackTimer.textContent = this.formatTime(this.timers[1]);
            
            // Сбрасываем стили
            whiteTimer.className = 'timer';
            blackTimer.className = 'timer';
            
            // Подсвечиваем активный таймер
            if (this.currentTimer === 0) {
                whiteTimer.classList.add('active');
            } else {
                blackTimer.classList.add('active');
            }
            
            // Предупреждения при малом времени
            if (this.timers[0] <= 30 && this.timers[0] > 0) {
                whiteTimer.classList.add('warning');
            }
            if (this.timers[1] <= 30 && this.timers[1] > 0) {
                blackTimer.classList.add('warning');
            }
            if (this.timers[0] <= 10 && this.timers[0] > 0) {
                whiteTimer.classList.add('danger');
            }
            if (this.timers[1] <= 10 && this.timers[1] > 0) {
                blackTimer.classList.add('danger');
            }
        }
    }

    /**
     * Форматирование времени в мм:сс
     */
    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    /**
     * Обновить множество видимых клеток для тумана войны
     */
    updateVisibleCells() {
        this.visibleCells.clear();
        
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = this.board[row][col];
                if (piece && piece.color === this.currentPlayer) {
                    this.visibleCells.add(`${row}-${col}`);
                    
                    const moves = piece.getValidMoves(this.board, col, row, this.enPassant);
                    moves.forEach(move => {
                        this.visibleCells.add(`${move.y}-${move.x}`);
                    });
                }
            }
        }
    }

    /**
     * Сохранить состояние игры
     */
    saveGame() {
        const gameState = {
            board: this.serializeBoard(),
            currentPlayer: this.currentPlayer,
            moveHistory: this.moveHistory,
            capturedPieces: this.capturedPieces,
            timers: this.timers,
            gameOver: this.gameOver,
            check: this.check,
            enPassant: this.enPassant,
            boardFlipped: this.boardFlipped,
            fogOfWar: this.fogOfWar
        };

        // Сохраняем в localStorage
        localStorage.setItem('chessGameSave', JSON.stringify(gameState));
        
        // Отправляем на сервер через AJAX
        this.saveToServer(gameState);
        
        alert('Игра сохранена!');
    }

    /**
     * Сериализация доски для сохранения
     */
    serializeBoard() {
        const serialized = [];
        for (let row = 0; row < 8; row++) {
            const rowData = [];
            for (let col = 0; col < 8; col++) {
                const piece = this.board[row][col];
                if (piece) {
                    rowData.push({
                        type: piece.constructor.name,
                        color: piece.color,
                        hasMoved: piece.hasMoved,
                        symbol: piece.symbol
                    });
                } else {
                    rowData.push(null);
                }
            }
            serialized.push(rowData);
        }
        return serialized;
    }

    /**
     * Десериализация доски из сохранения
     */
    deserializeBoard(serialized) {
        const board = this.createEmptyBoard();
        const pieceClasses = {
            'Pawn': Pawn, 'Knight': Knight, 'Bishop': Bishop,
            'Rook': Rook, 'Queen': Queen, 'King': King
        };

        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const pieceData = serialized[row][col];
                if (pieceData) {
                    const PieceClass = pieceClasses[pieceData.type];
                    if (PieceClass) {
                        const piece = new PieceClass(pieceData.color);
                        piece.hasMoved = pieceData.hasMoved;
                        board[row][col] = piece;
                    }
                }
            }
        }
        return board;
    }

    /**
     * Сохранение на сервер через AJAX
     */
    async saveToServer(gameState) {
        try {
            const response = await fetch('savegame.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'save',
                    gameState: gameState
                })
            });
            
            const result = await response.json();
            if (result.success) {
                console.log('Game saved to server');
            }
        } catch (error) {
            console.error('Error saving to server:', error);
        }
    }

    /**
     * Загрузить состояние игры
     */
    loadGame() {
        // Пытаемся загрузить из localStorage
        const saved = localStorage.getItem('chessGameSave');
        if (saved) {
            try {
                const gameState = JSON.parse(saved);
                this.loadFromState(gameState);
                alert('Игра загружена из локального сохранения!');
                return;
            } catch (error) {
                console.error('Error loading from localStorage:', error);
            }
        }
        
        // Если нет локального сохранения, пробуем загрузить с сервера
        this.loadFromServer();
    }

    /**
     * Загрузить состояние из объекта
     */
    loadFromState(gameState) {
        this.board = this.deserializeBoard(gameState.board);
        this.currentPlayer = gameState.currentPlayer;
        this.moveHistory = gameState.moveHistory || [];
        this.capturedPieces = gameState.capturedPieces || {0: [], 1: []};
        this.timers = gameState.timers || {0: 600, 1: 600};
        this.gameOver = gameState.gameOver || false;
        this.check = gameState.check || false;
        this.enPassant = gameState.enPassant || null;
        this.boardFlipped = gameState.boardFlipped || false;
        this.fogOfWar = gameState.fogOfWar !== undefined ? gameState.fogOfWar : true;
        
        this.selectedPiece = null;
        this.validMoves = [];
        this.promotionPending = null;
        
        this.updateVisibleCells();
        this.startTimer();
        this.drawBoard();
        this.updateGameInfo();
    }

    /**
     * Загрузка с сервера через AJAX
     */
    async loadFromServer() {
        try {
            const response = await fetch('savegame.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'load'
                })
            });
            
            const result = await response.json();
            if (result.success && result.gameState) {
                this.loadFromState(result.gameState);
                alert('Игра загружена с сервера!');
            } else {
                alert('Нет сохраненной игры на сервере');
            }
        } catch (error) {
            console.error('Error loading from server:', error);
            alert('Ошибка загрузки с сервера');
        }
    }

    /**
     * Очистить сохраненную игру
     */
    clearSavedGame() {
        localStorage.removeItem('chessGameSave');
        
        // Также очищаем на сервере
        fetch('savegame.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                action: 'clear'
            })
        });
    }

    /**
     * Проверить, видна ли клетка текущему игроку
     */
    isCellVisible(row, col) {
        return this.visibleCells.has(`${row}-${col}`);
    }
    
    /**
     * Отрисовка шахматной доски и фигур
     */
    drawBoard() {
        const canvas = document.getElementById('chess-board');
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        const squareSize = 80;
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const displayRow = this.boardFlipped ? 7 - row : row;
                const displayCol = this.boardFlipped ? 7 - col : col;
                
                const x = col * squareSize;
                const y = row * squareSize;
                
                const isVisible = !this.fogOfWar || this.isCellVisible(displayRow, displayCol);
                
                if (isVisible) {
                    ctx.fillStyle = (displayRow + displayCol) % 2 === 0 ? '#f0d9b5' : '#b58863';
                    ctx.fillRect(x, y, squareSize, squareSize);
                } else {
                    // Темные клетки для невидимых областей
                    ctx.fillStyle = '#2c3e50';
                    ctx.fillRect(x, y, squareSize, squareSize);
                }
                
                if (isVisible) {
                    if (row === 7) {
                        ctx.fillStyle = displayCol % 2 === 0 ? '#b58863' : '#f0d9b5';
                        ctx.font = '14px Times New Roman';
                        ctx.fillText(String.fromCharCode(97 + displayCol), x + 5, y + squareSize - 5);
                    }
                    if (col === 0) {
                        ctx.fillStyle = displayRow % 2 === 0 ? '#b58863' : '#f0d9b5';
                        ctx.font = '14px Times New Roman';
                        ctx.fillText((8 - displayRow).toString(), x + 5, y + 15);
                    }
                }
                
                const piece = this.board[displayRow][displayCol];
                if (piece && isVisible) {
                    this.drawPieceImage(ctx, piece, x, y, squareSize);
                }
            }
        }
        
        if (this.selectedPiece) {
            let {x: selX, y: selY} = this.selectedPiece;
            if (this.boardFlipped) {
                selX = 7 - selX;
                selY = 7 - selY;
            }
            
            ctx.strokeStyle = '#ffeb3b';
            ctx.lineWidth = 4;
            ctx.strokeRect(selX * squareSize, selY * squareSize, squareSize, squareSize);
            
            ctx.fillStyle = 'rgba(76, 175, 80, 0.5)';
            this.validMoves.forEach(move => {
                let displayX = move.x;
                let displayY = move.y;
                if (this.boardFlipped) {
                    displayX = 7 - displayX;
                    displayY = 7 - displayY;
                }
                ctx.fillRect(displayX * squareSize, displayY * squareSize, squareSize, squareSize);
            });
        }

        if (this.check && !this.gameOver) {
            const kingPos = this.findKing(this.currentPlayer);
            if (kingPos) {
                let {x: kingX, y: kingY} = kingPos;
                if (this.boardFlipped) {
                    kingX = 7 - kingX;
                    kingY = 7 - kingY;
                }
                ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
                ctx.fillRect(kingX * squareSize, kingY * squareSize, squareSize, squareSize);
            }
        }

        if (this.fogOfWar) {
            this.drawFogOfWar(ctx, squareSize);
        }

        // Отрисовка меню превращения пешки
        if (this.promotionPending) {
            this.drawPromotionMenu(ctx, squareSize);
        }
    }

    /**
     * Отрисовка изображения фигуры
     */
    drawPieceImage(ctx, piece, x, y, squareSize) {
        const color = piece.color === 0 ? 'white' : 'black';
        const imageKey = `${color}_${piece.symbol}`;
        const img = this.pieceImages[imageKey];
        
        // Используем изображение только если оно загружено
        if (img && img.complete && img.naturalWidth > 0) {
            // Рисуем изображение с небольшим отступом
            const padding = 5;
            ctx.drawImage(img, x + padding, y + padding, squareSize - padding * 2, squareSize - padding * 2);
        } else {
            // Fallback на символы, если изображение не загружено
            this.drawPieceSymbol(ctx, piece, x, y, squareSize);
        }
    }

    /**
     * Отрисовка символа фигуры (fallback)
     */
    drawPieceSymbol(ctx, piece, x, y, squareSize) {
        ctx.fillStyle = piece.color === 0 ? '#ffffff' : '#000000';
        ctx.strokeStyle = piece.color === 0 ? '#000000' : '#ffffff';
        ctx.lineWidth = 2;
        ctx.font = 'bold 48px Times New Roman';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const symbol = this.getPieceSymbol(piece);
        ctx.strokeText(symbol, x + squareSize / 2, y + squareSize / 2);
        ctx.fillText(symbol, x + squareSize / 2, y + squareSize / 2);
    }

    /**
     * Отрисовка меню превращения пешки
     */
    drawPromotionMenu(ctx, squareSize) {
        const {x, y} = this.promotionPending;
        const displayX = this.boardFlipped ? 7 - x : x;
        const displayY = this.boardFlipped ? 7 - y : y;
        
        const menuX = displayX * squareSize;
        const menuY = displayY * squareSize;
        
        const isMenuDown = (this.currentPlayer === 1 && !this.boardFlipped) || 
                          (this.currentPlayer === 0 && this.boardFlipped);
        
        // Позиция меню
        const menuStartY = isMenuDown ? menuY - squareSize * 4 : menuY + squareSize;
        const menuHeight = squareSize * 4;
        
        // Фон меню
        ctx.fillStyle = this.currentPlayer === 1 ? 'rgba(255, 255, 255, 0.95)' : 'rgba(0, 0, 0, 0.95)';
        ctx.fillRect(menuX, menuStartY, squareSize, menuHeight);
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 2;
        ctx.strokeRect(menuX, menuStartY, squareSize, menuHeight);
        
        // Фигуры для выбора
        const pieces = [
            { type: 'Q', symbol: 'Q', name: 'Ферзь' },
            { type: 'R', symbol: 'R', name: 'Ладья' },
            { type: 'B', symbol: 'B', name: 'Слон' },
            { type: 'N', symbol: 'N', name: 'Конь' }
        ];
        
        pieces.forEach((piece, index) => {
            // Позиция фигуры в меню
            const pieceY = isMenuDown ? 
                menuStartY + index * squareSize : 
                menuStartY + (3 - index) * squareSize;
            
            // Подсветка при наведении
            const mouseX = this.promotionMouseX;
            const mouseY = this.promotionMouseY;
            if (mouseX && mouseY && 
                mouseX >= menuX && mouseX <= menuX + squareSize &&
                mouseY >= pieceY && mouseY <= pieceY + squareSize) {
                ctx.fillStyle = 'rgba(0, 123, 255, 0.2)';
                ctx.fillRect(menuX, pieceY, squareSize, squareSize);
            }
            
            // Рисуем фигуру в меню
            const color = this.currentPlayer === 0 ? 'white' : 'black';
            const imageKey = `${color}_${piece.symbol}`;
            const img = this.pieceImages[imageKey];
            
            if (img && img.complete && img.naturalWidth > 0) {
                const padding = 10;
                ctx.drawImage(img, menuX + padding, pieceY + padding, squareSize - padding * 2, squareSize - padding * 2);
            } else {
                // Fallback на символы
                this.drawPieceSymbol(ctx, {symbol: piece.symbol, color: this.currentPlayer}, menuX, pieceY, squareSize);
            }
            
            // Название фигуры
            ctx.fillStyle = this.currentPlayer === 1 ? '#000000' : '#FFFFFF';
            ctx.font = '12px Times New Roman';
            ctx.textAlign = 'center';
            // Позиция названия в зависимости от направления меню
            const nameY = isMenuDown ? 
                pieceY + squareSize - 8 : 
                pieceY + 10;
            ctx.fillText(piece.name, menuX + squareSize/2, nameY);
        });
    }

    /**
     * Обработка клика по меню превращения
     */
    handlePromotionClick(x, y) {
        if (!this.promotionPending) return false;

        const squareSize = 80;
        const {x: pawnX, y: pawnY} = this.promotionPending;
        const displayX = this.boardFlipped ? 7 - pawnX : pawnX;
        const displayY = this.boardFlipped ? 7 - pawnY : pawnY;
        
        const menuX = displayX * squareSize;
        const menuY = displayY * squareSize;
        
        // Определяем направление меню (такая же логика как в drawPromotionMenu)
        const isMenuDown = (this.currentPlayer === 1 && !this.boardFlipped) || 
                          (this.currentPlayer === 0 && this.boardFlipped);
        
        // Область меню
        const menuStartY = isMenuDown ? menuY - squareSize * 4 : menuY + squareSize;
        const menuEndY = isMenuDown ? menuY : menuY + squareSize * 5;

        // Проверяем, был ли клик в области меню
        if (x >= menuX && x <= menuX + squareSize && 
            y >= menuStartY && y <= menuEndY) {
            
            const pieces = ['Q', 'R', 'B', 'N'];
            
            // Вычисляем индекс выбранной фигуры
            let clickIndex;
            if (isMenuDown) {
                // Меню снизу - индекс увеличивается сверху вниз
                clickIndex = Math.floor((y - menuStartY) / squareSize);
            } else {
                // Меню сверху - индекс увеличивается снизу вверх
                clickIndex = 3 - Math.floor((y - menuStartY) / squareSize);
            }
            
            if (clickIndex >= 0 && clickIndex < pieces.length) {
                this.promotePawn(pieces[clickIndex]);
                return true;
            }
        }
        return false;
    }

    /**
     * Обновление позиции мыши для меню превращения
     */
    updatePromotionMouse(x, y) {
        this.promotionMouseX = x;
        this.promotionMouseY = y;
        if (this.promotionPending) {
            this.drawBoard();
        }
    }

    /**
     * Отрисовка тумана войны с использованием изображения
    */
    drawFogOfWar(ctx, squareSize) {
        // Рисуем изображение тумана для каждой невидимой клетки
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const displayRow = this.boardFlipped ? 7 - row : row;
                const displayCol = this.boardFlipped ? 7 - col : col;
                
                // Если клетка не видна рисуем на ней туман
                if (!this.isCellVisible(displayRow, displayCol)) {
                    const x = col * squareSize;
                    const y = row * squareSize;
                    
                    if (this.fogImage && this.fogImage.complete && this.fogImage.naturalWidth > 0) {
                        // Рисуем изображение тумана для этой клетки
                        ctx.drawImage(this.fogImage, x, y, squareSize, squareSize);
                    } else {
                        // Fallback - темная клетка
                        ctx.fillStyle = '#2c3e50';
                        ctx.fillRect(x, y, squareSize, squareSize);
                    }
                }
            }
        }
    }
    
    /**
     * Получить символ Unicode для отображения фигуры (fallback)
     */
    getPieceSymbol(piece) {
        const symbols = {
            'P': '♙', 'N': '♘', 'B': '♗', 'R': '♖', 'Q': '♕', 'K': '♔'
        };
        const blackSymbols = {
            'P': '♟', 'N': '♞', 'B': '♝', 'R': '♜', 'Q': '♛', 'K': '♚'
        };
        
        return piece.color === 0 ? symbols[piece.symbol] : blackSymbols[piece.symbol];
    }
    
    
    /**
     * Обработка клика мыши по шахматной доске
     */
    handleClick(x, y) {
        if (this.gameOver) return;

        // Сначала проверяем клик по меню превращения
        if (this.promotionPending) {
            if (this.handlePromotionClick(x, y)) {
                return;
            }
        }

        if (this.promotionPending) return;

        let col = Math.floor(x / 80);
        let row = Math.floor(y / 80);
        
        if (this.boardFlipped) {
            col = 7 - col;
            row = 7 - row;
        }

        if (!this.isValidPosition(col, row)) return;

        if (this.fogOfWar && !this.isCellVisible(row, col)) {
            return;
        }

        if (this.selectedPiece) {
            const move = this.validMoves.find(m => m.x === col && m.y === row);
            if (move) {
                this.makeMove(this.selectedPiece, move);
                this.selectedPiece = null;
                this.validMoves = [];
            } else {
                this.selectPiece(col, row);
            }
        } else {
            this.selectPiece(col, row);
        }
        
        this.drawBoard();
        this.updateGameInfo();
    }
    
    /**
     * Выбор фигуры на доске
     */
    selectPiece(x, y) {
        const piece = this.board[y][x];
        if (piece && piece.color === this.currentPlayer) {
            this.selectedPiece = {x, y};
            this.validMoves = this.getValidMovesForPiece(x, y);
        } else {
            this.selectedPiece = null;
            this.validMoves = [];
        }
    }

    /**
     * Получить допустимые ходы для фигуры с учетом шаха
     */
    getValidMovesForPiece(x, y) {
        const piece = this.board[y][x];
        if (!piece) return [];

        const moves = piece.getValidMoves(this.board, x, y, this.enPassant);
        return moves.filter(move => this.isMoveValid({x, y}, move));
    }

    /**
     * Проверить, является ли ход допустимым
     */
    isMoveValid(start, end) {
        const tempBoard = this.deepCopyBoard();
        const movingPiece = tempBoard[start.y][start.x];
        
        tempBoard[end.y][end.x] = movingPiece;
        tempBoard[start.y][start.x] = null;

        return !this.isInCheck(this.currentPlayer, tempBoard);
    }

    /**
     * Создать глубокую копию шахматной доски
     */
    deepCopyBoard() {
        const newBoard = this.createEmptyBoard();
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = this.board[row][col];
                if (piece) {
                    const pieceClass = piece.constructor;
                    const newPiece = new pieceClass(piece.color);
                    newPiece.hasMoved = piece.hasMoved;
                    newBoard[row][col] = newPiece;
                }
            }
        }
        return newBoard;
    }

    /**
     * Проверить, находится ли король под шахом
     */
    isInCheck(color, board = this.board) {
        const kingPos = this.findKing(color, board);
        if (!kingPos) return false;

        const opponentColor = 1 - color;
        
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = board[row][col];
                if (piece && piece.color === opponentColor) {
                    const moves = piece.getValidMoves(board, col, row, this.enPassant);
                    if (moves.some(move => move.x === kingPos.x && move.y === kingPos.y)) {
                        return true;
                    }
                }
            }
        }
        return false;
    }

    /**
     * Найти короля указанного цвета
     */
    findKing(color, board = this.board) {
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = board[row][col];
                if (piece instanceof King && piece.color === color) {
                    return {x: col, y: row};
                }
            }
        }
        return null;
    }
    
    /**
     * Выполнить ход на доске
     */
    makeMove(from, to) {
        const movingPiece = this.board[from.y][from.x];
        const targetPiece = this.board[to.y][to.x];
        
        const moveNotation = this.getMoveNotation(from, to, movingPiece, targetPiece);
        this.moveHistory.push(moveNotation);

        if (targetPiece) {
            this.capturedPieces[this.currentPlayer].push(targetPiece);
        }

        if (movingPiece instanceof Pawn && to.x !== from.x && !targetPiece) {
            const captureY = from.y;
            const capturedPawn = this.board[captureY][to.x];
            if (capturedPawn) {
                this.capturedPieces[this.currentPlayer].push(capturedPawn);
                this.board[captureY][to.x] = null;
            }
        }

        this.board[to.y][to.x] = movingPiece;
        this.board[from.y][from.x] = null;
        movingPiece.hasMoved = true;

        if (movingPiece instanceof King && Math.abs(to.x - from.x) === 2) {
            if (to.x > from.x) {
                this.board[to.y][5] = this.board[to.y][7];
                this.board[to.y][7] = null;
                this.board[to.y][5].hasMoved = true;
            } else {
                this.board[to.y][3] = this.board[to.y][0];
                this.board[to.y][0] = null;
                this.board[to.y][3].hasMoved = true;
            }
        }

        if (movingPiece instanceof Pawn && movingPiece.shouldPromote(to.y)) {
            this.promotionPending = {x: to.x, y: to.y};
            this.drawBoard();
            return;
        }

        if (movingPiece instanceof Pawn && Math.abs(to.y - from.y) === 2) {
            this.enPassant = {x: from.x, y: (from.y + to.y) / 2};
        } else {
            this.enPassant = null;
        }

        this.currentPlayer = 1 - this.currentPlayer;
        this.updateVisibleCells();
        this.startTimer();
        
        this.check = this.isInCheck(this.currentPlayer);
        if (this.isCheckmate()) {
            this.gameOver = true;
            clearInterval(this.timerInterval);
        } else if (this.isStalemate()) {
            this.gameOver = true;
            clearInterval(this.timerInterval);
        }
    }

    /**
     * Получить нотацию хода
     */
    getMoveNotation(from, to, piece, captured) {
        const files = 'abcdefgh';
        const fromFile = files[from.x];
        const fromRank = 8 - from.y;
        const toFile = files[to.x];
        const toRank = 8 - to.y;
        
        let notation = '';
        
        if (piece.symbol !== 'P') {
            notation += piece.symbol;
        }
        
        if (captured) {
            if (piece.symbol === 'P') {
                notation += fromFile;
            }
            notation += 'x';
        }
        
        notation += toFile + toRank;

        const tempBoard = this.deepCopyBoard();
        tempBoard[to.y][to.x] = piece;
        tempBoard[from.y][from.x] = null;
        
        if (this.isInCheck(1 - this.currentPlayer, tempBoard)) {
            if (this.isCheckmateForColor(1 - this.currentPlayer, tempBoard)) {
                notation += '#';
            } else {
                notation += '+';
            }
        }
        
        return notation;
    }

    /**
     * Проверить мат
     */
    isCheckmate() {
        return this.isCheckmateForColor(this.currentPlayer);
    }

    /**
     * Проверить мат для указанного цвета
     */
    isCheckmateForColor(color, board = this.board) {
        if (!this.isInCheck(color, board)) return false;
        
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = board[row][col];
                if (piece && piece.color === color) {
                    const moves = piece.getValidMoves(board, col, row, this.enPassant);
                    for (const move of moves) {
                        const tempBoard = this.deepCopyBoard();
                        tempBoard[move.y][move.x] = piece;
                        tempBoard[row][col] = null;
                        
                        if (!this.isInCheck(color, tempBoard)) {
                            return false;
                        }
                    }
                }
            }
        }
        
        return true;
    }

    /**
     * Проверить пат
     */
    isStalemate() {
        if (this.isInCheck(this.currentPlayer)) return false;
        
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = this.board[row][col];
                if (piece && piece.color === this.currentPlayer) {
                    const moves = this.getValidMovesForPiece(col, row);
                    if (moves.length > 0) return false;
                }
            }
        }
        
        return true;
    }

    /**
     * Превратить пешку в другую фигуру
     */
    promotePawn(pieceType) {
        if (!this.promotionPending) return;
        
        const {x, y} = this.promotionPending;
        const pawn = this.board[y][x];
        const color = pawn.color;
        
        const pieceClasses = {
            'Q': Queen, 'R': Rook, 'B': Bishop, 'N': Knight
        };
        
        this.board[y][x] = new pieceClasses[pieceType](color);
        this.promotionPending = null;
        this.promotionMouseX = null;
        this.promotionMouseY = null;
        
        this.currentPlayer = 1 - this.currentPlayer;
        this.updateVisibleCells();
        this.startTimer();
        this.check = this.isInCheck(this.currentPlayer);
        
        if (this.isCheckmate()) {
            this.gameOver = true;
            clearInterval(this.timerInterval);
        } else if (this.isStalemate()) {
            this.gameOver = true;
            clearInterval(this.timerInterval);
        }
        
        this.drawBoard();
        this.updateGameInfo();
    }

    /**
     * Обновить информацию о состоянии игры
     */
    updateGameInfo() {
        const statusElement = document.getElementById('game-status');
        const historyElement = document.getElementById('move-history');
        const capturedWhite = document.getElementById('captured-white');
        const capturedBlack = document.getElementById('captured-black');

        if (this.gameOver) {
            if (this.timers[0] <= 0) {
                statusElement.textContent = 'Время вышло, победа черных!';
            } else if (this.timers[1] <= 0) {
                statusElement.textContent = 'Время вышло, победа белых!';
            } else if (this.isCheckmate()) {
                statusElement.textContent = `Мат! Победа ${this.currentPlayer === 0 ? 'черных' : 'белых'}`;
            } else {
                statusElement.textContent = 'Пат, ничья!';
            }
            statusElement.style.color = '#dc3545';
        } else {
            let statusText = `Ход ${this.currentPlayer === 0 ? 'белых' : 'черных'}`;
            if (this.check) {
                statusText += ' (ШАХ)';
            }
            if (this.promotionPending) {
                statusText += ' - Выберите фигуру для превращения';
            }
            statusElement.textContent = statusText;
            statusElement.style.color = this.check ? '#dc3545' : '#495057';
        }

        historyElement.innerHTML = this.moveHistory.map((move, index) => 
            `<div>${index + 1}. ${move}</div>`
        ).join('');

        capturedWhite.textContent = this.capturedPieces[0].map(p => this.getPieceSymbol(p)).join(' ');
        capturedBlack.textContent = this.capturedPieces[1].map(p => this.getPieceSymbol(p)).join(' ');
    }

    /**
     * Проверить валидность позиции
     */
    isValidPosition(x, y) {
        return x >= 0 && x < 8 && y >= 0 && y < 8;
    }

    /**
     * Перевернуть доску
     */
    flipBoard() {
        this.boardFlipped = !this.boardFlipped;
        this.drawBoard();
    }

    /**
     * Включить/выключить туман войны
     */
    toggleFogOfWar() {
        this.fogOfWar = !this.fogOfWar;
        this.drawBoard();
    }
}

let game;

/**
 * Инициализация игры
 */
function initGame() {
    game = new ChessGame();
    
    const canvas = document.getElementById('chess-board');
    if (!canvas) {
        console.error('Canvas element not found!');
        return;
    }
    
    canvas.addEventListener('click', (event) => {
        const rect = canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        game.handleClick(x, y);
    });

    canvas.addEventListener('mousemove', (event) => {
        if (game.promotionPending) {
            const rect = canvas.getBoundingClientRect();
            const x = event.clientX - rect.left;
            const y = event.clientY - rect.top;
            game.updatePromotionMouse(x, y);
        }
    });

    document.addEventListener('keydown', (event) => {
        if (!game.promotionPending) return;
        
        const key = event.key.toUpperCase();
        const validPieces = {'Q': 'Q', 'R': 'R', 'B': 'B', 'N': 'N'};
        
        if (validPieces[key]) {
            game.promotePawn(validPieces[key]);
        }
    });
    
}

/**
 * Начать новую игру
 */
function startNewGame() {
    if (confirm('Начать новую игру? Текущий прогресс будет потерян.')) {
        initGame();
    }
}

/**
 * Перевернуть доску
 */
function toggleFlipBoard() {
    if (game) {
        game.flipBoard();
    }
}

/**
 * Включить/выключить туман войны
 */
function toggleFogOfWar() {
    if (game) {
        game.toggleFogOfWar();
    }
}

/**
 * Сохранить игру
 */
function saveGame() {
    if (game && !game.gameOver) {
        game.saveGame();
    } else {
        alert('Нет активной игры для сохранения');
    }
}

/**
 * Загрузить игру
 */
function loadGame() {
    if (game) {
        if (confirm('Загрузить сохраненную игру? Текущий прогресс будет потерян.')) {
            game.loadGame();
        }
    }
}

/**
 * Войти в систему
 */
function login() {
    const username = prompt('Введите имя пользователя:');
    if (username) {
        // Здесь можно добавить реальную авторизацию
        alert(`Добро пожаловать, ${username}! Теперь вы можете сохранять игры на сервер.`);
    }
}

window.onload = initGame;