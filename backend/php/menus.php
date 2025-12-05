<?php
require 'db.php';

// supports GET (list), POST (add), PUT (update), DELETE (delete)
header('Content-Type: application/json');

if($_SERVER['REQUEST_METHOD']==='GET'){
    $res = $mysqli->query('SELECT menu_id,menu_name,description,price,category FROM menu ORDER BY menu_id');
    $rows = [];
    while($r = $res->fetch_assoc()) $rows[] = $r;
    echo json_encode($rows); exit;
}

$body = json_decode(file_get_contents('php://input'), true);
if($_SERVER['REQUEST_METHOD']==='POST'){
    $menu_name = $mysqli->real_escape_string($body['menu_name'] ?? '');
    $description = $mysqli->real_escape_string($body['description'] ?? '');
    $price = intval($body['price'] ?? 0);
    $category = $mysqli->real_escape_string($body['category'] ?? 'General');
    $stmt = $mysqli->prepare('INSERT INTO menu (menu_name,description,price,category) VALUES (?,?,?,?)');
    // types: menu_name (s), description (s), price (i), category (s)
    $stmt->bind_param('ssis',$menu_name,$description,$price,$category);
    $stmt->execute();
    echo json_encode(['menu_id'=>$stmt->insert_id,'menu_name'=>$menu_name,'description'=>$description,'price'=>$price,'category'=>$category]); exit;
}

if($_SERVER['REQUEST_METHOD']==='PUT'){
    $menu_id = intval($body['menu_id'] ?? 0);
    $menu_name = $mysqli->real_escape_string($body['menu_name'] ?? '');
    $description = $mysqli->real_escape_string($body['description'] ?? '');
    $price = intval($body['price'] ?? 0);
    $category = $mysqli->real_escape_string($body['category'] ?? 'General');
    $stmt = $mysqli->prepare('UPDATE menu SET menu_name=?,description=?,price=?,category=? WHERE menu_id=?');
    // types: menu_name (s), description (s), price (i), category (s), menu_id (i)
    $stmt->bind_param('ssisi',$menu_name,$description,$price,$category,$menu_id);
    $stmt->execute();
    echo json_encode(['ok'=>true]); exit;
}

if($_SERVER['REQUEST_METHOD']==='DELETE'){
    $menu_id = intval($body['menu_id'] ?? ($_GET['menu_id'] ?? 0));
    $stmt = $mysqli->prepare('DELETE FROM menu WHERE menu_id=?');
    $stmt->bind_param('i',$menu_id);
    $stmt->execute();
    echo json_encode(['ok'=>true]); exit;
}

http_response_code(405);
echo json_encode(['error'=>'method not allowed']);

