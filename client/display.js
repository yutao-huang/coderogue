import AsciiMap from './ascii_map.js';
import NewMap from './new_map.js';

const alertLevels = [
    'alert-success',
    'alert-secondary',
    'alert-warning',
    'alert-danger',
];

const numPlayersToRender = 12;

export default class Display {
    constructor(client) {
        this.client = client;
        this.asciiMap = new AsciiMap(client, 'canvas');
        this.newMap = new NewMap(client, 'canvas');
        this.map = this.asciiMap;
        this.levelToRender = 0;
        this.renderedPlayers = [];
        this.messageNumber = 0;
        this.freezeLog = false;
        this.messagesToShow = 'all';
    }

    async start() {
        await this.asciiMap.start();
        await this.newMap.start();
        this.createPlayerRows();
    }

    createPlayerRows() {
        this.table = document.getElementById('players');
        for (let i = 0; i < numPlayersToRender; i++) {
            let row = this.table.insertRow();
            for (let j = 0; j < 6; j++) {
                row.insertCell();
            }
            row.onclick = () => this.highlightPlayer(i);
        }
    }

    setState(state) {
        this.players = [];
        for (let player of state.players) {
            if (player) this.players[player.id] = player;
        }
        this.levels = state.levels;
        this.render();
    }

    render() {
        if (this.highlightedPlayer) {
            let playerLevel = this.players[this.highlightedPlayer].level;
            if (playerLevel != 'jail') this.levelToRender = playerLevel;
        }
        let level = this.levels[this.levelToRender];
        this.renderTitle(level.name);
        this.map.render(level.map, this.players);
        this.renderPlayers(this.players);
    }

    renderTitle(name) {
        let span = document.getElementById('level');
        span.removeChild(span.firstChild);
        span.appendChild(document.createTextNode(this.levelToRender));
        span = document.getElementById('level-name');
        span.removeChild(span.firstChild);
        span.appendChild(document.createTextNode(name));
    }

    renderPlayers(players) {
        this.renderedPlayers = this.findPlayersToRender(players);
        for (let i = 0; i < numPlayersToRender; i++) {
            let row = this.table.rows[i + 1];
            if (i < this.renderedPlayers.length) {
                row.classList.remove('hidden');
                let player = this.renderedPlayers[i];
                let cols = ['rank', 'score', 'level', 'handle', 'kills', 'deaths'];
                for (let j = 0; j < cols.length; j++) {
                    row.cells[j].innerHTML = player[cols[j]];
                }
                if (player.id == this.highlightedPlayer) {
                    row.classList.add('highlighted');
                } else {
                    row.classList.remove('highlighted');
                }
            } else {
                row.classList.add('hidden');
            }
        }
    }

    findPlayersToRender(players) {
        let result = [];
        if (this.client.credentials.playerId) {
            result.push(players[this.client.credentials.playerId]);
        }
        if (this.highlightedPlayer && this.highlightedPlayer != this.client.credentials.playerId) {
            result.push(players[this.highlightedPlayer]);
        }
        let topPlayers = players.filter(p => p);
        topPlayers.sort((a, b) => b.score - a.score);
        topPlayers.forEach((p, i) => p.rank = i + 1);
        for (let player of topPlayers) {
            if (result.some(p => p.id == player.id)) continue;
            result.push(player);
            if (result.length >= numPlayersToRender) break;
        }
        result.sort((a, b) => a.rank - b.rank);
        return result;
    }

    highlightPlayer(index) {
        this.toggleHighlight(this.renderedPlayers[index].id);
    }

    highlightTile(x, y) {
        this.toggleHighlight(this.map.getPlayerAt(x, y));
    }

    toggleHighlight(playerId) {
        if (!playerId) return;
        if (playerId == this.highlightedPlayer) {
            delete this.highlightedPlayer;
        } else {
            this.highlightedPlayer = playerId;
        }
        this.render();
    }

    setCode(code) {
        const codeArea = document.getElementById('code-text');
        codeArea.value = code;
    }

