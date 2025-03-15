import * as fs from 'fs';
import * as os from 'os';
import { exit } from 'process';
import { exec } from 'child_process';
import * as readline from 'readline';

const regexExp = /^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])$/gi;

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

type serverInfo = {
    ip: string;
    user: string;
    id: number;
}

type savedServers = {
    [name: string]: serverInfo;
}

//If your private key is in a different location, you can change the path here
const SSHPrivateKeyPath = "%userprofile%/.ssh/id_rsa.ppk";

function onlySpaces(str: string): boolean {
    return str.trim().length === 0;
}

function isIp(str: string): boolean {
    return regexExp.test(str);
}

async function readCli(question: string): Promise<string> {
    return new Promise((resolve) => {
        rl.question(question, resolve);
    });
}

async function sleep(time: number): Promise<unknown> {
    return new Promise((resolve) => {
        setTimeout(resolve, time);
    });
}

async function mainList() {
    console.clear();
    console.log('------------ SSH SERVER MANAGER ------------\n');

    let savedServers: savedServers = {};
    let configPresent: boolean = false;

    if (await fs.existsSync(os.homedir() + '\\.ssh\\saved_servers')) {
        console.log(' Used config file: ~/.ssh/saved_servers\n');

        console.log('------------------ SERVER ------------------\n');

        const localSavedServers = await JSON.parse(await fs.promises.readFile(os.homedir() + '\\.ssh\\saved_servers', 'utf8'));

        let id: number = 1;

        for (const server in localSavedServers) {
            savedServers[server] = localSavedServers[server];
            savedServers[server]['id'] = id;
            console.log(' ' + id + ': ' + server);
            id++;
        }
        savedServers = localSavedServers;

        console.log('');

        configPresent = true;
    }
    else {
        console.log(' No config file found\n');
    }

    return { savedServers: savedServers, configPresent: configPresent };
}

async function listOptions(configPresent: boolean) {
    /* 
    * All Options:
    * ConServer = Connect to server
    * ConServerSFTP = Connect to server via sftp
    * AddServer = Add a new server to the config
    * DelServer = Remove a server from the config
    * InfServer = Info about a server
    * CluCom = Execute a command on all given servers
    * Exit = Leave the script
    */
    console.log('----------------- OPTIONS ------------------\n');

    let optionId: number = 1;
    const options: string[] = [];

    if (configPresent) {
        console.log(' ' + optionId + ': Connect to server via SSH');
        options[optionId] = 'ConServer';
        optionId++;

        console.log(' ' + optionId + ': Connect to server via SFTP');
        options[optionId] = 'ConSFTP';
        optionId++;
    }

    console.log(' ' + optionId + ': Add new server');
    options[optionId] = 'AddServer';
    optionId++;

    console.log(' ' + optionId + ': Info about server');
    options[optionId] = 'InfServer';
    optionId++;

    console.log(' ' + optionId + ': Remove server');
    options[optionId] = 'DelServer';
    optionId++;

    console.log(' ' + optionId + ': Cluster command');
    options[optionId] = 'CluCom';
    optionId++;

    console.log(' ' + optionId + ': Exit');
    options[optionId] = 'Exit';
    optionId++;

    return options;
}

function idToOption(options: string[], id: string): string {
    if (options.hasOwnProperty(id)) {
        return options[Number.parseInt(id)];
    }
    else {
        return 'invOpt';
    }
}

async function displayMessage(message: string) {
    console.log('\n' + message);
}

async function conToServer(Servers: savedServers): Promise<void> {
    let serverId: string = '';
    let idValid: boolean = true;

    do {
        await mainList();
        console.log('--------------- SERVER INFO ----------------\n');
        serverId = await readCli(' Server ID: ');
        if (Number.isNaN(serverId)) {
            idValid = false;
        }

        if (!checkForId(Servers, serverId)) {
            idValid = false;
        }
    } while (!idValid);

    exec("start cmd /c ssh " + Servers[idToServer(Servers, serverId)]['user'] + "@" + Servers[idToServer(Servers, serverId)]['ip']);
}

