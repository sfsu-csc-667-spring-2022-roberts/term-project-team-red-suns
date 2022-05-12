/* eslint-disable linebreak-style */
const constants_game_uno = {};

constants_game_uno.CARD_COLOR_BLACK = 'black';
constants_game_uno.CARD_COLOR_GREEN = 'green';
constants_game_uno.CARD_COLOR_YELLOW = 'yellow';
constants_game_uno.CARD_COLOR_RED = 'red';
constants_game_uno.CARD_COLOR_BLUE = 'blue';
constants_game_uno.NUMBER = 'NUMBER';
constants_game_uno.SPECIAL = 'SPECIAL';
constants_game_uno.SPECIALS_CONTENT_SKIP = 'skip';
constants_game_uno.SPECIALS_CONTENT_REVERSE = 'reverse';
constants_game_uno.SPECIALS_CONTENT_DRAWTWO = 'drawTwo';
constants_game_uno.SPECIALS_CONTENT_WILD = 'wild';
constants_game_uno.SPECIALS_CONTENT_WILDFOUR = 'wildFour';

constants_game_uno.LEGAL_COLORS = [
    constants_game_uno.CARD_COLOR_BLUE,
    constants_game_uno.CARD_COLOR_RED,
    constants_game_uno.CARD_COLOR_GREEN,
    constants_game_uno.CARD_COLOR_YELLOW,
    constants_game_uno.CARD_COLOR_BLACK,
];

module.exports = constants_game_uno;