    getCode() {
        return document.getElementById('code-text').value;
    }

    setCodeCursor(cursor) {
        document.getElementById('code-text').selectionStart = cursor;
        document.getElementById('code-text').selectionEnd = cursor;
    }

    getCodeCursor() {
        return document.getElementById('code-text').selectionStart;
    }

    isShowingLogTab() {
        const logTab = document.getElementById('log-tab');
        return logTab.classList.contains('active');
    }

    setLog(log) {
        const logArea = document.getElementById('log-text');
        logArea.value = this.filterLog(log);
    }

    toggleFreeze() {
        let button = document.getElementById('freeze').classList.toggle('active');
        this.freezeLog = !this.freezeLog;
    }

    showAll() {
        document.getElementById('show-all').classList.add('active');
        document.getElementById('show-latest').classList.remove('active');
        document.getElementById('show-filtered').classList.remove('active');
        this.messagesToShow = 'all';
    }

    showLatest() {
        document.getElementById('show-all').classList.remove('active');
        document.getElementById('show-latest').classList.add('active');
        document.getElementById('show-filtered').classList.remove('active');
        this.messagesToShow = 'latest';
    }

    showFiltered() {
        document.getElementById('show-all').classList.remove('active');
        document.getElementById('show-latest').classList.remove('active');
        document.getElementById('show-filtered').classList.add('active');
        this.messagesToShow = 'filtered';
    }

    filterLog(log) {
        let lines = log.split('\n');
        let filter = '';
        if (this.messagesToShow == 'latest' && lines.length > 0) {
            filter = lines[lines.length - 1].slice(0, 8);
        }
        if (this.messagesToShow == 'filtered') {
            filter = document.getElementById('filter-text').value;
        }
        lines = lines.filter(line => line.includes(filter));
        lines.reverse();
        return lines.join('\n');
    }

    onMouseEnter() {
        document.getElementById('coords').classList.add('show');
    }

    onMouseMove(x, y) {
        let [col, row] = this.map.getPosAt(x, y);
        document.getElementById('x-coord').innerHTML = col;
        document.getElementById('y-coord').innerHTML = row;
    }

    onMouseLeave() {
        document.getElementById('coords').classList.remove('show');
    }

    showLoggedIn() {
        document.getElementById('login-form').classList.add('d-none');
        document.getElementById('logout-form').classList.remove('d-none');
        document.getElementById('handle').innerHTML = this.client.credentials.handle;
    }

    showLoggedOut() {
        document.getElementById('login-form').classList.remove('d-none');
        document.getElementById('logout-form').classList.add('d-none');
    }

    switchTab(dir) {
        let navLinks = document.getElementsByClassName('nav-link');
        let activeIndex = 0;
        for (let i = 0; i < navLinks.length; i++) {
            if (navLinks[i].classList.contains('active')) {
                activeIndex = i;
            }
        }
        let newIndex = (activeIndex + dir + navLinks.length) % navLinks.length;
        navLinks[newIndex].click();
    }

    switchLevel(dir) {
        delete this.highlightedPlayer;
        this.levelToRender += dir;
        this.levelToRender = Math.max(this.levelToRender, 0);
        this.levelToRender = Math.min(this.levelToRender, this.levels.length - 1);
        this.render();
    }

    switchMap(dir) {
        switch (dir) {
            case -1: this.map = this.asciiMap; break;
            case 1: this.map = this.newMap; break;
        }
        this.render();
    }

    say(message, level) {
        const n = ++this.messageNumber;
        const div = document.getElementById('message');
        div.innerHTML = message;
        for (let level of alertLevels) {
            div.classList.remove(level);
        }
        div.classList.add(alertLevels[level]);
        div.classList.add('show');
        setTimeout(() => {
            if (this.messageNumber != n) return;
            div.classList.remove('show');
        }, 3000);
    }

    lookup(handle) {
        return this.renderedPlayers.find(p => p && p.handle == handle);
    }
}
