import User from '../models/User.js';
import Group from '../models/Group.js';
import bcrypt from 'bcryptjs';

// Cargar panel con usuarios y grupos
export const renderAdminPanel = async (req, res) => {
  try {
    const groups = await Group.findAll();
    const users = await User.findAll({ include: Group });
    res.render('admin', { groups, users });
  } catch (error) {
    res.status(500).send('Error al cargar el panel de administración');
  }
};

// Alta de Grupo
export const createGroup = async (req, res) => {
  try {
    await Group.create({ name: req.body.name, description: req.body.description });
    res.redirect('/admin');
  } catch (error) {
    res.status(400).send('Error al crear el grupo');
  }
};

// Baja de Grupo
export const deleteGroup = async (req, res) => {
  try {
    const { id } = req.params;
    await User.update({ groupId: null }, { where: { groupId: id } });
    await Group.destroy({ where: { id } });
    res.redirect('/admin');
  } catch (error) {
    res.status(500).send('Error al eliminar el grupo');
  }
};

// Alta de Usuario (con foto y asignación de grupo)
export const createUser = async (req, res) => {
  try {
    const { name, email, password, role, groupId } = req.body;
    const photoPath = req.file ? `/uploads/${req.file.filename}` : '/uploads/default.png';
    const hashedPassword = await bcrypt.hash(password, 10);

    await User.create({
      name,
      email,
      password: hashedPassword,
      role: role || 'user',
      photo: photoPath,
      groupId: groupId || null
    });

    res.redirect('/admin');
  } catch (error) {
    res.status(400).send('Error al crear usuario: ' + error.message);
  }
};

// Baja de Usuario
export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    await User.destroy({ where: { id } });
    res.redirect('/admin');
  } catch (error) {
    res.status(500).send('Error al borrar el usuario');
  }
};