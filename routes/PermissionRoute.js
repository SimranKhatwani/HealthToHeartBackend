const express = require('express');
const { createPermission, getAllPermissions, getPermissionById, updatePermission, deletePermission } = require('../controllers/PermissionController');
const { verifyAdminToken } = require('../middleware/Verification');
const PermissionRoutes = express.Router();


PermissionRoutes.post('/',verifyAdminToken,createPermission);
PermissionRoutes.get('/',verifyAdminToken, getAllPermissions);
// PermissionRoutes.get('/:id',verifyAdminToken, checkPermission("SeePermissions"),getPermissionById); 
// PermissionRoutes.put('/:id',verifyAdminToken, checkPermission("ManagePermissions"),updatePermission);
PermissionRoutes.put('/:id', verifyAdminToken, updatePermission);
// PermissionRoutes.delete('/:id',verifyAdminToken, checkPermission("ManagePermissions"), deletePermission);

module.exports = PermissionRoutes;
