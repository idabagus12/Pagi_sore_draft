<?php
require 'db.php';
header('Content-Type: application/json');

// POST: create order
if($_SERVER['REQUEST_METHOD']==='POST'){
    $body = json_decode(file_get_contents('php://input'), true);
    $customer_id = intval($body['customer_id'] ?? 0);
    $total_price = intval($body['total_price'] ?? 0);
    $delivery_date = $body['delivery_date'] ?? null;
    $status = $body['status'] ?? 'Pending';
    
    if(!$customer_id){ http_response_code(400); echo json_encode(['error'=>'customer_id required']); exit; }
    
    // generate order_id: ORD-{timestamp}-{random}
    $order_id = 'ORD-'.time().'-'.rand(10000,99999);
    $order_date = date('Y-m-d H:i:s');
    
    $stmt = $mysqli->prepare('INSERT INTO orders (order_id,customer_id,total_price,order_date,delivery_date,status) VALUES (?,?,?,?,?,?)');
    $stmt->bind_param('siisss',$order_id,$customer_id,$total_price,$order_date,$delivery_date,$status);
    if(!$stmt->execute()){ http_response_code(500); echo json_encode(['error'=>$stmt->error]); exit; }
    
    // Handle order_items if provided
    if(isset($body['items']) && is_array($body['items'])){
        $itemStmt = $mysqli->prepare('INSERT INTO order_items (order_id,menu_id,portion,note) VALUES (?,?,?,?)');
        foreach($body['items'] as $item){
            $menu_id = intval($item['menu_id'] ?? 0);
            $portion = intval($item['portion'] ?? 1);
            $note = $mysqli->real_escape_string($item['note'] ?? '');
            $itemStmt->bind_param('siis',$order_id,$menu_id,$portion,$note);
            $itemStmt->execute();
        }
        $itemStmt->close();
    }
    
    echo json_encode(['order_id'=>$order_id,'customer_id'=>$customer_id,'total_price'=>$total_price,'order_date'=>$order_date,'delivery_date'=>$delivery_date,'status'=>$status]); exit;
}

// GET: fetch orders. optional ?customer_id= or ?order_id=
if($_SERVER['REQUEST_METHOD']==='GET'){
    if(isset($_GET['customer_id'])){
        $cid = intval($_GET['customer_id']);
        $res = $mysqli->query("SELECT * FROM orders WHERE customer_id={$cid} ORDER BY order_id DESC");
        $rows=[]; while($r=$res->fetch_assoc()) $rows[]=$r; echo json_encode($rows); exit;
    }
    if(isset($_GET['order_id'])){
        $oid = $mysqli->real_escape_string($_GET['order_id']);
        $res = $mysqli->query("SELECT * FROM orders WHERE order_id='{$oid}' LIMIT 1");
        $r = $res->fetch_assoc(); echo json_encode($r); exit;
    }
    // admin get all
    $res = $mysqli->query('SELECT * FROM orders ORDER BY order_id DESC'); $rows=[]; while($r=$res->fetch_assoc()) $rows[]=$r; echo json_encode($rows); exit;
}

http_response_code(405); echo json_encode(['error'=>'method not allowed']);

