//|- 
//|- NodeDevices
//|-

// We get a logger

var log4js = require('log4js');
log4js.configure('log4js.json', {});
var logger = log4js.getLogger();

var prepath="./ftp/";
var curPos=0;


var path = require("path");
var fs = require('fs');
var http = require('http');
var util = require('util');
var bodyParser = require("body-parser");
var formidable = require('formidable');

var httpManagementPort=9999;

var express = require('express');
var app = express();

app.use(express.static('./management'));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));


app.get('/getClients', function (request, response){
	logger.info("Checking clients.json...");
	fs.readFile('./ftp/clients.json', 'utf8', function (err,data) {
		if (err) 
		{
			logger.info("ERROR while reading clients.json:"+err);
			return console.log(err);
		}
		
		try
		{
			var obj = JSON.parse(data)
			console.log(obj)
			response.setHeader("application-type", "application/json");
			response.end(data)	
		}
		catch(err)
		{
			logger.error("clients.json is badly formatted. ERR="+err);
		}
	
	});
});


app.get('/getConfig', function (request, response) {

	if((request.query !=null)&&(request.query.clientID!=null))
	{
		var clientID = request.query.clientID;
		try
		{
			var config = JSON.parse(fs.readFileSync(prepath+clientID+"/config.json"));
			console.log("sending config associated to client:"+clientID)
			response.setHeader("application-type", "application/json");
			response.end(JSON.stringify(config));				
		}
		catch(err)
		{
			logger.error("unable to retrieve the file associated to <"+clientID+">. ERR="+err);
			response.sendStatus(400);
		}
		
	}
	else
	{
		response.sendStatus(400);
	}

});

app.get('/status', function (request, response) {
	var rep = {};
	response.end(JSON.stringify(rep)); 
});

app.get('/test', function (request, response) {
	console.log("TEST called....");
	console.log(request);
	var rep = {};
	response.end(JSON.stringify(rep)); 
});

app.post('/updateConfig', function (request, response) {

	console.log("updateConfig");
	var req = request.body
	
	logger.info("Saving config.");
	connectionStatus='Saving config.s';
	fs.writeFileSync(prepath+req.client.id+"/config.json", JSON.stringify(req.config));
	logger.info("Config saved.s");
	connectionStatus='Config saved';
	
	init();				
	var rep = {};
	response.end(JSON.stringify(rep)); 
	
});


//app.post('/fileUpload', upload.single('file'));
/*
*/
app.post('/fileUpload', function (req, res) {

		logger.info("File Upload called");
		
		var form = new formidable.IncomingForm();

		
	    form.parse(req,function(err, fields, files) {
//			console.log(fields);
//			console.log(files.file.path);
			res.writeHead(200, {'content-type': 'text/plain'});
			res.write('received upload:\n\n');
			res.end(util.inspect({fields: fields, files: files}));
			
			fields.client = JSON.parse(fields.client)
			
			logger.info('Client:');
			logger.info(fields.client);
			
			var config = JSON.parse(fs.readFileSync(prepath+fields.client.id+"/config.json"));
			
			if((fields.target!=undefined)&&(files !=undefined)&&(files.file !=undefined))
			{
				fields.target=JSON.parse(fields.target);
				for(var i=0;i<fields.target.length;i++)
				{
					for(var j=0;j<config.screens.length;j++)
					{
						if(config.screens[j].name==fields.target[i])
						{
							logger.info("Handling:"+config.screens[j].name);
							var target=prepath+fields.client.id+"/"+config.screens[j].name+"/ToDeploy/"+files.file.name;
							logger.info("Copy:"+files.file.path+" target:"+target);
							fs.createReadStream(files.file.path).pipe(fs.createWriteStream(target));
						}
					}
				}
			}
			
		});



	    form.on('fileBegin', function (name, file){
	        file.path = __dirname + '/uploads/' + file.name;
	    });

	    form.on('file', function (name, file){
	        logger.info('Uploaded ' + file.name);
	    });
				
});


var server = app.listen(httpManagementPort, function () {

  var host = server.address().address
  var port = server.address().port

  logger.info("Pulse Server app listening at http://%s:%s", host, port)

})


var clients = JSON.parse(fs.readFileSync("./ftp/clients.json")).clients;



function init()
{
	for(var i in clients)
	{
		var client = clients[i];
		console.log('client')
		console.log(client)
		
		var locPrePath = prepath+client.id+"/";
		
		console.log(locPrePath+"config.json")
		var config = JSON.parse(fs.readFileSync(locPrePath+"config.json"));
	
		for(var i=0;i<config.screens.length;i++)
		{		
			logger.info("Checking folders for :"+locPrePath+config.screens[i].name);
			mkdirSync(locPrePath+config.screens[i].name);
			mkdirSync(locPrePath+config.screens[i].name+"/ToDeploy");
			mkdirSync(locPrePath+config.screens[i].name+"/Data");
			fs.writeFile(locPrePath+config.screens[i].name+"/Data/config.json",JSON.stringify(config.screens[i]), function (err) {
				if (err) 
					return console.log(err);
					
			});
		}
	}
}

var mkdirSync = function (path) {
  try {
    fs.mkdirSync(path);
  } catch(e) {
    if ( e.code != 'EEXIST' ) throw e;
  }
}

init();

/*var meetingInterval = setInterval(function() {
  checkMeetingCofely()
}, 5000);*/


function findNextField(meeting)
{
	var index=meeting.indexOf("<td class=listingData",curPos);
  if(index>0)
  {
  	var index2=meeting.indexOf(">",index);
    if(index2>0)
    {
	    var index3=meeting.indexOf("<",index2);
      //alert(meeting.substring(index2+1,index3));
      var value=meeting.substring(index2+1,index3);
      value=value.replace(/&nbsp;/g,"");
      value=value.replace(/\t/g,"");
      value=value.replace(/&#241;/g,"ñ");
      value=value.trim();
      
      curPos=index3+1;
      return value;
    }
    else
    	return null;
  }
  return null;
}

/*
function checkMeetingCofely()
{
	logger.info("Checking meeting COFELY...");
	fs.readFile('./ftp/meetingscofely/meeting.html', 'utf8', function (err,data) {
		if (err) 
		{
			logger.info("ERROR while reading meeting:"+err);
			return console.log(err);
		}
		
		
		try
		{
			var list=[];
			var firstfield=findNextField(data);
			
			if(firstfield!=null)
				list.push(firstfield);

			while(firstfield!=null)
			{
				firstfield=findNextField(data);
			  if(firstfield!=null)
					list.push(firstfield);
			}

			var curMeeting=0;
			var meetings=[];
			curPos=0;

			for(var i=0;i<list.length/7;i++)
			{
			  var newMeeting={};
				newMeeting.time=list[i*7];
			  newMeeting.floor=list[i*7+2];
			  newMeeting.description=list[i*7+1];
			  newMeeting.room=list[i*7+4];
			  meetings.push(newMeeting);
			}

			logger.info(JSON.stringify(meetings));
			fs.writeFile(prepath+"EvereFirstFloor"+"/Data/meeting.json",JSON.stringify(meetings), function (err) {
			if (err) 
				return console.log(err);
				
		});
		}
		catch(err)
		{
			logger.error("Unable to decode meetings. ERR="+err);
		}
		//console.log("Synchronous read: " + data.toString());
	});

	
}
*/

logger.info("Node Pulse Server main finished...");
