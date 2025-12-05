<?php
require 'db.php';

$body = json_decode(file_get_contents('php://input'), true);
if(!$body){ http_response_code(400); json_out(['error'=>'invalid input']); exit; }

$name = $mysqli->real_escape_string($body['name'] ?? '');
$phone = $mysqli->real_escape_string($body['phone'] ?? '');
$address = $mysqli->real_escape_string($body['address'] ?? '');
$password = $mysqli->real_escape_string($body['password'] ?? '');

if(!$name || !$phone || !$address || !$password){ 
    http_response_code(400); 
    json_out(['error'=>'name, phone, address, and password required']); 
    exit; 
}

// Check if customer already exists
$checkStmt = $mysqli->prepare('SELECT customer_id FROM customers WHERE name=?');
$checkStmt->bind_param('s', $name);
$checkStmt->execute();
if($checkStmt->get_result()->num_rows > 0){
    http_response_code(400);
    json_out(['error'=>'User sudah terdaftar']);
    exit;
}
$checkStmt->close();

// NOTE: For demo, store plaintext; in production hash passwords (password_hash)
$stmt = $mysqli->prepare('INSERT INTO customers (name,phone,address,password) VALUES (?,?,?,?)');
$stmt->bind_param('ssss', $name, $phone, $address, $password);
if(!$stmt->execute()){
    http_response_code(500);
    json_out(['error'=>'insert failed','detail'=>$stmt->error]);
    exit;
}
$customer_id = $stmt->insert_id;
$stmt->close();

json_out(['customer_id'=>$customer_id,'name'=>$name,'phone'=>$phone,'address'=>$address]);

