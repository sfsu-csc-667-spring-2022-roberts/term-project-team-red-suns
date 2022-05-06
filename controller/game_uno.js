/*

IMPORTANT NOTES:
    THERE SHOULD BE NO SOCKET IO STUFF HERE

TODO: FIX CONSISTENCY IN RETURNS

 */
const dbEngine = require('./db_engine');
const dbEngineGameUno = require('./db_engine_game_uno');

const debugPrinter = require('../util/debug_printer');
const constants = require('../server/constants');

const gameUno = {};

/*
Return format
{
    status,
    message,
    games,
{
 */
/**
 * Get All games and the players in those games
 *
 * Notes:
 *      This function is not dependent on if the db is successful or not
 *
 * @returns {Promise<{game: *, players: *}[]>}
 */
async function getGamesWithTheirPlayersSimple() {
    debugPrinter.printFunction(getGamesWithTheirPlayersSimple.name);

    const result = {
        status: null,
        message: null,
        games: null,
    };

    // May be empty
    const gameRowsSimple = await dbEngineGameUno.getGameRowsSimple();

    // May be empty
    const playerRows = await Promise.all(gameRowsSimple.map((gameRow) => dbEngineGameUno.getPlayerRowsJoinPlayersRowJoinGameRowByGameID(gameRow.game_id)));

    const gamesWithPlayersRows = gameRowsSimple.map((row, index) => ({
        game: row,
        players: playerRows[index],
    }));

    result.status = constants.SUCCESS;
    result.message = 'Games with their players was returned';
    result.games = gamesWithPlayersRows;

    return result;
}

gameUno.getGamesWithTheirPlayersSimple = getGamesWithTheirPlayersSimple;

/*
Return format
{
    status,
    message,
    games,
    players,
{
 */
/**
 * Notes:
 *      Do not use this in getGamesWithTheirPlayersSimple() because you will be making more db calls
 *
 *      This function is dependent on if the db is successful
 *
 * @param game_id
 * @returns {Promise<{game: *, players: *}>}
 */
async function getGameAndTheirPlayersByGameIDDetailed(game_id) {
    debugPrinter.printFunction(getGameAndTheirPlayersByGameIDDetailed.name);

    const result = {
        status: null,
        message: null,
        game: null,
        players: null,
    };

    // May be undefined
    const gameRow = await dbEngineGameUno.getGameRowByGameIDDetailed(game_id);

    // If Game Row does not exist
    if (!gameRow) {
        result.status = constants.FAILURE;
        result.message = `Game ${game_id} does not exist`;
        return result;
    }

    result.game = gameRow;

    // May be empty
    const playerRows = await dbEngineGameUno.getPlayerRowsJoinPlayersRowJoinGameRowByGameID(gameRow.game_id);

    if (!playerRows) {
        result.status = constants.FAILURE;
        result.message = `Error in game players for game ${game_id}`;
        return result;
    }
    result.players = playerRows;

    result.status = constants.SUCCESS;
    result.message = `Game ${game_id} and their returned`;

    return result;
}

gameUno.getGameAndTheirPlayersByGameIDDetailed = getGameAndTheirPlayersByGameIDDetailed;

async function getGame(game_id) {
    debugPrinter.printFunction(getGame.name);

    const result = {
        status: null,
        message: null,
        game: null,
    };

    // May be undefined
    const gameRow = await dbEngineGameUno.getGameRowByGameIDSimple(game_id);

    // If Game Row does not exist
    if (!gameRow) {
        result.status = constants.FAILURE;
        result.message = `Game ${game_id} does not exist`;
        return result;
    }

    result.game = gameRow;

    result.status = constants.SUCCESS;
    result.message = `Game ${game_id} returned`;

    return result;
}

gameUno.getGame = getGame;

/*
Return format
{
    status,
    message,
    game,
    player,
{
 */
