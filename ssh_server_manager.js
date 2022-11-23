// exec("start cmd /c ssh root@192.168.50.132")
const fs = require('fs');
const os = require('os')
const readline = require('readline')

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

async function mainList()
{
    console.clear()
    console.log('------------ SSH SERVER MANAGER ------------\n')

    var savedServers = {}

    if(await fs.existsSync(os.homedir() + '\\.ssh\\saved_servers'))
    {
        console.log('Used config file: ~/.ssh/saved_servers\n')

        console.log('------------------ SERVER ------------------\n')

        const localSavedServers = await JSON.parse(await fs.promises.readFile(os.homedir() + '\\.ssh\\saved_servers', 'utf8'))

        var id = 1

        for(var server in localSavedServers)
        {
            console.log('\t' + id + ': ' + localSavedServers[server]['name'])
            savedServers[id] = localSavedServers[server]
            id++
        }

        console.log('')
    }
    else
    {
        console.log('No config file found\n')
    }

    return savedServers
}

async function listOptions(Servers)
{
    /* 
    * All Options:
    * ConServer = Connect to server
    * AddServer = Add a new server to the config
    * DelServer = Remove a server from the config
    * InfServer = Info about a server
    * CluCom = Execute a command on all given servers
    */
    console.log('----------------- OPTIONS ------------------\n')

    var optionId = 1
    var options = {}

    if(Servers != {})
    {
        console.log(optionId + ': Connect to server via SSH')
        options[optionId] = 'ConServer'
        optionId++
    }

    console.log(optionId + ': Add new server')
    options[optionId] = 'AddServer'
    optionId++

    console.log(optionId + ': Info about server')
    options[optionId] = 'InfServer'
    optionId++

    console.log(optionId + ': Remove server')
    options[optionId] = 'DelServer'
    optionId++

    console.log(optionId + ': Cluster command')
    options[optionId] = 'CluCom'
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

async function conToServer()
{
    
}

const readCli = prompt => {
    return new Promise((resolve, reject) => {
        rl.question(prompt, resolve)
    })
}

async function main()
{
    do {
        var Servers = await mainList()
        var options = await listOptions(Servers)
        var option = await readCli('\n- ')
    } while(idToOption(options, option) == 'invOpt')
    
}

main()