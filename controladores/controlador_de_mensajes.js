const User = require('../models/User');
const Message = require('../models/Message');

// Obtener vista de chat con usuarios del mismo grupo
exports.getChat = async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const currentGroupId = req.user.groupId;

    // Filtrar únicamente compañeros del mismo grupo
    const groupMates = await User.find({
      groupId: currentGroupId,
      _id: { $ne: currentUserId }
    });

    // Cargar historial de mensajes del grupo
    const messages = await Message.find({ groupId: currentGroupId })
      .populate('senderId receiverId', 'nombre foto');

    res.render('chat', { groupMates, messages, user: req.user });
  } catch (error) {
    res.status(500).send('Error al cargar la mensajería.');
  }
};

// Enviar mensaje con validación estricta de grupo
exports.sendMessage = async (req, res) => {
  try {
    const { receiverId, text } = req.body;
    const senderId = req.user.id;
    const senderGroupId = req.user.groupId;

    const receiver = await User.findById(receiverId);

    // Validar que emisor y receptor pertenecen al mismo grupo
    if (!receiver || receiver.groupId.toString() !== senderGroupId.toString()) {
      return res.status(403).send('No puedes enviar mensajes fuera de tu grupo.');
    }

    await Message.create({
      senderId,
      receiverId,
      groupId: senderGroupId,
      text
    });

    res.redirect('/mensajes');
  } catch (error) {
    res.status(500).send('Error al enviar el mensaje.');
  }
};