/**
 * Join a game
 *
 * Notes:
 *      This function is dependent on if the db is successful
 *
 * @param game_id
 * @param user_id
 * @returns {Promise<*>}
 */
async function joinGameIfPossible(game_id, user_id) {
    debugPrinter.printFunction(joinGameIfPossible.name);

    debugPrinter.printDebug(`game_id: ${game_id} user_id: ${user_id}`);

    const result = {
        status: null,
        message: null,
        game: null,
        player: null,
    };

    const gameRow = await dbEngineGameUno.getGameRowByGameIDDetailed(game_id);

    // Check if game exists
    if (!gameRow) {
        result.status = constants.FAILURE;
        result.message = `Game ${game_id} does not exist`;
        return result;
    }

    result.game = gameRow;

    // If game is active
    if (gameRow.is_active) {
        result.status = constants.FAILURE;
        result.message = `Game ${game_id} is active`;
        return result;
    }

    // Get player given game_id and user_id (May be undefined)
    const playerRowExists = await dbEngineGameUno.getPlayerRowJoinPlayersRowJoinGameRowByGameIDAndUserID(game_id, user_id);

    debugPrinter.printDebug(playerRowExists);

    // If player is exists for the user for the game
    if (playerRowExists) {
        result.status = constants.FAILURE;
        result.message = `Player already exists for game ${game_id}`;
        result.player = playerRowExists;
        return result;
    }

    // Create Player (May be undefined)
    const playerRowNew = await dbEngineGameUno.createPlayerRowAndCreatePlayersRow(user_id, game_id);

    // If player row was not made
    if (!playerRowNew) {
        result.status = constants.FAILURE;
        result.message = `Player could not be made for game ${game_id}`;
        return result;
    }

    result.status = constants.SUCCESS;
    result.message = `Player ${playerRowNew.player_id} was made for game ${game_id}`;
    result.player = playerRowNew;

    return result;
}

gameUno.joinGameIfPossible = joinGameIfPossible;

/*
Return format
{
    status,
    message,
    game,
    player,
{
 */
/**
 * Leave a game
 *
 * Notes:
 *      This function is dependent on if the db is successful
 *
 * @param game_id
 * @param user_id
 * @returns {Promise<*>}
 */
async function leaveGame(game_id, user_id) {
    debugPrinter.printFunction(leaveGame.name);

    const result = {
        status: null,
        message: null,
        game: null,
        player: null,
    };

    const gameRow = await dbEngineGameUno.getGameRowByGameIDDetailed(game_id);

    if (!gameRow) {
        result.status = constants.FAILURE;
        result.message = `Game ${game_id} does not exist`;
        return result;
    }

    // May be undefined
    const playerRow = await dbEngineGameUno.getPlayerRowJoinPlayersRowJoinGameRowByGameIDAndUserID(game_id, user_id);

    // If playerRow does not exist
    if (!playerRow) {
        result.status = constants.FAILURE;
        result.message = `Player ${playerRow.player_id} does not exist for game ${game_id}`;
        return result;
    }

    if (playerRow.player_id === gameRow.player_id_host) {
        // May be empty
        result.game = await dbEngineGameUno.deleteGameRow(game_id); // Will also delete players in game
        result.message = `Game ${game_id} was removed and player ${playerRow.player_id} was removed`;
    } else {
        // May be empty
        result.player = await dbEngineGameUno.deletePlayerRowByPlayerID(playerRow.player_id);
        result.message = `Player ${playerRow.player_id} was removed from game ${game_id}`;
    }

    result.status = constants.SUCCESS;

    return result;
}

gameUno.leaveGame = leaveGame;

