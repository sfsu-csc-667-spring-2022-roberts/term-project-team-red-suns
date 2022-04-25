/*
Middleware for socket io in relationship to the game
 */

const connectionContainer = require('../server/server');
const dbEngineGameUno = require('../controller/db_engine_game_uno');
const debugPrinter = require('../util/debug_printer');

const { io } = connectionContainer;

/**
 *
 * Notes:
 *      THIS MUST BE CALLED ONCE
 * @param socket
 * @param next
 * @returns {Promise<void>}
 */
async function attachGameIDToSocketIORequest(socket, next) {
    debugPrinter.printMiddlewareSocketIO(attachGameIDToSocketIORequest.name);

    if (socket.request.session.game_id_temp) {
        socket.request.game_id = socket.request.session.game_id_temp;
    }

    next();
}

io.use(attachGameIDToSocketIORequest);

/**
 *
 * Notes:
 *      THIS MUST BE CALLED ONCE
 *
 * @param socket
 * @param next
 * @returns {Promise<void>}
 */
async function attachPlayerIDToSocketIORequest(socket, next) {
    debugPrinter.printMiddlewareSocketIO(attachPlayerIDToSocketIORequest.name);

    if (socket.request.user && socket.request.game_id) {
        const result = await dbEngineGameUno.getPlayerRowJoinPlayersRowJoinGameRowByGameIDAndUserID(
            socket.request.game_id,
            socket.request.user.user_id,
        );

        socket.request.player_id = result.player_id;
    }

    next();
}

io.use(attachPlayerIDToSocketIORequest);
