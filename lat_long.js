
const geocoder   = require('geocoder');
const json2csv   = require('json2csv');
const fs         = require('fs');
const csv   	 = require('fast-csv');
// csv containing list of address 
var stream 		 = fs.createReadStream("google.csv");  
var path         = './google.csv';
var async        = require('async');
var responseObj  = {};


var asyncArray   = [getCsvdata.bind(null, path, responseObj),
				   	getLatLong.bind(null, responseObj)];
async.series(asyncArray ,function(err, result){
	if(err){
		console.log(err);
		return err;
	}

	// new csv format
    var fields  = ['latitude','longitude','address']; 
    var csvData    = result[1];
    var csv = json2csv({ data: csvData, fields: fields });
    fs.writeFile('file1.csv', csv, function(err) {  
    	if (err) {
    		console.log(err); 
    		return err;
    	}
    	//saving latitude longitude and address to new csv file
       	console.log('file saved');
    });
})

function getCsvdata(path, responseObj, callback){
	var SuccessArray = [];
    var ErrorArray   = [];
    csv.fromPath(path)
        .on('data', function (data) {
            SuccessArray.push(data);
        })
        .on("error", function (data) {
            ErrorArray.push(data);
        })
        .on('end', function () {
        	//list of successful and error address
            var ResultObject         = {Success: SuccessArray, ErrorList: ErrorArray}; 
            responseObj.adrressarray = ResultObject;
            callback(null, ResultObject);
        });
 }

function getLatLong(responseObj, callback){
    var responseArray         = responseObj.adrressarray; 
    var geocodeArray          = responseArray.Success.slice(1);
    var geoLatLongFunctions   = geocodeArray.map(function(x) {
        return function(cb){
            var addressOfRow = x.toString(); // as geocode accepts address in stirng format
            geocoder.geocode(addressOfRow, function (err, data) {
                if(err){
                     cb(err);
                }
                var latitude    = JSON.stringify(data.results[0].geometry.location.lat);
                var longitude   = data.results[0].geometry.location.lng;
                var address     = data.results[0].formatted_address;
                var obj         = {"latitude":latitude,"longitude":longitude, "address":address};
                cb(null,obj);
            });
         };
    });
    //as geocoder.geocode is asynchronous function
   async.parallel(geoLatLongFunctions,callback);   
}
