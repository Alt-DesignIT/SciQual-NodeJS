
module.exports =
{
	ajax: function(oParam)
	{
		var http = require("https");
		var hostname = oParam.settings.hostname;
		var port = oParam.settings.port;
		var sData = oParam.ajax.data;
		var fCallBack = oParam.ajax.success;
		var sDataType = oParam.ajax.dataType;
		var sResponse = '';

		var options =
		{
			hostname: hostname,
			port: port,
			path: oParam.ajax.url,
			method: oParam.ajax.type,
			dataType: sDataType,
			headers: 
			{
				'Content-Type': 'application/x-www-form-urlencoded',
				'Content-Length': Buffer.byteLength(sData)
			}
		};
		//debugger;
		var req = http.request(options, function(res)
		{
			//debugger;
			res.setEncoding('utf-8');
			res.on('data', function (data)
			{
		    	//debugger;
		    	sResponse += data;
			});

			res.on('end', function()
			{
		    	//debugger;
		    	oParam.ajax = {};
		    	fCallBack(false, JSON.parse(sResponse), oParam);
			});
		});

		req.on('error', function(e)
		{
			console.log('#MYDS-LOGON.req.error.response:' + e.message)
		  	fCallBack(true, e.message);
		});

		req.write(sData);

		req.end()
	},

	each: function(data, fDo)
	{
		for (var i = 0; i < data.length; i++)
		{
			if (fDo(i, data[i]) == false)
			{
				i = data.length;
			}
		}
	},

	grep: function(data, fEval)
	{
		var aNewData = [];

		for (var i = 0; i < data.length; i++)
		{
			if (fEval(data[i]) == true)
			{
				aNewData.push(data[i]);
			}
		}
		return aNewData;
	},

	map: function(data, fEval)
	{
		var aNewData = [];

		for (var i = 0; i < data.length; i++)
		{
			aNewData.push(fEval(data[i]));
		}
		return aNewData;
	},

	dateString: function(dDate)
	{
		aMonth = 
		[
			'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
		]
		return (dDate.getDate()) + ' ' + (aMonth[dDate.getMonth()]) + ' ' + dDate.getFullYear()
	}
}