//
// /**
//  * Given an array, shuffle it
//  *
//  * @param array
//  * @returns {Promise<*>}
//  */
// async function shuffleArray(array) {
//     let itemTemp;
//
//     // eslint-disable-next-line no-plusplus
//     for (let i = array.length - 1; i > 0; i--) {
//         const indexRandom = Math.floor(Math.random() * (i + 1));
//
//         itemTemp = array[i];
//
//         // Swap items at index location
//         // eslint-disable-next-line no-param-reassign
//         array[i] = array[indexRandom];
//         // eslint-disable-next-line no-param-reassign
//         array[indexRandom] = itemTemp;
//     }
//     return array;
// }
//
// /**
//  * Generate the initial cards for a game
//  *
//  * Notes:
//  *      Create Player Row
//  *      Create Game Row
//  *
//  *      Create Players Row (Link Player Row to Game Row. The first player should be the host)
//  *
//  *      Create Card Rows
//  *          Create Card Rows based on Card.card_id and CardInfo.card_info_id
//  *          Create Cards Rows based on Card.card_id and Game.game_id
//  *          Create Collection Rows based on Card.card_id and CollectionInfo.collection_info_id
//  *
//  * @param game_id
//  * @returns {Promise<void>}
//  */
// async function createGame(user_id) {
//     debugPrinter.printFunction(createGame.name);
//     debugPrinter.printDebug(user_id);
//
//     // FIXME: WARNING: DANGEROUS AND NOT ACID PROOF
//
//     const playerRow = await dbEngineGameUno.createPlayerRow(user_id);
//     debugPrinter.printDebug(playerRow);
//
//     const gameRow = await dbEngineGameUno.createGameRow(playerRow.player_id);
//     debugPrinter.printDebug(gameRow);
//
//     const playersRow = await dbEngineGameUno.createPlayersRow(gameRow.game_id, playerRow.player_id);
//     debugPrinter.printDebug(playersRow);
//
//     const cardRows = await dbEngineGameUno.createCardRowsAndCardsRows(gameRow.game_id, 2);
//     debugPrinter.printDebug(cardRows);
//
//     // TODO: ADDING TO THE Collection IS NOT WRITTEN, WRITE THE ALGO TO SHUFFLE THE CARDS IN THE DECk
//     // dbEngineGameUno.createCollectionRow(card_id, collection_info_id, collection_index);
//
//     const cardRowsShuffled = await shuffleArray(cardRows);
//     const collection = await Promise.all(cardRowsShuffled.map((element, index) => dbEngineGameUno.createCollectionRow(cardRowsShuffled[index].card_id, 1, index)));
//
//     return {
//         player: playerRow,
//         game: gameRow,
//         players: playersRow,
//         cardRows,
//         collection,
//     };
// }

// gameUno.createGame = createGame;

/*
Return Format
{
    status,
    message,
    player,
    game,
    players,
}
 */
/**
 * Generate the initial cards for a game
 *
 * Notes:
 *      Order:
 *          Create Player Row
 *          Create Game Row (Set the player_id_host of the game to the player_id of the Player row)
 *
 *          Create Players Row
 *
 * @param user_id
 */
async function createGameV2(user_id) {
    debugPrinter.printFunction(createGameV2.name);

    const result = {
        status: null,
        message: null,
        player: null,
        game: null,
        players: null,
    };

    // FIXME: WARNING: DANGEROUS, NOT ACID PROOF

    // May be undefined
    const playerRow = await dbEngineGameUno.createPlayerRow(user_id);
    debugPrinter.printDebug(playerRow);

    if (!playerRow) {
        result.status = constants.FAILURE;
        result.message = 'Could not create player row when creating game';
        return result;
    }
    result.game = playerRow;

    // May be undefined
    const gameRow = await dbEngineGameUno.createGameRow(playerRow.player_id);
    debugPrinter.printDebug(gameRow);

    if (!gameRow) {
        result.status = constants.FAILURE;
        result.message = 'Could not create game row when creating game';
        return result;
    }
    result.game = gameRow;

    // May be undefined
    const playersRow = await dbEngineGameUno.createPlayersRow(gameRow.game_id, playerRow.player_id);
    debugPrinter.printDebug(playersRow);

    if (!playersRow) {
        result.status = constants.FAILURE;
        result.message = 'Could not create players row when creating game, game will be deleted';

        await dbEngineGameUno.deleteGameRow(gameRow); // For safety, remove the game

        return result;
    }

    result.players = playersRow;

    result.status = constants.SUCCESS;
    result.message = 'Player, game, and players were created';

    return result;
}

