<?php
require 'db.php';

$body = json_decode(file_get_contents('php://input'), true);
if(!$body){ http_response_code(400); json_out(['error'=>'invalid input']); exit; }

$name = $mysqli->real_escape_string($body['name'] ?? '');
$password = $mysqli->real_escape_string($body['password'] ?? '');

if(!$name || !$password){ http_response_code(400); json_out(['error'=>'name and password required']); exit; }

$stmt = $mysqli->prepare('SELECT customer_id,name,phone,address FROM customers WHERE name=? AND password=? LIMIT 1');
$stmt->bind_param('ss', $name, $password);
$stmt->execute();
$res = $stmt->get_result();
if($res->num_rows===0){ http_response_code(401); json_out(['error'=>'invalid credentials']); exit; }
$customer = $res->fetch_assoc();
$stmt->close();

// set session
session_start();
$_SESSION['customer'] = $customer;

json_out(['customer'=>$customer]);

