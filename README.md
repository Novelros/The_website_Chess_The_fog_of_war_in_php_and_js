Для работы шахмат с туманом войны потребуются PHP и JavaScript. Перед тем как приступить к запуску проекта, убедитесь, что у вас установлено необходимое программное JS (v20.17.0) , если нет, то вы можете скачать её с официального сайта  nodejs.org . После скачивания JS, нужно установить php можно через сайт, но я использовал  chocolety, поэтому напиши этот способ:<br>

Этот код нужен для установки chocolety:


```bash
Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1')
```
Код чтобы установить php и проверить, что он установился:
<br>

<p align="center">

<img width="235" height="67" alt="image" src="https://github.com/user-attachments/assets/37ae8b27-0afb-46d0-8c2a-866cd2fbf5c9" />

</p>
#Структура проекта:

Cкачать фотографии фигур можно с GitHub
<br>

<p align="center">
<img width="576" height="293" alt="image" src="https://github.com/user-attachments/assets/50022690-4528-4478-9911-16a85fea363e" />
</p>

#2. Основная часть
<br>
##2.1 Реализация шахматных фигур
Каждая шахматная фигура реализована как отдельный класс, наследуемый от базового класса **ChessPiece**, такой объектно-ориентированный подход обеспечивает простоту расширения и поддержки кода. Каждый класс фигуры содержит метод **get_valid_moves()**, который возвращает список допустимых ходов для данной фигуры из текущей позиции
<br>
```JS
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

```
<br>
##2.1.1 Пешка (Pawn)
Пешка является самой многочисленной, но при этом одной из самых сложных в реализации фигур из-за особых правил перемещения. В отличие от других фигур, пешка имеет различные правила для обычного хода, для хода с перовой клетки, для взятия фигур на проходе, также смены самой пешки на другую фигуру при достижении конца доски

Белая пешка движется вверх по доске (уменьшение координаты Y), а черная – вниз (увеличение координаты Y). Со стартовой позиции пешка может сделать двойной ход на две клетки вперед, если путь свободен. Для взятия фигур противника пешка движется по диагонали на одну клетку вперед. Особый случай - "взятие на проходе" - позволяет пешке взять пешку противника, которая только что сделала двойной ход и переместилась на соседнюю вертикаль
<br>

<p align="center">
<img width="649" height="650" alt="image" src="https://github.com/user-attachments/assets/ff81607c-bbd6-4b82-ab09-1cdd59d0f5ed" />
</p>

```JS
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
```
##2.1.2 Конь (Knight)
Конь единственная фигура, способная перепрыгивать через другие фигуры, его движение описывается характерной буквой "Г", он перемещается на две клетки по одной оси и на одну клетку по другой. Это создает восемь возможных направлений движения из любой точки доски
<br>

<p align="center">
<img width="458" height="457" alt="image" src="https://github.com/user-attachments/assets/a89451e6-1462-4dd8-b7d2-f2613d2c763d" />
</p>

```JS
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
```
##2.1.3 Слон (Bishop)
Слон перемещается исключительно по диагоналям на любое количество клеток до тех пор, пока не встретит препятствие. Каждый слон остается на клетках одного цвета на протяжении всей игры
<br>

<p align="center">
<img width="520" height="520" alt="image" src="https://github.com/user-attachments/assets/95a22e41-4867-4a23-9d24-a320f9be82ee" />
</p>

```JS
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
```
##2.1.4 Ладья (Rook)
Ладья движется по горизонталям и вертикалям на любое количество клеток. В начальной позиции ладьи занимают угловые клетки доски и участвуют в специальном ходе рокировке. Алгоритм перемещения ладьи аналогичен слону, но использует четыре ортогональных направления вместо диагональных
<br>

<p align="center">
<img width="350" height="350" alt="image" src="https://github.com/user-attachments/assets/1c84b7e4-78c5-484f-9b7a-32458e8f8348" />
</p>

```JS
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

```
##2.1.5 Ферзь (Queen)
Ферзь сочетает в себе возможности ладьи и слона, что делает его самой мощной фигурой на доске. Он может перемещаться на любое количество клеток по горизонтали, вертикали или диагонали. В реализации мы используем композицию, объединяя ходы ладьи и слона
<br>

<p align="center">
<img width="540" height="540" alt="image" src="https://github.com/user-attachments/assets/e215c792-3722-4d46-a39c-9def75fdd044" />
</p>

```JS
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
```
##2.1.6 Король (King)
Король самая важная фигура, чья потеря означает проигрыш партии. Он перемещается на одну клетку в любом направлении. Особый ход рокировка позволяет королю переместиться на две клетки в сторону ладьи, а ладье перепрыгнуть через короля

В реализации учитывается, что король не может перемещаться на атакованные клетки, что проверяется в основном игровом цикле. Рокировка возможна только если король и соответствующая ладья не двигались с начала игры, между ними нет других фигур, и король не проходит через атакованные клетки
<br>

<p align="center">
<img width="704" height="369" alt="image" src="https://github.com/user-attachments/assets/711ad95e-0bd1-4cc6-86a8-5bd50a811c59" />
</p>

```JS
/**
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
}
```
Каждая фигура демонстрирует различные аспекты объектно-ориентированного программирования: наследование, инкапсуляцию и полиморфизм. Общий интерфейс **get_valid_moves** позволяет единообразно обрабатывать все типы фигур в основном игровом цикле, при этом каждая фигура сохраняет свою уникальную логику поведения


#3. Итоги 
<br>

<p align="center">
<img width="622" height="827" alt="image" src="https://github.com/user-attachments/assets/99abc9f5-670c-46a0-b821-2c6b5ce27bc6" />

</p>
<br>

<p align="center">
<img width="616" height="818" alt="image" src="https://github.com/user-attachments/assets/c55c601c-88b2-471d-a7d6-74bc302d4afc" />

</p>

