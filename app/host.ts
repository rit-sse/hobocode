var worker = new Worker("robot.js");
function helloWorld() {
    console.log(worker);
    worker.postMessage({"start":"Woo"});
}

worker.addEventListener('message', function(e) {
    document.getElementById('result').textContent = "Hello world!";
}, false);