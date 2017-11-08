/* https://www.npmjs.org/package/node-schedule
 * 0 = Sunday
 * rule.dayOfWeek = [0, new schedule.Range(4, 6)];
 * hour is 24 hour format

 * mydigitalstructure.send(options, data, callback)
 */

var mydigitalstructure = require('./mydigitalstructure');
var sciqual = require('./sciqual');
var oSettings;

var app = 
{
	auditsWhereCertificateExpires:
	{
		start: function()
		{
			debugger;
			//console.log('About to process automation ' + oAutomation.name);
			sciqual.auditsWhereCertificateExpires.preProcess({settings: oSettings}, 
																sciqual.auditsWhereCertificateExpires.preProcess,
																sciqual.auditsWhereCertificateExpires.processAudits);
		}

	},

	newAuditorNotes:
	{
		start: function()
		{
			debugger;
			sciqual.newAuditorNotes.preProcess({settings: oSettings}, 
																sciqual.newAuditorNotes.preProcess,
																sciqual.newAuditorNotes.findStandards);
		}

	},

	newOperationsNotes:
	{
		start: function()
		{
			debugger;
			sciqual.newOperationsNotes.preProcess({settings: oSettings}, 
												sciqual.newOperationsNotes.preProcess);
		}
	},

	updateClientClass:
	{
		start: function()
		{
			debugger;
			sciqual.updateClientClass.preProcess({settings: oSettings}, 
												sciqual.updateClientClass.preProcess);
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

		if (oSettings.automations)
		{
			for (var i = 0; i < oSettings.automations.length; i++)
			{

				if (oSettings.local == "true" || oSettings.local == true)
				{
					if (oSettings.automations[i].localRun == "true")
					{
						app[oSettings.automations[i].functionName].start();
					}
				}
				else
				{
					(function(e)
					{
						var oAutomation = oSettings.automations[e];
						mydigitalstructure.data['rule' + oAutomation.id] = new schedule.RecurrenceRule();
						mydigitalstructure.data['rule' + oAutomation.id].dayOfWeek = [
																						new schedule.Range(parseInt(oAutomation.schedule.dayOfWeekRange.start), 
																							parseInt(oAutomation.schedule.dayOfWeekRange.end))
																					];		
						mydigitalstructure.data['rule' + oAutomation.id].hour = parseInt(oAutomation.schedule.hour); 
						mydigitalstructure.data['rule' + oAutomation.id].minute = parseInt(oAutomation.schedule.minute);

						mydigitalstructure.data['schedule' + oAutomation.id] = schedule.scheduleJob(mydigitalstructure.data['rule' + oAutomation.id], 
							function() {app[oAutomation.functionName].start()}
							);
					})(i);
				}
			}
		}
	}	
}
