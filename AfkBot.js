const mineflayer = require('mineflayer')
const fs = require("fs")


var options = {
    host: 'constantiam.net',
    port: 25565,
    username: '<YOUR MINECRAFT EMAIL>',
    password: '<YOUR MINECRAFT PASSWORD>'

};

var bot = mineflayer.createBot(options);

class LoggedPlayer { // Data type used to log players.

    constructor(name, pos) {

        var d = new Date();

        this.playerName = name;
        console.log(this.playerName)

        this.playerInitialPos = pos;
        console.log(this.playerInitialPos)

        this.playerLastPos = 0;
        console.log(this.playerLastPos)

        this.playerFirstSeen = d.getTime();
        console.log(this.playerFirstSeen)

        this.playerLastSeen = d.getTime();
        console.log(this.playerLastSeen)
    }

    setLastSeen(x) {

        this.playerLastSeen = x;

    }

    setLastPos(x) {

        this.playerLastPos = x;

    }

    printData() {

        console.log('Player Name: ' + this.playerName);
        console.log('Initial Pos: ' + this.playerInitialPos);
        console.log('Final Pos:' + this.playerLastPos);
        console.log('First Seen: ' + this.playerFirstSeen);
        console.log('Last Seen: ' + this.playerLastSeen);

    }
}

pyTemplate = new LoggedPlayer("Username","Pos"); // Dummy player placed at start of array

let playerManifest = [] // Array that will be used to keep track of all logged player

playerManifest.push(pyTemplate); // Pushing dummy player into array (This isn't really needed but I was exploring JS as I wrote this code...)

console.log(playerManifest.length);

recallArray(); // Reads log_backup.txt to rebuild array

var time = new Date();

bindEvents(bot);

var botHealth = 11; // used to keep track of the bots last known health value. (behind bot.health) (11 probably a safe starting point)

function lookAtNearestPlayer() {

    // Fires every physics tick. (20 times per second ideally)
    // Bot looks at the nearest player, and logs them into the playerManifest array if they are new.
    // If they have been seen before, they're last known position and time of contact will be logged.

    const playerFilter = (entity) => entity.type === 'player'
    const playerEntity = bot.nearestEntity(playerFilter)

    if (!playerEntity) return

    const pos = playerEntity.position.offset(0, playerEntity.height, 0)
    bot.lookAt(pos)

    var index; // crawl through array and check if player is new
    for (index = 0; index < playerManifest.length; index++) {

        if (playerManifest[index].playerName === playerEntity.username) { // If player has been seen before, update info

            var d = new Date();
            if (d.getTime() - playerManifest[index].playerLastSeen > 3600000) { // If player hasn't been seen in the past hour, greet them

                var reply = 'Welcome back, ' + playerManifest[index].playerName + ', its a pleasure to see you. ("/tell <BOT USERNAME> help" for more)';
                bot.whisper(playerEntity.username, reply);
                fileAppend('log_chat.txt', '<BOT_USERNAME>: ' + reply + ' \@ ' + d.getTime());
                fileAppend('log_chat.txt', ' ');
                console.log('<BOT USERNAME> ' + reply + ' \@ ' + d.getTime());
            }

            playerManifest[index].playerLastPos = pos;
            playerManifest[index].setLastSeen(d.getTime());

            break;
        }

        if (index == (playerManifest.length - 1)) { // if player is new, push them to the array and take down their info

            var d = new Date();

            player = new LoggedPlayer(playerEntity.username, pos);
            playerManifest.push(player);
            console.log('New Player Logged: ' + playerManifest[index + 1].playerName);

            var reply = 'Greetings, ' + playerEntity.username + ', welcome to <YOUR BASE>. I will notify <YOUR USERNAME> of your visit. ("/tell <BOT USERNAME> help" for more)';
            bot.whisper(playerEntity.username, reply);

            fileAppend('log_chat.txt', '<BOT USERNAME>: ' + reply + ' \@ ' + d.getTime());
            fileAppend('log_chat.txt', ' ');
            console.log('<BOT USERNAME> ' + reply + ' \@ ' + d.getTime());

        }

    }

}

