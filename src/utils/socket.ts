import { Server, Socket } from 'socket.io';
import logger from './logger';

export interface userRooms {
  roomName: string;
  message?: string;
  userId: string;
  role: string;
}

export const realTime = (io: Server) => {
  const userRooms: Record<string, userRooms> = {};

  // Connected event to server chat
  io.on('connection', (socket: Socket) => {
    logger.log('info', 'User connected');

    // Join room event
    socket.on(
      'joinRoom',
      (input: { roomName: string; userId: string; role: string }) => {
        if (!userRooms[socket.id]) {
          socket.join(input.roomName);
          userRooms[socket.id] = input;
          logger.log('info', `User connected to RoomID ${input.roomName}`);
        }
      },
    );

    // Send notification event
    socket.on(
      'sendNotification',
      (data: {
        roomName: string;
        message: string;
        userId: string;
        role: string;
      }) => {
        const { roomName, role } = data;
        if (role === 'user') {
          logger.log('info', 'Checking');
          io.to(roomName).emit('notification', data);
        }
      },
    );

    // Event for product updates
    socket.on(
      'productUpdated',
      (data: { productId: string; productData: any }) => {
        const { productId, productData } = data;
        logger.log('info', `Product updated: ${productId}`);
        io.to(`product_${productId}`).emit('productUpdated', productData);
      },
    );

    // Event for order updates
    socket.on(
      'orderUpdated',
      (input: { orderId: string; role: string; orderData: any }) => {
        const { role, orderId, orderData } = input;
        // if (role === 'superAdmin' || role === 'admin' || role === 'shipper') {
        logger.log('info', `Order updated ${orderId} `);
        io.to(`order_${orderId}`).emit('orderUpdated', orderData);
        // }
      },
    );

    // Disconnected event
    socket.on('disconnect', () => {
      logger.log('info', `User ${userRooms[socket.id]?.userId} disconnected`);
      delete userRooms[socket.id];
    });

    // Leave room event
    socket.on('leaveRoom', (roomName: string) => {
      socket.leave(roomName);
      delete userRooms[socket.id];
      logger.log('info', `User left RoomID ${roomName}`);
    });
  });
};