async function conSFTP(Servers: savedServers) {
    let serverId: string = '';
    let idValid: boolean = true;

    do {
        await mainList();
        console.log('--------------- SERVER INFO ----------------\n');
        serverId = await readCli(' Server ID: ');
        if (Number.isNaN(serverId)) {
            idValid = false;
        }

        if (!checkForId(Servers, serverId)) {
            idValid = false;
        }
    } while (!idValid);

    exec("WinSCP.exe " + Servers[idToServer(Servers, serverId)]['user'] + "@" + Servers[idToServer(Servers, serverId)]['ip'] + ' /privatekey=' + SSHPrivateKeyPath);
}

async function addServer(savedServers: savedServers) {
    let getInfoMessage: string = '\n';
    const serverName: string = '';

    do {
        await mainList();
        console.log('------------- ADD NEW SERVER ---------------');
        displayMessage(getInfoMessage);
        const serverName = await readCli(' Server name: ');

        getInfoMessage = ' Name is already in use!\n';
        if (onlySpaces(serverName)) {
            getInfoMessage = ' Name can\'t be blank!\n';
        }
        console.log(serverName);
        console.log(savedServers);
    } while (savedServers.hasOwnProperty(serverName) || onlySpaces(serverName));

    getInfoMessage = '\n\n Server name: ' + serverName;

    let serverIp: string = '';

    do {
        await mainList();
        console.log('------------- ADD NEW SERVER ---------------');
        displayMessage(getInfoMessage);
        serverIp = await readCli(' Server IP: ');

        getInfoMessage = ' Enter valid IP!\n\n Server name: ' + serverName;
    } while (!isIp(serverIp));

    getInfoMessage = '\n\n Server name: ' + serverName + '\n Server IP: ' + serverIp;

    await mainList();
    console.log('------------- ADD NEW SERVER ---------------');
    displayMessage(getInfoMessage);
    const serverUsername = await readCli(' Server Username: ');

    getInfoMessage = '\n\n Server name: ' + serverName + '\n Server IP: ' + serverIp + '\n Username: ' + serverIp + '\n\n Server was saved to config file';

    savedServers[serverName] = {
        'id': NaN,
        'ip': serverIp,
        'user': serverUsername
    };
    fs.writeFileSync(os.homedir() + '\\.ssh\\saved_servers', JSON.stringify(savedServers));

    await mainList();
    console.log('------------- ADD NEW SERVER ---------------');
    displayMessage(getInfoMessage);
}

function checkForId(Servers: savedServers, id: string) {
    for (const server in Servers) {
        if (Servers[server]['id'] === Number.parseInt(id)) {
            return true;
        }
    }
    return false;
}

function idToServer(Servers: savedServers, id: string): string {
    for (const server in Servers) {
        if (Servers[server]['id'] === Number.parseInt(id)) {
            return server;
        }
    }
    return '';
}

async function infoServer(Servers: savedServers) {
    let serverId: string = '';
    let idValid: boolean = true;

    do {
        await mainList();
        console.log('--------------- SERVER INFO ----------------\n');
        serverId = await readCli(' Server ID: ');
        if (Number.isNaN(serverId)) {
            idValid = false;
        }

        if (!checkForId(Servers, serverId)) {
            idValid = false;
        }
    } while (!idValid);

    await mainList();
    console.log('--------------- SERVER INFO ----------------\n');

    const server = idToServer(Servers, serverId);

    const optionsMessage = ' Name: ' + server + '\n IP: ' + Servers[server]['ip'] + '\n User: ' + Servers[server]['user'];

    displayMessage(optionsMessage);
    await readCli('');
}

