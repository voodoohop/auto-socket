
const portfinder = require('portfinder');
const nodeCleanup = require('node-cleanup');
const os = require("os");
const bonjour = require('bonjour')();

// 1 hour default time-to-live
const DEFAULT_TTL = 60 * 60 * 1000;

const host = os.hostname();

nodeCleanup(_unpublish);

/**
 * Find a free port and set up automatic broadcasting via bonjour
 * @param  {} serviceDescription=null Service configuration
 * @param  {} serviceDescription.isUnique True if multiple services of the same name are allowed to coexist
 * @param  {} serviceDescription.name The service name. This is not used for discovery
 * @param  {} serviceDescription.type The service type. This is used for discovery.
 * @param  {} serviceDescription.txt Additional metadata to pass in the DNS TXT field
 */
async function prepareService() {
    const port = await portfinder.getPortPromise();
    let intervalHandle = -1;
    let alreadyPublished = false;

    const publish = async ({ type, txt, name = null, isUnique = true }) => {
        if (name === null)
            name = `${type}`;
        if (isUnique)
            name = `${name}_${process.pid}`;

        const publishParams = { name, type, port, host, txt };

        if (alreadyPublished)
            await _unpublish();

        console.log("Publishing", publishParams);
        bonjour.publish(publishParams);
        alreadyPublished = true;

        if (intervalHandle > 0)
            clearInterval(intervalHandle);

        intervalHandle = setInterval(async () => {
            console.log("Republishing service.");
            await _unpublish();
            bonjour.publish(publishParams);
        }, DEFAULT_TTL);
    }

    return { publish, port };
}

/**
 * find a service that matches the given type.
 * @param  {} options options
 * @param  {string} options.type The type of service
 * @param  {object} options.txt Metadata
 * @param  {boolean} options.local=true Whether to look only on the local host for services
 * @param  {func} callback Callback which is called any time a new service is found that satistfies the query
 */
function findService({ type, txt, local = true }, callback) {

    if (local)
        callback = _filterLocal(callback);

    bonjour.find({ type, txt }, callback);
}

/**
 * Same as findService but returns a promise that resolves as soon as a service is found that meets the requirements
 * @param  {} options
 */
function findServiceOnce(options) {
    return new Promise(resolver => findService(options, resolver));
}


const _filterLocal = callback => service => {
    if (service.host === host)
        callback(service);
}


async function _unpublish() {
    console.log("unpublishing");
    try {
        await new Promise(resolve => bonjour.unpublishAll(resolve));
    } catch (e) {
        console.error("Couldn't unpublish but continuing.");
        console.error(e);
    }
}


module.exports = { prepareService, findService, findServiceOnce };