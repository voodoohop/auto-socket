
const portfinder = require('portfinder');
const nodeCleanup = require('node-cleanup');
const Observable = require("zen-observable");

async function unpublish() {
    console.log("unpublishing");
    await new Promise(bonjour.unpublishAll)
}

nodeCleanup(unpublish);

// 1 hour default time-to-live
const DEFAULT_TTL = 60 * 60;

const bonjour = require('bonjour')();

async function createService({ type, metadata, name = null, isUnique = true }) {
    if (!name)
        name = `${process.title}_${type}`;

    if (isUnique)
        name = `${name}_${process.pid}`;

    const host = os.hostname();
    const port = await portfinder.getPortPromise();
    const socket = io.listen(port);

    bonjour.publish({ name, type, port, host, txt: metadata });
    setInterval(async () => {
        await unpublish();
        bonjour.publish({ name, type, port, host })
    }, DEFAULT_TTL);
    return socket;
}

function findService({ type, local = true }) {
    const host = local ? os.hostname() : undefined;
    return new Observable(observer => bonjour.find({ type, host }, observer));
}

function findServiceOnce({ type, local = true }) {
    const host = local ? os.hostname() : undefined;
    return new Promise(resolver => bonjour.find({ type, host }, resolver));
}

module.exports = { createService, findService, findServiceOnce };