gameUno.createGameV2 = createGameV2;

/*
{
    status,
    message,
    game,
    cards,
}
 */
/**
 * Start the game
 *
 * IMPORTANT NOTES:
 *      DO NOT RETURN THE RESULT OF THIS FUNCTION TO USERS BECAUSE IT RETURNS EVERYTHING ABOUT THE CARDS
 *
 * Notes:
 *      Order:
 *          Get the game row
 *          Set game to active
 *
 *          Create Card Rows
 *              Create Card Rows based on Card.card_id and CardInfo.card_info_id
 *              Create Cards Rows based on Card.card_id and Game.game_id
 *              Create Collection Rows based on Card.card_id and CollectionInfo.collection_info_id
 *                  (Cards are randomized)
 *
 *
 * @param game_id
 * @param player_id
 * @returns {Promise<null|{game: null, message: null, status: null}>}
 */
async function startGame(game_id, player_id, deckMultiplier) {
    debugPrinter.printFunction(startGame.name);

    // TODO: Assign player_index to players so you know the turn order. Maybe do this because we can use the player_id instead

    const result = {
        status: null,
        message: null,
        game: null,
        cards: null,
    };

    const gameRow = await dbEngineGameUno.getGameRowByGameIDDetailed(game_id);

    if (!gameRow) {
        result.status = constants.FAILURE;
        result.message = `Game ${game_id} does not exist`;
        return result;
    }

    result.game = gameRow;

    if (gameRow.player_id_host !== player_id) {
        result.status = constants.FAILURE;
        result.message = `Player is not the host for game ${game_id}`;
        return result;
    }

    // If player_id is host and if game is not active, make it active
    if (gameRow.is_active === true) {
        result.status = constants.FAILURE;
        result.message = `Game ${game_id} is already active`;
        return result;
    }

    await dbEngineGameUno.updateGameIsActiveByGameID(game_id, true);

    // May be empty
    const cardRows = await dbEngineGameUno.createCardRowsAndCardsRowsAndCollectionRowsWithCollectionRandomized(gameRow.game_id, deckMultiplier);
    debugPrinter.printDebug(cardRows);

    // Basically if cards not created
    if (!cardRows.length) {
        result.status = constants.FAILURE;
        result.message = `Cards could not be made for game ${game_id}, game ${game_id} will be deleted`;

        await dbEngineGameUno.deleteGameRow(gameRow); // For safety, remove the game

        return result;
    }

    result.cards = cardRows; // In this case, cardsRows is not cards, but cardRows is cards

    result.status = constants.SUCCESS;
    result.message = `Game ${game_id} has started`;

    return result;
}

gameUno.startGame = startGame;

/*
game_state

Notes:
    This should not show any information about the actual cards, but only for the

{
    status,
    message,
    game:
        {
            game_id,
            is_active,
            player_id_current_turn,
            is_clockwise,
            player_id_host,
        },
    players:
        [
            {
                display_name,
                game_id,
                num_loss,
                num_wins,
                player_id,
                user_id,
                collection:
                    [
                        {collection_index: 0},
                        {collection_index: 1},
                        {collection_index: 2},
                        {collection_index: 3},
                        {collection_index: 4},
                        ...
                    ]
            },
            ...
        ],
    collection_draw:
        [
            {collection_index: 0},
            {collection_index: 1},
            {collection_index: 2},
            {collection_index: 3},
            {collection_index: 4},
            ...
        ],
    collection_play:
        [
            {
                game_id,
                card_info_type,
                card_color,
                card_content,
                player_id: null,
                collection_index,
                card_id,
                collection_info_id,
                card_info_id,
                collection_info_type,
            },
            ...
        ]

}
 */

