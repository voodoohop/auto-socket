
const portfinder = require('portfinder');
const nodeCleanup = require('node-cleanup');

async function unpublish() {
    console.log("unpublishing");
    await new Promise(bonjour.unpublishAll)
}

nodeCleanup(unpublish);

// 1 hour default time-to-live
const DEFAULT_TTL = 60 * 60;

const bonjour = require('bonjour')();

async function createService() {

    const host = os.hostname();
    const port = await portfinder.getPortPromise();
    const socket = io.listen(port);

    let intervalHandle = -1;
    return {
        socket,
        publish: ({ type, txt, name = null, isUnique = true }) => {
            if (!name)
                name = `${process.title}_${type}`;
            if (isUnique)
                name = `${name}_${process.pid}`;

            const publishParams = { name, type, port, host, txt };
            bonjour.publish(publishParams);

            if (intervalHandle > 0)
                clearInterval(intervalHandle);

            intervalHandle = setInterval(async () => {
                await unpublish();
                bonjour.publish(publishParams);
            }, DEFAULT_TTL);
        }
    }
    return socket;
}

function findService({ type, local = true }, callback) {
    const host = local ? os.hostname() : undefined;
    bonjour.find({ type, host }, callback);
}

function findServiceOnce({ type, local = true }) {
    const host = local ? os.hostname() : undefined;
    return new Promise(resolver => bonjour.find({ type, host }, resolver));
}

module.exports = { createService, findService, findServiceOnce };