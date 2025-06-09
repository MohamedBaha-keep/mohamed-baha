<?php
header('Content-Type: application/json');

// Validate and sanitize inputs
$requiredFields = ['propertyType', 'propertyCategory', 'propertyLocation', 'propertyPrice', 'propertyDescription', 'contactName', 'contactPhone'];
foreach ($requiredFields as $field) {
    if (empty($_POST[$field])) {
        echo json_encode(['success' => false, 'message' => 'جميع الحقول المطلوبة يجب ملؤها']);
        exit;
    }
}

// Process file uploads
$uploadedFiles = [];
if (!empty($_FILES['images'])) {
    $uploadDir = 'uploads/';
    if (!file_exists($uploadDir)) {
        mkdir($uploadDir, 0777, true);
    }
    
    foreach ($_FILES['images']['tmp_name'] as $key => $tmpName) {
        $fileName = basename($_FILES['images']['name'][$key]);
        $targetPath = $uploadDir . uniqid() . '_' . $fileName;
        
        if (move_uploaded_file($tmpName, $targetPath)) {
            $uploadedFiles[] = $targetPath;
        }
    }
}

// Save to database (example using PDO)
try {
    $pdo = new PDO('mysql:host=localhost;dbname=your_db', 'username', 'password');
    
    $stmt = $pdo->prepare("INSERT INTO property_listings 
        (type, category, location, price, description, contact_name, contact_phone, contact_email, contact_method, images) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
    
    $imagesSerialized = serialize($uploadedFiles);
    $stmt->execute([
        $_POST['propertyType'],
        $_POST['propertyCategory'],
        $_POST['propertyLocation'],
        $_POST['propertyPrice'],
        $_POST['propertyDescription'],
        $_POST['contactName'],
        $_POST['contactPhone'],
        $_POST['contactEmail'] ?? null,
        $_POST['contactMethod'],
        $imagesSerialized
    ]);
    
    echo json_encode(['success' => true, 'message' => 'تم حفظ البيانات بنجاح']);
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => 'خطأ في قاعدة البيانات: ' . $e->getMessage()]);
}

// Send email notification
$to = 'mm1148369@gmail.com';
$subject = 'إعلان عقاري جديد';
$message = "تم استلام إعلان عقاري جديد:\n\n";
$message .= "النوع: " . $_POST['propertyType'] . "\n";
// Add all other fields...
$headers = 'From: webmaster@example.com';
mail($to, $subject, $message, $headers);

?>


