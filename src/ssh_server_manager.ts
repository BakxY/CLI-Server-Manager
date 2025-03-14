import { Function } from "estree"

const fs = require('fs')
const os = require('os')
const { exit } = require('process')
const { exec } = require("child_process")
const readline = require('readline')

const regexExp = /^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])$/gi

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
})

type server = {

}

//If your private key is in a different location, you can change the path here
const SSHPrivateKeyPath = "%userprofile%/.ssh/id_rsa.ppk"

function onlySpaces(str: string): boolean {
    return str.trim().length === 0
}

function isIp(str: string): boolean {
    return regexExp.test(str)
}

async function readCli(question: string): Promise<string> {
    return new Promise((resolve, reject) => {
        rl.question(question, resolve)
    })
}

async function sleep(time: number): Promise<unknown> {
    return new Promise((resolve, reject) => {
        setTimeout(resolve, time)
    })
}

async function mainList() {
    console.clear()
    console.log('------------ SSH SERVER MANAGER ------------\n')

    var savedServers: any = {}
    var configPresent: boolean = false

    if (await fs.existsSync(os.homedir() + '\\.ssh\\saved_servers')) {
        console.log(' Used config file: ~/.ssh/saved_servers\n')

        console.log('------------------ SERVER ------------------\n')

        const localSavedServers = await JSON.parse(await fs.promises.readFile(os.homedir() + '\\.ssh\\saved_servers', 'utf8'))

        var id = 1

        for (var server in localSavedServers) {
            savedServers[server] = localSavedServers[server]
            savedServers[server]['id'] = id
            console.log(' ' + id + ': ' + server)
            id++
        }
        savedServers = localSavedServers

        console.log('')

        configPresent = true
    }
    else {
        console.log(' No config file found\n')
    }

    return { savedServers, configPresent }
}

async function listOptions(configPresent: any) {
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
    console.log('----------------- OPTIONS ------------------\n')

    var optionId = 1
    var options: any = {}

    if (configPresent) {
        console.log(' ' + optionId + ': Connect to server via SSH')
        options[optionId] = 'ConServer'
        optionId++

        console.log(' ' + optionId + ': Connect to server via SFTP')
        options[optionId] = 'ConSFTP'
        optionId++
    }

    console.log(' ' + optionId + ': Add new server')
    options[optionId] = 'AddServer'
    optionId++

    console.log(' ' + optionId + ': Info about server')
    options[optionId] = 'InfServer'
    optionId++

    console.log(' ' + optionId + ': Remove server')
    options[optionId] = 'DelServer'
    optionId++

    console.log(' ' + optionId + ': Cluster command')
    options[optionId] = 'CluCom'
    optionId++

    console.log(' ' + optionId + ': Exit')
    options[optionId] = 'Exit'
    optionId++

    return options
}

function idToOption(options: any, id: string): string {
    if (options.hasOwnProperty(id)) {
        return options[id]
    }
    else {
        return 'invOpt'
    }
}

async function displayMessage(message: string) {
    console.log('\n' + message)
}

async function conToServer(Servers: any): Promise<void> {
    var serverId: string
    do {
        var idValid: boolean = true

        await mainList()
        console.log('--------------- SERVER INFO ----------------\n')
        serverId = await readCli(' Server ID: ')
        if (Number.isNaN(serverId)) {
            idValid = false
        }

        if (!checkForId(Servers, serverId)) {
            idValid = false
        }
    } while (!idValid)

    exec("start cmd /c ssh " + Servers[idToServer(Servers, serverId)]['user'] + "@" + Servers[idToServer(Servers, serverId)]['ip'])
}

async function conSFTP(Servers: any) {
    var serverId

    do {
        var idValid = true

        await mainList()
        console.log('--------------- SERVER INFO ----------------\n')
        serverId = await readCli(' Server ID: ')
        if (Number.isNaN(serverId)) {
            idValid = false
        }

        if (!checkForId(Servers, serverId)) {
            idValid = false
        }
    } while (!idValid)

    exec("WinSCP.exe " + Servers[idToServer(Servers, serverId)]['user'] + "@" + Servers[idToServer(Servers, serverId)]['ip'] + ' /privatekey=' + SSHPrivateKeyPath)
}

async function addServer(savedServers: any) {
    var getInfoMessage = '\n'
    do {
        await mainList()
        console.log('------------- ADD NEW SERVER ---------------')
        displayMessage(getInfoMessage)
        var serverName = await readCli(' Server name: ')

        getInfoMessage = ' Name is already in use!\n'
        if (onlySpaces(serverName)) {
            getInfoMessage = ' Name can\'t be blank!\n'
        }
        console.log(serverName)
        console.log(savedServers)
    } while (savedServers.hasOwnProperty(serverName) || onlySpaces(serverName))

    getInfoMessage = '\n\n Server name: ' + serverName

    do {
        await mainList()
        console.log('------------- ADD NEW SERVER ---------------')
        displayMessage(getInfoMessage)
        var serverIp = await readCli(' Server IP: ')

        getInfoMessage = ' Enter valid IP!\n\n Server name: ' + serverName
    } while (!isIp(serverIp))

    getInfoMessage = '\n\n Server name: ' + serverName + '\n Server IP: ' + serverIp

    await mainList()
    console.log('------------- ADD NEW SERVER ---------------')
    displayMessage(getInfoMessage)
    var serverUsername = await readCli(' Server Username: ')

    getInfoMessage = '\n\n Server name: ' + serverName + '\n Server IP: ' + serverIp + '\n Username: ' + serverIp + '\n\n Server was saved to config file'

    savedServers[serverName] = {
        'ip': serverIp,
        'user': serverUsername
    }
    fs.writeFileSync(os.homedir() + '\\.ssh\\saved_servers', JSON.stringify(savedServers));

    await mainList()
    console.log('------------- ADD NEW SERVER ---------------')
    displayMessage(getInfoMessage)
}

