/**
 * Базовый класс для всех шахматных фигур
 */
class ChessPiece {
    /**
     * Инициализация шахматной фигуры
     * 
     * Args:
     *     color: 0 - для белых, 1 - для черных
     *     symbol: символ фигуры (например: K - король)
     */
    constructor(color, symbol) {
        this.color = color;
        this.symbol = symbol;
        this.hasMoved = false;
    }

    /**
     *Проверить, является ли другая фигура фигурой противника
     */
    isOpponent(otherPiece) {
        return otherPiece && otherPiece.color !== this.color;
    }

    /**
     * Проверить, находится ли позиция в пределах доски
     */
    isValidPosition(x, y) {
        return x >= 0 && x < 8 && y >= 0 && y < 8;
    }

    /**
     * Проверить, является ли клетка пустой или содержит фигуру противника
     * */
    isEmptyOrOpponent(board, x, y) {
        if (!this.isValidPosition(x, y)) return false;
        const target = board[y][x];
        return target === null || this.isOpponent(target);
    }
}

/**
 * Класс пешки
 */
class Pawn extends ChessPiece {
    constructor(color) {
        super(color, 'P');
    }

    /**
     * Получить допустимые ходы для пешки
     * 
     * Args:
     *     board: шахматная доска
     *     x: текущая координата x
     *     y: текущая координата y
     *     enPassant: координаты для взятия на проходе
     * 
     * Returns:
     *     array: список допустимых ходов
     */
    getValidMoves(board, x, y, enPassant = null) {
        const moves = [];
        const direction = this.color === 0 ? -1 : 1;
        const startRow = this.color === 0 ? 6 : 1;

        // Ход вперед на одну клетку
        if (this.isValidPosition(x, y + direction) && board[y + direction][x] === null) {
            moves.push({x, y: y + direction});

            // Двойной ход с начальной позиции
            if (y === startRow && board[y + 2 * direction][x] === null) {
                moves.push({x, y: y + 2 * direction});
            }
        }

        // Взятия
        for (let dx of [-1, 1]) {
            const newX = x + dx;
            const newY = y + direction;
            
            if (this.isValidPosition(newX, newY)) {
                const target = board[newY][newX];
                if (target && this.isOpponent(target)) {
                    moves.push({x: newX, y: newY});
                }
                
                // Взятие на проходе
                if (enPassant && enPassant.x === newX && enPassant.y === newY) {
                    moves.push({x: newX, y: newY});
                }
            }
        }

        return moves;
    }

    /**
     * Проверить, должна ли пешка превратиться в другую фигуру
     * 
     * Args:
     *     y: текущая координата y пешки
     * 
     * Returns:
     *     boolean: True, если пешка достигла последней горизонтали и False, если нет
     */
    shouldPromote(y) {
        return (this.color === 0 && y === 0) || (this.color === 1 && y === 7);
    }
}

/**
 * Класс коня (обозначается как N в шахматах)
 */
class Knight extends ChessPiece {
    constructor(color) {
        super(color, 'N');
    }

    /**
     * Получить допустимые ходы для коня
     * 
     * Args:
     *     board: шахматная доска
     *     x: текущая координата x
     *     y: текущая координата y
     * 
     * Returns:
     *     array: список допустимых ходов
     */
    getValidMoves(board, x, y) {
        const moves = [];
        const knightMoves = [
            [2, 1], [2, -1], [-2, 1], [-2, -1],
            [1, 2], [1, -2], [-1, 2], [-1, -2]
        ];

        for (let [dx, dy] of knightMoves) {
            const newX = x + dx;
            const newY = y + dy;
            if (this.isEmptyOrOpponent(board, newX, newY)) {
                moves.push({x: newX, y: newY});
            }
        }

        return moves;
    }
}

/**
 * Класс слона
 */
class Bishop extends ChessPiece {
    constructor(color) {
        super(color, 'B');
    }

