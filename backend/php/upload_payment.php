<?php
require 'db.php';
header('Content-Type: application/json');

$body = json_decode(file_get_contents('php://input'), true);
if(!$body){ http_response_code(400); echo json_encode(['error'=>'invalid input']); exit; }

$order_id = $mysqli->real_escape_string($body['order_id'] ?? '');
$upload_proof = $body['upload_proof'] ?? null; // expect data URL or base64

if(!$order_id || !$upload_proof){ http_response_code(400); echo json_encode(['error'=>'order_id and upload_proof required']); exit; }

// decode data URL if present
if(preg_match('/^data:(.*);base64,(.*)$/', $upload_proof, $m)){
    $b64 = $m[2];
} else { $b64 = $upload_proof; }

$binary = base64_decode($b64);
if($binary === false){ http_response_code(400); echo json_encode(['error'=>'invalid file data']); exit; }

$uploadsDir = __DIR__ . '/../uploads';
if(!is_dir($uploadsDir)) mkdir($uploadsDir, 0777, true);

$safeName = time() . '_' . substr(str_shuffle('0123456789abcdef'), 0, 8);
$path = $uploadsDir . '/' . $safeName;
file_put_contents($path, $binary);

// verify order exists
$res = $mysqli->query("SELECT order_id FROM orders WHERE order_id='{$order_id}' LIMIT 1");
if($res->num_rows===0){ http_response_code(404); echo json_encode(['error'=>'order not found']); exit; }

$timestamp = date('Y-m-d H:i:s');
// When user uploads proof, mark payment as 'Waiting for Validation' so admin can review
$status = 'Waiting for Validation';

$stmt = $mysqli->prepare('INSERT INTO payments (order_id,upload_proof,timestamp,status) VALUES (?,?,?,?)');
$stmt->bind_param('ssss',$order_id,$safeName,$timestamp,$status);
$stmt->execute();
$payment_id = $stmt->insert_id;

// update orders.status
$stmt2 = $mysqli->prepare('UPDATE orders SET status=? WHERE order_id=?');
$status_update = 'Waiting for Validation';
$stmt2->bind_param('ss',$status_update,$order_id); 
$stmt2->execute();

echo json_encode(['payment_id'=>$payment_id,'order_id'=>$order_id,'status'=>$status,'upload_proof'=>$safeName]);

