-- ===========================================
-- INSERTAR PRODUCTOS
-- ===========================================
INSERT INTO producto (nombre, marca, descripcion, unidad, caducidad, path_img, tipo)
VALUES 
('Leche entera', 'Granero', 'Leche fresca 1L', 'l', '2025-12-01',  '/img/leche.jpg', 'lacteo'),    
('Harina de trigo', 'Molino Real', 'Harina 1kg', 'kg', NULL,  '/img/harina.jpg' ,'cereal'),         
('Huevos camperos', 'Granja Feliz', 'Caja de 12 huevos', 'unidad', '2025-11-15',  '/img/huevo.jpg','huevo'); 

-- ===========================================
-- INSERTAR ALÉRGENOS
-- ===========================================
INSERT INTO producto_alergeno (id_producto, alergeno) VALUES
(1, 'lacteos'),   
(2, 'gluten'),    
(3, 'huevos');    

-- ===========================================
-- INSERTAR PROVEEDORES
-- ===========================================
INSERT INTO proveedor (nombre, contacto) VALUES
('Distribuciones ABC', 'abc@distribuciones.com'),  
('Proveedor XYZ', 'xyz@proveedor.com');           

-- ===========================================
-- ASIGNAR PROVEEDORES A PRODUCTOS
-- ===========================================
-- Usamos la tabla intermedia producto_proveedor
INSERT INTO producto_proveedor (id_producto, id_proveedor, referencia) VALUES
(1, 1, 'Lote-LE-001'),
(2, 2, 'Lote-HT-010');