    /**
     * Получить допустимые ходы для слона
     * 
     * Args:
     *     board: шахматная доска
     *     x: текущая координата x
     *     y: текущая координата y
     * 
     * Returns:
     *     array: список допустимых ходов
     */
    getValidMoves(board, x, y) {
        const moves = [];
        const directions = [[1, 1], [1, -1], [-1, 1], [-1, -1]];

        for (let [dx, dy] of directions) {
            for (let i = 1; i < 8; i++) {
                const newX = x + i * dx;
                const newY = y + i * dy;
                
                if (!this.isValidPosition(newX, newY)) break;
                
                if (board[newY][newX] === null) {
                    moves.push({x: newX, y: newY});
                } else if (this.isOpponent(board[newY][newX])) {
                    moves.push({x: newX, y: newY});
                    break;
                } else {
                    break;
                }
            }
        }

        return moves;
    }
}

/**
 * Класс ладьи
 */
class Rook extends ChessPiece {
    constructor(color) {
        super(color, 'R');
    }

    /**
     * Получить допустимые ходы для ладьи
     * 
     * Args:
     *     board: шахматная доска
     *     x: текущая координата x
     *     y: текущая координата y
     * 
     * Returns:
     *     array: список допустимых ходов
     */
    getValidMoves(board, x, y) {
        const moves = [];
        const directions = [[1, 0], [-1, 0], [0, 1], [0, -1]];

        for (let [dx, dy] of directions) {
            for (let i = 1; i < 8; i++) {
                const newX = x + i * dx;
                const newY = y + i * dy;
                
                if (!this.isValidPosition(newX, newY)) break;
                
                if (board[newY][newX] === null) {
                    moves.push({x: newX, y: newY});
                } else if (this.isOpponent(board[newY][newX])) {
                    moves.push({x: newX, y: newY});
                    break;
                } else {
                    break;
                }
            }
        }

        return moves;
    }
}

/**
 * Класс ферзя
 */
class Queen extends ChessPiece {
    constructor(color) {
        super(color, 'Q');
    }

    /**
     * Получить допустимые ходы для ферзя
     * 
     * Args:
     *     board: шахматная доска
     *     x: текущая координата x
     *     y: текущая координата y
     * 
     * Returns:
     *     array: список допустимых ходов
     */
    getValidMoves(board, x, y) {
        // Ферзь ходит как ладья + слон
        const rookMoves = new Rook(this.color).getValidMoves(board, x, y);
        const bishopMoves = new Bishop(this.color).getValidMoves(board, x, y);
        return [...rookMoves, ...bishopMoves];
    }
}

`/**
 * Класс короля
 */
class King extends ChessPiece {
    constructor(color) {
        super(color, 'K');
    }

    /**
     * Получить допустимые ходы для короля
     * 
     * Args:
     *     board: шахматная доска
     *     x: текущая координата x
     *     y: текущая координата y
     * 
     * Returns:
     *     array: список допустимых ходов
     */
    getValidMoves(board, x, y) {
        const moves = [];
        const kingMoves = [
            [1, 0], [-1, 0], [0, 1], [0, -1],
            [1, 1], [1, -1], [-1, 1], [-1, -1]
        ];

        for (let [dx, dy] of kingMoves) {
            const newX = x + dx;
            const newY = y + dy;
            if (this.isEmptyOrOpponent(board, newX, newY)) {
                moves.push({x: newX, y: newY});
            }
        }

        // Рокировка
        if (!this.hasMoved) {
            // Короткая рокировка
            if (board[y][x + 1] === null && board[y][x + 2] === null &&
                board[y][x + 3] instanceof Rook && !board[y][x + 3].hasMoved) {
                moves.push({x: x + 2, y, castling: 'short'});
            }

            // Длинная рокировка
            if (board[y][x - 1] === null && board[y][x - 2] === null && board[y][x - 3] === null &&
                board[y][x - 4] instanceof Rook && !board[y][x - 4].hasMoved) {
                moves.push({x: x - 2, y, castling: 'long'});
            }
        }

        return moves;
    }
}`