<?php
require 'db.php';

$body = json_decode(file_get_contents('php://input'), true);
if(!$body){ http_response_code(400); json_out(['error'=>'invalid input']); exit; }

$username = $mysqli->real_escape_string($body['username'] ?? '');
$password = $mysqli->real_escape_string($body['password'] ?? '');

$stmt = $mysqli->prepare('SELECT admin_id,username,name FROM admin WHERE username=? AND password=? LIMIT 1');
$stmt->bind_param('ss', $username, $password);
$stmt->execute();
$res = $stmt->get_result();
if($res->num_rows===0){ http_response_code(401); json_out(['error'=>'invalid credentials']); exit; }
$admin = $res->fetch_assoc();
$stmt->close();

session_start();
$_SESSION['admin'] = $admin;
json_out(['ok'=>true,'admin'=>$admin]);
