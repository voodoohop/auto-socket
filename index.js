
const portfinder = require('portfinder');
const nodeCleanup = require('node-cleanup');
const io = require("socket.io");
const os = require("os");

const bonjour = require('bonjour')();

async function unpublish() {
    console.log("unpublishing");
    try {
        await new Promise(resolve => bonjour.unpublishAll(resolve));
    } catch (e) {
        console.error("Couldn't unpublish but continuing.");
        console.error(e);
    }
}

nodeCleanup(unpublish);

// 1 hour default time-to-live
const DEFAULT_TTL = 60 * 60 * 1000;

async function createService(serviceDescription = null) {

    const host = os.hostname();
    const port = await portfinder.getPortPromise();
    const socket = io.listen(port);

    let intervalHandle = -1;
    const publish = ({ type, txt, name = null, isUnique = true }) => {
        if (!name)
            name = `${process.title}_${type}`;
        if (isUnique)
            name = `${name}_${process.pid}`;

        const publishParams = { name, type, port, host, txt };
        bonjour.publish(publishParams);

        if (intervalHandle > 0)
            clearInterval(intervalHandle);

        intervalHandle = setInterval(async () => {
            console.log("Republishing service.");
            await unpublish();
            bonjour.publish(publishParams);
        }, DEFAULT_TTL);
    }

    if (serviceDescription !== null)
        publish(serviceDescription);

    return {
        socket,
        publish
    }
}

function findService({ type, local = true }, callback) {
    const host = local ? os.hostname() : undefined;
    bonjour.find({ type, host }, callback);
}

function findServiceOnce({ type, local = true }) {
    const host = local ? os.hostname() : undefined;
    return new Promise(resolver => bonjour.findOne({ type, host }, resolver));
}

module.exports = { createService, findService, findServiceOnce };