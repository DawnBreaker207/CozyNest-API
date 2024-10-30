import { Server, Socket } from '@/socket.io/dist';
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
    console.log('User connected');
    // Join room event
    socket.on(
      'joinRoom',
      (input: { roomName: string; userId: string; role: string }) => {
        if (!userRooms[socket.id]) {
          socket.join(input.roomName);
          userRooms[socket.id] = input;
          console.log(`User connected to RoomID ${input.roomName}`);
        }
      }
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
        console.log(data);

        const { roomName, role } = data;
        if (role === 'user') {
          console.log('Checking');

          io.to(roomName).emit('notification', data);
        }
      }
    );

    // Disconnected event
    socket.on('disconnect', () => {
      console.log(`User ${userRooms[socket.id]?.userId} disconnected`);
      delete userRooms[socket.id];
    });

    // Leave room event
    socket.on('leaveRoom', (roomName: string) => {
      socket.leave(roomName);
      delete userRooms[socket.id];
      console.log(`User left RoomID ${roomName}`);
    });
  });
};
