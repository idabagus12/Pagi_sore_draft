<?php

require 'db.php';
header('Content-Type: application/json');

$body = json_decode(file_get_contents('php://input'), true);
if(!$body){ http_response_code(400); echo json_encode(['error'=>'invalid input']); exit; }

$payment_id = intval($body['payment_id'] ?? 0);
$order_id = $mysqli->real_escape_string($body['order_id'] ?? '');
$status = $mysqli->real_escape_string($body['status'] ?? 'Pending'); // Approved or Rejected

// Prefer session-based admin id when available (safer than trusting client)
session_start();
$verified_by = 0;
if(isset($_SESSION['admin']) && isset($_SESSION['admin']['admin_id'])){
	$verified_by = intval($_SESSION['admin']['admin_id']);
} else {
	// fallback to client-provided verified_by if numeric
	$verified_by = intval($body['verified_by'] ?? 0);
}

if(!$payment_id || !$order_id){ http_response_code(400); echo json_encode(['error'=>'payment_id and order_id required']); exit; }

// verify order exists
$res = $mysqli->query("SELECT order_id FROM orders WHERE order_id='{$order_id}' LIMIT 1");
if($res->num_rows===0){ http_response_code(404); echo json_encode(['error'=>'order not found']); exit; }

// update payments
$timestamp = date('Y-m-d H:i:s');
$stmt = $mysqli->prepare('UPDATE payments SET verified_by=?, status=? WHERE payment_id=? AND order_id=?');
// types: verified_by (i), status (s), payment_id (i), order_id (s)
$stmt->bind_param('isis', $verified_by, $status, $payment_id, $order_id);
if(!$stmt->execute()){ http_response_code(500); echo json_encode(['error'=>'update failed']); exit; }

// update orders status
$order_status = ($status === 'Approved') ? 'Paid' : 'Payment Rejected';
$stmt2 = $mysqli->prepare('UPDATE orders SET status=? WHERE order_id=?');
$stmt2->bind_param('ss',$order_status,$order_id); 
$stmt2->execute();

echo json_encode(['ok'=>true,'payment_id'=>$payment_id,'status'=>$status]);

