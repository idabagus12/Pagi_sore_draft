<?php
require 'db.php';
header('Content-Type: application/json');

// POST: schedule delivery
if($_SERVER['REQUEST_METHOD']==='POST'){
    $body = json_decode(file_get_contents('php://input'), true);
    $order_id = $mysqli->real_escape_string($body['order_id'] ?? '');
    $deliver_time = $body['deliver_time'] ?? null;
    $driver = $mysqli->real_escape_string($body['driver'] ?? '');
    $address = $mysqli->real_escape_string($body['address'] ?? '');
    
    if(!$order_id){ http_response_code(400); echo json_encode(['error'=>'order_id required']); exit; }
    
    $status = 'Scheduled';
    $stmt = $mysqli->prepare('INSERT INTO delivery (order_id,deliver_time,driver,address,status) VALUES (?,?,?,?,?)');
    $stmt->bind_param('sssss',$order_id,$deliver_time,$driver,$address,$status);
    if(!$stmt->execute()){ http_response_code(500); echo json_encode(['error'=>$stmt->error]); exit; }
    
    echo json_encode(['delivery_id'=>$stmt->insert_id,'order_id'=>$order_id,'deliver_time'=>$deliver_time,'driver'=>$driver,'address'=>$address,'status'=>$status]); exit;
}

// GET: fetch deliveries
if($_SERVER['REQUEST_METHOD']==='GET'){
    if(isset($_GET['order_id'])){
        $oid = $mysqli->real_escape_string($_GET['order_id']);
        $res = $mysqli->query("SELECT * FROM delivery WHERE order_id='{$oid}' LIMIT 1");
        $r = $res->fetch_assoc(); echo json_encode($r); exit;
    }
    // get all
    $res = $mysqli->query('SELECT * FROM delivery ORDER BY delivery_id DESC');
    $rows=[]; while($r=$res->fetch_assoc()) $rows[]=$r; echo json_encode($rows); exit;
}

// PUT: update delivery
if($_SERVER['REQUEST_METHOD']==='PUT'){
    $body = json_decode(file_get_contents('php://input'), true);
    $delivery_id = intval($body['delivery_id'] ?? 0);
    $deliver_time = $body['deliver_time'] ?? null;
    $driver = $mysqli->real_escape_string($body['driver'] ?? '');
    $address = $mysqli->real_escape_string($body['address'] ?? '');
    $status = $mysqli->real_escape_string($body['status'] ?? 'Scheduled');
    
    $stmt = $mysqli->prepare('UPDATE delivery SET deliver_time=?,driver=?,address=?,status=? WHERE delivery_id=?');
    $stmt->bind_param('ssssi',$deliver_time,$driver,$address,$status,$delivery_id);
    $stmt->execute();
    echo json_encode(['ok'=>true]); exit;
}

http_response_code(405); echo json_encode(['error'=>'method not allowed']);