/**
 * Get game state by game_id
 *
 * @param game_id
 * @returns {Promise<{game: *, players: *}>}
 */
async function getGameState(game_id) {
    const result = {
        status: null,
        message: null,
        game: null,
        players: null,
        collection_draw: null,
        collection_play: null,
    };

    // May be undefined
    const gameRow = await dbEngineGameUno.getGameRowByGameIDDetailed(game_id);

    // If Game Row does not exist
    if (!gameRow) {
        result.status = constants.FAILURE;
        result.message = `Game ${game_id} does not exist`;
        return result;
    }

    result.game = gameRow;

    // May be empty
    const playerRows = await dbEngineGameUno.getPlayerRowsJoinPlayersRowJoinGameRowByGameID(gameRow.game_id);

    result.players = playerRows;

    // eslint-disable-next-line no-restricted-syntax
    for (const playerRow of playerRows) {
        // eslint-disable-next-line no-await-in-loop
        playerRow.collection = await dbEngineGameUno.getCollectionCollectionIndexRowsByPlayerID(playerRow.player_id);
    }

    // May be empty
    result.collection_draw = await dbEngineGameUno.getCollectionByGameIDAndCollectionInfoID(game_id, 1);

    // May be empty
    result.collection_play = await dbEngineGameUno.getCollectionByGameIDAndCollectionInfoID(game_id, 2);

    result.status = constants.SUCCESS;
    result.message = 'Game state was successful';

    // Game state
    return result;
}

gameUno.getGameState = getGameState;

async function moveCardDrawToHandHelper(game_id, playerRow) {
    const result = {
        status: null,
        message: null,
        player: null,
        collection: null,
    };

    // If player is exists for the user for the game
    if (!playerRow) {
        result.status = constants.FAILURE;
        result.message = `Player does not exist for game ${game_id}`; // Short circuit because the playerRow is based on the game_id (don't need to check if game exists)
        return result;
    }
    result.player = playerRow;

    const collectionRow = await dbEngineGameUno.updateCollectionRowDrawToHandByPlayerID(game_id, playerRow.player_id);

    if (!collectionRow) {
        result.status = constants.FAILURE;
        result.message = `Error in updating player ${playerRow.player_id}'s collection`;
        return result;
    }
    result.collection = collectionRow;

    result.status = constants.SUCCESS;
    result.message = `A card from DRAW's collection moved to player ${playerRow.player_id}'s collection for Game ${game_id}`; // TODO FIX THEN

    return result;
}

/*
{
    status,
    message,
    player,
    collection,
}
 */
async function moveCardDrawToHandByGameIDAndPlayerID(game_id, player_id) { // TODO ADD MORE GUARDING AND ERROR CHECKING ETC
    debugPrinter.printFunction(moveCardDrawToHandByGameIDAndPlayerID.name);

    // Get player given game_id and user_id (May be undefined)
    const playerRow = await dbEngineGameUno.getPlayerRowJoinPlayersRowJoinGameRowByPlayerID(player_id);

    return moveCardDrawToHandHelper(game_id, playerRow);
}

gameUno.moveCardDrawToHandByGameIDAndPlayerID = moveCardDrawToHandByGameIDAndPlayerID;

/*
{
    status,
    message,
    player,
    collection,
}
 */
async function moveCardDrawToHandByGameIDAndUserID(game_id, user_id) {
    debugPrinter.printFunction(moveCardDrawToHandByGameIDAndUserID.name);

    // Get player given game_id and user_id (May be undefined)
    const playerRow = await dbEngineGameUno.getPlayerRowJoinPlayersRowJoinGameRowByGameIDAndUserID(game_id, user_id);

    return moveCardDrawToHandHelper(game_id, playerRow);
}

