require('dotenv').config();

const log_prefix = '(LookingGlass-Daemon)';

if (!process.env.NODE_NAME) {
    console.log(`${log_prefix} Missing key "NODE_NAME" in .env. It must be a string, without spaces, containing the node name.`);
    process.exit(1);
}
if (!process.env.NODE_COUNTRY) {
    console.log(`${log_prefix} Missing key "NODE_COUNTRY" in .env. It must be a two character string containing the node's country ISO-3166-2 code.`);
    process.exit(1);
}
if (process.env.NODE_COUNTRY.length !== 2) {
    console.log(`${log_prefix} Invalid value for key "NODE_COUNTRY" in .env. It must be a two character string containing the node's country ISO-3166-2 code.`);
    process.exit(1);
}
if (!process.env.DAEMON_PORT) {
    console.log(`${log_prefix} Missing key "DAEMON_PORT" in .env. It must be the port the daemon will listen on.`);
    process.exit(1);
}
if (!process.env.SSL_ENABLE) {
    console.log(`${log_prefix} Missing key "SSL_ENABLE" in .env. It must be either "true" or "false".`);
    process.exit(1);
}
if (process.env.SSL_ENABLE !== "true" && process.env.SSL_ENABLE !== "false") {
    console.log(`${log_prefix} Invalid value for key "SSL_ENABLE" in .env. It must be either "true" or "false".`);
    process.exit(1);
}
if (process.env.SSL_ENABLE === "true" && !process.env.SSL_CERTIFICATE) {
    console.log(`${log_prefix} Missing key "SSL_CERTIFICATE" in .env. With SSL enabled it must contain the path to the SSL certificate.`);
    process.exit(1);
}
if (process.env.SSL_ENABLE === "true" && !process.env.SSL_KEY) {
    console.log(`${log_prefix} Missing key "SSL_KEY" in .env. With SSL enabled it must contain the path to the SSL certificate private key.`);
    process.exit(1);
}

const fs = require('fs');
const fastify = require('fastify')({
    logger: true,
    ...(process.env.SSL_ENABLE === "true" && { https: {
        key: fs.readFileSync(process.env.SSL_CERTIFICATE),
        cert: fs.readFileSync(process.env.SSL_CERTIFICATE)
    } })
});
const { spawn } = require('child_process');
const isIp = require('is-ip');
const isValidDomain = require('is-valid-domain')

fastify.get('/', async (request, reply) => {
    return {
        status: 'OK',
        node: {
            name: process.env.NODE_NAME,
            country: process.env.NODE_COUNTRY.toLowerCase(),
            city: process.env.NODE_CITY,
            secure: (process.env.SSL_ENABLE === "true") ? true : false
        }
    }
});

fastify.post('/run', (request, reply) => {
    const { command, payload } = request.body;
    if (isIp(payload) || isValidDomain(payload)) {
        let cmd = "/bin/ping"
        let args = [ "-c", "4", payload ]

        switch(command) {
            case "mtr":
                args = [ "-4", "-c", "4", "--report", "--report-wide", payload ]
                cmd = "/bin/mtr";
                break;
            case "mtr6":
                args = [ "-6", "-c", "4", "--report", "--report-wide", payload ]
                cmd = "/bin/mtr";
                break;
            case "traceroute":
                args = [ "-4", "-w2", payload ]
                cmd = "/bin/traceroute";
                break;
            case "traceroute6":
                args = [ "-6", "-w2", payload ]
                cmd = "/bin/traceroute";
                break;
            case "ping":
                args = [ "-c", "4", "-w15", payload ]
                cmd = "/bin/ping";
                break;
            case "ping6":
                args = [ "-c", "4", "-w15", payload ]
                cmd = "/bin/ping6";
                break;
        }
    
        let subprocess = spawn(cmd, args);
        let stderr = '';
        let stdout = '';
        subprocess.stdout.on('data', function(data) {
            stdout += data;
        });
        subprocess.stderr.on('data', function(data) {
            stderr += data;
        });
        subprocess.on('close', function(exitCode) {
            reply.code(200).send({
                success: true,
                code: 700,
                stdout,
                stderr
            });
        });
    }
    else {
        reply.code(400).send({
            success: false,
            code: 701,
            error: 'Invalid IP address / hostname.'
        });
    }
});

const start = async () => {
    try {
        await fastify.listen(process.env.DAEMON_PORT, '0.0.0.0')
    } catch (err) {
        fastify.log.error(err)
        process.exit(1)
    }
}
start();