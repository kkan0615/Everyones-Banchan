const SoketIO = require('socket.io');
const axios = require('axios');

module.exports = (server, app, sessionMiddleware) => {
    const io = SoketIO(server, { path:'/socket.io' });

    /* Set Name Space */
    app.set('io', io);
    const store = io.of('/store');
    io.use((socket, next) => {
        sessionMiddleware(socket.request, socket.request.res, next);
    });

    /* Connect with store name space */
    store.on('connection', (socket) => {
        console.log('Store 네임스페이스에 접속 완료');
        const req = socket.request;
        const { headers: { referer }} = req;
        const storeId = referer.split('/')[referer.split('/').length-3];
        console.log(referer + ' ' +storeId);

        socket.join(storeId);
        //socket.to(storeId).emit('new', {
        //
        //});
        /* disconnect store 네임 스페이스 */
        socket.on('disconnect', () => {
            console.log('store 네임스페이스에 접속 해제');
            socket.leave(storeId);
        });
    })
}