setInterval(function rebuildFile() {

    // Backs up the log into log_backup in case program terminates while in this function
    // Clears the file and writes over it the updated array
    // Called once every 10 seconds

    fs.readFile('log.txt', (err, data) => { // Backs up log.txt to log_backup.txt
        if (err) throw err;
        fs.writeFile('log_backup.txt', data, function (err) {
            if (err) {
                return console.log(err);
            }
        });
    });

    fs.writeFile('log.txt', '', function (err) { // clearing out log.txt breifly..
        if (err) {
            return console.log(err);
        }
    });

    fileAppend('log.txt', 'FORMAT:');
    fileAppend('log.txt', 'PLAYER USERNAME');
    fileAppend('log.txt', 'FIRST SEEN POSITION');
    fileAppend('log.txt', 'LAST SEEN POSITION');
    fileAppend('log.txt', 'UNIX TIME FIRST SEEN');
    fileAppend('log.txt', 'UNIX TIME LAST SEEN');
    fileAppend('log.txt', ' ');


    var index; // crawl through array and write down every player and their info
    for (index = 1; index < playerManifest.length; index++) {
        fileAppend('log.txt', playerManifest[index].playerName);
        fileAppend('log.txt', playerManifest[index].playerInitialPos);
        fileAppend('log.txt', playerManifest[index].playerLastPos);
        fileAppend('log.txt', playerManifest[index].playerFirstSeen);
        fileAppend('log.txt', playerManifest[index].playerLastSeen);
        fileAppend('log.txt', '');

    }

}, 10000);

function recallArray() {

    //Rebuilds player manifest based on text file

    try {
        // read contents of the file
        const data = fs.readFileSync('log_backup.txt', 'UTF-8');

        // split the contents by new line
        const lines = data.split(/\r?\n/);

        console.log(lines.length);

        var index; 
        for (index = 7; index < lines.length - 1; index = index + 6) { // index starts @ 7 because of header lines, inc by 6 because 5 data points

            //player = new LoggedPlayer(lines[index], lines[index + 1]);
            //playerManifest.push(player);
            player = new LoggedPlayer("Username", "Pos");
            player.playerName = lines[index];
            player.playerInitialPos = lines[index + 1];
            player.playerLastPos = lines[index + 2];
            player.playerFirstSeen = lines[index + 3];
            player.playerLastSeen = lines[index + 4];

            playerManifest.push(player);

            console.log(lines[index]);
            console.log(lines[index + 1]);
            console.log(lines[index + 2]);
            console.log(lines[index + 3]);
            console.log(lines[index + 4]);

        }


    } catch (err) {
        console.error(err);
    }

    console.log('Finished building array!' + '/\r?\n/');

}

function fileAppend(file, arg) {

    //appends argument to end of file
    fs.appendFileSync(file, arg + '\n', function (err) {

        if (err) {
            console.log('File error!');
        }
        else {
        }
        
    })

}

