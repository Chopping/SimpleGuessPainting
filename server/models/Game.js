const util = require('../utils');
const Rx = require('rxjs/Rx');
const gameConfig = require('../resource/game-config');

const ClIENTS_MAP = global.CLIENTS_MAP;
function pickWord (wordList) {
    return wordList.splice(Math.random() * wordList.length | 0, 1)[0]
}

module.exports = class Game {
    constructor ({
            roundTime = gameConfig.roundTime,
            pendingTime = gameConfig.pendingTime,
            playerIdList,
            wordMatchScore = gameConfig.wordMatchScore,
            bankerScore = gameConfig.bankerScore,
            wordList,
        }) {


        this.rounds = 2;
        this.currentRound = 0;

        this.playersMap = new Map(Array.from(playerIdList).map(clientId => {
            let client = ClIENTS_MAP.get(clientId);
            let player = util.clientData(client);
            player.score = 0;
            player.online = true;
            return [client.id, player];
        }));
        this._bankerIdGenerator = this.playersMap.keys();
        this.bankerId = this._bankerIdGenerator.next().value;

        this.status = 'await';
        this.pendingTime = pendingTime;
        this.roundTime = roundTime;

        this.word = '';
        this.wordList = wordList.slice();
        this.wordMatched = [];
        this.wordMatchScore = wordMatchScore;

        this._roundTimer = 0;
        this.roundCountDown = 0;
        this._handler = {};

        this.canvasData = [];
    }
    broadcast ({ channel, data, exclude }) {
        this._emit('broadcast', { channel, data, exclude });
    }
    isPlayerInGame(client){
        let player = this.playersMap.get(client.id);
        return undefined != player;
    }
    playerLeave (client) {
        let player = this.playersMap.get(client.id);
        if (!player) return;
        player.online = false;
        // let isAllLeave = [...this.playersMap.values()].every(player => !player.online);
        // if (isAllLeave) {
        //     this.gameEnd();
        //     return;
        // }
        this.broadcast({ channel: 'setGamePlayers', data: util.map2Obj(this.playersMap) });
    }
    peopleConnect (client) { // todo
        let player = this.playersMap.get(client.id);
        client.io.emit('setGameStatus', this.status);
        client.io.emit('setGameCountDown', this.roundCountDown);
        client.io.emit('setGameBanker', util.clientData(ClIENTS_MAP.get(this.bankerId)));
        if (client.id === this.bankerId || this.status === 'pending') {
            client.io.emit('roundWord', this.word);
        }
        client.io.emit('initCanvas', this.canvasData);
        if (!player) return;
        player.online = true;
        this.broadcast({ channel: 'setGamePlayers', data: util.map2Obj(this.playersMap) });
    }
    gameStart () {
        this.broadcast({ channel: 'setGamePlayers', data: util.map2Obj(this.playersMap) });
        this.roundStart();
    }
    matchWord (word, client) {
        if (this.status !== 'going') return; // 如果游戏不是正在进行 说明 异常了 xb
        if (this.word && word === this.word) {
            let playerId = client.id;

            // block banker
            if (client.id === this.bankerId) return;
            // block duplicate player
            if (this.wordMatched.includes(playerId)) return;
            // block bystander
            if(! this.isPlayerInGame)  return;

            let score = this.wordMatchScore[this.wordMatched.length]; 
            let player = this.playersMap.get(client.id);
            player.score += score;
            
            let sys_info = 'Congratulation! User' + player.info.name+' has answered correctly! he/she got '+score+' scores';

            this.broadcast({
                channel: 'updateGamePlayerScore',
                data: { playerId: client.id, score }
            });
          
            console.log(sys_info);
            // 用来提醒用户答对的 xb
            this.broadcast({
                channel: 'matchWord',
                data: { content:sys_info, timestamp: Date.now() },
            });

            this.wordMatched.push(playerId);

            // if all player matched or scores run out
            if (this.wordMatched.length >= this.wordMatchScore.length || this.wordMatched.length >= this.playersMap.size - 1) {
                this.roundEnd();
            }
        }
    }
    canvasStroke (client, data) {
        if (client.id !== this.bankerId) return;
        this.canvasData.push(data);
        this.broadcast({
            channel: 'canvasStroke',
            data,
            exclude: client.id
        });
    }
    roundStart () {
        this._roundTime$$ && this._roundTime$$.unsubscribe();

        this.status = 'going';

        let banker = ClIENTS_MAP.get(this.bankerId);
        this.broadcast({
            channel: 'setGameStatus',
            data: this.status
        });
        this.broadcast({
            channel: 'setGameBanker',
            data: util.clientData(banker)
        });
        this.word = pickWord(this.wordList);


        banker && banker.io.emit('roundWord', this.word);
        this.wordMatched = [];

        this.canvasData = [];

        this.roundCountDown = this.roundTime;
        this._roundTime$$ = Rx.Observable
            .interval(1000)
            .scan((acc) => acc - 1, this.roundTime)
            .do((countDown) => {
                this.roundCountDown = countDown;
                this.broadcast({
                    channel: 'setGameCountDown',
                    data: countDown
                });
                if (countDown <= 0) {
                    this.roundEnd();
                }
            })
            .subscribe();
    }
    roundEnd () {
        this._roundTime$$ && this._roundTime$$.unsubscribe();

        this.status = 'pending';
        this.broadcast({
            channel: 'setGameStatus',
            data: this.status
        });
        this.broadcast({
            channel: 'roundWord',
            data: this.word
        });

        let item = this._bankerIdGenerator.next();

        if (!item.value) {
            this.currentRound++;
            this._bankerIdGenerator = this.playersMap.keys();
            item = this._bankerIdGenerator.next();
        }

        this.bankerId = item.value;

        this.roundCountDown = this.pendingTime;
        this._roundTime$$ = Rx.Observable
            .interval(1000)
            .scan((acc) => acc - 1, this.pendingTime)
            .do((countDown) => {
                this.roundCountDown = countDown;
                this.broadcast({
                    channel: 'setGameCountDown',
                    data: countDown
                });



                if (countDown <= 0) {
                    if (this.currentRound >= this.rounds) {
                        this.gameEnd();
                        this.status = 'await';
                        this.broadcast({
                            channel: 'setGameStatus',
                            data: this.status
                        });
                        return;
                    }
                    this.roundStart();
                }
            })
            .subscribe();
    }
    gameEnd () {
        this._emit('gameEnd');
        this._roundTime$$ && this._roundTime$$.unsubscribe();
    }
    on (event, callback) {
        if (typeof callback !== 'function') {
            throw('callback must be a function');
        }
        if (!this._handler[event]) this._handler[event] = [];
        this._handler[event].push(callback);
    }
    _emit (event, params) {
        if (this._handler[event]) {
            this._handler[event].forEach(fn => fn(params));
        }
    }
};