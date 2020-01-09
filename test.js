const auto_socket = require("./index");

const io = require("socket.io-client");

async function testService() {
    await auto_socket.createService({ type: "test_service" });
    const service = await auto_socket.findServiceOnce({ type: "test_service", local: true });
    console.log("Found service", service);
}

testService();