gameUno.moveCardDrawToHandByGameIDAndUserID = moveCardDrawToHandByGameIDAndUserID;

async function moveCardDrawToPlay(game_id) { // TODO ADD MORE GUARDING AND ERROR CHECKING ETC
    debugPrinter.printFunction(moveCardDrawToPlay.name);

    const result = {
        status: null,
        message: null,
        game: null,
        collection: null,
    };

    // May be undefined
    const gameRow = await dbEngineGameUno.getGameRowByGameIDDetailed(game_id);

    // If Game Row does not exist
    if (!gameRow) {
        result.status = constants.FAILURE;
        result.message = `Game ${game_id} does not exist`;
        return result;
    }

    const collectionRow = await dbEngineGameUno.updateCollectionRowDrawToPlay(game_id);

    if (!collectionRow) {
        result.status = constants.FAILURE;
        result.message = `Error in updating PLAY's collection for Game ${game_id}`; // TODO FIX THEN
        return result;
    }
    result.collection = collectionRow;

    result.status = constants.SUCCESS;
    result.message = `A card from DRAW's collection moved to PLAY's collection for Game ${game_id}`; // TODO FIX THEN

    return result;
}

gameUno.moveCardDrawToPlay = moveCardDrawToPlay;

async function moveCardHandToPlay(game_id, user_id, collection_index) {
    debugPrinter.printFunction(moveCardHandToPlay.name);

    const result = {
        status: null,
        message: null,
        player: null,
        collection: null,
    };

    // Get player given game_id and user_id (May be undefined)
    const playerRow = await dbEngineGameUno.getPlayerRowJoinPlayersRowJoinGameRowByPlayerID(game_id, user_id);

    // If player is exists for the user for the game
    if (!playerRow) {
        result.status = constants.FAILURE;
        result.message = `Player does not exist for game ${game_id}`; // Short circuit because the playerRow is based on the game_id (don't need to check if game exists)
        return result;
    }
    result.player = playerRow;

    const collectionRow = await dbEngineGameUno.updateCollectionRowHandToPlay(game_id, collection_index, playerRow.player_id);

    if (!collectionRow) {
        result.status = constants.FAILURE;
        result.message = `Error in updating PLAY's collection for Game ${game_id}`;
        return result;
    }
    result.collection = collectionRow;

    result.status = constants.SUCCESS;
    result.message = `A card from ${playerRow.player_id}'s collection moved to PLAY's collection for Game ${game_id}`;

    return result;
}

gameUno.moveCardHandToPlay = moveCardHandToPlay;

async function getHand(game_id, user_id) {
    debugPrinter.printFunction(getHand.name);

    const result = {
        status: null,
        message: null,
        player: null,
        collection: null,
    };

    const gameRow = await dbEngineGameUno.getGameRowByGameIDDetailed(game_id);

    // Check if game exists
    if (!gameRow) {
        result.status = constants.FAILURE;
        result.message = `Game ${game_id} does not exist`;
        return result;
    }

    result.game = gameRow;

    // Get player given game_id and user_id (May be undefined)
    const playerRow = await dbEngineGameUno.getPlayerRowJoinPlayersRowJoinGameRowByGameIDAndUserID(game_id, user_id);

    // If player is exists for the user for the game
    if (!playerRow) {
        result.status = constants.FAILURE;
        result.message = `Player does not exist for game ${game_id}`; // Short circuit because the playerRow is based on the game_id (don't need to check if game exists)
        return result;
    }
    result.player = playerRow;

    // May be undefined
    const collectionRow = await dbEngineGameUno.getCollectionRowByPlayerID(playerRow.player_id);

    // If player is exists for the user for the game
    if (!collectionRow) {
        result.status = constants.FAILURE;
        result.message = `Collection does not exist for player ${playerRow.player_id}`;
        return result;
    }

    result.status = constants.SUCCESS;
    result.message = `Player ${playerRow.player_id} has gotten their hand`;

    result.collection = collectionRow;

    return result;
}