async function delServer(Servers: savedServers) {
    let serverId: string = '';
    let idValid: boolean = true;
    do {
        await mainList();
        console.log('-------------- DELETE SERVER ---------------\n');
        serverId = await readCli(' Server ID: ');
        if (Number.isNaN(serverId)) {
            idValid = false;
        }

        if (!checkForId(Servers, serverId)) {
            idValid = false;
        }
    } while (!idValid);

    let delOpt: string;
    let server: string;

    idValid = true;

    do {
        await mainList();
        console.log('-------------- DELETE SERVER ---------------');

        server = idToServer(Servers, serverId);

        const optionsMessage = ' Name: ' + server + '\n IP: ' + Servers[server]['ip'];

        displayMessage(optionsMessage);
        delOpt = await readCli('\n Delete this server (y/n): ');

        if (delOpt === 'y' || delOpt === 'n') {
            idValid = false;
        }
    } while (idValid);

    let optionsMessage = ' Aborted';

    if (delOpt === 'y') {
        delete Servers[server];
        optionsMessage = ' Server was removed';
    }

    fs.writeFileSync(os.homedir() + '\\.ssh\\saved_servers', JSON.stringify(Servers));

    await mainList();
    console.log('-------------- DELETE SERVER ---------------');
    displayMessage(optionsMessage);
    await sleep(500);
}

async function cluCom(Servers: savedServers) {
    let serverIdList: string[];
    let idValid: boolean = true;

    do {
        await mainList();
        console.log('------------- CLUSTER COMMAND --------------\n');
        serverIdList = (await readCli(' Server IDs (sep. by ,): ')).split(',');

        for (const id in serverIdList) {
            if (Number.isNaN(serverIdList[id])) {
                idValid = false;
            }

            if (!checkForId(Servers, serverIdList[id])) {
                idValid = false;
            }
        }
    } while (!idValid);

    let command: string = '';
    let execCommand: boolean = true;

    do {
        await mainList();
        console.log('------------- CLUSTER COMMAND --------------\n');
        command = await readCli(' Command: ');

        await mainList();
        console.log('------------- CLUSTER COMMAND --------------\n');
        const execOpt = await readCli(' Do you want to execute "' + command + '" on every selected server (y/n): ');
        if (execOpt !== 'y') {
            execCommand = false;
        }
    } while (!execCommand);

    for (const id in serverIdList) {
        console.log(Servers[idToServer(Servers, serverIdList[id])]['ip']);
        console.log(idToServer(Servers, serverIdList[id]));

        const titleString: string = 'Cluster command on ' + idToServer(Servers, serverIdList[id]);
        const conString: string = 'cmd /k "echo off && cls && ssh ' + Servers[idToServer(Servers, serverIdList[id])]['user'] + '@' + Servers[idToServer(Servers, serverIdList[id])]['ip'];

        exec('start "' + titleString + '" ' + conString + ' ' + command + '; echo ------------------- DONE -------------------; exit"');
    }
}

async function exitScr() {
    console.clear();
    console.log('\n Left the ssh manager script');
}

async function main() {
    while (true) {
        const optionsMessage: string = ' Please choose one of the above';
        let option: string = '';
        let options: string[] = [];
        let savedServers: savedServers = {};
        let configPresent: boolean = false;

        do {
            ({ savedServers: savedServers, configPresent: configPresent } = await mainList());
            options = await listOptions(configPresent);
            displayMessage(optionsMessage);
            option = await readCli(' - ');
        } while (idToOption(options, option) === 'invOpt');

        switch (idToOption(options, option)) {
            case 'ConServer': await conToServer(savedServers); break;
            case 'ConSFTP': await conSFTP(savedServers); break;
            case 'AddServer': await addServer(savedServers); break;
            case 'InfServer': await infoServer(savedServers); break;
            case 'DelServer': await delServer(savedServers); break;
            case 'CluCom': await cluCom(savedServers); break;
            case 'Exit': await exitScr(); break;
            default: break;
        }

        if (idToOption(options, option) === 'Exit') {
            exit();
        }
    }
}

main();