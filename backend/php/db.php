<?php
// Simple DB connection for XAMPP
$DB_HOST = '127.0.0.1';
$DB_USER = 'root';
$DB_PASS = '';
$DB_NAME = 'pagi_sore';

$mysqli = new mysqli($DB_HOST, $DB_USER, $DB_PASS, $DB_NAME);
if ($mysqli->connect_errno) {
    http_response_code(500);
    echo json_encode(['error' => 'DB connection failed: ' . $mysqli->connect_error]);
    exit;
}

// set JSON header by callers as needed
function json_out($data){
    header('Content-Type: application/json');
    echo json_encode($data);
}

?>
