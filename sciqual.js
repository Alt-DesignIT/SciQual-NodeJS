// We assume that we're logged on before we do anything in here
var myJquery = require('./myJquery');

module.exports =
{
	data: {},

	formatXHTML: function(sValue, bDirection)
	{
		var aFind = [
			String.fromCharCode(8220), //“
			String.fromCharCode(8221), //”
			String.fromCharCode(8216), //‘
			String.fromCharCode(8217), //‘
			String.fromCharCode(8211), //–
			String.fromCharCode(8212), //—
			String.fromCharCode(189), //½
			String.fromCharCode(188), //¼
			String.fromCharCode(190), //¾
			String.fromCharCode(169), //©
			String.fromCharCode(174), //®
			String.fromCharCode(8230) //…  
		];	

		var aReplace = [
			'"',
			'"',
			"'",
			"'",
			"-",
			"--",
			"1/2",
			"1/4",
			"3/4",
			"(C)",
			"(R)",
			"..."
		];

		if(bDirection)
		{
			sValue= sValue.replace(/\&/g,'&amp;');
			sValue= sValue.replace(/</g,'&lt;');
			sValue= sValue.replace(/>/g,'&gt;');
			//sValue = sValue.replace(/-/g, '&#45;')
			//sValue = sValue.replace(/@/g, '&#64;')
			//sValue = sValue.replace(/\//g, '&#47;')
			//sValue = sValue.replace(/"/g, '&quot;')
			//sValue = sValue.replace(/\\/g, '&#39;')
		}
		else
		{
			sValue = sValue.replace(/\&amp;/g,'&');
			sValue = sValue.replace(/\&lt;/g,'<');
			sValue = sValue.replace(/\&gt;/g,'>');
			sValue = sValue.replace(/\&#45;/g, '-');
			sValue = sValue.replace(/\&#64;/g, '@');
			sValue = sValue.replace(/\&#47;/g, '/');
			sValue = sValue.replace(/\&quot;/g, '"');
			sValue = sValue.replace(/\&#39;/g, '\'');
			sValue = sValue.replace(/\&#239;‚&#167;,&#226;/g, '-');
			for ( var i = 0; i < aFind.length; i++ ) 
			{
				var regex = new RegExp(aFind[i], "gi");
				sValue = sValue.replace(regex, aReplace[i]);
			}
		}
		
		return sValue;	
	},

	sendLogFile: function(oParam)
	{
		var sciqual = module.exports;
		var bLocal = (oParam.settings.local != undefined) ? oParam.settings.local == "true" : false;
		var sHTML = '<p>' + oParam.logHTML.join('<br />') + '</p>';
		var sEmailData = 'to=' + encodeURIComponent(oParam.settings.email) +
					 '&subject=' + encodeURIComponent((oParam.errorOccurred == true || oParam.errorMinor === true ? 'ERROR ': '') + 
					 				(oParam.errorMinor === true ? (oParam.errorOccurred === true ? ':Minor ' : 'Minor Error ') : '') + 
					 				'Log File for ' + sciqual.data.automation.title) +
					 '&fromemail=' + encodeURIComponent(sciqual.data.automation.responseactionfrom) +
					 '&message=' + encodeURIComponent(sHTML) +
					 '&send=Y';

		oParam.ajax.type = 'POST';
		oParam.ajax.url = '/rpc/messaging/?method=MESSAGING_EMAIL_SEND&rf=JSON&logonkey=' + oParam.settings.user.logonkey + '&sid=' + oParam.settings.user.sid;
		oParam.ajax.data = sEmailData; 					//JSON.stringify(oEmailData);
		oParam.ajax.rf = 'JSON';
		oParam.ajax.dataType = 'JSON';
		oParam.ajax.success = function(bErr, oResponse, oParam)
		{
			if (bErr || oResponse.status != 'OK')
			{
				// Write to log file - email sending failed
				console.log("Email sending failed: " + ((oResponse && oResponse.status === 'ER') ? oResponse.error.errornotes : ''));
			}
			else 
			{
				if (bLocal) {console.log('Log file Email sent to ' + oParam.settings.email);}
			}
		};
		myJquery.ajax(oParam);
	},

	getAutomation: function(oParam, fCallBack, fCallBackProcess)
	{
		var sciqual = module.exports;
		var bLocal   = (oParam.settings.local != undefined) ? oParam.settings.local == "true" : false;
		var oAutomation = oParam.automation;

		sciqual.data.automation = {};
		oParam.ajax = {};
		oParam.ajax.type = 'GET';
		oParam.ajax.url = '/ondemand/setup/?method=SETUP_AUTOMATION_SEARCH&rf=JSON&id=' + oAutomation.id + 
							'&logonkey=' + oParam.settings.user.logonkey + '&sid=' + oParam.settings.user.sid;
		oParam.ajax.data = '';
		oParam.ajax.success = function(bErr, oResponse, oParam)
		{
			if (!bErr && oResponse.status === 'OK')
			{
				sciqual.data.automation = oResponse.data.rows.shift();
				if (bLocal) {console.log("Automation found.." + sciqual.data.automation.title);}
				oParam.logHTML.push("Automation found..." + sciqual.data.automation.title);
				fCallBack(oParam, fCallBack, fCallBackProcess);
			}
			else
			{
				// Write to the log file
				console.log("Error finding automation: " + ((oResponse && oResponse.status === 'ER') ? oResponse.error.errornotes : ''));
				oParam.logHTML.push("Error finding automation: " + ((oResponse && oResponse.status === 'ER') ? oResponse.error.errornotes : ''));

				oParam.processingStep = -1;
				fCallBack(oParam, fCallBack, fCallBackProcess);
			}
		}
		myJquery.ajax(oParam);
	},

	getNetworkUsers: function(oParam, fCallBack, fCallBackProcess)
	{
		// Get list of users in network group
		var sciqual = module.exports;
		var bLocal   = (oParam.settings.local != undefined) ? oParam.settings.local == "true" : false;
		var bTesting = (oParam.settings.testing != undefined) ? oParam.settings.testing == "true" : false;

		var oSearch = 
		{
			fields: 
			[
				{"name": "usernetworkgroup.user.contactperson"},
				{"name": "usernetworkgroup.user.contactperson.email"},
				{"name": "usernetworkgroup.user.contactpersontext"},
				{"name": 'usernetworkgroup.user.id'}
			],
			filters:
			[
				{"name": "networkgroup", comparison: "EQUAL_TO", value1: sciqual.data.automation.responseactioncontext}
			],
			options:
			{
				"rf": "JSON",
				"rows": "100"
			}
		};

		if (oParam.addSearchFields)
		{
			for (var i=0; i < oParam.addSearchFields.length; i++)
			{
				oSearch.fields.push({"name": oParam.addSearchFields[i]});
			};
			delete(oParam.addSearchFields);
		}

		if (oParam.addSearchFilters)
		{
			for (var i=0; i < oParam.addSearchFilters.length; i++)
			{
				oSearch.filters.push(oParam.addSearchFilters[i]);
			};
			delete(oParam.addSearchFilters);
		}

		sciqual.data.userContext = [];
		oParam.ajax = {};
		//if (bTesting && !bLab)
		//{
		//	oSearch.filters.push({"name": "usernetworkgroup.user.contactperson", comparison: "EQUAL_TO", value1: "1000505873"});
		//}
		
		oParam.ajax.type = 'POST';
		oParam.ajax.url = '/rpc/setup/?method=SETUP_USER_NETWORK_GROUP_SEARCH&advanced=1&rf=JSON&logonkey=' + oParam.settings.user.logonkey + '&sid=' + oParam.settings.user.sid;
		oParam.ajax.data = JSON.stringify(oSearch);
		oParam.ajax.success = function(bErr, oResponse, oParam)
		{
			if (!bErr && oResponse.status === 'OK')
			{
				if (bLocal) {console.log(oResponse.data.rows.length + " Network Group Users found..");}
				oParam.logHTML.push(oResponse.data.rows.length + " Network Group Users found..");

				sciqual.data.userContext = oResponse.data.rows;
				fCallBack(oParam, fCallBack, fCallBackProcess);
			}
			else
			{
				// Write to the log file
				console.log("Error finding network groups: " + ((oResponse && oResponse.status === 'ER') ? oResponse.error.errornotes : ''));
				oParam.logHTML.push("Error finding network groups: " + ((oResponse && oResponse.status === 'ER') ? oResponse.error.errornotes : ''));

				oParam.processingStep = -1;
				fCallBack(oParam, fCallBack, fCallBackProcess);
			}
		}
		myJquery.ajax(oParam);
	
	},

	sendEmail: function(oParam, fCallBack, fCallBackProcess)
	{
		// If we're in testing mode, send to currently logged on person, otherwise send to email of current userData index
		var sciqual = module.exports;
		var bLocal = (oParam.settings.local != undefined) ? oParam.settings.local == "true" : false;

		var aHTML = [];
		var sciqual = require("./sciqual");
		var oEmailData = {};
		var bTesting = (oParam.settings.testing != undefined) ? oParam.settings.testing == "true" : false;
		var sEmailTo = (bTesting) ? oParam.settings.email : sciqual.data.userContext[oParam.userIndex]['usernetworkgroup.user.contactperson.email'];

		var fFunctionHeader = oParam.functionEmailHeader;
		var fFunctionRow = oParam.functionEmailRow;

		aHTML.push('<table class="sciqual"><tr class="sciqual">');

		aHTML.push(fFunctionHeader());

		aHTML.push('</tr>');

		for (var index = 0; index < sciqual.data.automationResponseRows.length; index++)
		{
			var row = sciqual.data.automationResponseRows[index];

			aHTML.push(fFunctionRow(row));
		}

		aHTML.push('</table><br /><br />');

		if (bTesting)
		{
			aHTML.push('<br />' + sciqual.data.userContext[oParam.userIndex]['usernetworkgroup.user.contactpersontext'] + 
							'(' + sciqual.data.userContext[oParam.userIndex]['usernetworkgroup.user.id'] + ')');
		}
		aHTML.push('<br /><br />');


		if (sciqual.data.userContext[oParam.userIndex]['usernetworkgroup.user.contactperson.email'] != '')
		{
			//debugger;
			oEmailData.to = sEmailTo;
			oEmailData.subject = sciqual.data.automation.title;
			oEmailData.fromemail = sciqual.data.automation.responseactionfrom;
			oEmailData.message = aHTML.join('');
			oEmailData.saveagainstobject = '32';
			oEmailData.saveagainstobjectcontext = sciqual.data.userContext[oParam.userIndex]['usernetworkgroup.user.contactperson'];
			oEmailData.save = 'Y';
			oEmailData.applysystemtemplate = 'Y';
			oEmailData.send = 'Y';

			var sEmailData = '';
			sEmailData += 'to=' + encodeURIComponent(sEmailTo) +
						 '&subject=' + encodeURIComponent(sciqual.data.automation.title) +
						 '&fromemail=' + encodeURIComponent(sciqual.data.automation.responseactionfrom) +
						 '&message=' + encodeURIComponent(aHTML.join('')) +
						 '&saveagainstobject=' + encodeURIComponent(32) +
						 '&saveagainstobjectcontext=' + sciqual.data.userContext[oParam.userIndex]['usernetworkgroup.user.contactperson'] +
						 '&save=Y' +
						 '&applysystemtemplate=Y' +
						 '&send=Y';

			oParam.ajax.type = 'POST';
			oParam.ajax.url = '/rpc/messaging/?method=MESSAGING_EMAIL_SEND&rf=JSON&logonkey=' + oParam.settings.user.logonkey + '&sid=' + oParam.settings.user.sid;
			oParam.ajax.data = sEmailData; 					//JSON.stringify(oEmailData);
			oParam.ajax.rf = 'JSON';
			oParam.ajax.dataType = 'JSON';
			oParam.ajax.success = function(bErr, oResponse, oParam)
			{
				if (bErr || oResponse.status != 'OK')
				{
					// Write to log file - email sending failed
					console.log("Email sending failed: " + ((oResponse && oResponse.status === 'ER') ? oResponse.error.errornotes : ''));
					oParam.errorMinor = true;
					oParam.logHTML.push("Email sending failed: " + ((oResponse && oResponse.status === 'ER') ? oResponse.error.errornotes : ''));

				}
				else 
				{
					if (bLocal) {console.log('Email sent to ' + oEmailData.to);}
					oParam.logHTML.push('Email sent to ' + oEmailData.to);
					
				}

				oParam.userIndex += 1;			// Go to next automation call
				fCallBack(oParam, fCallBack, fCallBackProcess);
			};
			myJquery.ajax(oParam);
		}
		else
		{
			// write to log file - no email address
			console.log("Email sending failed: No email address");
			oParam.logHTML.push("Email sending failed: No email address");

			oParam.errorMinor = true;
			oParam.userIndex += 1;
			fCallBack(oParam, fCallBack, fCallBackProcess);
		}
	},

	auditsWhereCertificateExpires: 
	{
		preProcess: function(oParam, fCallBack, fCallBackProcess)
		{
			// Extended version of Assigned Audits Where Certificate Expires in next 30 Days
			// Calls DASHBOARD_AUDIT_AUDIT_TEAM_SEARCH and then processes results, removing rows where audits cancelled

			// Steps are:
			// 1. Get Automation record
			// 2. Get list of users in required network group including contactperson and email address
			// 3. For each user, call DASHBOARD_AUDIT_AUDIT_TEAM_SEARCH
			// 4. With results from (3), check each record. 
			//		If Audit is more than 60 days in the future and expiry date is in the past, check to see if the preceeding audit is Cancelled or Assigned
			//		If so, then remove from the list
			// 5. Compile email and sent to current user, saving against contactperson record

			var sciqual = module.exports;
			var oAutomation;
			var bTesting = (oParam.settings.testing != undefined) ? oParam.settings.testing == "true" : false;
			var bLocal   = (oParam.settings.local   != undefined) ? oParam.settings.local == "true"   : false;
			var bLab = false;
			
			debugger;
			for (var i = 0; i < oParam.settings.automations.length; i++)
			{
				if (oParam.settings.automations[i].functionName === "auditsWhereCertificateExpires")
				{
					oAutomation = oParam.settings.automations[i];
				}
			}

			oParam.functionEmailHeader = sciqual.auditsWhereCertificateExpires.emailHeader;
			oParam.functionEmailRow = sciqual.auditsWhereCertificateExpires.emailRow;

			if (oParam)
			{ 	if (oParam.processingStep === undefined) {oParam.processingStep = 1}}
			else { oParam = {processingStep: 1}}

			// Get the Automation
			if (oParam.processingStep === 1)
			{
				oParam.logHTML = [];
				console.log(Date());
				oParam.logHTML.push(Date());

				console.log("#AUTOMATION_SETTINGS: " + JSON.stringify(oAutomation));

				oParam.automation = oAutomation;
				oParam.processingStep = 2;
				sciqual.getAutomation(oParam, fCallBack, fCallBackProcess);
			}

			// Get a list of networkgroup Users
			else if (oParam.processingStep === 2)
			{
				oParam.processingStep = 3;
				delete(oParam.addSearchFilters);
				oParam.addSearchFilters = [{"name": "usernetworkgroup.user.contactperson.supplierstatus", comparison: "IN_LIST", value1: '1,2'}]
				sciqual.getNetworkUsers(oParam, fCallBack, fCallBackProcess);
			}

			// Call DASHBOARD method for each user
			else if (oParam.processingStep === 3)
			{
				if (oParam.userIndex === undefined) {oParam.userIndex = 0}

				if (oParam.userIndex < sciqual.data.userContext.length)
				{
					var sData = sciqual.data.automation.postdata.replace('[[CONTACTPERSON]]', sciqual.data.userContext[oParam.userIndex]['usernetworkgroup.user.contactperson']);

					if (bLocal) {console.log("Calling DASHBOARD for " + sciqual.data.userContext[oParam.userIndex]['usernetworkgroup.user.contactpersontext']);}
					oParam.logHTML.push('');
					oParam.logHTML.push("Calling DASHBOARD for " + sciqual.data.userContext[oParam.userIndex]['usernetworkgroup.user.contactpersontext']);

					oParam.ajax.type = 'POST';
					oParam.ajax.url = '/ondemand/dashboard/' + sciqual.data.automation.url.replace('rf=text', 'rf=JSON') + '&rows=100' +
										'&logonkey=' + oParam.settings.user.logonkey + '&sid=' + oParam.settings.user.sid;
					oParam.ajax.data = sData;
					oParam.ajax.success = function(bErr, oResponse, oParam)
					{
						//debugger;
						if (!bErr && oResponse.status === 'OK')
						{
							// Loop thru all rows and check for future audits with old expiry dates
							if (bLocal) {console.log("DASHBOARD records found for " + sciqual.data.userContext[oParam.userIndex]['usernetworkgroup.user.contactpersontext'] + 
																						": " + oResponse.data.rows.length + ' rows');}
							oParam.logHTML.push("DASHBOARD records found for " + sciqual.data.userContext[oParam.userIndex]['usernetworkgroup.user.contactpersontext'] + 
															": " + oResponse.data.rows.length + ' rows');

							oParam.auditsToCheck = [];
							sciqual.data.automationResponseRows = oResponse.data.rows;

							for (var index = 0; index < oResponse.data.rows.length; index++)
							{
								var row = oResponse.data.rows[index];
								var dAudit = (row.scheduleddate != '') ? new Date(row.scheduleddate) : '';
								var dExpiry = (row.certificateexpiry != '') ? new Date(row.certificateexpiry) : '';
								var dToday = new Date((new Date()).toString('dd MMM yyyy'));
								var nDaysToExpiry = (dExpiry - dToday)/ (1000*3600*24);
								var nDaysToAudit = (dAudit - dToday)/ (1000*3600*24);

								if (nDaysToExpiry < 0 && nDaysToAudit > 60)
								{
									debugger;
									oParam.auditsToCheck.push({id: row.id, index: index});
								}
							}

							debugger;
							if (bLocal) {console.log(oParam.auditsToCheck.length + ' audits to check');}
							oParam.logHTML.push(oParam.auditsToCheck.length + ' audits to check');

							// Now go and check the audits (if any), otherwise, just send out the email
							if (oParam.auditsToCheck.length > 0)
							{
								fCallBackProcess(oParam, fCallBack, fCallBackProcess);
							}
							// No Audits to Check, just send email
							else if (oResponse.data.rows.length > 0)
							{
								sciqual.sendEmail(oParam, fCallBack, fCallBackProcess);
							}
							// Don't send anything if there's no response from the dashboard call
							else
							{
								oParam.userIndex += 1;
								fCallBack(oParam, fCallBack, fCallBackProcess);
							}
						}
						else
						{
							// Write to the log file - dashboard failed
							console.log("Error calling dashboard method: " + ((oResponse && oResponse.status === 'ER') ? oResponse.error.errornotes : ''));
							oParam.logHTML.push("Error calling dashboard method: " + ((oResponse && oResponse.status === 'ER') ? oResponse.error.errornotes : ''));

							oParam.processingStep = -1;
							fCallBack(oParam, fCallBack, fCallBackProcess);
						}
					};

					myJquery.ajax(oParam);
				}
				else
				{
					// We're all done
					console.log(Date() + " All done..");
					oParam.logHTML.push(Date() + " All done..");

					oParam.processingStep = 4;
					fCallBack(oParam, fCallBack, fCallBackProcess);
				}
			}

			// All done sucessfully
			else if (oParam.processingStep === 4 || oParam.processingStep === -1)
			{
				oParam.errorOccurred = (oParam.processingStep === -1);
				sciqual.sendLogFile(oParam);
			}

		},

		processAudits: function(oParam, fCallBack, fCallBackProcess)
		{
			// Here we search through oParam.auditsToCheck for audits linked to the current business in reverse data order. 
			// If the audit preceeding the current audit is either Cancelled or Assigned, we remove the current audit from the result set.
			var sciqual = module.exports;
			var bLocal = (oParam.settings.local != undefined) ? oParam.settings.local == "true" : false;
				
			var bLab = false;
			var iStatusAssigned = (bLab ? '13' : '5'),
				iStatusCancelled = (bLab ? '16': '9');
			var sContactBusiness;

			if (oParam.processAuditsIndex === undefined) {oParam.processAuditsIndex = 0}

			if (oParam.processAuditsIndex < oParam.auditsToCheck.length)
			{
				var oCurrentAudit = sciqual.data.automationResponseRows[oParam.auditsToCheck[oParam.processAuditsIndex].index];

				if (bLocal) {console.log('Checking audit ' + oCurrentAudit.contactbusinesstext + '..');}
				oParam.logHTML.push('Checking audit ' + oCurrentAudit.contactbusinesstext + '..');

				// First find contactbusiness
				var oSearch = 
				{
					fields:
					[
						{"name": "contactbusiness"},
						{"name": "scheduleddate"}
					],
					filters:
					[
						{"name": 'id', "comparison": "EQUAL_TO", "value1": oCurrentAudit.id}
					],
					options:
					{
						"rf": "JSON"
					}
				};
				
				oParam.ajax.type = 'POST';
				oParam.ajax.url = '/rpc/audit/?method=AUDIT_SEARCH&rf=JSON&advanced=1&logonkey=' + oParam.settings.user.logonkey + '&sid=' + oParam.settings.user.sid;
				oParam.ajax.data = JSON.stringify(oSearch);
				oParam.ajax.success = function(bErr, oResponse, oParam)
				{
					if (!bErr && oResponse.status == 'OK' && oResponse.data.rows.length > 0)
					{
						sContactBusiness = oResponse.data.rows[0].contactbusiness;
						sActualDate = oResponse.data.rows[0].scheduleddate;

						// Now get the list of audits for this contactbusiness, sorted by scheduleddate desc
						var oSearch = 
						{
							fields:
							[
								{"name": "scheduleddate"},
								{"name": "status"}
							],
							filters:
							[
								{"name": 'contactbusiness', "comparison": "EQUAL_TO", "value1": sContactBusiness},
								{"name": 'scheduleddate', "comparison": "LESS_THAN_OR_EQUAL_TO", "value1": sActualDate}
							],
							sorts:
							[
								{"name": "scheduleddate", "direction": 'desc'}
							],
							options:
							{
								"rf": "JSON",
								"rows": "5"
							}
						};

						oParam.ajax.type = 'POST';
						oParam.ajax.url = '/rpc/audit/?method=AUDIT_SEARCH&rf=JSON&advanced=1&logonkey=' + oParam.settings.user.logonkey + '&sid=' + oParam.settings.user.sid;
						oParam.ajax.data = JSON.stringify(oSearch);
						oParam.ajax.success = function(bErr, oResponse, oParam)
						{
							if (!bErr && oResponse.status === 'OK' && oResponse.data.rows.length > 0)
							{
								var bCurrentAuditFound = false;
								var iNextAuditIndex = undefined;
								if (bLocal) {console.log(oResponse.data.rows.length + ' audits for ' + oCurrentAudit.contactbusinesstext);}
								oParam.logHTML.push(oResponse.data.rows.length + ' audits for ' + oCurrentAudit.contactbusinesstext);

								for (var index = 0; index < oResponse.data.rows.length; index++)
								{
									var row = oResponse.data.rows[index];
									// Note that we've arrived at the current audit and record the index of the next audit (the one we want to check)
									if (row.id == oCurrentAudit.id)
									{
										bCurrentAuditFound = true;
										iNextAuditIndex = index + 1; 
									}

									// Check to see if previous audit is cancelled or assigned
									if (bCurrentAuditFound && index === iNextAuditIndex)
									{
										if ((row.status == iStatusCancelled || row.status == iStatusAssigned))
										{
											sciqual.data.automationResponseRows[oParam.auditsToCheck[oParam.processAuditsIndex].index].remove = true;
										}
										index = oResponse.data.rows.length;		// quit out of loop
									}
								}

								// We have finished processing this dashboardResponseRow, go to the next one
								oParam.processAuditsIndex += 1;
								fCallBackProcess(oParam, fCallBack, fCallBackProcess);
							}
							else
							{
								// Write to the log file
								console.log("Error finding Client audits: " + ((oResponse && oResponse.status === 'ER') ? oResponse.error.errornotes : ''));
								oParam.logHTML.push("Error finding Client audits: " + ((oResponse && oResponse.status === 'ER') ? oResponse.error.errornotes : ''));

								oParam.errorOccurred = true;
								sciqual.sendLogFile(oParam);
							}
						};
						
						myJquery.ajax(oParam);
					}
					else
					{
						// Write to the log file
						console.log("Error finding dashboard audit: " + ((oResponse && oResponse.status === 'ER') ? oResponse.error.errornotes : ''));
						oParam.logHTML.push("Error finding dashboard audit: " + ((oResponse && oResponse.status === 'ER') ? oResponse.error.errornotes : ''));

						oParam.errorOccurred = true;
						sciqual.sendLogFile(oParam);
					}
				};

				myJquery.ajax(oParam);
			}
			else
			{
				// Remove rows from automationResponseRows where necessary
				if (bLocal) {console.log(myJquery.grep(sciqual.data.automationResponseRows, function(x) {return x.remove === true}).length + ' rows to remove..');}
				oParam.logHTML.push(myJquery.grep(sciqual.data.automationResponseRows, function(x) {return x.remove === true}).length + ' rows to remove..');

				sciqual.data.automationResponseRows = myJquery.grep(sciqual.data.automationResponseRows, function(x) {return x.remove != true});
				delete(oParam.processAuditsIndex);

				// Now send out email
				if (sciqual.data.automationResponseRows.length > 0)
				{
					sciqual.sendEmail(oParam, fCallBack, fCallBackProcess);
				}
				else
				{
					oParam.userIndex += 1;
					fCallBack(oParam, fCallBack, fCallBackProcess);
				}
			}
		},

		emailHeader: function()
		{
			return '<td class="sciqualcaption sciqualReference">Audit Reference</td>' +
					'<td class="sciqualcaption sciqualClient">Client</td>' +
					'<td class="sciqualcaption sciqualLocation">Location</td>' +
					'<td class="sciqualcaption sciqualAuditType">Audit Type</td>' +
					'<td class="sciqualcaption sciqualScheduledDate">Scheduled Date</td>' +
					'<td class="sciqualcaption sciqualEndDate">End Date</td>' +
					'<td class="sciqualcaption sciqualHours">Hours</td>' +
					'<td class="sciqualcaption sciqualCertificateExpiry">Certificate Expiry</td>';
		},

		emailRow: function(row)
		{
			var sciqual = module.exports;
			var aHTML = [];

			aHTML.push('<tr id="tr_' + row.id + '">');
			
			aHTML.push('<td class="sciqual" style="vertical-align:top;">' + 
							'<a href="' + sciqual.formatXHTML(sciqual.data.automation.xhtmlahref) + row.id + '" target="_blank" class="sciqual">' + 
								sciqual.formatXHTML(row.title) + '</a>' +
						'</td>');

			aHTML.push('<td class="sciqual" style="vertical-align:top;">' + sciqual.formatXHTML(row.contactbusinesstext) + '</td>');

			aHTML.push('<td class="sciqual" style="vertical-align:top;">' + sciqual.formatXHTML(row.contactbusinesslocation) + '</td>');
			
			aHTML.push('<td class="sciqual" style="vertical-align:top;">' + sciqual.formatXHTML(row.audittype) + '</td>');
			
			aHTML.push('<td class="sciqual" style="vertical-align:top;">' + sciqual.formatXHTML(row.scheduleddate) + '</td>');
			
			aHTML.push('<td class="sciqual" style="vertical-align:top;">' + sciqual.formatXHTML(row.enddate) + '</td>');
			
			aHTML.push('<td class="sciqual" style="vertical-align:top;">' + sciqual.formatXHTML(row.hours) + '</td>');
			
			aHTML.push('<td class="sciqual" style="vertical-align:top;">' + sciqual.formatXHTML(row.certificateexpiry) + '</td>');
			
			aHTML.push('</tr>' + "\r\n");

			return aHTML.join('');
		}
	},

	newAuditorNotes: 
	{
		preProcess: function(oParam, fCallBack, fCallBackProcess)
		{
			// Extended version of New Auditor notes
			// Calls AUDIT_TASK_LIST and also adds notes added against the Client

			// Steps are:
			// 1. Get Automation record
			// 2. Get list of users in required network group including contactperson and email address
			// 3. Get a list of all auditors
			// 4. Get all Client notes entered within time period by auditors
			// 5. For each user, call AUDIT_TASK_LIST
			// 6. With results from (5), add any notes for this networkgroupuser. 
			//		Find Standards for all notes added for this user
			// 7. Compile email and sent to current user, saving against contactperson record

			var sciqual = module.exports;
			var oAutomation;
			var bTesting = (oParam.settings.testing != undefined) ? oParam.settings.testing == "true" : false;
			var bLocal   = (oParam.settings.local   != undefined) ? oParam.settings.local == "true"   : false;
			var bLab = false;
			
			//debugger;
			for (var i = 0; i < oParam.settings.automations.length; i++)
			{
				if (oParam.settings.automations[i].functionName === "newAuditorNotes")
				{
					oAutomation = oParam.settings.automations[i];
				}
			}

			oParam.functionEmailHeader = sciqual.newAuditorNotes.emailHeader;
			oParam.functionEmailRow = sciqual.newAuditorNotes.emailRow;

			
			if (oParam)
			{	if (oParam.processingStep === undefined) {oParam.processingStep = 1}}
			else { oParam = {processingStep: 1}}

			// Get the Automation
			if (oParam.processingStep === 1)
			{
				oParam.logHTML = [];
				console.log(Date());
				oParam.logHTML.push(Date());

				console.log("#AUTOMATION_SETTINGS: " + JSON.stringify(oAutomation));

				oParam.automation = oAutomation;
				oParam.processingStep = 2;
				sciqual.getAutomation(oParam, fCallBack, fCallBackProcess);
			}

			// Get a list of networkgroup Users
			else if (oParam.processingStep === 2)
			{
				oParam.processingStep = 3;
				oParam.addSearchFields = ['usernetworkgroup.user.contactperson.se2017', 'usernetworkgroup.user.contactperson.se2018'];
				sciqual.getNetworkUsers(oParam, fCallBack, fCallBackProcess);
			}

			// Get list of auditors and their manager
			else if (oParam.processingStep === 3)
			{
				if (bLocal) {console.log("Calling CONTACT_PERSON_SEARCH");}
				oParam.logHTML.push('');
				oParam.logHTML.push("Calling CONTACT_PERSON_SEARCH");

				sciqual.data.auditors = [];
				var oSearch = 
				{
					fields: 
					[
						{'name': 'contactperson.user.id'},
						{'name': 'se2015'}
					],
					filters:
					[
						{
							name: 'persongroup',
							comparison: 'EQUAL_TO',
							value1: '6849'
						},
						{
							name: 'contactperson.user.id',
							comparison: 'IS_NOT_NULL'
						}
					],
					options:
					{
						"rf": "JSON",
						"rows": (bTesting) ? "500" : "500"
					}
				};

				oParam.ajax = {};
				oParam.ajax.type = 'POST';
				oParam.ajax.url = '/rpc/contact/?method=CONTACT_PERSON_SEARCH&rf=JSON&advanced=1' +
									'&logonkey=' + oParam.settings.user.logonkey + '&sid=' + oParam.settings.user.sid;
				oParam.ajax.data = JSON.stringify(oSearch);
				oParam.ajax.success = function(bErr, oResponse, oParam)
				{
					//debugger;
					if (!bErr && oResponse.status === 'OK')
					{
						if (bLocal) {console.log(oResponse.data.rows.length + " Auditors found..");}
						oParam.logHTML.push(oResponse.data.rows.length + " Auditors found..");

						oParam.processingStep = 4;
						sciqual.data.auditors = oResponse.data.rows;
						fCallBack(oParam, fCallBack, fCallBackProcess);
					}
					else
					{
						// Write to the log file
						console.log("Error finding Auditors: " + ((oResponse && oResponse.status === 'ER') ? oResponse.error.errornotes : ''));
						oParam.logHTML.push("Error finding Auditors: " + ((oResponse && oResponse.status === 'ER') ? oResponse.error.errornotes : ''));

						oParam.processingStep = -1;
						fCallBack(oParam, fCallBack, fCallBackProcess);
					}
				};

				myJquery.ajax(oParam);
			}

			// Get any Client notes entered in the timeframe 
			else if (oParam.processingStep === 4)
			{
				if (bLocal) {console.log("Calling ACTION_SEARCH");}
				oParam.logHTML.push('');
				oParam.logHTML.push("Calling ACTION_SEARCH");

				debugger;
				var dYesterday = new Date();
				dYesterday = new Date(dYesterday.setHours(dYesterday.getHours() + 10));	// Adjust for UTC since it's run on the server
				dYesterday = new Date(dYesterday.setDate(dYesterday.getDate() -1));		// Get yesterday's date
				var sYesterday = myJquery.dateString(dYesterday);
				var aUsers = [];

				for (var i = 0; i < sciqual.data.auditors.length; i++)
				{
					aUsers.push(sciqual.data.auditors[i]['contactperson.user.id']);
				}

				sciqual.data.clientNotes = [];
				if (bLocal) {console.log(sYesterday);}
				/* ,'description,action.actionby.contactperson' */
				var oSearch = 
				{	
					fields: 
					[
						{"name": "duedate"},
						{"name": "contactbusiness"},
						{"name": "contactbusinesstext"},
						{"name": "actionby"},
						{"name": "actionbytext"},
						{"name": "actionby"},
						{'name': 'object'},
						{'name': 'objectcontext'},
						{'name': 'description'},
						{"name": "action.contactbusiness.se13456"}
					],
					filters:
					[
						{
							"name": "object",
							"comparison": "EQUAL_TO",
							"value1": "12"
						},
						{
							"name": "actiontype",
							"comparison": "EQUAL_TO",
							"value1": "4"
						},
						{
							"name": "createddate", 
							"comparison": "BETWEEN",
							"value1": sYesterday + " 00:00:00",
							"value2": sYesterday + " 23:59:59"
						},
						/*{
							"name": "actionby",
							"comparison": "IN_LIST",
							"value1": aUsers.join(",")
						}, Decided they want ALL notes */
						{	
							'name': 'status',
							'comparison': 'NOT_EQUAL_TO',
							'value1': '3'		
						}
					],
					options:
					{
						"rf": "JSON",
						"rows": "500"
					}
				};

				oParam.ajax = {};
				oParam.ajax.type = 'POST';
				oParam.ajax.url = '/rpc/action/?method=ACTION_SEARCH&rf=JSON&advanced=1' +
									'&logonkey=' + oParam.settings.user.logonkey + '&sid=' + oParam.settings.user.sid;
				oParam.ajax.data = JSON.stringify(oSearch);
				//oParam.ajax.dataType = 'JSON';
				oParam.ajax.success = function(bErr, oResponse, oParam)
				{
					debugger;
					if (!bErr && oResponse.status === 'OK')
					{
						if (bLocal) {console.log(oResponse.data.rows.length + " Client Notes found.. " + 
									myJquery.grep(oResponse.data.rows, function(x) {return x['action.contactbusiness.se13456'] == '1'}).length + ' ISO Clients and ' +
									myJquery.grep(oResponse.data.rows, function(x) {return x['action.contactbusiness.se13456'] == '2'}).length + ' Food Clients');}
						oParam.logHTML.push(oResponse.data.rows.length + " Client Notes found..");

						oParam.processingStep = 5;
						sciqual.data.clientNotes = oResponse.data.rows;
						fCallBack(oParam, fCallBack, fCallBackProcess);
					}
					else
					{
						// Write to the log file
						console.log("Error finding Client Notes: " + ((oResponse && oResponse.status === 'ER') ? oResponse.error.errornotes : ''));
						oParam.logHTML.push("Error finding Client Notes: " + ((oResponse && oResponse.status === 'ER') ? oResponse.error.errornotes : ''));

						oParam.processingStep = -1;
						fCallBack(oParam, fCallBack, fCallBackProcess);
					}
				};

				myJquery.ajax(oParam);
			}

			// Call AUDIT_TASK_LIST method for each user
			else if (oParam.processingStep === 5)
			{
				if (oParam.userIndex === undefined) {oParam.userIndex = 0}

				if (oParam.userIndex < sciqual.data.userContext.length)
				{
					sciqual.data.automationResponseRows = [];
					var sData = sciqual.data.automation.postdata.replace('[[CONTACTPERSON]]', sciqual.data.userContext[oParam.userIndex]['usernetworkgroup.user.contactperson']);

					if (bLocal) {console.log("Calling AUDIT_TASK_LIST for " + sciqual.data.userContext[oParam.userIndex]['usernetworkgroup.user.contactpersontext']);}
					oParam.logHTML.push('');
					oParam.logHTML.push("Calling AUDIT_TASK_LIST for " + sciqual.data.userContext[oParam.userIndex]['usernetworkgroup.user.contactpersontext']);

					oParam.ajax.type = 'POST';
					oParam.ajax.url = '/rpc/audit/' + sciqual.data.automation.url.replace('rf=TEXT', 'rf=JSON') + '&rows=100' +
										'&logonkey=' + oParam.settings.user.logonkey + '&sid=' + oParam.settings.user.sid;
					oParam.ajax.data = sData;
					oParam.ajax.success = function(bErr, oResponse, oParam)
					{
						//debugger;
						if (!bErr && oResponse.status === 'OK')
						{
							// Check to see if we have any notes for this ContactPerson in sciqual.data.clientNotes
							if (bLocal) {console.log("AUDIT_TASK_LIST records found for " + sciqual.data.userContext[oParam.userIndex]['usernetworkgroup.user.contactpersontext'] + 
																						": " + oResponse.data.rows.length + ' rows');}
							oParam.logHTML.push("AUDIT_TASK_LIST records found for " + sciqual.data.userContext[oParam.userIndex]['usernetworkgroup.user.contactpersontext'] + 
															": " + oResponse.data.rows.length + ' rows');

							var oUser = sciqual.data.userContext[oParam.userIndex];
							var aNotes = [];
							
							if (bLocal) {console.log(sciqual.data.userContext[oParam.userIndex]['usernetworkgroup.user.contactpersontext'] + ' is ' + 
																	(oUser['usernetworkgroup.user.contactperson.se2017'] === 'Yes' ? 'ISO' : '') + ' ' +
																	(oUser['usernetworkgroup.user.contactperson.se2018'] === 'Yes' ? 'Food': ''));}

							// Check if ISO - find notes added where actionBy user is managed by the current person
							if (oUser['usernetworkgroup.user.contactperson.se2017'] === 'Yes')
							{
								// Get the list of auditors this user manages
								var aAuditors = myJquery.grep(sciqual.data.auditors, function(x)
								{
									return (x['se2015'] == oUser['usernetworkgroup.user.id']);
								});

								// Get the list of other ISO internal staff 
								var aISOStaff =  myJquery.grep(sciqual.data.userContext, function(x)
								{
									return (x['usernetworkgroup.user.contactperson.se2017'] == 'Yes');
								});

								debugger;
								aNotes = myJquery.grep(sciqual.data.clientNotes, function(x)
								{
									return (myJquery.grep(aAuditors, function(y) {return x.actionby == y['contactperson.user.id']}).length > 0 
											|| x['action.contactbusiness.se13456'] == '1');
								});
							}

							// Check Non-ISO - find notes where the client's itemtypeclass is Non-ISO (2)
							if (oUser['usernetworkgroup.user.contactperson.se2018'] === 'Yes')
							{
								for (var i=0; i < sciqual.data.clientNotes.length; i++)
								{
									if (sciqual.data.clientNotes[i]['action.contactbusiness.se13456'] == '2')
									{
										// make sure it doesn't already exist from above
										if (myJquery.grep(aNotes, function(x) {return x.id === sciqual.data.clientNotes[i].id}).length == 0)
										{
											aNotes.push(sciqual.data.clientNotes[i]);
										}
									}
								}
							}

							if (aNotes) {oParam.clientNotes = aNotes} else {oParam.clientNotes = [];}
							sciqual.data.automationResponseRows = oResponse.data.rows;

							// If any notes, get standards, otherwise, just send out the email
							if (oParam.clientNotes.length > 0)
							{
								fCallBackProcess(oParam, fCallBack, fCallBackProcess);
							}
							// No Standards to check, just send email
							else if (oResponse.data.rows.length > 0)
							{
								sciqual.sendEmail(oParam, fCallBack, fCallBackProcess);
							}
							// Don't send anything if there's no response from the dashboard call
							else
							{
								oParam.userIndex += 1;
								fCallBack(oParam, fCallBack, fCallBackProcess);
							}
						}
						else
						{
							// Write to the log file - dashboard failed
							console.log("Error calling audit_task_list method: " + ((oResponse && oResponse.status === 'ER') ? oResponse.error.errornotes : ''));
							oParam.logHTML.push("Error calling audit_task_list method: " + ((oResponse && oResponse.status === 'ER') ? oResponse.error.errornotes : ''));

							oParam.processingStep = -1;
							fCallBack(oParam, fCallBack, fCallBackProcess);
						}
					};

					myJquery.ajax(oParam);
				}
				else
				{
					// We're all done
					console.log(Date() + " All done..");
					oParam.logHTML.push(Date() + " All done..");

					debugger;
					oParam.processingStep = 6;
					fCallBack(oParam, fCallBack, fCallBackProcess);
				}
			}

			// All done sucessfully
			else if (oParam.processingStep === 6 || oParam.processingStep === -1)
			{
					debugger;
				oParam.errorOccurred = (oParam.processingStep === -1);
				sciqual.sendLogFile(oParam);
			}

		},

		findStandards: function(oParam, fCallBack, fCallBackProcess)
		{
			// Here we search through oParam.clientNotes and get the client's standards
			// We also configure the notes into the same format as returned from the AUDIT_TASK_LIST call

			var sciqual = module.exports;
			var bLocal = (oParam.settings.local != undefined) ? oParam.settings.local == "true" : false;
				
			var bLab = false;
			var iItemTypeStandard = (bLab ? '26' : '1');
			var sContactBusiness;
			var aClients = [];
			var aNotes = [];

			if (oParam.clientNotes) {aNotes = oParam.clientNotes}
			else if (oParam.auditNotes) {aNotes = oParam.auditNotes}

			for (var i=0; i < aNotes.length; i++)
			{
				aClients.push(aNotes[i].contactbusiness);
			}

			var oSearch = 
			{
				fields: 
				[
					{name: 'itemtypetext'}, 
					{name: 'objectcontext'}
				],
				filters:
				[
					{
						name: 'object',
						comparison: 'EQUAL_TO',
						value1: '12'
					},
					{
						name: 'objectcontext',
						comparison: 'IN_LIST',
						value1: aClients.join(',')
					},
					{
						name: 'itemtypecategory',
						comparison: 'EQUAL_TO',
						value1: '1'
					},
					{
						name: 'deprecated',
						comparison: 'IS_NULL'
					}
				],
				options:
				{
					rows: '500',
					rf: 'JSON'
				}
			};

			oParam.ajax = {};
			oParam.ajax.type = 'POST';
			oParam.ajax.url = '/rpc/audit/?method=AUDIT_ITEM_TYPE_SEARCH&rf=JSON&advanced=1' +
									'&logonkey=' + oParam.settings.user.logonkey + '&sid=' + oParam.settings.user.sid,
			oParam.ajax.data = JSON.stringify(oSearch);
			oParam.ajax.success = function(bErr, oResponse, oParam)
			{
				if (!bErr && oResponse.status === 'OK')
				{
					if (bLocal) {console.log(oResponse.data.rows.length + " Standards found..");}
					oParam.logHTML.push(oResponse.data.rows.length + " Standards found..");

					// Now add the aNotes to the automationResponseRows in the correct format
					for (var i=0; i < aNotes.length; i++)
					{
						var oStandards = myJquery.grep(oResponse.data.rows, function(x) {return x.objectcontext === aNotes[i].contactbusiness});
						var aStandards = myJquery.map(oStandards, function(x) {return x.itemtypetext});
						var oAuditorNote = 
						{
							contactbusinesstext: aNotes[i].contactbusinesstext,
							scheduleddate: (aNotes[i]['action.audit.scheduleddate'] ? aNotes[i]['action.audit.scheduleddate'] :''),
							actionbytext: aNotes[i].actionbytext,
							description: aNotes[i].description,
							standards: aStandards.join('; '),
							id: aNotes[i].objectcontext,
							object: aNotes[i].object
						};
							//id: (aNotes[i]['action.audit.scheduleddate'] ? aNotes[i].objectcontext : oParam.aNotes[i].contactbusiness),
						sciqual.data.automationResponseRows.push(oAuditorNote);
					}

					// Send email
					sciqual.sendEmail(oParam, fCallBack, fCallBackProcess);
				}
				else
				{
					// Write to the log file
					console.log("Error finding Standards: " + ((oResponse && oResponse.status === 'ER') ? oResponse.error.errornotes : ''));
					oParam.logHTML.push("Error finding Standards: " + ((oResponse && oResponse.status === 'ER') ? oResponse.error.errornotes : ''));

					oParam.processingStep = -1;
					fCallBack(oParam, fCallBack, fCallBackProcess);
				}
			};

			myJquery.ajax(oParam);
		},

		emailHeader: function()
		{
			return '<td class="sciqualcaption sciqualClient">Client</td>' +
					'<td class="sciqualcaption sciqualAuditDate">Audit Date</td>' +
					'<td class="sciqualcaption sciqualAuditor">Entered By</td>' +
					'<td class="sciqualcaption sciqualNotes">Notes</td>' +
					'<td class="sciqualcaption sciqualStandards">Standards</td>';
		},

		emailRow: function(row)
		{
			var sciqual = module.exports;
			var aHTML = [];
			var sAHREF = (row.object && row.object == '12') ? sciqual.data.automation.xhtmlahref.replace('Audit', 'Client') : sciqual.data.automation.xhtmlahref;

			aHTML.push('<tr id="tr_' + row.id + '">');
			
			aHTML.push('<td class="sciqual" style="vertical-align:top;">' + 
							'<a href="' + sciqual.formatXHTML(sAHREF) + row.id + '" target="_blank" class="sciqual">' + 
								sciqual.formatXHTML(row.contactbusinesstext) + '</a>' +
						'</td>');

			aHTML.push('<td class="sciqual" style="vertical-align:top;">' + sciqual.formatXHTML(row.scheduleddate) + '</td>');
			
			aHTML.push('<td class="sciqual" style="vertical-align:top;">' + sciqual.formatXHTML(row.actionbytext) + '</td>');
			
			aHTML.push('<td class="sciqual" style="vertical-align:top;">' + sciqual.formatXHTML(row.description) + '</td>');
			
			aHTML.push('<td class="sciqual" style="vertical-align:top;">' + sciqual.formatXHTML(row.standards) + '</td>');
			
			aHTML.push('</tr>' + "\r\n");

			return aHTML.join('');
		}
	},

	newOperationsNotes: 
	{
		preProcess: function(oParam, fCallBack)
		{
			// Automation for old DASHBOARD_AUDIT_SEARCH which disappeared
			// Finds all notes added by operations team and sends out to audit's team leader

			// Steps are:
			// 1. Get list of users in auditor network group including contactperson and email address
			// 2. Get a list of all operations users
			// 3. Get all Audit notes entered within time period by operations users
			// 4. For each user in auditor network group, determine if any notes apply to them
			// 5. Get Standards for all notes for the current person
			// 6. Compile email and sent to current user, saving against contactperson record

			var sciqual = module.exports;
			var oAutomation;
			var bTesting = (oParam.settings.testing != undefined) ? oParam.settings.testing == "true" : false;
			var bLocal   = (oParam.settings.local   != undefined) ? oParam.settings.local == "true"   : false;
			var bLab = false;
			
			//debugger;
			for (var i = 0; i < oParam.settings.automations.length; i++)
			{
				if (oParam.settings.automations[i].functionName === "newOperationsNotes")
				{
					oAutomation = oParam.settings.automations[i];
				}
			}

			oParam.functionEmailHeader = sciqual.newAuditorNotes.emailHeader;
			oParam.functionEmailRow = sciqual.newAuditorNotes.emailRow;

			if (oParam)
			{	if (oParam.processingStep === undefined) {oParam.processingStep = 1}}
			else { oParam = {processingStep: 1}}

			// Get a list of Auditor networkgroup Users
			if (oParam.processingStep === 1)
			{
				oParam.logHTML = [];
				console.log(Date());
				oParam.logHTML.push(Date());

				console.log("#AUTOMATION_SETTINGS: " + JSON.stringify(oAutomation));

				oParam.processingStep = 2;
				sciqual.data.automation = 
				{
					responseactioncontext: '855', 
					xhtmlahref: 'https://sciqual.1blankspace.com/#viewport-Audit-',
					title: 'Notes added by Operations',
					responseactionfrom: 'databasenotes@sciqual.com.au'
				};
				sciqual.getNetworkUsers(oParam, fCallBack);
			}

			// Get list of Operations users
			else if (oParam.processingStep === 2)
			{
				if (bLocal) {console.log("Calling CONTACT_PERSON_SEARCH");}
				oParam.logHTML.push('');
				oParam.logHTML.push("Calling CONTACT_PERSON_SEARCH");

				sciqual.data.operations = [];
				var oSearch = 
				{
					fields: 
					[
						{"name": "usernetworkgroup.user.contactperson"},
						{"name": "usernetworkgroup.user.contactpersontext"},
						{"name": 'usernetworkgroup.user.id'}
					],
					filters:
					[
						{"name": "networkgroup", comparison: "EQUAL_TO", value1: '860'}
					],
					options:
					{
						"rf": "JSON",
						"rows": "100"
					}
				};

				oParam.ajax = {};
				oParam.ajax.type = 'POST';
				oParam.ajax.url = '/rpc/setup/?method=SETUP_USER_NETWORK_GROUP_SEARCH&rf=JSON&advanced=1' +
									'&logonkey=' + oParam.settings.user.logonkey + '&sid=' + oParam.settings.user.sid;
				oParam.ajax.data = JSON.stringify(oSearch);
				oParam.ajax.success = function(bErr, oResponse, oParam)
				{
					//debugger;
					if (!bErr && oResponse.status === 'OK')
					{
						if (bLocal) {console.log(oResponse.data.rows.length + " Operations Staff found..");}
						oParam.logHTML.push(oResponse.data.rows.length + " Operations Staff found..");

						oParam.processingStep = 3;
						sciqual.data.operations = oResponse.data.rows;
						fCallBack(oParam, fCallBack);
					}
					else
					{
						// Write to the log file
						console.log("Error finding Ops Staff: " + ((oResponse && oResponse.status === 'ER') ? oResponse.error.errornotes : ''));
						oParam.logHTML.push("Error finding Ops Staff: " + ((oResponse && oResponse.status === 'ER') ? oResponse.error.errornotes : ''));

						oParam.processingStep = -1;
						fCallBack(oParam, fCallBack);
					}
				};

				myJquery.ajax(oParam);
			}

			// Get any Audit notes entered in the timeframe by operations
			else if (oParam.processingStep === 3)
			{
				if (bLocal) {console.log("Calling ACTION_SEARCH");}
				oParam.logHTML.push('');
				oParam.logHTML.push("Calling ACTION_SEARCH");

				var dYesterday = new Date();
				dYesterday = new Date(dYesterday.setHours(dYesterday.getHours() + 10));	// Adjust for UTC since it's run on the server
				dYesterday = new Date(dYesterday.setDate(dYesterday.getDate() -1));		// Get yesterday's date
				var sYesterday = myJquery.dateString(dYesterday);
				var aUsers = [];

				for (var i = 0; i < sciqual.data.operations.length; i++)
				{
					aUsers.push(sciqual.data.operations[i]['usernetworkgroup.user.id']);
				}

				sciqual.data.clientNotes = [];

				/* ,'description,action.actionby.contactperson' */
				var oSearch = 
				{	
					fields: 
					[
						{"name": "duedate"},
						{"name": "contactbusiness"},
						{"name": "contactbusinesstext"},
						{"name": "actionby"},
						{"name": "actionbytext"},
						{"name": "actionby"},
						{'name': 'description'},
						{'name': 'object'},
						{"name": 'objectcontext'},
						{"name": "action.audit.teamleadercontactperson"},
						{"name": "action.audit.scheduleddate"}
					],
					filters:
					[
						{
							"name": "object",
							"comparison": "EQUAL_TO",
							"value1": "107"
						},
						{
							"name": "actiontype",
							"comparison": "EQUAL_TO",
							"value1": "4"
						},
						{
							"name": "createddate", 
							"comparison": "BETWEEN",
							"value1": sYesterday + " 00:00:00",
							"value2": sYesterday + " 23:59:59"
						},
						{
							"name": "actionby",
							"comparison": "IN_LIST",
							"value1": aUsers.join(",")
						},
						{
							'name': 'status',
							'comparison': 'NOT_EQUAL_TO',
							'value1': '3' 
						}
					],
					options:
					{
						"rf": "JSON",
						"rows": "500"
					}
				};

				oParam.ajax = {};
				oParam.ajax.type = 'POST';
				oParam.ajax.url = '/rpc/action/?method=ACTION_SEARCH&rf=JSON&advanced=1' +
									'&logonkey=' + oParam.settings.user.logonkey + '&sid=' + oParam.settings.user.sid;
				oParam.ajax.data = JSON.stringify(oSearch);
				//oParam.ajax.dataType = 'JSON';
				oParam.ajax.success = function(bErr, oResponse, oParam)
				{
					debugger;
					if (!bErr && oResponse.status === 'OK')
					{
						if (bLocal) {console.log(oResponse.data.rows.length + " Operations Notes found.. ")}
						oParam.logHTML.push(oResponse.data.rows.length + " Operations Notes found..");

						oParam.processingStep = 4;
						sciqual.data.auditNotes = oResponse.data.rows;
						fCallBack(oParam, fCallBack);
					}
					else
					{
						// Write to the log file
						console.log("Error finding Operations Notes: " + ((oResponse && oResponse.status === 'ER') ? oResponse.error.errornotes : ''));
						oParam.logHTML.push("Error finding Operations Notes: " + ((oResponse && oResponse.status === 'ER') ? oResponse.error.errornotes : ''));

						oParam.processingStep = -1;
						fCallBack(oParam, fCallBack);
					}
				};

				myJquery.ajax(oParam);
			}

			// Loop through each networkgroup user and send email if there are any notes
			else if (oParam.processingStep === 4)
			{
				if (oParam.userIndex === undefined) {oParam.userIndex = 0}

				if (oParam.userIndex < sciqual.data.userContext.length)
				{
					sciqual.data.automationResponseRows = [];
					delete(oParam.clientNotes);

					var oUser = sciqual.data.userContext[oParam.userIndex];
					var iContactPerson = sciqual.data.userContext[oParam.userIndex]['usernetworkgroup.user.contactperson'];
					var aNotes = [];
					
					// Find any notes where current iCOntactPerson is the audit teamleader linked to the note
					debugger;
					aNotes = myJquery.grep(sciqual.data.auditNotes, function(x)
					{
						return x['action.audit.teamleadercontactperson'] === iContactPerson;
					});

					if (bLocal) {console.log("Notes found for " + sciqual.data.userContext[oParam.userIndex]['usernetworkgroup.user.contactpersontext'] + 
																				": " + aNotes.length + ' rows');}
					oParam.logHTML.push("Notes found for " + sciqual.data.userContext[oParam.userIndex]['usernetworkgroup.user.contactpersontext'] + 
													": " + aNotes.length + ' rows');

					if (aNotes) {oParam.auditNotes = aNotes} else {oParam.auditNotes = [];}

					// If any notes, get standards, otherwise, just send out the email
					if (oParam.auditNotes.length > 0)
					{
						sciqual.newAuditorNotes.findStandards(oParam, fCallBack);
					}
					// Don't send anything if there's no notes
					else
					{
						oParam.userIndex += 1;
						fCallBack(oParam, fCallBack);
					}
				}
				else
				{
					// We're all done
					console.log(Date() + " All done..");
					oParam.logHTML.push(Date() + " All done..");

					debugger;
					oParam.processingStep = 6;
					fCallBack(oParam, fCallBack);
				}
			}

			// All done sucessfully
			else if (oParam.processingStep === 6 || oParam.processingStep === -1)
			{
					debugger;
				oParam.errorOccurred = (oParam.processingStep === -1);
				sciqual.sendLogFile(oParam);
			}
		}
	},

	updateClientClass:
	{
		preProcess: function(oParam, fCallBack, fCallBackProcess)
		{
			// Updates seClientClass with correct value on a nightly basis

			// Steps are:
			// 1. Get list of 'Standard' AuditItemType records linked to clients sorted by contactbusiness
			// 2. Look through rows and dtermine whether ISO, Non-ISO or SQF
			// 3. Update each ContactBusiness row if different

			var sciqual = module.exports;
			var oAutomation;
			var bTesting = (oParam.settings.testing != undefined) ? oParam.settings.testing == "true" : false;
			var bLocal   = (oParam.settings.local   != undefined) ? oParam.settings.local == "true"   : false;
			var bLab = false;
			var iCategoryStandard = (oParam.settings.standardCategory != undefined) ? oParam.settings.standardCategory : '3';
			var seClientClass = (oParam.settings.seClientClass != undefined) ? oParam.settings.seClientClass : '13456';
			var iClassISO = '1';
			var iClassNonISO = '2';
			var iClassSQF = '3';
			
			//debugger;
			for (var i = 0; i < oParam.settings.automations.length; i++)
			{
				if (oParam.settings.automations[i].functionName === "updateClientClass")
				{
					oAutomation = oParam.settings.automations[i];
				}
			}

			oParam.functionEmailHeader = sciqual.newAuditorNotes.emailHeader;
			oParam.functionEmailRow = sciqual.newAuditorNotes.emailRow;

			if (oParam)
			{	if (oParam.processingStep === undefined) {oParam.processingStep = 1}}
			else { oParam = {processingStep: 1}}

			// Get "Automation" settings
			if (oParam.processingStep === 1)
			{
				oParam.logHTML = [];
				console.log(Date());
				oParam.logHTML.push(Date());

				console.log("#AUTOMATION_SETTINGS: " + JSON.stringify(oAutomation));

				oParam.processingStep = 2;
				sciqual.data.automation = 
				{
					responseactioncontext: '873', 
					xhtmlahref: 'https://sciqual.1blankspace.com/#viewport-Client-',
					title: 'Update Client Class',
					responseactionfrom: 'cassandra.buono@alt-designit.com.au'
				};
				fCallBack(oParam, fCallBack);
			}

			// Get list of Standrds linked to Clients
			else if (oParam.processingStep === 2)
			{
				if (bLocal) {console.log("Calling AUDIT_ITEM_TYPE_SEARCH");}
				oParam.logHTML.push('');
				oParam.logHTML.push("Calling AUDIT_ITEM_TYPE_SEARCH");

				sciqual.data.clientStandards = [];
				var oSearch = 
				{
					fields: 
					[
						{"name": "audititemtype.contactbusiness.tradename"},
						{"name": "audititemtype.contactbusiness.se" + seClientClass},
						{"name": 'objectcontext'},
						{"name": "itemtype"},
						{"name": 'itemtypetext'},
						{"name": 'itemtypeclass'}
					],
					filters:
					[
						{"name": "itemtypecategory", comparison: "EQUAL_TO", value1: iCategoryStandard},
						{"name": "object", comparison: "EQUAL_TO", value1: '12'}
					],
					sorts:
					[
						{name: 'objectcontext', direction: 'asc'},
						{"name": 'itemtypeclass', direction: 'asc'},
						{name: 'itemtype', direction: 'asc'}
					],
					options:
					{
						"rf": "JSON",
						"rows": "500"
					}
				};

				oParam.ajax = {};
				oParam.ajax.type = 'POST';
				oParam.ajax.url = '/rpc/audit/?method=AUDIT_ITEM_TYPE_SEARCH&rf=JSON&advanced=1' +
									'&logonkey=' + oParam.settings.user.logonkey + '&sid=' + oParam.settings.user.sid;
				oParam.ajax.data = JSON.stringify(oSearch);
				oParam.ajax.success = function(bErr, oResponse, oParam)
				{
					//debugger;
					if (!bErr && oResponse.status === 'OK')
					{
						if (bLocal) {console.log(oResponse.data.rows.length + " Client Standards found..");}
						oParam.logHTML.push(oResponse.data.rows.length + " Client Standards found..");

						oParam.processingStep = 3;
						oParam.response = oResponse;
						sciqual.data.clientStandards = oResponse.data.rows;
						fCallBack(oParam, fCallBack);
					}
					else
					{
						// Write to the log file
						console.log("Error finding Client Standards: " + ((oResponse && oResponse.status === 'ER') ? oResponse.error.errornotes : ''));
						oParam.logHTML.push("Error finding Client Standards: " + ((oResponse && oResponse.status === 'ER') ? oResponse.error.errornotes : ''));

						oParam.processingStep = -1;
						fCallBack(oParam, fCallBack);
					}
				};

				myJquery.ajax(oParam);
			}

			// Find more rows
			else if (oParam.processingStep === 3)
			{
				if (oParam.response)
				{
					var oResponse = oParam.response;

					debugger;
					if (oResponse.morerows == "true")
					{
						console.log("Getting more rows")
						oParam.logHTML.push("Getting more rows");

						var sData = 'id=' + oResponse.moreid + '&startrow=' + (parseInt(oResponse.startrow) + parseInt(oResponse.rows)) + '&rows=' + oResponse.rows;

						oParam.ajax = {};
						oParam.ajax.type = 'POST';
						oParam.ajax.url = '/rpc/core/?method=CORE_SEARCH_MORE&rf=JSON' +
											'&logonkey=' + oParam.settings.user.logonkey + '&sid=' + oParam.settings.user.sid;
						oParam.ajax.data = sData;
						oParam.ajax.success = function(bErr, oResponse, oParam)
						{
							if (!bErr && oResponse.status === 'OK')
							{
								sciqual.data.clientStandards = sciqual.data.clientStandards.concat(oResponse.data.rows);
								oParam.response = oResponse;
							}
							else
							{
								console.log("Error finding more rows: " + ((oResponse && oResponse.status === 'ER') ? oResponse.error.errornotes : ''));
								oParam.logHTML.push("Error finding more rows: " + ((oResponse && oResponse.status === 'ER') ? oResponse.error.errornotes : ''));
								oParam.processingStep = -1;
							}
							fCallBack(oParam, fCallBack, fCallBackProcess);
						};

						myJquery.ajax(oParam);
					}
					// We have all the records, go to the next step
					else
					{
						console.log(sciqual.data.clientStandards.length + ' Client Standards found');

						oParam.processingStep = 4;
						fCallBack(oParam, fCallBack, fCallBackProcess);
					}
				}
				else
				{
					console.log("oResponse not passed to step 3");
					oParam.logHTML.push("oResponse not passed to step 3");
					oParam.processingStep = -1;
				}
			}

			// Process ItemType Rows
			else if (oParam.processingStep === 4)
			{
				var sPreviousBusiness = '';
				var sClass = '';
				var aUpdateRows = [];

				for (var i = 0; i < sciqual.data.clientStandards.length; i++)
				{
					var oThisRow = sciqual.data.clientStandards[i];

					if (oThisRow['objectcontext'] != oParam.previousBusiness)
					{
						if (i > 0)		// Check if Class is different to saved class, but only if we're not on first row
						{
							if (sciqual.data.clientStandards[i-1]['audititemtype.contactbusiness.se' + seClientClass] != sClass
								&& sciqual.data.clientStandards[i-1]['audititemtype.contactbusiness.tradename'] != '')
							{
								aUpdateRows.push(
								{
									id: sciqual.data.clientStandards[i-1].objectcontext,
									tradename: sciqual.data.clientStandards[i-1]['audititemtype.contactbusiness.tradename'],
									clientclass: sClass,
									currentclass: sciqual.data.clientStandards[i-1]['audititemtype.contactbusiness.se' + seClientClass]
								});
							}
						}
						sClass = oThisRow.itemtypeclass;
					}
					else
					{
						if (oThisRow.itemtypeclass == iClassISO)
						{
							sClass = iClassISO;
						}
						else if (sClass == '')
						{
							sClass = oThisRow.itemtypeclass;
						}
					}
					oParam.previousBusiness = oThisRow['objectcontext'];
				}

				oParam.updateRows = aUpdateRows;
				console.log('aUpdateRows: ' + aUpdateRows.length);
				oParam.logHTML.push('aUpdateRows: ' + aUpdateRows.length);
				console.log('');

				oParam.processingStep = 5;
				fCallBack(oParam, fCallBack, fCallBackProcess);
			}

			else if (oParam.processingStep === 5)
			{
				var aUpdateRows = oParam.updateRows;
				if (oParam.updateIndex == undefined) {oParam.updateIndex = 0}

				if (oParam.updateIndex < aUpdateRows.length)		//
				{
					var oThisRow = aUpdateRows[oParam.updateIndex];
					var sData = 'id=' + oThisRow.id + '&se' + seClientClass + '=' + oThisRow.clientclass;
					//console.log(sData);

					console.log('Updating ' + sciqual.formatXHTML(oThisRow.tradename) + ' from ' + oThisRow.currentclass + ' to ' + oThisRow.clientclass);
					oParam.logHTML.push('Updating ' + sciqual.formatXHTML(oThisRow.tradename) + ' from ' + oThisRow.currentclass + ' to ' + oThisRow.clientclass);

					if (!bTesting)
					{
						oParam.ajax = {};
						oParam.ajax.type = 'POST';
						oParam.ajax.url = '/rpc/contact/?method=CONTACT_BUSINESS_MANAGE&rf=JSON' +
											'&logonkey=' + oParam.settings.user.logonkey + '&sid=' + oParam.settings.user.sid;
						oParam.ajax.data = sData;
						oParam.ajax.success = function(bErr, oResponse, oParam)
						{
							//debugger;
							if (!bErr && oResponse.status === 'OK')
							{
								oParam.updateIndex += 1;
							}
							else
							{
								console.log('Error Updating ' + sciqual.formatXHTML(oThisRow.tradename) + ": " + ((oResponse && oResponse.status === 'ER') ? oResponse.error.errornotes : ''));
								oParam.logHTML.push('Updating ' + sciqual.formatXHTML(oThisRow.tradename) + ": " + ((oResponse && oResponse.status === 'ER') ? oResponse.error.errornotes : ''));
								oParam.processingStep = -1;
							}
							fCallBack(oParam, fCallBack, fCallBackProcess);
						};

						myJquery.ajax(oParam);
					}
					else
					{
						oParam.updateIndex += 1;
						fCallBack(oParam, fCallBack, fCallBackProcess);
					}
				}
				// All records processed. 
				else
				{
					delete(oParam.updateIndex);
					console.log('');
					delete(oParam.updateRows);
					oParam.processingStep = 10;
					fCallBack(oParam, fCallBack, fCallBackProcess);
				}
			}

			// All done sucessfully
			else if (oParam.processingStep === 10 || oParam.processingStep === -1)
			{
				delete(oParam.currentObject);
				oParam.errorOccurred = (oParam.processingStep === -1);
				sciqual.sendLogFile(oParam);
			}
		}
	}

}


