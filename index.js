const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const imageRouter = require('./router/images');
const adminRouter = require('./router/adminRoute');
const path = require('path');
const {connectToMongoDb} = require('./connection');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(express.urlencoded({extended: true}));
app.use(express.json());

connectToMongoDb('mongodb://127.0.0.1:27017/Animals')
.then(()=> console.log('Database Connected'))
.catch((err) => console.log('Error Occured at database connection ',err));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'public','HTML'));
app.use(express.static('public'));
app.get('/',(req,res)=>{
  res.render('index');
});
app.use('/admin',adminRouter);
app.use('/image',imageRouter);
app.get('/our_gallery',(req,res)=>{
  res.render('our_gallery');
});
app.get('/donation',(req,res)=>{ res.render('donation')});
app.get('/membership',(req,res)=>{ res.render('membership')});
app.get('/adoptions',(req,res)=> res.render('adoptions'));
app.get('/About_Us',(req,res)=> res.render('About_Us'));


let users = [];

io.on('connection', (socket) => {
  console.log('A new user connected:', socket.id);
  users.push(socket.id);
  socket.broadcast.emit('new-user', socket.id);
  socket.emit('existing-users', users.filter(id => id !== socket.id));
  socket.on('start-broadcast', () => {
    console.log(`${socket.id} started broadcasting.`);
    socket.broadcast.emit('new-user', socket.id); 
  });
  socket.on('send-offer', (remoteSocketId, offer) => {
    io.to(remoteSocketId).emit('receive-offer', socket.id, offer);
  });
  socket.on('send-answer', (remoteSocketId, answer) => {
    io.to(remoteSocketId).emit('receive-answer', socket.id, answer);
  });
  socket.on('send-ice-candidate', (remoteSocketId, candidate) => {
    io.to(remoteSocketId).emit('receive-ice-candidate', socket.id, candidate);
  });
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    users = users.filter(id => id !== socket.id);
    socket.broadcast.emit('user-disconnected', socket.id); 
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});