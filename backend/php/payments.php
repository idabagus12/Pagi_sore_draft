<?php
require 'db.php';
header('Content-Type: application/json');

// GET: fetch payments with optional filter
if($_SERVER['REQUEST_METHOD']==='GET'){
    if(isset($_GET['status'])){
        $status = $mysqli->real_escape_string($_GET['status']);
        $res = $mysqli->query("SELECT * FROM payments WHERE status='{$status}' ORDER BY payment_id DESC");
        $rows=[]; while($r=$res->fetch_assoc()) $rows[]=$r; echo json_encode($rows); exit;
    }
    if(isset($_GET['order_id'])){
        $oid = $mysqli->real_escape_string($_GET['order_id']);
        $res = $mysqli->query("SELECT * FROM payments WHERE order_id='{$oid}' LIMIT 1");
        $r = $res->fetch_assoc(); echo json_encode($r); exit;
    }
    // admin get all
    $res = $mysqli->query('SELECT * FROM payments ORDER BY payment_id DESC');
    $rows=[]; while($r=$res->fetch_assoc()) $rows[]=$r; echo json_encode($rows); exit;
}

http_response_code(405); echo json_encode(['error'=>'method not allowed']);