function bindEvents(bot) {

    // Used to set all bot triggers. Called when a bot is created.

    bot.on('physicTick', lookAtNearestPlayer) // occurs 20 times per second. (At 20 TPS)

    bot.on('error', function (err) { // bot reconnects if some error occurs
        console.log('Error attempting to reconnect: ' + err.errno + '.');
        if (err.code == undefined) {
            console.log('Invalid credentials OR bot needs to wait because it relogged too quickly.');
            console.log('Will retry to connect in 30 seconds. ');
            setTimeout(relog, 90000);
        }
    });

    bot.on('end', function () {
        console.log("Bot has ended");
        // If set less than 30s you will get an invalid credentials error, which we handle above.
        setTimeout(relog, 90000);
    });

    var waitTill = new Date(new Date().getTime() + 550);
    while (waitTill > new Date()) { } // Need to wait ~half a second otherwise health trigger will happen on spawn

    bot.on('spawn', function () { // fires when bot spawns

        setTimeout(setHealthTrigger, 5000) // Health trigger always fires as soon as trigger is set, so 5 seconds of flex time is given to heal bot

    })

    bot.on('whisper', (username, message, type, rawMessage, matches) => {

        var d = new Date();


        fileAppend('log_chat.txt', username + ': ' + message + ' ' + '\@ ' + d.getTime());
        fileAppend('log_chat.txt', ' ');
        console.log(username + ': ' + message + ' ' + '\@ ' + d.getTime());

        var reply;

        switch (message) {

            case 'help':

                reply = 'Commands(/tell <BOT USERNAME> command): "info", "credits", "firstseen"';

                bot.whisper(username, reply);

                fileAppend('log_chat.txt', '<BOT USERNAME>: ' + reply + ' \@ ' + d.getTime());
                fileAppend('log_chat.txt', ' ');
                console.log('<BOT USERNAME> ' + reply + ' \@ ' + d.getTime());

                break;

            case 'info':

                reply = 'I have been assigned by <YOUR NAME> to watch over <YOUR NAME> while he/she is away. If you would like to reach him, you can add him/her on discord: "<YOUR DISCORD>"';

                bot.whisper(username, reply);

                fileAppend('log_chat.txt', '<BOT USERNAME>: ' + reply + ' \@ ' + d.getTime());
                fileAppend('log_chat.txt', ' ');
                console.log('<BOT USERNAME> ' + reply + ' \@ ' + d.getTime());

                break;

            case 'credits':

                reply = 'Created by Jon. To get your own guard bot, check out Jon's gethub to get one set up. (github.com/JonJust)';

                bot.whisper(username, reply);

                fileAppend('log_chat.txt', '<BOT USERNAME>: ' + reply + ' \@ ' + d.getTime());
                fileAppend('log_chat.txt', ' ');
                console.log('<BOT USERNAME> ' + reply + ' \@ ' + d.getTime());

                break;

            case 'firstseen':

                for (index = 0; index < playerManifest.length; index++) {

                    if (playerManifest[index].playerName === username) { // If player has been seen before, tell them when they where first seen

                        reply = 'Salutations, ' + username + '. I first saw you on ' + timeConverter(playerManifest[index].playerFirstSeen);

                        bot.whisper(username, reply);

                        fileAppend('log_chat.txt', '<BOT USERNAME>: ' + reply + ' \@ ' + d.getTime());
                        fileAppend('log_chat.txt', ' ');
                        console.log('<BOT USERNAME> ' + reply + ' \@ ' + d.getTime());

                        break;
                    }

                    if (index == (playerManifest.length - 1)) { // else, inform them they have not encountered the bot yet

                        reply = 'Hello, ' + username + '. It appears you havent been to <YOUR BASE> yet.';

                        bot.whisper(username, reply);        

                        fileAppend('log_chat.txt', '<BOT USERNAME>: ' + reply + ' \@ ' + d.getTime());
                        fileAppend('log_chat.txt', ' ');
                        console.log('<BOT USERNAME> ' + reply + ' \@ ' + d.getTime());

                    }

                }

                break;

            default:

                reply = 'Im sorry, I am but a humble bot. "/tell <BOT USERNAME> help" for more information.';
                bot.whisper(username, reply);

                fileAppend('log_chat.txt', '<BOT USERNAME>: ' + reply + ' \@ ' + d.getTime());
                fileAppend('log_chat.txt', ' ');
                console.log('<BOT USERNAME> ' + reply + ' \@ ' + d.getTime());

        }

    });

}

function timeConverter(UNIX_timestamp) {

    // Converts a unix timestamp to a date format
    var a = new Date(UNIX_timestamp*1);
    var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    var year = a.getFullYear();
    var month = months[a.getMonth()];
    var date = a.getDate();
    var hour = a.getHours();
    var min = a.getMinutes();
    var sec = a.getSeconds();
    var time = date + ' ' + month + ' ' + year + ' ' + hour + ':' + min + ':' + sec;
    return time;
}

function relog() {
    console.log("Attempting to reconnect...");
    bot = mineflayer.createBot(options);
    bindEvents(bot);
}

function setHealthTrigger() {
    bot.on('health', function () {

        // Terminates script if bot's health is too low

        if ((bot.health < 19) && bot.health < botHealth) {
            bot.quit(); // bot dips if takes damage
            process.exit(1); // end process if bot takes damage
        }

        botHealth = bot.health;

    });
}
