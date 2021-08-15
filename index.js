const { spawn } = require('child_process');
const isIp = require('is-ip');
const express = require('express');
const app = express();

app.use(express.urlencoded({
    extended: true
}));
app.use(express.static('assets'));
app.set('view engine', 'ejs');
app.disable('x-powered-by');

app.get('/', (req, res) => {
    res.render('home');
});

app.post('/', (req, res) => {
    const { command, payload } = req.body;

    if (!isIp(payload) || !isValidDomain(payload)) {
        return res.render('err', {
            err: 'Invalid IP address / hostname'
        });
    }

    let cmd = "/bin/ping"

    switch(command) {
        case "mtr":
            cmd = "/bin/mtr";
            break;
        case "traceroute":
            cmd = "/bin/traceroute";
            break;
        case "ping":
            cmd = "/bin/ping";
            break;
        default:
            cmd = "/bin/ping";
    }

    let subprocess = spawn(cmd, [ payload ]);
    let stderr = '';
    let stdout = '';
    subprocess.stdout.on('data', function(data) {
        stdout += data;
    });
    subprocess.stderr.on('data', function(data) {
        stderr += data;
    });
    subprocess.on('close', function(exitCode) {
        res.render('out', {
            stdout,
            stderr
        });
    });
});

app.listen(2750, () => {
    console.log('Listening on port 2750');
});