function checkForId(Servers: any, id: string) {
    for (var server in Servers) {
        if (Number.parseInt(Servers[server]['id']) === Number.parseInt(id)) {
            return true
        }
    }
    return false
}

function idToServer(Servers: any, id: string): string {
    for (var server in Servers) {
        if (Number.parseInt(Servers[server]['id']) === Number.parseInt(id)) {
            return server
        }
    }
    return ''
}

async function infoServer(Servers: any) {
    do {
        var idValid = true

        await mainList()
        console.log('--------------- SERVER INFO ----------------\n')
        var serverId: string = await readCli(' Server ID: ')
        if (Number.isNaN(serverId)) {
            idValid = false
        }

        if (!checkForId(Servers, serverId)) {
            idValid = false
        }
    } while (!idValid)

    await mainList()
    console.log('--------------- SERVER INFO ----------------\n')

    const server = idToServer(Servers, serverId)

    var optionsMessage = ' Name: ' + server + '\n IP: ' + Servers[server]['ip'] + '\n User: ' + Servers[server]['user']

    displayMessage(optionsMessage)
    await readCli('')
}

async function delServer(Servers: any) {
    do {
        var idValid = true

        await mainList()
        console.log('-------------- DELETE SERVER ---------------\n')
        var serverId = await readCli(' Server ID: ')
        if (Number.isNaN(serverId)) {
            idValid = false
        }

        if (!checkForId(Servers, serverId)) {
            idValid = false
        }
    } while (!idValid)

    var delOpt
    var server

    do {
        var idValid = true

        await mainList()
        console.log('-------------- DELETE SERVER ---------------')

        server = idToServer(Servers, serverId)

        var optionsMessage = ' Name: ' + server + '\n IP: ' + Servers[server]['ip']

        displayMessage(optionsMessage)
        delOpt = await readCli('\n Delete this server (y/n): ')

        if (delOpt == 'y' || delOpt == 'n') {
            idValid = false
        }
    } while (idValid)

    var optionsMessage = ' Aborted'

    if (delOpt == 'y') {
        delete Servers[server]
        optionsMessage = ' Server was removed'
    }

    fs.writeFileSync(os.homedir() + '\\.ssh\\saved_servers', JSON.stringify(Servers));

    await mainList()
    console.log('-------------- DELETE SERVER ---------------')
    displayMessage(optionsMessage)
    await sleep(500)
}

async function cluCom(Servers: any) {
    var serverIdList: any

    do {
        var idValid = true

        await mainList()
        console.log('------------- CLUSTER COMMAND --------------\n')
        serverIdList = await readCli(' Server IDs (sep. by ,): ')
        serverIdList = serverIdList.split(',')

        for (var id in serverIdList) {
            if (Number.isNaN(serverIdList[id])) {
                idValid = false
            }

            if (!checkForId(Servers, serverIdList[id])) {
                idValid = false
            }
        }
    } while (!idValid)

    var command

    do {
        var execCommand = true

        await mainList()
        console.log('------------- CLUSTER COMMAND --------------\n')
        command = await readCli(' Command: ')

        await mainList()
        console.log('------------- CLUSTER COMMAND --------------\n')
        var execOpt = await readCli(' Do you want to execute "' + command + '" on every selected server (y/n): ')
        if (execOpt != 'y') {
            execCommand = false
        }
    } while (!execCommand)

    for (var id in serverIdList) {
        console.log(Servers[idToServer(Servers, serverIdList[id])]['ip'])
        console.log(idToServer(Servers, serverIdList[id]))

        var titleString = 'Cluster command on ' + idToServer(Servers, serverIdList[id])
        var conString = 'cmd /k "echo off && cls && ssh ' + Servers[idToServer(Servers, serverIdList[id])]['user'] + '@' + Servers[idToServer(Servers, serverIdList[id])]['ip']

        exec('start "' + titleString + '" ' + conString + ' ' + command + '; echo ------------------- DONE -------------------; exit"')
    }
}

async function exitScr(Servers: any) {
    console.clear()
    console.log('\n Left the ssh manager script')
}

async function main() {
    while (true) {
        var optionsMessage: string = ' Please choose one of the above'

        do {
            var { savedServers, configPresent } = await mainList()
            var options = await listOptions(configPresent)
            displayMessage(optionsMessage)
            var option: string = await readCli(' - ')
        } while (idToOption(options, option) == 'invOpt')

        switch (idToOption(options, option)) {
            case 'ConServer': await conToServer(savedServers); break;
            case 'ConSFTP': await conSFTP(savedServers); break;
            case 'AddServer': await addServer(savedServers); break;
            case 'InfServer': await infoServer(savedServers); break;
            case 'DelServer': await delServer(savedServers); break;
            case 'CluCom': await cluCom(savedServers); break;
            case 'Exit': await exitScr(savedServers); break;
            default: break
        }

        if (idToOption(options, option) == 'Exit') {
            exit();
        }
    }
}

main()