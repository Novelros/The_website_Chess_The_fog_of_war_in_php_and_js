<?php
session_start();

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    $action = $input['action'] ?? '';
    
    switch ($action) {
        case 'save':
            if (isset($input['gameState'])) {
                $_SESSION['chess_game_state'] = $input['gameState'];
                echo json_encode(['success' => true]);
            } else {
                echo json_encode(['success' => false, 'error' => 'No game state provided']);
            }
            break;
            
        case 'load':
            if (isset($_SESSION['chess_game_state'])) {
                echo json_encode([
                    'success' => true, 
                    'gameState' => $_SESSION['chess_game_state']
                ]);
            } else {
                echo json_encode(['success' => false, 'error' => 'No saved game found']);
            }
            break;
            
        case 'clear':
            unset($_SESSION['chess_game_state']);
            echo json_encode(['success' => true]);
            break;
            
        default:
            echo json_encode(['success' => false, 'error' => 'Invalid action']);
    }
} else {
    echo json_encode(['success' => false, 'error' => 'Invalid request method']);
}
?>