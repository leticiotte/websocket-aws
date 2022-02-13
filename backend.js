const AWS = require('aws-sdk')
const endpoint = ''
const client = new AWS.ApiGatewayManagementApi({ endpoint })
let names = {}

exports.handler = async (event) => {
    console.log(event)
    if (event.requestContext) {
        const connectionId = event.requestContext.connectionId
        const routeKey = event.requestContext.routeKey

        let body = {}
        if(event && event.body){
            body = JSON.parse(event.body)
        }
        switch (routeKey) {
            case '$connect':
                break;
            case '$disconnect':
                await sendMessageToAll(Object.keys(names), { systemMessage: `${names[connectionId]} has left the chat.`})
                delete names[connectionId]
                await sendMessageToAll(Object.keys(names), { members: Object.values(names) })
                break;
            case '$default':
                break;
            case 'setName':
                names[connectionId] = body.name
                console.log(names)
                await sendMessageToAll(Object.keys(names), { members: Object.values(names) })
                await sendMessageToAll(Object.keys(names), { systemMessage: `${names[connectionId]} has joined the chat.` })
                break;
            case 'sendPublic':
                console.log(names)
                await sendMessageToAll(Object.keys(names), { publicMessage: `${names[connectionId]}: ${body.message}` })
                break;
            case 'sendPrivate':
                console.log(names)
                const messageToConnectionId = Object.keys(names).find(key => names[key] === body.to)
                console.log(messageToConnectionId)
                await sendMessageToUser(messageToConnectionId, { privateMessage: `${names[connectionId]}: ${body.message}`})
                break;

            default:
                // code
        }
    }



    const response = {
        statusCode: 200,
        body: JSON.stringify('Hello from Lambda!'),
    };
    return response;
};

async function sendMessageToAll(users, message) {
    console.log(users)
    const all = users.map(i => sendMessageToUser(i, message))
    return Promise.all(all)
}

async function sendMessageToUser(user, message) {
    try {
        await client.postToConnection({
            'ConnectionId': user,
            'Data': Buffer.from(JSON.stringify(message)),
        }).promise()
    }
    catch (e) {
        console.error(e)
    }
}
