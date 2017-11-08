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
					 				'Log File for EMS Code Update') +
					 '&fromemail=' + encodeURIComponent('cassandra.buono@alt-designit.com.au') +
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

	getCodes: function(oParam, fCallBack, fCallBackProcess)
	{
		// Get list of Codes in the emsCategory
		var sciqual = module.exports;
		var bLocal   = (oParam.settings.local != undefined) ? oParam.settings.local == "true" : false;
		var bTesting = (oParam.settings.testing != undefined) ? oParam.settings.testing == "true" : false;
		var sCategory = (oParam.settings.emsCategory != undefined) ? oParam.settings.emsCategory : '12';

		var oSearch = 
		{
			fields: 
			[
				{"name": "code"},
				{"name": "description"},
				{"name": "startdate"},
				{"name": 'enddate'}
			],
			filters:
			[
				{"name": "category", comparison: "EQUAL_TO", value1: sCategory}
			],
			options:
			{
				"rf": "JSON",
				"rows": "20"
			}
		};

		oParam.ajax = {};
		oParam.ajax.type = 'POST';
		oParam.ajax.url = '/rpc/setup/?method=SETUP_AUDIT_ITEM_TYPE_SEARCH&advanced=1&rf=JSON&logonkey=' + oParam.settings.user.logonkey + '&sid=' + oParam.settings.user.sid;
		oParam.ajax.data = JSON.stringify(oSearch);
		oParam.ajax.success = function(bErr, oResponse, oParam)
		{
			if (!bErr && oResponse.status === 'OK')
			{
				if (bLocal) {console.log(oResponse.data.rows.length + " EMS Codes found..");}
				oParam.logHTML.push(oResponse.data.rows.length + " EMS Codes found..");

				sciqual.data.emsCodes = oResponse.data.rows;

				// Now put the code mappings into the result set - don't add ones that stay the same
				for (var i = 0; i < sciqual.data.emsCodes.length; i++)
				{	
					var oCode = sciqual.data.emsCodes[i];
					if (oCode.code == '05') {oCode.mapToText = '04'; oCode.mapTo = myJquery.grep(sciqual.data.emsCodes, function(x) {return x.code == '04'}).shift().id; oCode.checkExist= true}
					if (oCode.code == '06') {oCode.mapToText = '05'; oCode.mapTo = myJquery.grep(sciqual.data.emsCodes, function(x) {return x.code == '05'}).shift().id}
					if (oCode.code == '07') {oCode.mapToText = '06'; oCode.mapTo = myJquery.grep(sciqual.data.emsCodes, function(x) {return x.code == '06'}).shift().id; oCode.checkExist= true}
					if (oCode.code == '08') {oCode.mapToText = '06'; oCode.mapTo = myJquery.grep(sciqual.data.emsCodes, function(x) {return x.code == '06'}).shift().id; oCode.checkExist= true}
					if (oCode.code == '09') {oCode.mapToText = '06'; oCode.mapTo = myJquery.grep(sciqual.data.emsCodes, function(x) {return x.code == '06'}).shift().id; oCode.checkExist= true}
					if (oCode.code == '10') {oCode.mapToText = '07'; oCode.mapTo = myJquery.grep(sciqual.data.emsCodes, function(x) {return x.code == '07'}).shift().id}
					if (oCode.code == '11') {oCode.mapToText = '08'; oCode.mapTo = myJquery.grep(sciqual.data.emsCodes, function(x) {return x.code == '08'}).shift().id}
					if (oCode.code == '12') {oCode.mapToText = '01'; oCode.mapTo = myJquery.grep(sciqual.data.emsCodes, function(x) {return x.code == '01'}).shift().id; oCode.checkExist= true}
					if (oCode.code == '13') {oCode.mapToText = '09'; oCode.mapTo = myJquery.grep(sciqual.data.emsCodes, function(x) {return x.code == '09'}).shift().id}
					if (oCode.code == '14') {oCode.mapToText = '10'; oCode.mapTo = myJquery.grep(sciqual.data.emsCodes, function(x) {return x.code == '10'}).shift().id}
					if (oCode.code == '15') {oCode.mapToText = '07'; oCode.mapTo = myJquery.grep(sciqual.data.emsCodes, function(x) {return x.code == '07'}).shift().id; oCode.checkExist= true}
				}

				fCallBack(oParam, fCallBack, fCallBackProcess);
			}
			else
			{
				// Write to the log file
				console.log("Error finding codes: " + ((oResponse && oResponse.status === 'ER') ? oResponse.error.errornotes : ''));
				oParam.logHTML.push("Error finding codes: " + ((oResponse && oResponse.status === 'ER') ? oResponse.error.errornotes : ''));

				oParam.processingStep = -1;
				fCallBack(oParam, fCallBack, fCallBackProcess);
			}
		}
		myJquery.ajax(oParam);
	
	},

	moveEMSCodes: 
	{
		process: function(oParam, fCallBack, fCallBackProcess)
		{
			// Task to move EMS Codes from 
			var sciqual = module.exports;
			var oAutomation;
			var bTesting = (oParam.settings.testing != undefined) ? oParam.settings.testing == "true" : false;
			var bLocal   = (oParam.settings.local   != undefined) ? oParam.settings.local == "true"   : false;
			var bUpdate = true;
			var sCategory = (oParam.settings.emsCategory != undefined) ? oParam.settings.emsCategory : '12';
			
			
			//debugger;

			if (oParam == undefined) {oParam = {}}
			if (oParam.processingStep === undefined) {oParam.processingStep = 1}
			if (oParam.currentObject === undefined) {oParam.currentObject = '32'}		// We do Auditors first, followed by Clients

			// Get the Codes
			if (oParam.processingStep === 1)
			{
				oParam.logHTML = [];
				console.log(Date());
				oParam.logHTML.push(Date());

				oParam.processingStep = 2;
				sciqual.getCodes(oParam, fCallBack, fCallBackProcess);
			}

			// Get a list of ITEM_TYPE records linked to to the currentObject. First 500 followed by remainder
			else if (oParam.processingStep === 2)
			{
				var oSearch = 
				{
					fields: 
					[
						{"name": "itemtype"},
						{"name": "itemtypetext"},
						{"name": 'object'},
						{"name": "objectcontext"}
					],
					filters:
					[
						{"name": "object", comparison: "EQUAL_TO", value1: oParam.currentObject},
						{"name": "itemtypecategory", "comparison": "EQUAL_TO", value1: sCategory}
					],
					sorts:
					[
						{name: "itemtypetext", direction: 'asc'},
						{name: "objectcontext", direction: "asc"}
					],
					options:
					{
						"rf": "JSON",
						"rows": "20"
					}
				};

				if (oParam.currentObject == '32')
				{
					oSearch.fields.push({name: "audititemtype.contactperson.firstname"});
					oSearch.fields.push({name: "audititemtype.contactperson.surname"});
				}
				else
				{
					oSearch.fields.push({name: "audititemtype.contactbusiness.tradename"});
				}

				oParam.ajax = {};
				oParam.ajax.type = 'POST';
				oParam.ajax.url = '/rpc/audit/?method=AUDIT_ITEM_TYPE_SEARCH&rows=500' +
									'&logonkey=' + oParam.settings.user.logonkey + '&sid=' + oParam.settings.user.sid;
				oParam.ajax.data = JSON.stringify(oSearch);
				oParam.ajax.success = function(bErr, oResponse, oParam)
				{
					//debugger;
					if (!bErr && oResponse.status === 'OK')
					{	
						sciqual.data.rowsToUpdate = oResponse.data.rows;
						oParam.response = oResponse;
						oParam.processingStep = 3;
					}
					else
					{
						// Write to the log file - call failed
						console.log("Error calling AUDIT_ITEM_TYPE_SEARCH: " + ((oResponse && oResponse.status === 'ER') ? oResponse.error.errornotes : ''));
						oParam.logHTML.push("Error calling AUDIT_ITEM_TYPE_SEARCH: " + ((oResponse && oResponse.status === 'ER') ? oResponse.error.errornotes : ''));

						oParam.processingStep = -1;
					}
					fCallBack(oParam, fCallBack, fCallBackProcess);
				};

				myJquery.ajax(oParam);
			}

			// Get more records if they exist
			else if (oParam.processingStep === 3)
			{
				if (oParam.response)
				{
					var oResponse = oParam.response;

					if (oResponse.morerows == "true")
					{
						console.log("Getting more rows")
						oParam.logHTML.push('');
						oParam.logHTML.push("Getting more rows");

						var sData = 'id=' + oResponse.moreid + '&startrow=' + (parseInt(oResponse.startrow) + parseInt(oResponse.rows)) + '&rows=' + oResponse.rows;

						oParam.ajax = {};
						oParam.ajax.type = 'POST';
						oParam.ajax.url = '/rpc/core/?method=CORE_SEARCH_MORE&rf=JSON' +
											'&logonkey=' + oParam.settings.user.logonkey + '&sid=' + oParam.settings.user.sid;
						oParam.ajax.data = sData;
						oParam.ajax.success = function(bErr, oResponse, oParam)
						{
							//debugger;
							if (!bErr && oResponse.status === 'OK')
							{
								sciqual.data.rowsToUpdate.concat(oResponse.data.rows);
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

			// Now work through the rows and update
			else if (oParam.processingStep == 4)
			{
				// First we want to show how many of each code there is for each Object
				if (oParam.updateIndex == undefined)
				{
					var sPrevCode = '';
					var aProcessed = [];

					for (var i = 0; i < sciqual.data.rowsToUpdate.length; i++)
					{
						var oThis = sciqual.data.rowsToUpdate[i];
						if (sPrevCode != oThis.itemtype)
						{
							aProcessed.push(
							{
								updateids: oThis.id,
								itemtype: oThis.itemtype,
								itemtypetext: oThis.itemtypetext,
								countActual: 1,
								countUpdated: 0
							});
							aProcessed[aProcessed.length - 1].index = aProcessed.length - 1;
						}
						else
						{
							aProcessed[aProcessed.length - 1].countActual += 1;
							aProcessed[aProcessed.length - 1].updateids += ',' + oThis.id;
						}
						sPrevCode = oThis.itemtype;
					}


					console.log((oParam.currentObject == '32' ? 'Auditor' : 'Client') + ' Codes to Update:');
					oParam.logHTML.push((oParam.currentObject == '32' ? 'Auditor' : 'Client') + ' Codes to Update:');
					for (var i = 0; i < aProcessed.length; i++)
					{
						var oThis = aProcessed[i];
						console.log(oThis.itemtypetext + ': ' + oThis.countActual + '.  IDs: ' + oThis.updateids);
						oParam.logHTML.push(oThis.itemtypetext + ': ' + oThis.countActual + ' codes to update');
					}
				
					oParam.processed = aProcessed;
					oParam.updateIndex = 0;
					console.log(sciqual.data.rowsToUpdate.length);
				}

				// Time to do the update
				if (oParam.updateIndex < sciqual.data.rowsToUpdate.length)
				{
					var oAuditItem = sciqual.data.rowsToUpdate[oParam.updateIndex];
					var sItemType = oAuditItem.itemtype;
					var oMapTo = myJquery.grep(sciqual.data.emsCodes, function(x) {return x.id == sItemType && x.mapTo != undefined}).shift();
					var iCodeIndex = myJquery.grep(oParam.processed, function(y) {return y.itemtype == sItemType}).shift().index;
					var sData = '';
					oAuditItem.objectcontexttext = sciqual.formatXHTML((oParam.currentObject == '32') 
													? oAuditItem['audititemtype.contactperson.firstname'] + ' ' + oAuditItem['audititemtype.contactperson.surname']
													: oAuditItem['audititemtype.contactbusiness.tradename']);

					if (oMapTo)		// We must have a mapping to update the ercord
					{
						if (oMapTo.checkExist == true)
						{
							// We need to see if the code exists for the current objectcontext already and if it does, then remove this record
							if (myJquery.grep(sciqual.data.rowsToUpdate, function(x) {return x.objectcontext == oAuditItem.objectcontext && x.itemtype == oMapTo.mapTo}).length > 0)
							{
								sData = 'remove=1';
							}
						}

						if (sData == '')
						{
							sData = 'itemtype=' + oMapTo.mapTo;
						}

						console.log("Updating " + oAuditItem.itemtypetext + " for " + oAuditItem.objectcontexttext + ': ' + (sData.indexOf('remove') == -1 ? 'To ' + oMapTo.mapToText : 'REMOVE'));
						oParam.logHTML.push("Updating " + oAuditItem.itemtypetext + " for " + oAuditItem.objectcontexttext + ': ' + (sData.indexOf('remove') == -1 ? 'To ' + oMapTo.mapToText : 'REMOVE'));

						if (bUpdate)
						{
							sData += '&id=' + oAuditItem.id;

							oParam.ajax = {};
							oParam.ajax.type = 'POST';
							oParam.ajax.url = '/ondemand/audit/?method=AUDIT_ITEM_TYPE_MANAGE&rf=JSON' +
												'&logonkey=' + oParam.settings.user.logonkey + '&sid=' + oParam.settings.user.sid;
							oParam.ajax.data = sData;
							oParam.ajax.success = function(bErr, oResponse, oParam)
							{
								//debugger;
								if (!bErr && oResponse.status === 'OK')
								{
									oParam.processed[iCodeIndex].countUpdated += 1;
									// update the values in sciqual.data.rowsToUpdate
									if (sData.indexOf('remove') > -1)
									{
										oAuditItem.itemtype = 'removed';
									}
									else
									{
										oAuditItem.itemtype = oMapTo.mapTo;
										oAuditItem.itemtypetext = oMapTo.mapToText;
									}
									oParam.updateIndex += 1;
								}
								else
								{
									console.log("Error updating " + oAuditItem.itemtypetext + " for " + oAuditItem.objectcontexttext + ": " + ((oResponse && oResponse.status === 'ER') ? oResponse.error.errornotes : ''));
									oParam.logHTML.push("Error updating " + oAuditItem.itemtypetext + " for " + oAuditItem.objectcontexttext + ": " + ((oResponse && oResponse.status === 'ER') ? oResponse.error.errornotes : ''));
									oParam.processingStep = -1;
								}
								fCallBack(oParam, fCallBack, fCallBackProcess);
							};

							myJquery.ajax(oParam);
						}
						else
						{
							if (!bUpdate) 
							{
								oParam.processed[iCodeIndex].countUpdated += 1;
								if (sData.indexOf('remove') > -1)
								{
									oAuditItem.itemtype = 'removed';
								}
								else
								{
									oAuditItem.itemtype = oMapTo.mapTo;
									oAuditItem.itemtypetext = oMapTo.mapToText;
								}
							}
							oParam.updateIndex += 1;
							fCallBack(oParam, fCallBack, fCallBackProcess);
						}
					}
					// No need to update, go to next row
					else
					{
						oParam.updateIndex += 1;
						fCallBack(oParam, fCallBack, fCallBackProcess);
					}
				}
				// All records processed. Go to Clients or update Code descriptions
				else
				{
					delete(oParam.updateIndex);
					delete(oParam.processed);
					oParam.processingStep = (oParam.currentObject == '32') ? 2 : 5;
					oParam.currentObject = '12';
					fCallBack(oParam, fCallBack, fCallBackProcess);
				}

			}

			// Update COde descriptions
			else if (oParam.processingStep == 5)
			{
				
				if (oParam.codeIndex == undefined) 
				{
					console.log('Updating Code descriptions:');
					oParam.logHTML.push('Updating Code descriptions:');
					oParam.codeIndex = 0;
				}

				if (oParam.codeIndex < sciqual.data.emsCodes.length)
				{
					var oCode = sciqual.data.emsCodes[oParam.codeIndex];
					var sData = 'id=' + oCode.id;

					if (oCode.code == '01')
					{ sData += '&description=' + encodeURIComponent("Agriculture, farming, forestry & fishing, Pest Control (ANZSIC Codes A0 +L7865)"); oCode.changed = 'Description'}

					if (oCode.code == '04')
					{ sData += '&description=' + encodeURIComponent("Electricity, gas supply water, sewerage & drainage (ANZSIC Codes D36 & D37)"); oCode.changed = 'Description'}

					if (oCode.code == '05')
					{ sData += '&remove=1'; oCode.changed = 'REMOVE'}

					if (oCode.code == '06')
					{ sData += '&code=05&description=' + encodeURIComponent("Construction (ANZSIC Codes E41 & 42)"); oCode.changed = 'To 05 + Description'}

					if (oCode.code == '07')
					{ sData += '&code=06&description=' + encodeURIComponent("General wholesaling, retailing & Hospitality (ANZSIC Codes F45 - F47, G51 – G53 & H57)"); oCode.changed = 'TO 06 + Description'}

					if (oCode.code == '08')
					{ sData += '&remove=1'; oCode.changed = 'REMOVE'}

					if (oCode.code == '09')
					{ sData += '&remove=1'; oCode.changed = 'REMOVE'}

					if (oCode.code == '10')
					{ sData += '&code=07&description=' + encodeURIComponent("Transport & storage + Waste Disposal (ANZSIC codes I6 + Q9634)"); oCode.changed = 'To 07 + Description'}

					if (oCode.code == '11')
					{ sData += '&code=08'; oCode.changed = 'To 08'}

					if (oCode.code == '12')
					{ sData += '&remove=1'; oCode.changed = 'REMOVE'}

					if (oCode.code == '13')
					{ sData += '&code=09'; oCode.changed = 'To 09'}

					if (oCode.code == '14')
					{ sData += '&code=10'; oCode.changed = 'To 10'}

					if (oCode.code == '15')
					{ sData += '&remove=1'; oCode.changed = 'REMOVE'}

					console.log("Updating " + oCode.code + ': ' + (oCode.changed ? oCode.changed : 'No Change'));
					oParam.logHTML.push("Updating " + oCode.code + ': ' + (oCode.changed ? oCode.changed : 'No Change'));

					if (bUpdate && sData != 'id=' + oCode.id)
					{
						oParam.ajax = {};
						oParam.ajax.type = 'POST';
						oParam.ajax.url = '/rpc/setup/?method=SETUP_AUDIT_ITEM_TYPE_MANAGE&rf=JSON' +
											'&logonkey=' + oParam.settings.user.logonkey + '&sid=' + oParam.settings.user.sid;
						oParam.ajax.data = sData;
						oParam.ajax.success = function(bErr, oResponse, oParam)
						{
							//debugger;
							if (!bErr && oResponse.status === 'OK')
							{
								oParam.codeIndex += 1;
							}
							else
							{
								console.log("Error updating " + oCode.code + ": " + ((oResponse && oResponse.status === 'ER') ? oResponse.error.errornotes : ''));
								oParam.logHTML.push("Error updating " + oCode.code + ": " + ((oResponse && oResponse.status === 'ER') ? oResponse.error.errornotes : ''));
								oParam.processingStep = -1;
							}
							fCallBack(oParam, fCallBack, fCallBackProcess);
						};

						myJquery.ajax(oParam);
					}
					else
					{
						oParam.codeIndex += 1;
						fCallBack(oParam, fCallBack, fCallBackProcess);
					}
				}
				else
				{
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
	},

	fixEMSCodes: 
	{
		process: function(oParam, fCallBack, fCallBackProcess)
		{
			// Task to move EMS Codes from 
			var sciqual = module.exports;
			var oAutomation;
			var bTesting = (oParam.settings.testing != undefined) ? oParam.settings.testing == "true" : false;
			var bLocal   = (oParam.settings.local   != undefined) ? oParam.settings.local == "true"   : false;
			var bUpdate = true;
			var sCategory = (oParam.settings.emsCategory != undefined) ? oParam.settings.emsCategory : '12';
			oParam.logHTML = [];
			
			
			//debugger;

			if (oParam == undefined) {oParam = {}}
			if (oParam.processingStep === undefined) {oParam.processingStep = 5}
			if (oParam.currentObject === undefined) {oParam.currentObject = '32'}		// We do Auditors first, followed by Clients

			// Get the Codes to be changed
			if (oParam.processingStep === 1)
			{
				oParam.logHTML = [];
				console.log(Date());
				oParam.logHTML.push(Date());

				oParam.processingStep = 2;
				sciqual.data.emsCodes =
				[
					{id: '848', changeTo: '852', countUpdated: 0, index: 0},
					{id: '847', changeTo: '851', countUpdated: 0, index: 2},
					{id: '846', changeTo: '849', countUpdated: 0, index: 3},
					{id: '845', changeTo: '848', countUpdated: 0, index: 4},
					{id: '844', changeTo: '845', countUpdated: 0, index: 5},
					{id: '843', changeTo: '844', countUpdated: 0, index: 6}
				];
				fCallBack(oParam, fCallBack, fCallBackProcess);
			}

			// Get a list of ITEM_TYPE records linked to to the currentObject. First 500 followed by remainder
			else if (oParam.processingStep === 2)
			{
				var oSearch = 
				{
					fields: 
					[
						{"name": "itemtype"},
						{"name": "itemtypetext"},
						{"name": 'object'},
						{"name": "objectcontext"}
					],
					filters:
					[
						{"name": "object", comparison: "EQUAL_TO", value1: oParam.currentObject},
						{"name": "itemtype", "comparison": "IN_LIST", value1: myJquery.map(sciqual.data.emsCodes, function(x) {return x.id}).join(',')}
					],
					sorts:
					[
						{name: "itemtype", direction: 'desc'},
						{name: "objectcontext", direction: "asc"}
					],
					options:
					{
						"rf": "JSON",
						"rows": "20"
					}
				};

				if (oParam.currentObject == '32')
				{
					oSearch.fields.push({name: "audititemtype.contactperson.firstname"});
					oSearch.fields.push({name: "audititemtype.contactperson.surname"});
				}
				else
				{
					oSearch.fields.push({name: "audititemtype.contactbusiness.tradename"});
				}

				oParam.ajax = {};
				oParam.ajax.type = 'POST';
				oParam.ajax.url = '/rpc/audit/?method=AUDIT_ITEM_TYPE_SEARCH&rows=500' +
									'&logonkey=' + oParam.settings.user.logonkey + '&sid=' + oParam.settings.user.sid;
				oParam.ajax.data = JSON.stringify(oSearch);
				oParam.ajax.success = function(bErr, oResponse, oParam)
				{
					//debugger;
					if (!bErr && oResponse.status === 'OK')
					{	
						sciqual.data.rowsToUpdate = oResponse.data.rows;
						oParam.response = oResponse;
						oParam.processingStep = 3;
					}
					else
					{
						// Write to the log file - call failed
						console.log("Error calling AUDIT_ITEM_TYPE_SEARCH: " + ((oResponse && oResponse.status === 'ER') ? oResponse.error.errornotes : ''));
						oParam.logHTML.push("Error calling AUDIT_ITEM_TYPE_SEARCH: " + ((oResponse && oResponse.status === 'ER') ? oResponse.error.errornotes : ''));

						oParam.processingStep = -1;
					}
					fCallBack(oParam, fCallBack, fCallBackProcess);
				};

				myJquery.ajax(oParam);
			}

			// Get more records if they exist
			else if (oParam.processingStep === 3)
			{
				if (oParam.response)
				{
					var oResponse = oParam.response;

					if (oResponse.morerows == "true")
					{
						console.log("Getting more rows")
						oParam.logHTML.push('');
						oParam.logHTML.push("Getting more rows");

						var sData = 'id=' + oResponse.moreid + '&startrow=' + (parseInt(oResponse.startrow) + parseInt(oResponse.rows)) + '&rows=' + oResponse.rows;

						oParam.ajax = {};
						oParam.ajax.type = 'POST';
						oParam.ajax.url = '/rpc/core/?method=CORE_SEARCH_MORE&rf=JSON' +
											'&logonkey=' + oParam.settings.user.logonkey + '&sid=' + oParam.settings.user.sid;
						oParam.ajax.data = sData;
						oParam.ajax.success = function(bErr, oResponse, oParam)
						{
							//debugger;
							if (!bErr && oResponse.status === 'OK')
							{
								sciqual.data.rowsToUpdate.concat(oResponse.data.rows);
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

			// Now work through the rows and update
			else if (oParam.processingStep == 4)
			{
				// First we want to show how many of each code there is for each Object
				if (oParam.updateIndex == undefined)
				{
					oParam.updateIndex = 0;
					console.log(sciqual.data.rowsToUpdate.length);
				}

				// Time to do the update
				if (oParam.updateIndex < sciqual.data.rowsToUpdate.length)
				{
					var oAuditItem = sciqual.data.rowsToUpdate[oParam.updateIndex];
					var sItemType = oAuditItem.itemtype;
					var oMapTo = myJquery.grep(sciqual.data.emsCodes, function(x) {return x.id == sItemType}).shift();
					var iCodeIndex = oMapTo.index;
					var sData = '';
					oAuditItem.objectcontexttext = sciqual.formatXHTML((oParam.currentObject == '32') 
													? oAuditItem['audititemtype.contactperson.firstname'] + ' ' + oAuditItem['audititemtype.contactperson.surname']
													: oAuditItem['audititemtype.contactbusiness.tradename']);

					if (oMapTo)		// We must have a mapping to update the ercord
					{
						//sData = 'itemtype=' + oMapTo.changeTo;
						sData = oMapTo.postdata;

						console.log("Updating " + oAuditItem.itemtype + " for " + oAuditItem.objectcontexttext + ': ' + (sData.indexOf('remove') == -1 ? 'To ' + oMapTo.changeTo : 'REMOVE'));
						console.log(oMapTo.postdata);
						oParam.logHTML.push("Updating " + oAuditItem.itemtype + " for " + oAuditItem.objectcontexttext + ': ' + (sData.indexOf('remove') == -1 ? 'To ' + oMapTo.changeTo : 'REMOVE'));

						if (bUpdate)
						{
							sData += '&id=' + oAuditItem.id;

							oParam.ajax = {};
							oParam.ajax.type = 'POST';
							oParam.ajax.url = '/ondemand/audit/?method=AUDIT_ITEM_TYPE_MANAGE&rf=JSON' +
												'&logonkey=' + oParam.settings.user.logonkey + '&sid=' + oParam.settings.user.sid;
							oParam.ajax.data = sData;
							oParam.ajax.success = function(bErr, oResponse, oParam)
							{
								//debugger;
								if (!bErr && oResponse.status === 'OK')
								{
									// update the values in sciqual.data.rowsToUpdate
									if (sData.indexOf('remove') > -1)
									{
										oAuditItem.itemtype = 'removed';
									}
									else
									{
										oAuditItem.itemtype = oMapTo.changeTo;
									}
									oParam.updateIndex += 1;
								}
								else
								{
									console.log("Error updating " + oAuditItem.itemtypetext + " for " + oAuditItem.objectcontexttext + ": " + ((oResponse && oResponse.status === 'ER') ? oResponse.error.errornotes : ''));
									oParam.logHTML.push("Error updating " + oAuditItem.itemtypetext + " for " + oAuditItem.objectcontexttext + ": " + ((oResponse && oResponse.status === 'ER') ? oResponse.error.errornotes : ''));
									oParam.processingStep = -1;
								}
								fCallBack(oParam, fCallBack, fCallBackProcess);
							};

							myJquery.ajax(oParam);
						}
						else
						{
							if (!bUpdate) 
							{
								if (sData.indexOf('remove') > -1)
								{
									oAuditItem.itemtype = 'removed';
								}
								else
								{
									oAuditItem.itemtype = oMapTo.changeTo;
								}
							}
							oParam.updateIndex += 1;
							fCallBack(oParam, fCallBack, fCallBackProcess);
						}
					}
					// No need to update, go to next row
					else
					{
						oParam.updateIndex += 1;
						fCallBack(oParam, fCallBack, fCallBackProcess);
					}
				}
				// All records processed. Go to Clients or update Code descriptions
				else
				{
					delete(oParam.updateIndex);
					oParam.processingStep = (oParam.currentObject == '32') ? 2 : 10;
					oParam.currentObject = '12';
					fCallBack(oParam, fCallBack, fCallBackProcess);
				}

			}

			else if (oParam.processingStep == 5)
			{
				if (oParam.updateIndex == undefined)
				{

					if (oParam.currentObject == '32')
					{
						sciqual.data.emsCodes =
						[
							{id: '112129', postdata: 'itemtype=852&id=112129'},
							{id: '118691', postdata: 'itemtype=852&id=118691'},
							{id: '118690', postdata: 'itemtype=851&id=118690'},
							{id: '111608', postdata: 'itemtype=849&id=111608'},
							{id: '111024', postdata: 'itemtype=849&id=111024'},
							{id: '111012', postdata: 'itemtype=849&id=111012'},
							{id: '111947', postdata: 'itemtype=849&id=111947'},
							{id: '110944', postdata: 'itemtype=849&id=110944'},
							{id: '110947', postdata: 'itemtype=849&id=110947'},
							{id: '110998', postdata: 'itemtype=849&id=110998'},
							{id: '116134', postdata: 'itemtype=849&id=116134'},
							{id: '111478', postdata: 'itemtype=849&id=111478'},
							{id: '111049', postdata: 'itemtype=849&id=111049'},
							{id: '118687', postdata: 'itemtype=849&id=118687'},
							{id: '114360', postdata: 'itemtype=848&id=114360'},
							{id: '111009', postdata: 'itemtype=848&id=111009'},
							{id: '112125', postdata: 'itemtype=848&id=112125'},
							{id: '116626', postdata: 'itemtype=848&id=116626'},
							{id: '111048', postdata: 'itemtype=848&id=111048'},
							{id: '118688', postdata: 'itemtype=848&id=118688'},
							{id: '112126', postdata: 'itemtype=845&id=112126'},
							{id: '118684', postdata: 'itemtype=845&id=118684'},
							{id: '112197', postdata: 'itemtype=844&id=112197'},
							{id: '110977', postdata: 'itemtype=844&id=110977'},
							{id: '111023', postdata: 'itemtype=844&id=111023'},
							{id: '111008', postdata: 'itemtype=844&id=111008'},
							{id: '111665', postdata: 'itemtype=844&id=111665'},
							{id: '110943', postdata: 'itemtype=844&id=110943'},
							{id: '110946', postdata: 'itemtype=844&id=110946'},
							{id: '110995', postdata: 'itemtype=844&id=110995'},
							{id: '111062', postdata: 'itemtype=844&id=111062'},
							{id: '111065', postdata: 'itemtype=844&id=111065'},
							{id: '111047', postdata: 'itemtype=844&id=111047'},
							{id: '118810', postdata: 'itemtype=844&id=118810'},
							{id: '118682', postdata: 'itemtype=844&id=118682'},
							{id: '111433', postdata: 'itemtype=849&id=111433'},
							{id: '111281', postdata: 'itemtype=849&id=111281'},
							{id: '115047', postdata: 'itemtype=849&id=115047'},
							{id: '111350', postdata: 'itemtype=849&id=111350'},
							{id: '111410', postdata: 'itemtype=849&id=111410'},
							{id: '111313', postdata: 'itemtype=849&id=111313'},
							{id: '111102', postdata: 'itemtype=849&id=111102'},
							{id: '111363', postdata: 'itemtype=849&id=111363'},
							{id: '111289', postdata: 'itemtype=849&id=111289'},
							{id: '111381', postdata: 'itemtype=849&id=111381'},
							{id: '111170', postdata: 'itemtype=849&id=111170'},
							{id: '111159', postdata: 'itemtype=849&id=111159'},
							{id: '111400', postdata: 'itemtype=849&id=111400'},
							{id: '111471', postdata: 'itemtype=849&id=111471'},
							{id: '111153', postdata: 'itemtype=849&id=111153'},
							{id: '111080', postdata: 'itemtype=849&id=111080'},
							{id: '111301', postdata: 'itemtype=849&id=111301'},
							{id: '114656', postdata: 'itemtype=849&id=114656'},
							{id: '111477', postdata: 'itemtype=849&id=111477'},
							{id: '111293', postdata: 'itemtype=849&id=111293'},
							{id: '111269', postdata: 'itemtype=849&id=111269'},
							{id: '111088', postdata: 'itemtype=849&id=111088'},
							{id: '111248', postdata: 'itemtype=849&id=111248'},
							{id: '111130', postdata: 'itemtype=849&id=111130'},
							{id: '113840', postdata: 'itemtype=849&id=113840'},
							{id: '116110', postdata: 'itemtype=849&id=116110'},
							{id: '112577', postdata: 'itemtype=849&id=112577'},
							{id: '113839', postdata: 'itemtype=849&id=113839'},
							{id: '115422', postdata: 'itemtype=849&id=115422'},
							{id: '115293', postdata: 'itemtype=849&id=115293'},
							{id: '116754', postdata: 'itemtype=849&id=116754'},
							{id: '118231', postdata: 'itemtype=849&id=118231'},
							{id: '112794', postdata: 'itemtype=848&id=112794'},
							{id: '111215', postdata: 'itemtype=848&id=111215'},
							{id: '111440', postdata: 'itemtype=848&id=111440'},
							{id: '111240', postdata: 'itemtype=848&id=111240'},
							{id: '116345', postdata: 'itemtype=848&id=116345'},
							{id: '114563', postdata: 'itemtype=848&id=114563'},
							{id: '111923', postdata: 'itemtype=848&id=111923'},
							{id: '111494', postdata: 'itemtype=844&id=111494'},
							{id: '111214', postdata: 'itemtype=844&id=111214'},
							{id: '111445', postdata: 'itemtype=844&id=111445'},
							{id: '111069', postdata: 'itemtype=844&id=111069'},
							{id: '111111', postdata: 'itemtype=844&id=111111'},
							{id: '111188', postdata: 'itemtype=844&id=111188'},
							{id: '111263', postdata: 'itemtype=844&id=111263'},
							{id: '111359', postdata: 'itemtype=844&id=111359'},
							{id: '115626', postdata: 'itemtype=844&id=115626'},
							{id: '111232', postdata: 'itemtype=844&id=111232'},
							{id: '111336', postdata: 'itemtype=844&id=111336'},
							{id: '111143', postdata: 'itemtype=844&id=111143'},
							{id: '111352', postdata: 'itemtype=844&id=111352'},
							{id: '111319', postdata: 'itemtype=844&id=111319'},
							{id: '111124', postdata: 'itemtype=844&id=111124'},
							{id: '111270', postdata: 'itemtype=844&id=111270'},
							{id: '111366', postdata: 'itemtype=844&id=111366'},
							{id: '111465', postdata: 'itemtype=844&id=111465'},
							{id: '111458', postdata: 'itemtype=844&id=111458'},
							{id: '111392', postdata: 'itemtype=844&id=111392'},
							{id: '111090', postdata: 'itemtype=844&id=111090'},
							{id: '111421', postdata: 'itemtype=844&id=111421'},
							{id: '114562', postdata: 'itemtype=844&id=114562'},
							{id: '111169', postdata: 'itemtype=844&id=111169'},
							{id: '111203', postdata: 'itemtype=844&id=111203'},
							{id: '111158', postdata: 'itemtype=844&id=111158'},
							{id: '111320', postdata: 'itemtype=844&id=111320'},
							{id: '111119', postdata: 'itemtype=844&id=111119'},
							{id: '111906', postdata: 'itemtype=844&id=111906'},
							{id: '111260', postdata: 'itemtype=844&id=111260'},
							{id: '111225', postdata: 'itemtype=844&id=111225'},
							{id: '111142', postdata: 'itemtype=844&id=111142'},
							{id: '111164', postdata: 'itemtype=844&id=111164'},
							{id: '112999', postdata: 'itemtype=844&id=112999'},
							{id: '111414', postdata: 'itemtype=844&id=111414'},
							{id: '111470', postdata: 'itemtype=844&id=111470'},
							{id: '111299', postdata: 'itemtype=844&id=111299'},
							{id: '111084', postdata: 'itemtype=844&id=111084'},
							{id: '116808', postdata: 'itemtype=844&id=116808'},
							{id: '111254', postdata: 'itemtype=844&id=111254'},
							{id: '111501', postdata: 'itemtype=844&id=111501'},
							{id: '112341', postdata: 'itemtype=844&id=112341'},
							{id: '112978', postdata: 'itemtype=844&id=112978'}
						];
					}
					else
					{
						sciqual.data.emsCodes =
						[
							{id: '111433', postdata: 'itemtype=849&id=111433'},
							{id: '111281', postdata: 'itemtype=849&id=111281'},
							{id: '115047', postdata: 'itemtype=849&id=115047'},
							{id: '111350', postdata: 'itemtype=849&id=111350'},
							{id: '111410', postdata: 'itemtype=849&id=111410'},
							{id: '111313', postdata: 'itemtype=849&id=111313'},
							{id: '111102', postdata: 'itemtype=849&id=111102'},
							{id: '111363', postdata: 'itemtype=849&id=111363'},
							{id: '111289', postdata: 'itemtype=849&id=111289'},
							{id: '111381', postdata: 'itemtype=849&id=111381'},
							{id: '111170', postdata: 'itemtype=849&id=111170'},
							{id: '111159', postdata: 'itemtype=849&id=111159'},
							{id: '111400', postdata: 'itemtype=849&id=111400'},
							{id: '111471', postdata: 'itemtype=849&id=111471'},
							{id: '111153', postdata: 'itemtype=849&id=111153'},
							{id: '111080', postdata: 'itemtype=849&id=111080'},
							{id: '111301', postdata: 'itemtype=849&id=111301'},
							{id: '114656', postdata: 'itemtype=849&id=114656'},
							{id: '111477', postdata: 'itemtype=849&id=111477'},
							{id: '111293', postdata: 'itemtype=849&id=111293'},
							{id: '111269', postdata: 'itemtype=849&id=111269'},
							{id: '111088', postdata: 'itemtype=849&id=111088'},
							{id: '111248', postdata: 'itemtype=849&id=111248'},
							{id: '111130', postdata: 'itemtype=849&id=111130'},
							{id: '113840', postdata: 'itemtype=849&id=113840'},
							{id: '116110', postdata: 'itemtype=849&id=116110'},
							{id: '112577', postdata: 'itemtype=849&id=112577'},
							{id: '113839', postdata: 'itemtype=849&id=113839'},
							{id: '115422', postdata: 'itemtype=849&id=115422'},
							{id: '115293', postdata: 'itemtype=849&id=115293'},
							{id: '116754', postdata: 'itemtype=849&id=116754'},
							{id: '118231', postdata: 'itemtype=849&id=118231'},
							{id: '112794', postdata: 'itemtype=848&id=112794'},
							{id: '111215', postdata: 'itemtype=848&id=111215'},
							{id: '111440', postdata: 'itemtype=848&id=111440'},
							{id: '111240', postdata: 'itemtype=848&id=111240'},
							{id: '116345', postdata: 'itemtype=848&id=116345'},
							{id: '114563', postdata: 'itemtype=848&id=114563'},
							{id: '111923', postdata: 'itemtype=848&id=111923'},
							{id: '111494', postdata: 'itemtype=844&id=111494'},
							{id: '111214', postdata: 'itemtype=844&id=111214'},
							{id: '111445', postdata: 'itemtype=844&id=111445'},
							{id: '111069', postdata: 'itemtype=844&id=111069'},
							{id: '111111', postdata: 'itemtype=844&id=111111'},
							{id: '111188', postdata: 'itemtype=844&id=111188'},
							{id: '111263', postdata: 'itemtype=844&id=111263'},
							{id: '111359', postdata: 'itemtype=844&id=111359'},
							{id: '115626', postdata: 'itemtype=844&id=115626'},
							{id: '111232', postdata: 'itemtype=844&id=111232'},
							{id: '111336', postdata: 'itemtype=844&id=111336'},
							{id: '111143', postdata: 'itemtype=844&id=111143'},
							{id: '111352', postdata: 'itemtype=844&id=111352'},
							{id: '111319', postdata: 'itemtype=844&id=111319'},
							{id: '111124', postdata: 'itemtype=844&id=111124'},
							{id: '111270', postdata: 'itemtype=844&id=111270'},
							{id: '111366', postdata: 'itemtype=844&id=111366'},
							{id: '111465', postdata: 'itemtype=844&id=111465'},
							{id: '111458', postdata: 'itemtype=844&id=111458'},
							{id: '111392', postdata: 'itemtype=844&id=111392'},
							{id: '111090', postdata: 'itemtype=844&id=111090'},
							{id: '111421', postdata: 'itemtype=844&id=111421'},
							{id: '114562', postdata: 'itemtype=844&id=114562'},
							{id: '111169', postdata: 'itemtype=844&id=111169'},
							{id: '111203', postdata: 'itemtype=844&id=111203'},
							{id: '111158', postdata: 'itemtype=844&id=111158'},
							{id: '111320', postdata: 'itemtype=844&id=111320'},
							{id: '111119', postdata: 'itemtype=844&id=111119'},
							{id: '111906', postdata: 'itemtype=844&id=111906'},
							{id: '111260', postdata: 'itemtype=844&id=111260'},
							{id: '111225', postdata: 'itemtype=844&id=111225'},
							{id: '111142', postdata: 'itemtype=844&id=111142'},
							{id: '111164', postdata: 'itemtype=844&id=111164'},
							{id: '112999', postdata: 'itemtype=844&id=112999'},
							{id: '111414', postdata: 'itemtype=844&id=111414'},
							{id: '111470', postdata: 'itemtype=844&id=111470'},
							{id: '111299', postdata: 'itemtype=844&id=111299'},
							{id: '111084', postdata: 'itemtype=844&id=111084'},
							{id: '116808', postdata: 'itemtype=844&id=116808'},
							{id: '111254', postdata: 'itemtype=844&id=111254'},
							{id: '111501', postdata: 'itemtype=844&id=111501'},
							{id: '112341', postdata: 'itemtype=844&id=112341'},
							{id: '112978', postdata: 'itemtype=844&id=112978'}
						];
					}
					oParam.updateIndex = 0
				}

				if (oParam.updateIndex < sciqual.data.emsCodes.length)
				{
					var oMapTo = sciqual.data.emsCodes[oParam.updateIndex];
					var sData = oMapTo.postdata;

					//console.log((bUpdate ? '' : 'NOT ') + "Updating " + oAuditItem.itemtype + " for " + oAuditItem.objectcontexttext + ': ' + (sData.indexOf('remove') == -1 ? 'To ' + oMapTo.changeTo : 'REMOVE'));
					console.log(oMapTo.postdata);
					//oParam.logHTML.push("Updating " + oAuditItem.itemtype + " for " + oAuditItem.objectcontexttext + ': ' + (sData.indexOf('remove') == -1 ? 'To ' + oMapTo.changeTo : 'REMOVE'));

					if (bUpdate)
					{
						oParam.ajax = {};
						oParam.ajax.type = 'POST';
						oParam.ajax.url = '/ondemand/audit/?method=AUDIT_ITEM_TYPE_MANAGE&rf=JSON' +
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
								console.log("Error updating " + (oResponse && oResponse.status === 'ER' ? oResponse.error.errornotes : ''));
								//console.log("Error updating " + oAuditItem.itemtypetext + " for " + oAuditItem.objectcontexttext + ": " + ((oResponse && oResponse.status === 'ER') ? oResponse.error.errornotes : ''));
								//.logHTML.push("Error updating " + oAuditItem.itemtypetext + " for " + oAuditItem.objectcontexttext + ": " + ((oResponse && oResponse.status === 'ER') ? oResponse.error.errornotes : ''));
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
				// All records processed. Go to Clients or update Code descriptions
				else
				{
					delete(oParam.updateIndex);
					oParam.processingStep = (oParam.currentObject == '32') ? 2 : 10;
					oParam.currentObject = '12';
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
	}}


