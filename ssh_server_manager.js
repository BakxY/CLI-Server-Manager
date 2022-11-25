// exec("start cmd /c ssh root@192.168.50.132")
const fs = require('fs');
const os = require('os');
const { exit } = require('process');
const readline = require('readline')

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

function onlySpaces(str) 
{
    return str.trim().length === 0
}

function isIp(str)
{
    const regexExp = /^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])$/gi
    return regexExp.test(str)
}

async function mainList()
{
    console.clear()
    console.log('------------ SSH SERVER MANAGER ------------\n')

    var savedServers = {}
    var configPresent = false

    if(await fs.existsSync(os.homedir() + '\\.ssh\\saved_servers'))
    {
        console.log(' Used config file: ~/.ssh/saved_servers\n')

        console.log('------------------ SERVER ------------------\n')
        
        const localSavedServers = await JSON.parse(await fs.promises.readFile(os.homedir() + '\\.ssh\\saved_servers', 'utf8'))

        var id = 1

        for(var server in localSavedServers)
        {
            savedServers[server] = localSavedServers[server]
            savedServers[server]['id'] = id
            console.log(' ' + id + ': ' + server)
            id++
        }
        savedServers = localSavedServers

        console.log('')

        configPresent = true
    }
    else
    {
        console.log(' No config file found\n')
    }

    return { savedServers, configPresent }
}

async function listOptions(configPresent)
{
    /* 
    * All Options:
    * ConServer = Connect to server
    * AddServer = Add a new server to the config
    * DelServer = Remove a server from the config
    * InfServer = Info about a server
    * CluCom = Execute a command on all given servers
    * Exit = Leave the script
    */
    console.log('----------------- OPTIONS ------------------\n')

    var optionId = 1
    var options = {}

    if(configPresent)
    {
        console.log(' ' + optionId + ': Connect to server via SSH')
        options[optionId] = 'ConServer'
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

function idToOption(options, id)
{
    if(options.hasOwnProperty(id))
    {
        return options[id]
    }
    else
    {
        return 'invOpt'
    }
}

async function displayMessage(message)
{
    console.log('\n' + message)
}

async function conToServer(Servers)
{
    
}

async function addServer(savedServers)
{
    var getInfoMessage = '\n'
    do {
        await mainList()
        console.log('------------- ADD NEW SERVER ---------------')
        displayMessage(getInfoMessage)
        var serverName = await readCli(' Server name: ')

        getInfoMessage = ' Name is already in use!\n'
        if(onlySpaces(serverName))
        {
            getInfoMessage = ' Name can\'t be blank!\n'
        }
        console.log(serverName)
        console.log(savedServers)
    } while(savedServers.hasOwnProperty(serverName) || onlySpaces(serverName))

    getInfoMessage = '\n\n Server name: ' + serverName

    do
    {
        await mainList()
        console.log('------------- ADD NEW SERVER ---------------')
        displayMessage(getInfoMessage)
        var serverIp = await readCli(' Server IP: ')

        getInfoMessage = ' Enter valid IP!\n\n Server name: ' + serverName
    } while(!isIp(serverIp))

    getInfoMessage = '\n\n Server name: ' + serverName + '\n Server IP: ' + serverIp + '\n\n Server was saved to config file'

    savedServers[serverName] = {
        'ip': serverIp
    }
    fs.writeFileSync(os.homedir() + '\\.ssh\\saved_servers', JSON.stringify(savedServers));

    await mainList()
    console.log('------------- ADD NEW SERVER ---------------')
    displayMessage(getInfoMessage)
}

function checkForId(Servers, id)
{
    for(var server in Servers)
    {
        if(Servers[server]['id'] == id)
        {
            return true
        }
    }
    return false
}

function idToServer(Servers, id)
{
    for(var server in Servers)
    {
        if(Servers[server]['id'] == id)
        {
            return server
        }
    }
    return null
}

async function infoServer(Servers)
{
    do
    {
        var idValid = true

        await mainList()
        console.log('--------------- SERVER INFO ----------------\n')
        var serverId = await readCli(' Server ID: ')
        if(parseInt(serverId) == NaN)
        {
            idValid = false
        }

        if(!checkForId(Servers, serverId))
        {
            idValid = false
        }
    } while(!idValid)

    await mainList()
    console.log('--------------- SERVER INFO ----------------\n')

    const server = idToServer(Servers, serverId)

    var optionsMessage = ' Name: ' + server + '\n IP: ' + Servers[server]['ip']

    displayMessage(optionsMessage)
    await readCli('')
}

async function delServer(Servers)
{
    do
    {
        var idValid = true

        await mainList()
        console.log('-------------- DELETE SERVER ---------------\n')
        var serverId = await readCli(' Server ID: ')
        if(parseInt(serverId) == NaN)
        {
            idValid = false
        }

        if(!checkForId(Servers, serverId))
        {
            idValid = false
        }
    } while(!idValid)

    var delOpt
    var server

    do
    {
        var idValid = true

        await mainList()
        console.log('-------------- DELETE SERVER ---------------')

        server = idToServer(Servers, serverId)

        var optionsMessage = ' Name: ' + server + '\n IP: ' + Servers[server]['ip']

        displayMessage(optionsMessage)
        delOpt = await readCli('\n Delete this server (y/n): ')

        if(delOpt == 'y' || delOpt == 'n')
        {
            idValid = false
        }
    } while(idValid)

    var optionsMessage = ' Aborted'

    if(delOpt == 'y')
    {
        delete Servers[server]
        optionsMessage = ' Server was removed'
    }

    fs.writeFileSync(os.homedir() + '\\.ssh\\saved_servers', JSON.stringify(Servers));

    await mainList()
    console.log('-------------- DELETE SERVER ---------------')
    displayMessage(optionsMessage)
    await readCli('')
}

async function cluCom(Servers)
{
    
}

async function exitScr(Servers)
{
    console.clear()
    console.log('\n Left the ssh manager script')
}

function OptToFunc(option)
{
    const funcList = {
        'ConServer': conToServer,
        'AddServer': addServer,
        'InfServer': infoServer,
        'DelServer': delServer,
        'CluCom': cluCom,
        'Exit': exitScr
    }

    return funcList[option]
}

const readCli = prompt => {
    return new Promise((resolve, reject) => {
        rl.question(prompt, resolve)
    })
}

async function main()
{
    while(true)
    {
        var optionsMessage = ' Please choose one of the above'
        
        do {
            var { savedServers, configPresent } = await mainList()
            var options = await listOptions(configPresent)
            displayMessage(optionsMessage)
            var option = await readCli(' - ')
        } while(idToOption(options, option) == 'invOpt')
        optFunc = await OptToFunc(idToOption(options, option))
        await optFunc(savedServers)
        if(idToOption(options, option) == 'Exit')
        {
            exit();
        }
    }
}

main()