gameUno.getHand = getHand;

async function getPlayerDetailed(game_id, user_id) {
    debugPrinter.printFunction(getPlayerDetailed.name);

    const result = {
        status: null,
        message: null,
        player: null,
    };

    // Get player given game_id and user_id (May be undefined)
    const playerRow = await dbEngineGameUno.getPlayerRowJoinPlayersRowJoinGameRowByGameIDAndUserID(game_id, user_id);

    // If player is exists for the user for the game
    if (!playerRow) {
        result.status = constants.FAILURE;
        result.message = `Player does not exist for game ${game_id}`; // Short circuit because the playerRow is based on the game_id (don't need to check if game exists)
        return result;
    }
    result.player = playerRow;

    result.status = constants.SUCCESS;
    result.message = `Player ${playerRow.player_id} was returned`;

    return result;
}

gameUno.getPlayerDetailed = getPlayerDetailed;

async function setGamePlayerIDHost(game_id, user_id) {
    debugPrinter.printFunction(setGamePlayerIDHost.name);

    const result = {
        status: null,
        message: null,
        game: null,
        player: null,
    };

    // Get player given game_id and user_id (May be undefined)
    const playerRow = await dbEngineGameUno.getPlayerRowJoinPlayersRowJoinGameRowByGameIDAndUserID(game_id, user_id);

    // If player is exists for the user for the game
    if (!playerRow) {
        result.status = constants.FAILURE;
        result.message = `Player does not exist for game ${game_id}`;

        return result;
    }
    result.player = playerRow;

    result.game = await dbEngineGameUno.updateGamePlayerIDHostByGameID(game_id, playerRow.player_id);

    result.status = constants.SUCCESS;
    result.message = `Player ${playerRow.player_id} is not the host of game ${game_id}`;

    return result;
}

gameUno.setGamePlayerIDHost = setGamePlayerIDHost;

async function setGamePlayerIDCurrentTurn(game_id, user_id) {
    debugPrinter.printFunction(setGamePlayerIDCurrentTurn.name);

    const result = {
        status: null,
        message: null,
        game: null,
        player: null,
    };

    const gameRow = await dbEngineGameUno.getGameRowByGameIDDetailed(game_id);

    // Check if game exists
    if (!gameRow) {
        result.status = constants.FAILURE;
        result.message = `Game ${game_id} does not exist`;
        return result;
    }

    result.game = gameRow;

    // Get player given game_id and user_id (May be undefined)
    const playerRow = await dbEngineGameUno.getPlayerRowJoinPlayersRowJoinGameRowByGameIDAndUserID(game_id, user_id);

    // If player is exists for the user for the game
    if (!playerRow) {
        result.status = constants.FAILURE;
        result.message = `Player does not exist for game ${game_id}`;
        return result;
    }
    result.player = playerRow;

    result.game = await dbEngineGameUno.updateGameIsClockwiseByGameID(game_id, playerRow.player_id);

    result.status = constants.SUCCESS;
    result.message = `It is Player ${playerRow.player_id}'s turn for game ${game_id}`;

    return result;
}

gameUno.setGamePlayerIDCurrentTurn = setGamePlayerIDCurrentTurn;

module.exports = gameUno;

// TODO REASSIGN player_index WHEN A PLAYER IS OUT. BASCIALLY WHEN THEY CALLED UNO AND THEY ARE NOT A PLAYER IN THE ACTUAL PLAYING OF THE GAME
// TODO SET CURRENT TURN PLAYER ID
// TODO SET CLOCKWISE
// TODO CHANGE HOST
// TODO some route about calling Uno

/// //////////
// TODO Automatic Change Host when main host leaves
// TODO ON Start game ASSIGN PLAYER INDEX
// TODO Automatically change player turn
