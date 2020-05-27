'use strict';
//Using express to make it easier to work with html
const express = require('express');
const bodyParser = require('body-parser');
const async = require('async');
const app = express();
const router = express.Router();
const timeOut = 10000;

//File system module to allow file operations
var fs = require('fs');

//Ethplorer
var address = '';
var transactDepth = 1;
var transactLimit = 5;
var count = 0;


const ethplorerClient = require('ethplorer-node');
const api_key = "freekey";
const client = new ethplorerClient(api_key);
const limit = "0";

//Routes to the index page
router.get('/', function (req, res) {
    res.sendFile(path.join(__dirname + '/Html/index.html'));
});

//Required to load other Html/Javascript/CSS files
app.use(express.static(__dirname + "/Html"));
app.use(express.static(__dirname + '/Css'));
app.use(express.static(__dirname + '/Script'));
app.use(express.static(__dirname + '/Json'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use('/', router);

var x_position_to = 0;
var y_position_to = 0;
var x_position_from = 0;
var y_position_from = 0;
var currentNode = 0;
var currentEdge = 0;
var firstTime = true;
var sigJson = '{"nodes" : [], "edges" : []}';
var sigObj = JSON.parse(sigJson);

function setSigma(data, firstData, current_depth) {
    if (firstTime == true) {

        sigObj.nodes[currentNode] = { "id": "n0", "label": "", "x": "0", "y": "0", "size": "6", "color": "#800080" };
        sigObj.nodes[currentNode].label = firstData.address;
        currentNode = currentNode + 1;
        y_position_to += 1;
        y_position_from -= 1;
        firstTime = false;
    }

    // Sets up the json file for graphing transactions
    if (current_depth >= 0) {

        let currNodeId = "";
        let From = "B";
        let To = "B";
        let nodeSize = 0;

        // Find node that already exists
        for (let a = 0; a < currentNode; a++) {
            if (sigObj.nodes[a].label == data[0].currentAddress) {
                currNodeId = sigObj.nodes[a].id;
            }
        }


        for (let i = 0; i < transactLimit; i++) {
            if (data[i] != null) {


                //From
                if (data[i].from !== data[i].currentAddress) {

                    for (let b = 0; b < currentNode; b++) {
                        if (sigObj.nodes[b].label == data[i].from) {
                            From = sigObj.nodes[b].id;
                        }
                    }

                    if (From != "B") {
                        sigObj.edges[currentEdge] = { "id": "null", "source": "null", "target": "null" };
                        sigObj.edges[currentEdge].id = "e" + currentEdge.toString();
                        sigObj.edges[currentEdge].source = currNodeId;
                        sigObj.edges[currentEdge].target = From;
                        currentEdge = currentEdge + 1;
                    }
                    else {
                        sigObj.nodes[currentNode] = { "id": "null", "label": "null", "x": "null", "y": "null", "size": "4", "color": "#FF0000" };
                        sigObj.nodes[currentNode].id = "n" + currentNode.toString();
                        sigObj.edges[currentEdge] = { "id": "null", "source": "null", "target": "null" };
                        sigObj.nodes[currentNode].label = data[i].from;
                        sigObj.edges[currentEdge].id = "e" + currentEdge.toString();
                        sigObj.edges[currentEdge].source = currNodeId;
                        sigObj.edges[currentEdge].target = sigObj.nodes[currentNode].id;
                        sigObj.nodes[currentNode].x = x_position_from.toString();
                        sigObj.nodes[currentNode].y = y_position_from.toString();
                        x_position_from += 1;
                        currentNode = currentNode + 1;
                        currentEdge = currentEdge + 1;
                    }
                }

                //To
                if (data[i].to !== data[i].currentAddress) {

                    for (let c = 0; c < currentNode; c++) {
                        if (sigObj.nodes[c].label == data[i].to) {
                            To = sigObj.nodes[c].id;
                        }
                    }

                    if (To != "B") {
                        sigObj.edges[currentEdge] = { "id": "null", "source": "null", "target": "null" };
                        sigObj.edges[currentEdge].id = "e" + currentEdge.toString();
                        sigObj.edges[currentEdge].source = To;
                        sigObj.edges[currentEdge].target = currNodeId;
                        currentEdge = currentEdge + 1;
                    }
                    else {
                        sigObj.nodes[currentNode] = { "id": "null", "label": "null", "x": "null", "y": "null", "size": "4", "color": "#008000" };
                        sigObj.nodes[currentNode].id = "n" + currentNode.toString();
                        sigObj.edges[currentEdge] = { "id": "null", "source": "null", "target": "null" };
                        sigObj.nodes[currentNode].label = data[i].to;
                        sigObj.edges[currentEdge].id = "e" + currentEdge.toString();
                        sigObj.edges[currentEdge].source = currNodeId
                        sigObj.edges[currentEdge].target = sigObj.nodes[currentNode].id;
                        sigObj.nodes[currentNode].x = x_position_to.toString();
                        sigObj.nodes[currentNode].y = y_position_to.toString();
                        x_position_to += 1;
                        currentNode = currentNode + 1;
                        currentEdge = currentEdge + 1;
                    }
                }
                From = "B";
                To = "B";
                
            }
        }
        x_position_from += 1;
        x_position_to += 1;
        y_position_to = current_depth + 2;
        y_position_from = (current_depth * -1) - 1;
    }

    return sigObj;
}



//Big data organization function
function getToFrom(firstData, current_depth, data, string, callback) {

    let string_trans = string + "this.data['transactions'] = data";

    if (current_depth == 0) {
        count = count + 1
        console.log("in 0 depth");

        client.pubRequest('getAddressTransactions/' + address + "?apiKey=" + api_key + "&limit=" + transactLimit, {}, function (err, data) {
            if (err) console.log("E!", err);
            for (let i = 0; i < transactLimit + 1; i++) {
                // Used try catch because sometimes the data recieved from api is not complete
                try {
                    if (data[i] != null) {
                        delete data[i].hash;
                        delete data[i].input;
                        delete data[i].success;
                    }
                }
                catch{
                    continue;
                }

            }

            client.pubRequest('getAddressInfo/' + address + "?apiKey=" + api_key + "&limit=" + limit, {}, function (err, data) {
                if (err) console.log("E!", err)
                for (let i = 0; i < transactLimit + 1; i++) {
                    // This should never crash because there should always be address and balance data
                    if (data != null && this.data[i] != null) {
                        this.data[i].currentAddress = data.address;
                        this.data[i].currentBalance = data.ETH.balance;
                        console.log("Added Address info");
                    }
                }
                setSigma(this.data, firstData, current_depth);

            }.bind({ data: data }));

            console.log("In depth 0 section");
            eval(string_trans);
            callback('Called at depth 0');

        }.bind({ data: data }));

        return data;
    }

    //This is stringF data.transactions[i].transactions[a].to
    let stringF = string + "from";
    //This is stringT data.transactions[i].transactions[a].to
    let stringT = string + "to";
    let stringEvalF = "";
    let stringEvalT = "";
    try {
        stringEvalF = eval(stringF);
        stringEvalT = eval(stringT);
    }
    catch{
        console.log("Current Address Transactions is Less Than" + transactLimit);
        return data;
    }

    //this.data.transactions[i].transactions[a].transactions = data;
    let stringTransact = "this." + string + "transactions = data";


    if (stringEvalF !== address) {
        count = count + 1;
        client.pubRequest('getAddressTransactions/' + stringEvalF + "?apiKey=" + api_key + "&limit=" + transactLimit, {}, function (err, data) {
            if (err) console.log("E!", err);
            for (let i = 0; i < transactLimit + 1; i++) {
                // Used try catch because sometimes the data recieved from api is not complete
                try {
                    if (data[i] != null) {
                        delete data[i].hash;
                        delete data[i].input;
                        delete data[i].success;
                    }
                }
                catch{
                    continue;
                }
            }

            client.pubRequest('getAddressInfo/' + stringEvalF + "?apiKey=" + api_key + "&limit=" + limit, {}, function (err, data) {
                if (err) console.log("E!", err)
                for (let i = 0; i < transactLimit + 1; i++) {
                    // This should never crash because there should always be address and balance data
                    if (data != null && this.data[i] != null) {
                        this.data[i].currentAddress = data.address;
                        this.data[i].currentBalance = data.ETH.balance;
                        console.log("Added Address info");
                    }


                }
                setSigma(this.data, firstData, current_depth);

            }.bind({ data: data }));

            console.log("In from section");
            eval(stringTransact);
            callback('Called From');
            

        }.bind({ data: data }));
    }
    
    if (stringEvalT !== address) {
        count = count + 1;
        client.pubRequest('getAddressTransactions/' + stringEvalT + "?apiKey=" + api_key + "&limit=" + transactLimit, {}, function (err, data) {
            if (err) console.log("E!", err);
            for (let i = 0; i < transactLimit + 1; i++) {
                // Used try catch because sometimes the data recieved from api is not complete
                try {
                    if (data[i] != null) {
                        delete data[i].hash;
                        delete data[i].input;
                        delete data[i].success;
                    }
                }
                catch{
                    continue;
                }
            }
            
            client.pubRequest('getAddressInfo/' + stringEvalT + "?apiKey=" + api_key + "&limit=" + limit, {}, function (err, data) {
                if (err) console.log("E!", err)
                for (let i = 0; i < transactLimit; i++) {
                    // This should never crash because there should always be address and balance data
                    if (data != null && this.data[i] != null) {
                        this.data[i].currentAddress = data.address;
                        this.data[i].currentBalance = data.ETH.balance;
                        console.log("Added Address info");
                    }


                }
                setSigma(this.data, firstData, current_depth);

            }.bind({ data: data }));

            console.log("In to section");
            eval(stringTransact);
            callback('Called To');
            

        }.bind({ data: data }));
    }
    return data;
}

//Sets up query for current transactions
function getIndex(depth, current_depth, depthTracker) {

    let string = "";
    let num = 0;

    string = string + "data."
    while (num < current_depth) {
        string = string + "transactions[" + depthTracker[num] + "].";     // data.transactions[0].transactions[0]
        num = num + 1;
    }

    // This is always incrementing depending on the transaction limit size
    depthTracker[current_depth - 1] = depthTracker[current_depth - 1] + 1;

    //Depth Tracker
    for (let i = current_depth; i >= 0; i--) {
        if (depthTracker[i] >= transactLimit) {
            depthTracker[i] = 0;
            depthTracker[i - 1] += 1;
            console.log("Adjusting depth values");
        }
    }
    
    return string;
}

// This function will create a tree of ETH crypto addresses relating from transaction data
// Given a limit on how many transactions to recieve for each address, the number of transactions will depend on how many transactions
// have been made at that address.
async function followTransactions(data, depth) {

    let firstData = data;
    
    let string = "";
    var depthTracker = [];
    var current_depth = 0;

    while (current_depth < depth + 1) {
        if (current_depth != 0) {
            depthTracker.push(0);
            console.log("DepthTracker 0's: " + depthTracker[current_depth- 1]);
        }

        
        // Transactions go up exponentially as current_depth increases
        for (let d_iter = 0; d_iter < Math.pow(transactLimit, current_depth); d_iter++) {
            console.log("loops are working");

            // current_depth will be 1 when the transaction strings begin to be created
            if (current_depth != 0) {
                string = getIndex(depth, current_depth, depthTracker) 
            }
            console.log("Current String: " + string);
            data = getToFrom(firstData, current_depth ,data, string, function (result) {
                console.log(result);
            });

            // using await in order to not get banned from ethplorer
            await new Promise(r => setTimeout(r, timeOut));
        }
        current_depth = current_depth + 1;
    }
            
    console.log("broke out of while loop");
    console.log("transactions written: " + count);
    console.dir(data);

    //Write the JSON object to file once loop completes
    let jsonString = JSON.stringify(data);
    fs.writeFile('Json/' + address + '.json', jsonString, (err) => {
        if (err) throw err;
        console.log('Data written to file');
    });
    console.log('Json Data written to file');

    let sigmaJsonString = JSON.stringify(sigObj);
    fs.writeFile('Json/Sigma/' + address + '.json', sigmaJsonString, (err) => {
        if (err) throw err;
        console.log('Sigma written to file');
    });


    console.dir(data.transactions);

    return data;
}

function fixJsonAddressInfo(data) {
    delete data.tokens;
    delete data.ETH.price;

    return data;
}

//Initial address node
function addAddressInfo() {
    //Setup Json for SigmaJS


    client.pubRequest('getAddressInfo/' + address + "?apiKey=" + api_key + "&limit=" + limit, {}, function (err, data) {
        if (err) console.log("E!", err)

        data = fixJsonAddressInfo(data);

        data = followTransactions(data, transactDepth);

        //reset the current node when leaving this function
        currentNode = 0;

    });

}




//Get info on the address given
app.post('/', (req, res) => {
    console.log(`Address is:${req.body.address}.`);
    console.log(`Depth is:${req.body.depthName}.`);
    console.log(`Limit is:${req.body.limitName}.`);
    address = req.body.address;
    transactDepth = parseInt(req.body.depthName);
    transactLimit = parseInt(req.body.limitName);
    console.log(transactDepth);
    console.log(transactLimit);
   
    
    let secondsE = 0;
    let p = 0;
    for (let i = 0; i < transactDepth; i++) {
        p = p + Math.pow(transactLimit, i);
    }
    secondsE = p * timeOut / 1000;
    console.log("Expected Time(Seconds) " + secondsE);
    console.log("Expected Transactions " + p);

    addAddressInfo();

    res.redirect("index.html");
});


app.listen(process.env.port || 1337);

console.log('Running at Port 1337');

/*
//getAddressInfo
//Gives balance info of a particular address
client.pubRequest('getAddressInfo/' + address + "?apiKey=" + api_key + "&limit=" + limit, {}, function (err, data) {
    if (err) console.log("E!", err)
    console.dir(data);
});
*/

/*
//getAddressTransactions
//API with personal key allows up to 1000 operations in response
//Useful data includes timestamp for each transaction, from and to address, the value/amount of currency being sent
client.pubRequest('getAddressTransactions/' + address + "?apiKey=" + api_key + "&limit=10", {}, function (err, data) {
    if (err) console.log("E!", err)
    console.dir(data);
});
*/

/*
//getAddressHistory
client.pubRequest('getAddressHistory/' + address + "?apiKey=" + api_key + "&limit=" + limit, {}, function (err, data) {
    if (err) console.log("E!", err)
    console.dir(data);
});
*/

/*
//This may be useful to show data on owners of top tokens
//getTopTokens
client.pubRequest('getTopTokens/' + address + "?apiKey=" + api_key + "&limit=" + limit, {}, function (err, data) {
    if (err) console.log("E!", err)
    console.dir(data);
});
*/


