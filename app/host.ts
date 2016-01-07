var worker = new Worker("robot.js");
function init(bot:string) {
    console.log(bot);
    worker.postMessage({"msg":"newBot", "bot":bot});
}

worker.addEventListener('message', function(e) {
    document.getElementById('result').textContent = "Hello world!";
}, false);