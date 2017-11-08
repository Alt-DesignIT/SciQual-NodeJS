module.exports = 
{
	data: {},

	init:  	function (oSettings, fCallBack, fOnComplete)
	{
		var self = this;

		if (oSettings == undefined)
		{	
			var fs = require('fs');

			fs.readFile('settings.json', function (err, buffer)
			{
				if (!err)
				{	
					var sSettings = buffer.toString();

					console.log('#MYDS-SETTINGS:' + sSettings)

					var oSettings = JSON.parse(sSettings);
					self.data = {settings: oSettings};
					if (fCallBack) {fCallBack(oSettings, fOnComplete)}
				}	
			});
		}
		else
		{
			self.data = {settings: oSettings};
			debugger;
			if (fCallBack) {fCallBack(oSettings, fOnComplete)}
		}	
	},

	logon:  function (oSettings, fCallBack)
	{
		var self = this;
		var https = require('https');
		var sData = 'logon=' + oSettings.logon + 
					'&password=' + oSettings.password;

		var options =
		{
			hostname: oSettings.hostname,
			port: 443,
			path: '/rpc/logon/?method=LOGON',
			method: 'POST',
			headers:
			{
				'Content-Type': 'application/x-www-form-urlencoded',
				'Content-Length': sData.length
			}
		};

		var req = https.request(options, function(res)
		{
			res.setEncoding('utf8');

			var data = '';
			
			res.on('data', function(chunk)
			{
			  data += chunk;
			});
			
			res.on('end', function ()
			{	
				console.log('#MYDS-LOGON.req.data.response:' + data + '**')
		    	oSettings.user = JSON.parse(data);
		    	fCallBack(false, oSettings.user, oSettings);
			});
		});

		req.on('error', function(e)
		{
			console.log('#MYDS-LOGON.req.error.response:' + e.message)
		  	fCallBack(true, e.message);
		});

		req.write(sData);

		req.end()
	}

}