<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Шахматы Online</title>
    <style>
        body {
            font-family: 'Times New Roman', Times, serif;
            text-align: center;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            margin: 0;
            padding: 20px;
            min-height: 100vh;
        }
        
        .container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            border-radius: 15px;
            padding: 20px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.3);
        }
        
        h1 {
            color: #333;
            margin-bottom: 20px;
            font-size: 2.5em;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.1);
            font-family: 'Times New Roman', Times, serif;
        }
        
        .chess-container {
            display: inline-block;
            margin: 20px auto;
            border: 3px solid #333;
            border-radius: 5px;
            box-shadow: 0 0 20px rgba(0,0,0,0.5);
            background: #8B4513;
        }
        
        .game-info {
            margin: 20px;
            padding: 15px;
            background: #f8f9fa;
            border-radius: 10px;
            border: 2px solid #dee2e6;
            font-family: 'Times New Roman', Times, serif;
        }
        
        #game-status {
            font-size: 1.5em;
            font-weight: bold;
            margin: 10px 0;
            color: #495057;
            font-family: 'Times New Roman', Times, serif;
        }
        
        .timers {
            display: flex;
            justify-content: space-between;
            margin: 15px 0;
        }
        
        .timer {
            padding: 10px 20px;
            background: #e9ecef;
            border-radius: 10px;
            border: 2px solid #dee2e6;
            font-size: 1.2em;
            font-weight: bold;
        }
        
        .timer.active {
            background: #007bff;
            color: white;
            border-color: #0056b3;
        }
        
        .timer.warning {
            background: #ffc107;
            color: #856404;
            border-color: #ffc107;
        }
        
        .timer.danger {
            background: #dc3545;
            color: white;
            border-color: #c82333;
        }
        
        #move-history {
            max-height: 100px;
            overflow-y: auto;
            background: white;
            padding: 10px;
            border-radius: 5px;
            border: 1px solid #ced4da;
            font-family: 'Times New Roman', Times, serif;
        }
        
        .controls {
            margin: 20px;
        }
        
        button {
            background: #007bff;
            color: white;
            border: none;
            padding: 12px 24px;
            margin: 5px;
            border-radius: 25px;
            cursor: pointer;
            font-size: 1em;
            transition: all 0.3s ease;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            font-family: 'Times New Roman', Times, serif;
        }
        
        button:hover {
            background: #0056b3;
            transform: translateY(-2px);
            box-shadow: 0 6px 8px rgba(0,0,0,0.2);
        }
        
        button:active {
            transform: translateY(0);
        }
        
        .captured-pieces {
            display: flex;
            justify-content: space-between;
            margin: 15px 0;
            font-family: 'Times New Roman', Times, serif;
        }
        
        .captured-white, .captured-black {
            min-height: 30px;
            padding: 5px 10px;
            background: #e9ecef;
            border-radius: 5px;
            border: 1px solid #dee2e6;
            font-size: 1.2em;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>♞ Шахматы Online ♘</h1>
        
        <div class="game-info">
            <div id="game-status">Ход белых</div>
            <div class="timers">
                <div class="timer" id="white-timer">10:00</div>
                <div class="timer" id="black-timer">10:00</div>
            </div>
            <div class="captured-pieces">
                <div class="captured-white" id="captured-white"></div>
                <div class="captured-black" id="captured-black"></div>
            </div>
            <div id="move-history"></div>
        </div>
        
        <div class="chess-container">
            <canvas id="chess-board" width="640" height="640"></canvas>
        </div>
        
        <div class="controls">
            <button onclick="startNewGame()">Новая игра</button>
            <button onclick="toggleFlipBoard()">Перевернуть доску</button>
            <button onclick="toggleFogOfWar()">Туман войны</button>
        </div>
    </div>

    <!-- Подключаем оба файла в правильном порядке -->
    <script src="chess-pieces.js"></script>
    <script src="chess-game.js"></script>
</body>
</html>