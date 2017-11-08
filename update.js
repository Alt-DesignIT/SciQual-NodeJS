/* https://www.npmjs.org/package/node-schedule
 * 0 = Sunday
 * rule.dayOfWeek = [0, new schedule.Range(4, 6)];
 * hour is 24 hour format

 * mydigitalstructure.send(options, data, callback)
 */

var mydigitalstructure = require('./mydigitalstructure');
var sciqual = require('./sciqual-SUP022791');
var oSettings;

var update = 
{
	fixANZSICCodes:
	{
		start: function()
		{
			debugger;
			sciqual.fixANZSICCodes.process({settings: oSettings}, 
											sciqual.fixANZSICCodes.process,
											sciqual.fixANZSICCodes.process);
		}
	}
}

mydigitalstructure.init(oSettings, mydigitalstructure.logon, main);

function main(err, data, settings)
{
	//if (mydigitalstructure.data.session.status = "OK")
	oSettings = settings;

	if (data.status === "OK")
	{
		var schedule = require('node-schedule');
		//var date = new Date(2016, 7, 10, 14, 30, 0);
		var date = new Date(2016, 7, 12, 2, 0, 0);

		if (oSettings.local == "true" || oSettings.local == true)
		{
			update.fixANZSICCodes.start();
		}
		else
		{
			var anzsicSchedule = schedule.scheduleJob(date, function() 
			{
				update.fixANZSICCodes.start();
			});
		}
	}	
}
