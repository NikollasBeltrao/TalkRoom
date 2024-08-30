const express = require('express');
const path = require('path');
const http = require('http');
const socketIo = require('socket.io');
const fs = require('fs');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

let rooms = {};

// Servindo arquivos estáticos da pasta 'public'
app.use(express.static(path.join(__dirname, 'public')));

const roomsFilePath = path.join(__dirname, 'rooms.json');
function loadRooms() {
    if (fs.existsSync(roomsFilePath)) {
        rooms = JSON.parse(fs.readFileSync(roomsFilePath, 'utf8'));
    }
}
loadRooms();

function saveRoomsToFile() {
    fs.writeFileSync(roomsFilePath, JSON.stringify(rooms, null, 2));
}

// Configurando o Socket.io para comunicação em tempo real
io.on('connection', (socket) => {
    const username = socket.handshake.query.username;  // Acessa o nome de usuário a partir da query string
    socket.username = username;

    socket.on('join-room', (room, name) => {
        socket.join(room);
        if (!rooms[room]) {
            rooms[room] = {
                users: [],
                messages: []
            };
        }
        if (!rooms[room].users.includes(socket.username)) {
            rooms[room].users.push(socket.username);
        }
        saveRoomsToFile();

        io.to(socket.id).emit('user-rooms', getUserRooms());
        io.to(socket.id).emit('room-messages', getRoomMessages(room));
        io.to(room).emit('joined-user', socket.username);

        console.log(`Usuário ${socket.username} entrou na sala ${room}`);

    });

    socket.on('leave-room', (room) => {
        socket.leave(room);
        io.to(room).emit('user-left', socket.username);
    });

    socket.on('delete-room', (room) => {
        socket.leave(room);

        if (rooms[room]) {
            rooms[room].users = rooms[room].users.filter(user => user !== socket.username);
        }

        saveRoomsToFile();
        io.to(socket.id).emit('user-rooms', getUserRooms());
    });

    socket.on('get-user-rooms', () => {
        io.to(socket.id).emit('user-rooms', getUserRooms());
    });

    function getUserRooms() {
        loadRooms();
        var resp = [];
        for (const [room, value] of Object.entries(rooms)) {
            if (value?.users?.includes(socket.username)) {
                resp.push(room);
            }
        }
        return resp;
    }

    function getRoomMessages(room) {
        loadRooms();

        return rooms[room]?.messages?.map((el) => {
            return {
                ...el,
                time: formatDate(el.time)
            }
        });
    }

    // Enviando mensagens para a sala específica
    socket.on('send-message', (data) => {
        const date = new Date();
        rooms[data.room]['messages'].push({
            user: data.user,
            message: data.message,
            time: date
        });
        io.to(data.room).emit('message', { ...data, time: formatDate(date) });

        saveRoomsToFile();
    });

    socket.on('disconnect', () => {
        console.log('Usuário desconectado');
        //for (const room in rooms) {
        //  rooms[room].users = rooms[room]?.users?.filter(id => id !== socket.username);
        //}
    });
});

function formatDate(dateString) {
    const inputDate = new Date(dateString);
    const now = new Date();

    const isToday = inputDate.toDateString() === now.toDateString();
    const hours = String(inputDate.getHours()).padStart(2, '0');
    const minutes = String(inputDate.getMinutes()).padStart(2, '0');
    const day = String(inputDate.getDate()).padStart(2, '0');
    const month = String(inputDate.getMonth() + 1).padStart(2, '0');
    const year = inputDate.getFullYear();
    if (isToday) {
        return `${hours}:${minutes}`;
    } else {
        return `${day}/${month}/${year} às ${hours}:${minutes}`;
    }
}

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});
