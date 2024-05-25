import express from "express";
import { createServer } from "http";
import { Server, Socket } from "socket.io";
import cors from "cors";
import axios from "axios";

const PORT = 8080;

const app = express();

app.use(cors());
app.use(express.json());

interface MessageData {
    user: string;
    datetime: string;
    message: string;
    isError?: boolean;
}

interface StoredMessage {
    client: Socket;
    data: MessageData;
}

let messages: Record<string, StoredMessage> = {};

const server = createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
    },
});

app.get("/", (req, res) => {
    res.send("Hello, Express.js!");
});

app.post('/receive', (req, res) => {
    console.log("/receive");

    const message: MessageData = req.body;
    console.log(message);

    if (message.isError && messages[message.datetime]) {
        const { client, data } = messages[message.datetime];
        if (client) {
            client.emit("message", data);
        }
    }

    io.emit("message", message);

    res.send("Message received");

    delete messages[message.datetime];
});

io.on("connection", (socket: Socket) => {
    console.log("User connected", socket.id);

    socket.on("disconnect", () => {
        console.log("User disconnected", socket.id);
    });

    socket.on("message", async (message: string) => {
        console.log("New message", message);

        const data: MessageData = JSON.parse(message);
        console.log(data);

        messages[data.datetime] = { client: socket, data };

        axios.post("http://192.168.234.203:8000/transferMessage/", data).catch(error => console.log(error.message));
    });
});

server.listen(PORT, () => {
    console.log(`Server started on http://localhost:${PORT}`);
});
