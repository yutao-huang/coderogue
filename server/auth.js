import bcrypt from 'bcrypt';
import crypto from 'crypto';

import Util from '../shared/util.js';

export default class Auth {
    constructor(server) {
        this.server = server;
    }

    async login(credentials) {
        let [dbEntry] = await this.server.db.getPlayerByEmail(credentials.email);
        if (!dbEntry) {
            await this.createAccount(credentials);
            [dbEntry] = await this.server.db.getPlayerByEmail(credentials.email);
            await this.server.game.addPlayer(dbEntry);
        } else if (!dbEntry.password) {
            await this.setPassword(dbEntry.id, credentials);
            [dbEntry] = await this.server.db.getPlayerByEmail(credentials.email);
        }
        if (!await bcrypt.compare(credentials.password, dbEntry.password)) {
            return { error: "Incorrect password" };
        }
        let playerId = dbEntry.id;
        let authToken = dbEntry.auth_token;
        let textHandle = Util.getTextHandle(dbEntry.handle);
        return { playerId, authToken, textHandle };
    }

    async createAccount(credentials) {
        // TODO: This will need to change in order to validate accounts.
        const email = credentials.email;
        const password = await bcrypt.hash(credentials.password, 10);
        const authToken = crypto.randomBytes(16).toString('hex');
        let playerId = await this.server.db.addPlayer(email, password, authToken);
        let handle = this.server.game.createNewHandle();
        await this.server.db.updatePlayer(playerId, 0, handle);
    }

    async setPassword(id, credentials) {
        let password = await bcrypt.hash(credentials.password, 10);
        await this.server.db.setPassword(id, password)
    }
}